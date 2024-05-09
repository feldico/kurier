"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../attribute-types/password");
const types_1 = require("../types");
const pick_1 = require("../utils/pick");
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
        data.relationships = relationshipsFound.reduce((relationships, relationship) => {
            relationships[relationship.name] = {
                id: data.attributes[relationship.key],
                type: schemaRelationships[relationship.name].type().type,
            };
            return relationships;
        }, eagerlyLoadedRelationships);
        Object.keys(data.relationships)
            .filter((relName) => data.relationships[relName] && schemaRelationships[relName])
            .forEach((relName) => {
            const fkName = schemaRelationships[relName].belongsTo
                ? types_1.DEFAULT_PRIMARY_KEY
                : schemaRelationships[relName].type().schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            data.relationships[relName] = {
                data: this.serializeRelationship(data.relationships[relName], schemaRelationships[relName].type(), fkName),
            };
        });
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
        if (Array.isArray(relationships)) {
            return relationships.map((relationship) => this.serializeRelationship(relationship, resourceType, primaryKeyName));
        }
        relationships.id = relationships[primaryKeyName || types_1.DEFAULT_PRIMARY_KEY];
        if (!relationships.id) {
            return null;
        }
        relationships.type = resourceType.type;
        return (0, pick_1.default)(relationships, ["id", "type"]);
    }
    serializeIncludedResources(data, resourceType) {
        if (!data) {
            return null;
        }
        if (Array.isArray(data)) {
            return data.map((record) => this.serializeIncludedResources(record, resourceType));
        }
        if (data.preventSerialization) {
            return [];
        }
        const schemaRelationships = resourceType.schema.relationships;
        let includedData = [];
        Object.keys(data.relationships)
            .filter((relationshipName) => data.relationships[relationshipName])
            .map((relationshipName) => ({
            relationshipName,
            resources: data.relationships[relationshipName],
        }))
            .forEach(({ relationshipName, resources }) => {
            const { direct: directResources = [], nested: nestedResources = [] } = resources;
            const relatedResourceClass = schemaRelationships[relationshipName].type();
            const pkName = relatedResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            includedData = includedData.concat(directResources.map((resource) => {
                if (resource[pkName]) {
                    return {
                        ...this.serializeResource(new relatedResourceClass({
                            id: resource[pkName],
                            attributes: (0, unpick_1.default)(resource, [
                                pkName,
                                ...Object.keys(relatedResourceClass.schema.attributes).filter((attribute) => this.isSensitiveAttribute(relatedResourceClass.schema, attribute)),
                            ]),
                            relationships: {}, //TODO: this is not responding with the nested relationship relations
                        }), relatedResourceClass),
                        type: relatedResourceClass.type,
                    };
                }
            }));
            if (nestedResources) {
                includedData = includedData.concat(Object.entries(nestedResources).map(([subRelationName, nestedRelationData]) => {
                    const subResourceClass = relatedResourceClass.schema.relationships[subRelationName].type();
                    const subPkName = subResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
                    return nestedRelationData.map((resource) => {
                        if (resource[subPkName]) {
                            return {
                                ...this.serializeResource(new subResourceClass({
                                    id: resource[subPkName],
                                    attributes: (0, unpick_1.default)(resource, [
                                        subPkName,
                                        ...Object.keys(subResourceClass.schema.attributes).filter((attribute) => this.isSensitiveAttribute(subResourceClass.schema, attribute)),
                                    ]),
                                    relationships: {}, // nestedResources.filter
                                }), subResourceClass),
                                type: subResourceClass.type,
                            };
                        }
                    });
                }));
            }
        });
        return includedData;
    }
}
exports.default = JsonApiSerializer;
//# sourceMappingURL=serializer.js.map