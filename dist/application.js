"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./utils/instrument");
const json_api_errors_1 = require("./errors/json-api-errors");
const application_instance_1 = require("./application-instance");
const authorize_1 = require("./decorators/authorize");
const knex_processor_1 = require("./processors/knex-processor");
const serializer_1 = require("./serializers/serializer");
const types_1 = require("./types");
const flatten_1 = require("./utils/flatten");
const string_1 = require("./utils/string");
const object_1 = require("./utils/object");
class Application {
    constructor(settings) {
        this.namespace = settings.namespace || "";
        this.types = settings.types || [];
        this.processors = settings.processors || [];
        this.services = settings.services || {};
        this.defaultProcessor = settings.defaultProcessor || knex_processor_1.default;
        this.addons = [];
        this.serializer = new (settings.serializer || serializer_1.default)();
        this.hooks = {
            beforeAuthentication: [],
            beforeRequestHandling: [],
            beforeExecutingIdentifyOperation: [],
        };
        if (settings.attributeTypes) {
            for (const attributeType of settings.attributeTypes) {
                this.serializer.registerAttributeType(attributeType);
            }
        }
    }
    hook(type, callback) {
        this.hooks[type].push(callback);
    }
    use(addon, options = {}) {
        if (this.addons.find((installedAddon) => installedAddon.addon === addon)) {
            return;
        }
        const addonToInstall = new addon(this, options);
        addonToInstall.install().then(() => {
            this.addons.push({ addon, options: addonToInstall.options });
        });
    }
    getAddonOptions(addon) {
        const installedAddon = this.addons.find((installedAddon) => installedAddon.addon === addon);
        return installedAddon === null || installedAddon === void 0 ? void 0 : installedAddon.options;
    }
    registerAttributeType(attributeDefinition) {
        this.serializer.registerAttributeType(attributeDefinition);
    }
    async executeOperations(ops, applicationInstance = new application_instance_1.default(this)) {
        applicationInstance.transaction = await this.createTransaction();
        try {
            const result = (await Promise.all(ops
                .map(async (op) => {
                const processor = await applicationInstance.processorFor(op.ref.type);
                if (processor) {
                    return this.executeOperation(op, processor);
                }
            })
                .filter(Boolean)));
            await applicationInstance.transaction.commit();
            return result;
        }
        catch (error) {
            await applicationInstance.transaction.rollback(error);
            throw error;
        }
        finally {
            applicationInstance.transaction = {};
        }
    }
    async executeOperation(op, processor) {
        var _a;
        const resourceClass = await this.resourceFor(op.ref.type);
        if (op.ref.relationship) {
            const relationship = resourceClass.schema.relationships[op.ref.relationship];
            const relatedResourceClass = relationship.type();
            if (relatedResourceClass) {
                let relatedOp = {};
                if (relationship.hasMany) {
                    const relatedResourceClassRelationships = Object.entries(relatedResourceClass.schema.relationships);
                    const [relatedRelationshipName, relatedRelationship] = relatedResourceClassRelationships.find(([_relName, relData]) => relData.type().type === op.ref.type);
                    relatedOp = {
                        ...op,
                        ref: {
                            type: relatedResourceClass.type,
                        },
                        params: {
                            ...op.params,
                            filter: {
                                ...(op.params || {}).filter,
                                [relatedRelationship.foreignKeyName ||
                                    this.serializer.relationshipToColumn(relatedRelationshipName, relatedResourceClass.schema.primaryKeyName)]: op.ref.id,
                            },
                        },
                    };
                }
                else if (relationship.belongsTo) {
                    const deserializedOriginalOperation = await this.serializer.deserializeResource({ ...op, op: "get" }, resourceClass);
                    const result = (await processor.execute(deserializedOriginalOperation));
                    relatedOp = {
                        ...op,
                        ref: {
                            type: relatedResourceClass.type,
                            id: result.attributes[resourceClass.schema.relationships[op.ref.relationship].foreignKeyName ||
                                this.serializer.relationshipToColumn(op.ref.relationship)],
                        },
                    };
                }
                else if (relationship.manyToMany) {
                    const intermediateTable = relationship.intermediateTable;
                    if (!intermediateTable) {
                        throw new Error(`manyToMany relationship ${op.ref.relationship} on ${resourceClass.type} missing intermediateTable definition.`);
                    }
                    const relatedForeignKey = relationship.foreignKeyName;
                    if (!relatedForeignKey) {
                        throw new Error(`manyToMany relationship ${op.ref.relationship} on ${resourceClass.type} missing foreignKeyName definition.`);
                    }
                    const thisResourceRelationship = Object.entries(relatedResourceClass.schema.relationships)
                        .find(([, rel]) => rel.type().type === resourceClass.type && rel.manyToMany);
                    if (!thisResourceRelationship) {
                        throw new Error(`Cannot find reverse manyToMany relationship from ${relatedResourceClass.type} to ${resourceClass.type}`);
                    }
                    const thisForeignKey = thisResourceRelationship[1].foreignKeyName;
                    if (!thisForeignKey) {
                        throw new Error(`Reverse manyToMany relationship ${thisResourceRelationship[0]} on ${relatedResourceClass.type} missing foreignKeyName definition.`);
                    }
                    // Prefer the open request transaction to avoid a second pool checkout
                    // while the Kurier transaction is held (pool exhaustion risk).
                    const knex = (typeof processor.appInstance.transaction === "function"
                        ? processor.appInstance.transaction
                        : (_a = processor.appInstance.app.services) === null || _a === void 0 ? void 0 : _a.knex);
                    if (!knex) {
                        throw new Error("Knex service is required for manyToMany relationship endpoints.");
                    }
                    const subQuery = knex(intermediateTable)
                        .select(relatedForeignKey)
                        .where({ [thisForeignKey]: op.ref.id });
                    const relatedIds = (await subQuery).map(r => r[relatedForeignKey]);
                    relatedOp = {
                        ...op,
                        ref: {
                            type: relatedResourceClass.type,
                        },
                        params: {
                            ...op.params,
                            filter: {
                                ...(op.params || {}).filter,
                                [relatedResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY]: `in:${relatedIds.join(',')}`
                            },
                        },
                    };
                }
                const deserializedOperation = this.serializer.deserializeResource(relatedOp, relatedResourceClass);
                const relatedProcessor = (await this.processorFor(relatedResourceClass.type, processor.appInstance));
                const result = await relatedProcessor.execute(deserializedOperation);
                if (result) {
                    await this.injectResourceMeta(result, processor, op);
                }
                return this.buildOperationResponse(result, processor, op);
            }
        }
        const deserializedOperation = await this.serializer.deserializeResource(op, resourceClass);
        const result = await processor.execute(deserializedOperation);
        if (result) {
            await this.injectResourceMeta(result, processor, op);
        }
        return this.buildOperationResponse(result, processor, op);
    }
    async injectResourceMeta(result, processor, op) {
        const resourceMetaHookToCallForOperation = `resourceMetaFor${(0, string_1.classify)(op.op)}`;
        if (Array.isArray(result)) {
            for (const resource of result) {
                const resourceMeta = await processor.resourceMeta(resource);
                const resourceMetaFor = await processor.resourceMetaFor(op, resource);
                const resourceMetaForOp = typeof processor[resourceMetaHookToCallForOperation] === "function"
                    ? await processor[resourceMetaHookToCallForOperation](resource)
                    : undefined;
                resource.meta = {
                    ...(resourceMetaForOp || {}),
                    ...(resourceMetaFor || {}),
                    ...(resourceMeta || {}),
                };
                if ((0, object_1.isEmptyObject)(resource.meta)) {
                    resource.meta = undefined;
                }
            }
        }
        else {
            const resourceMeta = await processor.resourceMeta(result);
            const resourceMetaFor = await processor.resourceMetaFor(op, result);
            const resourceMetaForOp = typeof processor[resourceMetaHookToCallForOperation] === "function"
                ? await processor[resourceMetaHookToCallForOperation](result)
                : undefined;
            result.meta = {
                ...(resourceMetaForOp || {}),
                ...(resourceMetaFor || {}),
                ...(resourceMeta || {}),
            };
            if ((0, object_1.isEmptyObject)(result.meta)) {
                result.meta = undefined;
            }
        }
    }
    async buildDocumentMeta(data, processor, op) {
        if (!data) {
            return;
        }
        const metaHookToCallForOperation = `metaFor${(0, string_1.classify)(op.op)}`;
        const meta = await processor.meta(data);
        const metaFor = await processor.metaFor(op, data);
        const metaForOp = typeof processor[metaHookToCallForOperation] === "function"
            ? await processor[metaHookToCallForOperation](data)
            : undefined;
        const composedMeta = {
            ...metaForOp,
            ...metaFor,
            ...meta,
        };
        if (!(0, object_1.isEmptyObject)(composedMeta)) {
            return composedMeta;
        }
        return;
    }
    async createTransaction() {
        const { knex } = this.services;
        if (!knex) {
            return {
                commit: () => { },
                rollback: () => { },
            };
        }
        return knex.transaction();
    }
    async processorFor(resourceType, applicationInstance, processorType = this.defaultProcessor) {
        const resourceClass = await this.resourceFor(resourceType);
        const processors = await Promise.all(this.processors.map(async (processor) => ((await processor.shouldHandle(resourceType)) ? processor : false)));
        const ProcessorClass = processors.find((p) => p !== false);
        if (ProcessorClass) {
            return new ProcessorClass(applicationInstance);
        }
        class ResourceProcessor extends processorType {
        }
        ResourceProcessor.resourceClass = resourceClass;
        return new ResourceProcessor(applicationInstance);
    }
    async resourceFor(resourceType) {
        const resource = this.types.find(({ type }) => type && type === resourceType);
        if (!resource) {
            throw json_api_errors_1.default.ResourceNotFound(`Resource ${resourceType} is not registered in the API Application`);
        }
        if (!resource.schema.relationships) {
            resource.schema.relationships = {};
        }
        return resource;
    }
    async buildOperationResponse(data, processor, op) {
        let resourceType;
        const { appInstance } = processor;
        if (Array.isArray(data)) {
            resourceType = data[0] ? data[0].type : null;
        }
        else if (data) {
            resourceType = data.type;
        }
        else {
            resourceType = null;
        }
        const allIncluded = !resourceType
            ? []
            : (0, flatten_1.default)(this.serializer.serializeIncludedResources(data, await this.resourceFor(resourceType)) || []);
        let included = [];
        await Promise.all(allIncluded.map((resource) => {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve) => {
                const result = await (0, authorize_1.canAccessResource)(resource, "get", appInstance);
                if (result) {
                    included = included.concat(resource);
                }
                resolve();
            });
        }));
        const serializedResources = await this.serializeResources(data, op, appInstance);
        const meta = await this.buildDocumentMeta(data, processor, op);
        // Generate top-level links for the operation response if appropriate
        let links;
        if (op.ref.relationship && op.ref.id) {
            // This is a relationship request with an ID
            links = this.serializer.generateLinks(op.ref.type, op.ref.id, op.ref.relationship);
        }
        else if (op.ref.id) {
            // This is a single resource request with an ID
            links = this.serializer.generateLinks(op.ref.type, op.ref.id);
        }
        else {
            // This is a collection request
            links = this.serializer.generateLinks(op.ref.type);
        }
        const response = {
            data: serializedResources,
        };
        if (included.length) {
            response.included = included;
        }
        // Always include links in the response
        if (links) {
            response.links = links;
        }
        if (!(0, object_1.isEmptyObject)(meta)) {
            response.meta = meta;
        }
        else {
            delete response.meta;
        }
        return response;
    }
    async serializeResources(data, op, appInstance) {
        if (!data) {
            return null;
        }
        if (Array.isArray(data)) {
            if (!data.length) {
                return [];
            }
            const resourceType = data[0].type;
            const resource = await this.resourceFor(resourceType);
            const processor = (await this.processorFor(resourceType, appInstance));
            const resourceCollection = data
                .filter((record) => !record.preventSerialization)
                .map((record) => this.serializer.serializeResource(record, resource));
            for (const resourceItem of resourceCollection) {
                await this.injectResourceMeta(resourceItem, processor, op);
            }
            return resourceCollection;
        }
        const resource = await this.resourceFor(data.type);
        const serializedResource = this.serializer.serializeResource(data, resource);
        const processor = (await this.processorFor(data.type, appInstance));
        await this.injectResourceMeta(serializedResource, processor, op);
        return serializedResource;
    }
}
exports.default = Application;
//# sourceMappingURL=application.js.map