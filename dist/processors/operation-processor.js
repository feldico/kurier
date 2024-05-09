"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pick_1 = require("../utils/pick");
const promise_hash_map_1 = require("../utils/promise-hash-map");
const json_api_errors_1 = require("../errors/json-api-errors");
const operators_1 = require("../utils/operators");
class OperationProcessor {
    static async shouldHandle(resourceType) {
        return this.resourceClass && resourceType === this.resourceClass.type;
    }
    get resourceClass() {
        const staticMember = this.constructor;
        return staticMember.resourceClass;
    }
    constructor(appInstance) {
        this.appInstance = appInstance;
        this.attributes = {};
        this.relationships = {};
    }
    async execute(op) {
        const action = op.op;
        if (["update", "remove"].includes(action) && !op.ref.id) {
            throw json_api_errors_1.default.BadRequest(`${action} is not allowed without a defined primary key`);
        }
        const result = this[action] && (await this[action].call(this, op));
        let eagerLoadedData = [];
        if (Array.isArray(result)) {
            eagerLoadedData = await Promise.all(result.map(async (element) => {
                let eagerLoad = await this.eagerLoad(op, element);
                eagerLoad = await this.computeRelationshipProperties(op, eagerLoad);
                return eagerLoad;
            }));
        }
        else if (result !== undefined) {
            const eagerLoad = await this.eagerLoad(op, result);
            eagerLoadedData.push(await this.computeRelationshipProperties(op, eagerLoad));
        }
        return this.convertToResources(op, result, eagerLoadedData);
    }
    async computeRelationshipProperties(op, eagerLoadedData) {
        const baseResourceClass = await this.resourceFor(op.ref.type);
        for (const relationship in eagerLoadedData) {
            if (!(relationship in eagerLoadedData)) {
                continue;
            }
            const relationResourceClass = baseResourceClass.schema.relationships[relationship] &&
                baseResourceClass.schema.relationships[relationship].type();
            if (!relationResourceClass) {
                continue;
            }
            eagerLoadedData[relationship].direct = await this.computeDirectRelationsProps(op, eagerLoadedData[relationship].direct, relationResourceClass);
            eagerLoadedData[relationship].nested = await this.computeNestedRelationsProps(op, eagerLoadedData[relationship].nested, relationResourceClass);
        }
        return eagerLoadedData;
    }
    async computeDirectRelationsProps(op, directRelations, relationResourceClass) {
        const resourceProcessor = await this.processorFor(relationResourceClass.type);
        for (const includedRelationResource in directRelations) {
            if (!(includedRelationResource in directRelations)) {
                continue;
            }
            const value = directRelations[includedRelationResource];
            const computed = await resourceProcessor.getComputedProperties(op, relationResourceClass, value, {});
            Object.assign(directRelations[includedRelationResource], computed);
        }
        return directRelations;
    }
    async computeNestedRelationsProps(op, nestedRelations, baseRelationResourceClass) {
        for (const includedNestedRelation in nestedRelations) {
            if (!(includedNestedRelation in nestedRelations)) {
                continue;
            }
            const includedRelationElements = nestedRelations[includedNestedRelation];
            const nestedRelationResourceClass = baseRelationResourceClass.schema.relationships[includedNestedRelation] &&
                baseRelationResourceClass.schema.relationships[includedNestedRelation].type();
            const nestedResourceProcessor = await this.processorFor(nestedRelationResourceClass.type);
            includedRelationElements.map(async (value, index) => {
                const computed = await nestedResourceProcessor.getComputedProperties(op, nestedRelationResourceClass, includedRelationElements, {});
                nestedRelations[includedNestedRelation][index] = { ...value, ...computed };
            });
        }
        return nestedRelations;
    }
    async eagerLoad(op, result) {
        return {};
    }
    async getComputedProperties(op, resourceClass, record, eagerLoadedData) {
        const typeFields = op.params && op.params.fields && op.params.fields[resourceClass.type];
        const attributes = typeFields ? (0, pick_1.default)(this.attributes, typeFields) : this.attributes;
        return (0, promise_hash_map_1.default)(attributes, (key) => attributes[key].call(this, record));
    }
    async matchesComputedFilters(op, computedAttributes) {
        if (!op.params || !op.params.filter) {
            return true;
        }
        const requestedFilters = Object.keys(op.params.filter);
        if (!requestedFilters.length) {
            return true;
        }
        for (const filterAttribute of requestedFilters) {
            if (filterAttribute in computedAttributes) {
                const filter = op.params.filter[filterAttribute];
                let operator = "eq";
                let expected = filter;
                if (filter.includes(":")) {
                    [operator, expected] = filter.split(":");
                }
                if (!(operator in operators_1.FunctionalOperators)) {
                    throw json_api_errors_1.default.BadRequest(`Operator ${operator} is not part of the filter's valid operators`);
                }
                const filterResult = operators_1.FunctionalOperators[operator](computedAttributes[filterAttribute], expected);
                if (!filterResult) {
                    return false;
                }
            }
        }
        return true;
    }
    async getAttributes(op, resourceClass, record, eagerLoadedData) {
        const attributeKeys = (op.params && op.params.fields && op.params.fields[resourceClass.type]) ||
            Object.keys(resourceClass.schema.attributes);
        return (0, pick_1.default)(record, attributeKeys);
    }
    async getRelationships(op, record, eagerLoadedData) {
        const include = op.params ? op.params.include : [];
        const relationships = (0, pick_1.default)(this.relationships, include);
        return (0, promise_hash_map_1.default)(relationships, (key) => {
            return relationships[key].call(this, record);
        });
    }
    async getRelationshipAttributes(op, resourceClass, record, eagerLoadedData) {
        const relationshipKeys = Object.keys(resourceClass.schema.relationships)
            .filter((relName) => resourceClass.schema.relationships[relName].belongsTo)
            .map((relName) => resourceClass.schema.relationships[relName].foreignKeyName ||
            this.appInstance.app.serializer.relationshipToColumn(relName, resourceClass.schema.relationships[relName].type().schema.primaryKeyName));
        return (0, pick_1.default)(record, relationshipKeys);
    }
    async convertToResources(op, records, eagerLoadedData) {
        if (Array.isArray(records)) {
            if (records.length === eagerLoadedData.length) {
                return Promise.all(records.map((record, index) => {
                    return this.convertToResources(op, record, [eagerLoadedData[index]]);
                }));
            }
            return Promise.all(records.map((record) => {
                return this.convertToResources(op, record, eagerLoadedData);
            }));
        }
        const record = { ...records };
        const resourceClass = await this.resourceFor(op.ref.type);
        const eagerLoad = eagerLoadedData[0];
        const [attributes, computedAttributes, relationships, relationshipAttributes] = await Promise.all([
            this.getAttributes(op, resourceClass, record, eagerLoad),
            this.getComputedProperties(op, resourceClass, record, eagerLoad),
            this.getRelationships(op, record, eagerLoad),
            this.getRelationshipAttributes(op, resourceClass, record, eagerLoad),
        ]);
        const resource = new resourceClass({
            relationships,
            id: record[resourceClass.schema.primaryKeyName || "id"],
            attributes: {
                ...attributes,
                ...relationshipAttributes,
                ...computedAttributes,
            },
        });
        const passesFilters = await this.matchesComputedFilters(op, computedAttributes);
        if (!passesFilters) {
            resource.preventSerialization = true;
        }
        return resource;
    }
    async resourceFor(resourceType) {
        return this.appInstance.app.resourceFor(resourceType);
    }
    async processorFor(resourceType) {
        return this.appInstance.processorFor(resourceType);
    }
    async get(op) {
        return [];
    }
    async remove(op) {
        return Promise.reject();
    }
    async update(op) {
        return Promise.reject();
    }
    async add(op) {
        return Promise.reject();
    }
    async meta(resourceOrResources) { }
    async metaFor(op, resourceOrResources) { }
    async metaForGet(resourceOrResources) { }
    async metaForAdd(resourceOrResources) { }
    async metaForUpdate(resourceOrResources) { }
    async resourceMeta(resource) { }
    async resourceMetaFor(op, resource) { }
    async resourceMetaForGet(resource) { }
    async resourceMetaForAdd(resource) { }
    async resourceMetaForUpdate(resource) { }
}
exports.default = OperationProcessor;
//# sourceMappingURL=operation-processor.js.map