"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../attribute-types/password");
const types_1 = require("../types");
const string_1 = require("../utils/string");
const unpick_1 = require("../utils/unpick");
class JsonApiSerializer {
    constructor() {
        this.attributeTypes = [];
        this.registerAttributeType(password_1.default);
    }
    registerAttributeType(attributeDefinition) {
        const attribute = new attributeDefinition();
        this.attributeTypes.push({
            name: attributeDefinition.name,
            definition: attribute,
        });
    }
    resourceTypeToTableName(resourceType) {
        return (0, string_1.underscore)((0, string_1.pluralize)(resourceType));
    }
    attributeToColumn(attributeName) {
        return (0, string_1.underscore)(attributeName);
    }
    columnToAttribute(columnName) {
        return (0, string_1.camelize)(columnName);
    }
    columnToRelationship(columnName, primaryKeyName = types_1.DEFAULT_PRIMARY_KEY) {
        return this.columnToAttribute(columnName.replace(`_${primaryKeyName}`, ""));
    }
    relationshipToColumn(relationshipName, primaryKeyName = types_1.DEFAULT_PRIMARY_KEY) {
        return this.attributeToColumn(`${relationshipName}${(0, string_1.classify)(primaryKeyName)}`);
    }
    foreignResourceToForeignTableName(foreignResourceType, prefix = "belonging") {
        return (0, string_1.underscore)(`${prefix} `) + this.resourceTypeToTableName(foreignResourceType);
    }
    generateLinks(resourceType, resourceId, relationshipName) {
        // Base path for the API - normally this would come from config
        const basePath = `/${resourceType}${resourceId ? `/${resourceId}` : ""}`;
        if (relationshipName) {
            // This is a relationship link
            return {
                self: `${basePath}/relationships/${relationshipName}`,
                related: `${basePath}/${relationshipName}`,
            };
        }
        // This is a resource link
        return {
            self: basePath,
        };
    }
    deserializeResource(op, resourceType) {
        if (!op.data || !op.data.attributes || !op.data.relationships) {
            return op;
        }
        for (const [attribute, value] of Object.entries(op.data.attributes)) {
            op.data.attributes[attribute] = this.deserializeAttribute(resourceType.schema, attribute, value);
        }
        const primaryKey = resourceType.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const schemaRelationships = resourceType.schema.relationships;
        op.data.attributes = Object.keys(schemaRelationships)
            .filter((relName) => { var _a; return schemaRelationships[relName].belongsTo && ((_a = op.data) === null || _a === void 0 ? void 0 : _a.relationships.hasOwnProperty(relName)); })
            .reduce((relationAttributes, relName) => {
            var _a;
            const key = schemaRelationships[relName].foreignKeyName || this.relationshipToColumn(relName, primaryKey);
            const value = ((_a = op.data) === null || _a === void 0 ? void 0 : _a.relationships[relName].data).id;
            relationAttributes[key] = value;
            return relationAttributes;
        }, op.data.attributes);
        return op;
    }
    getAttributeDefinition(resourceSchema, attributeName) {
        const resourceSchemaAttribute = resourceSchema.attributes[attributeName];
        const attributeDefinition = this.attributeTypes.find((attribute) => attribute.definition.constructor === resourceSchemaAttribute);
        return attributeDefinition;
    }
    isSensitiveAttribute(resourceSchema, attributeName) {
        const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);
        if (!attributeDefinition) {
            return false;
        }
        return attributeDefinition.definition.isSensitive;
    }
    serializeResource(data, resourceType) {
        var _a;
        const resourceSchema = resourceType.schema;
        const schemaRelationships = resourceSchema.relationships;
        const relationshipsFound = Object.keys(schemaRelationships)
            .filter((relName) => schemaRelationships[relName].belongsTo)
            .filter((relName) => data.attributes.hasOwnProperty(`${schemaRelationships[relName].foreignKeyName}`) ||
            data.attributes.hasOwnProperty(this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName)))
            .map((relName) => ({
            name: relName,
            key: schemaRelationships[relName].foreignKeyName ||
                this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName),
        }));
        const eagerlyLoadedRelationships = Object.entries(data.relationships).reduce((includedDirectRelationships, [relName, relData]) => {
            includedDirectRelationships[relName] = relData.direct;
            return includedDirectRelationships;
        }, {});
        // Add links to the resource object
        if (data.id) {
            data.links = this.generateLinks(resourceType.type, data.id);
        }
        data.relationships = relationshipsFound.reduce((relationships, relationship) => {
            relationships[relationship.name] = {
                id: data.attributes[relationship.key],
                type: schemaRelationships[relationship.name].type().type,
            };
            return relationships;
        }, eagerlyLoadedRelationships);
        // Ensure all defined relationships have an entry before adding links/data
        for (const relName of Object.keys(schemaRelationships)) {
            if (!data.relationships[relName]) {
                // If relationship wasn't eagerly loaded or isn't a found belongsTo, add placeholder
                data.relationships[relName] = { data: undefined }; // Minimal placeholder
            }
        }
        // Iterate through ALL defined relationships to add links/meta and format data
        for (const relName of Object.keys(schemaRelationships)) {
            const relationshipSchema = schemaRelationships[relName];
            // Get the current relationship object (might be placeholder or from eager load/belongsTo)
            // We need the raw data passed in, which might be on the original data.relationships object
            // before it potentially got overwritten by the belongsTo reduce.
            // Let's assume the initial data.relationships (populated by convertToResources) holds the correct structure.
            const relationshipInputData = ((_a = data.relationships[relName]) === null || _a === void 0 ? void 0 : _a.data) || data.relationships[relName];
            const fkName = relationshipSchema.belongsTo
                ? types_1.DEFAULT_PRIMARY_KEY
                : relationshipSchema.type().schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            // Always add links
            const relationshipLinks = data.id ? this.generateLinks(resourceType.type, data.id, relName) : undefined;
            if (relationshipSchema.manyToMany && relationshipSchema.intermediateTable) {
                data.relationships[relName] = {
                    // Pass the actual data (or undefined) to serializeRelationship
                    data: this.serializeRelationship(relationshipInputData, relationshipSchema.type(), fkName),
                    links: relationshipLinks,
                    meta: {
                        intermediateTable: relationshipSchema.intermediateTable,
                        relationshipType: "manyToMany",
                    },
                };
            }
            else {
                // belongsTo or hasMany
                data.relationships[relName] = {
                    // Pass the actual data (or undefined/linkage object) to serializeRelationship
                    data: this.serializeRelationship(relationshipInputData, relationshipSchema.type(), fkName),
                    links: relationshipLinks,
                };
            }
        }
        data.attributes = (0, unpick_1.default)(data.attributes, relationshipsFound
            .map((relationship) => relationship.key)
            .filter((relationshipKey) => !Object.keys(resourceSchema.attributes).includes(relationshipKey))
            .concat(Object.keys(resourceSchema.attributes).filter((attributeKey) => this.isSensitiveAttribute(resourceSchema, attributeKey))));
        data.attributes = Object.assign({}, ...Object.keys(data.attributes).map((attribute) => ({
            [this.columnToAttribute(attribute)]: this.serializeAttribute(resourceSchema, attribute, data.attributes[attribute]),
        })));
        return data;
    }
    serializeAttribute(resourceSchema, attributeName, value) {
        const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);
        if (!attributeDefinition || !attributeDefinition.definition.serialize) {
            return value;
        }
        return attributeDefinition.definition.serialize(value);
    }
    deserializeAttribute(resourceSchema, attributeName, value) {
        const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);
        if (!attributeDefinition || !attributeDefinition.definition.deserialize) {
            return value;
        }
        return attributeDefinition.definition.deserialize(value);
    }
    serializeRelationship(relationships, resourceType, primaryKeyName = types_1.DEFAULT_PRIMARY_KEY) {
        if (!relationships) {
            return null;
        }
        if (Array.isArray(relationships)) {
            return relationships
                .filter(Boolean)
                .map((relationship) => this.serializeRelationship(relationship, resourceType, primaryKeyName))
                .filter(Boolean);
        }
        const id = relationships.id || relationships[primaryKeyName || types_1.DEFAULT_PRIMARY_KEY];
        if (!id) {
            return null;
        }
        return { id, type: resourceType.type };
    }
    serializeIncludedResources(data, resourceType) {
        var _a, _b;
        if (!data) {
            return null;
        }
        if (Array.isArray(data)) {
            return data
                .map((record) => this.serializeIncludedResources(record, resourceType))
                .flat()
                .filter(Boolean);
        }
        if (data.preventSerialization) {
            return [];
        }
        const schemaRelationships = resourceType.schema.relationships;
        let includedData = [];
        const relationships = Object.keys(data.relationships)
            .filter((relationshipName) => data.relationships[relationshipName])
            .map((relationshipName) => ({
            relationshipName,
            resources: data.relationships[relationshipName],
        }));
        for (const { relationshipName, resources } of relationships) {
            // Skip if no resources are included
            if (!resources)
                continue;
            // Extract resources at this level
            const { direct: directResources = [], nested: nestedResources = {} } = resources;
            // Skip if no direct resources
            if (!directResources || directResources.length === 0)
                return;
            // Get the resource class for this relationship
            const relatedResourceClass = schemaRelationships[relationshipName].type();
            const pkName = relatedResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            // Process direct resources
            const serializedDirectResources = directResources
                .filter((resource) => resource && resource[pkName])
                .map((resource) => {
                // Create a resource object with attributes and empty relationships
                const resourceObj = new relatedResourceClass({
                    id: resource[pkName],
                    attributes: (0, unpick_1.default)(resource, [
                        pkName,
                        ...Object.keys(relatedResourceClass.schema.attributes).filter((attribute) => this.isSensitiveAttribute(relatedResourceClass.schema, attribute)),
                    ]),
                    relationships: {},
                });
                // Serialize the resource
                return {
                    ...this.serializeResource(resourceObj, relatedResourceClass),
                    type: relatedResourceClass.type,
                };
            });
            // Add direct resources to included data
            includedData = includedData.concat(serializedDirectResources);
            // Process nested resources recursively
            if (nestedResources && Object.keys(nestedResources).length > 0) {
                // For each nested relationship name at this level (e.g., 'parentComment', 'author')
                const nestedRelationshipNames = Object.keys(nestedResources);
                for (const nestedRelationName of nestedRelationshipNames) {
                    const nestedRelationshipDescriptor = nestedResources[nestedRelationName];
                    // Skip if no data (direct or nested) for this nested relationship
                    // Also skip if no direct resources at this nested level to recurse from
                    if (!nestedRelationshipDescriptor || !((_a = nestedRelationshipDescriptor.direct) === null || _a === void 0 ? void 0 : _a.length))
                        return;
                    // Get the resource class for this *nested* relationship
                    const nestedResourceClass = (_b = relatedResourceClass.schema.relationships[nestedRelationName]) === null || _b === void 0 ? void 0 : _b.type();
                    if (!nestedResourceClass)
                        return; // Should not happen
                    const nestedPrimaryKey = nestedResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
                    // We need to process the *direct* resources of this nested level for further recursion
                    const nestedDirectResources = nestedRelationshipDescriptor.direct || [];
                    nestedDirectResources.forEach((nestedResourceRecord) => {
                        // Create a placeholder resource object for recursion.
                        // It needs the ID and any *further* nested relationships from the descriptor.
                        // Build the relationships object safely for the placeholder
                        const placeholderRelationships = {};
                        if (nestedRelationshipDescriptor.nested) {
                            // Iterate through the keys (deeper relationship names) in the nested descriptor
                            Object.keys(nestedRelationshipDescriptor.nested).forEach((deeperRelName) => {
                                // Check if this is a valid relationship for the nestedResourceClass
                                if (nestedResourceClass.schema.relationships[deeperRelName]) {
                                    // Assign the descriptor for this deeper relationship
                                    placeholderRelationships[deeperRelName] = nestedRelationshipDescriptor.nested[deeperRelName];
                                }
                            });
                        }
                        const resourceForRecursion = new nestedResourceClass({
                            id: nestedResourceRecord[nestedPrimaryKey],
                            attributes: {},
                            relationships: placeholderRelationships, // Use the filtered/structured object
                        });
                        // Recursively call serializeIncludedResources for this nested resource
                        const deeperIncluded = this.serializeIncludedResources(resourceForRecursion, // Pass the placeholder containing deeper relationships
                        nestedResourceClass);
                        if (deeperIncluded) {
                            includedData = includedData.concat(deeperIncluded);
                        }
                    });
                }
            }
        }
        // Remove duplicates by type and ID
        const uniqueResources = new Map();
        const uniqueResourcesFiltered = includedData.filter(Boolean);
        for (const resource of uniqueResourcesFiltered) {
            if (resource) {
                const key = `${resource.type}-${resource.id}`;
                uniqueResources.set(key, resource);
            }
        }
        return Array.from(uniqueResources.values());
    }
}
exports.default = JsonApiSerializer;
//# sourceMappingURL=serializer.js.map