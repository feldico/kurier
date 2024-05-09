"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_api_errors_1 = require("../errors/json-api-errors");
const types_1 = require("../types");
const pick_1 = require("../utils/pick");
const promise_hash_map_1 = require("../utils/promise-hash-map");
const operation_processor_1 = require("./operation-processor");
const operators_1 = require("../utils/operators");
const string_1 = require("../utils/string");
const getWhereMethod = (value, operator) => {
    if (value !== "null") {
        return "andWhere";
    }
    if (value === "null" && operator === "=") {
        return "whereNull";
    }
    if (value === "null" && operator === "!=") {
        return "whereNotNull";
    }
};
const buildSortClause = (sort, resourceClass, serializer) => {
    return sort.map((criteria) => {
        const direction = criteria.startsWith("-") ? "DESC" : "ASC";
        const attributeName = criteria.startsWith("-") ? criteria.substr(1) : criteria;
        const isCustomFK = Object.entries(resourceClass.schema.relationships)
            .filter(([, value]) => value.belongsTo)
            .map(([, value]) => value.foreignKeyName)
            .includes(attributeName);
        const field = isCustomFK ? attributeName : serializer.attributeToColumn(attributeName);
        return { field, direction };
    });
};
const parseOperationIncludedRelationships = (operationIncludes, resourceRelationships) => {
    const includes = operationIncludes.map((relationship) => relationship.split("."));
    const relationships = (0, pick_1.default)(resourceRelationships, includes.map((nestedInclude) => nestedInclude[0]));
    const nestedRelationships = includes
        .filter((include) => include.length > 1)
        .reduce((acumRelationships, [nestedOrigin, nestedRelationshipName]) => {
        acumRelationships[nestedOrigin] = {
            ...acumRelationships[nestedOrigin],
            [nestedRelationshipName]: relationships[nestedOrigin].type().schema.relationships[nestedRelationshipName],
        };
        return acumRelationships;
    }, {});
    return { relationships, nestedRelationships };
};
class KnexProcessor extends operation_processor_1.default {
    constructor(appInstance) {
        super(appInstance);
        this.knex = appInstance.transaction;
    }
    getQuery() {
        return this.knex(this.tableName);
    }
    async eagerLoad(op, result) {
        if (!op.params || !op.params.include) {
            return {};
        }
        const { relationships, nestedRelationships } = parseOperationIncludedRelationships(op.params.include, this.resourceClass.schema.relationships);
        const directData = await (0, promise_hash_map_1.default)(relationships, (baseKey) => {
            return this.eagerFetchRelationship(baseKey, result, relationships[baseKey], this.resourceClass);
        });
        const nestedData = await (0, promise_hash_map_1.default)(nestedRelationships, async (baseKey) => {
            return await (0, promise_hash_map_1.default)(nestedRelationships[baseKey], async (key) => {
                const relationProcessor = (await this.processorFor(relationships[baseKey].type().type));
                return this.eagerFetchRelationship(key, directData[baseKey], nestedRelationships[baseKey][key], relationProcessor.resourceClass);
            });
        });
        const eagerlyLoadedData = {};
        for (const baseKey in directData) {
            if (directData.hasOwnProperty(baseKey)) {
                eagerlyLoadedData[baseKey] = { direct: directData[baseKey], nested: nestedData[baseKey] };
            }
        }
        return eagerlyLoadedData;
    }
    getColumns(serializer, fields = {}) {
        const { type, schema } = this.resourceClass;
        const { attributes, relationships, primaryKeyName } = schema;
        const relationshipsKeys = Object.entries(relationships)
            .filter(([, value]) => value.belongsTo)
            .map(([key, value]) => value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || types_1.DEFAULT_PRIMARY_KEY));
        const typeFields = (fields[type] || []).filter((key) => Object.keys(attributes).includes(key));
        const attributesKeys = typeFields.length ? typeFields : Object.keys(attributes);
        return [
            ...attributesKeys.map((key) => `${serializer.attributeToColumn(key)} as ${key}`),
            ...relationshipsKeys,
            this.knex.raw('count(*) OVER() AS total'),
            primaryKeyName || types_1.DEFAULT_PRIMARY_KEY,
        ];
    }
    async get(op) {
        var _a, _b;
        const { params, ref } = op;
        const { id } = ref;
        const primaryKey = this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };
        let query = this.getQuery();
        let columns = this.getColumns(this.appInstance.app.serializer, (params || {}).fields);
        if (params === null || params === void 0 ? void 0 : params.include) {
            let isIncluded = false;
            for (const include of params.include) {
                if (include.includes('.')) {
                    continue;
                }
                const relationship = this.resourceClass.schema.relationships[include];
                if (relationship.manyToMany && relationship.foreignKeyName && relationship.intermediateTable && filters.hasOwnProperty(relationship.foreignKeyName)) {
                    if (!isIncluded) {
                        columns = columns.map(column => {
                            if (typeof column !== 'string' && columns.toString().includes('count')) {
                                return column;
                            }
                            return `${this.tableName}.${column}`;
                        });
                        isIncluded = true;
                    }
                    const intermediateTableColumn = `${(0, string_1.underscore)(op.ref.type)}_id`;
                    query.innerJoin(relationship.intermediateTable, `${this.tableName}.${primaryKey}`, `${relationship.intermediateTable}.${intermediateTableColumn}`);
                    columns.push(`${relationship.intermediateTable}.${relationship.foreignKeyName} as ${relationship.foreignKeyName}`);
                }
            }
        }
        const records = await query
            .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
            .modify((queryBuilder) => this.optionsBuilder(queryBuilder, params || {}))
            .select(columns);
        if (!records.length && id) {
            throw json_api_errors_1.default.RecordNotExists();
        }
        if ((_a = op.params) === null || _a === void 0 ? void 0 : _a.page) {
            op.meta = op.meta || {};
            op.meta.total = (_b = records[0]) === null || _b === void 0 ? void 0 : _b.total;
        }
        if (id) {
            return records[0];
        }
        return records;
    }
    async remove(op) {
        const { params, ref } = op;
        const { id } = ref;
        const primaryKey = this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };
        const record = await this.getQuery()
            .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
            .first();
        if (!record) {
            throw json_api_errors_1.default.RecordNotExists();
        }
        for (const relationshipName in this.resourceClass.schema.relationships) {
            const relationship = this.resourceClass.schema.relationships[relationshipName];
            if (relationship.manyToMany) {
                const relationResourceClass = await this.resourceFor(relationship.type().type);
                const toManyResourceFK = relationResourceClass.schema.relationships[`${(0, string_1.pluralize)(this.resourceClass.type)}`].foreignKeyName;
                await this.knex(relationship['intermediateTable'])
                    .where({ [`${toManyResourceFK}`]: id })
                    .del();
            }
        }
        return await this.getQuery()
            .where({ [primaryKey]: id })
            .del()
            .then(() => undefined);
    }
    async update(op) {
        var _a;
        const { params, ref } = op;
        const data = op.data;
        const { id } = ref;
        const primaryKey = this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };
        const dataToUpdate = Object.assign({}, ...Object.keys(data.attributes).map((attribute) => ({
            [this.appInstance.app.serializer.attributeToColumn(attribute)]: data.attributes[attribute],
        })));
        const updated = await this.getQuery()
            .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
            .first()
            .update(dataToUpdate);
        if (!updated) {
            throw json_api_errors_1.default.RecordNotExists();
        }
        for (const relationshipName in this.resourceClass.schema.relationships) {
            const relationship = this.resourceClass.schema.relationships[relationshipName];
            if (relationship.manyToMany) {
                let relatedData = ((_a = data.relationships[relationshipName]) === null || _a === void 0 ? void 0 : _a.data) || [];
                if (!Array.isArray(relatedData)) {
                    relatedData = [relatedData];
                }
                const relationResourceClass = await this.resourceFor(relationship.type().type);
                const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${(0, string_1.pluralize)(this.resourceClass.type)}`].foreignKeyName;
                if (relationship['intermediateTable']) {
                    const currentData = await this.knex.select('*').from(relationship['intermediateTable'])
                        .where({ [`${primaryKeyIntermediate}`]: id });
                    const currentDataSet = new Set(currentData.map(item => item[`${relationship.foreignKeyName}`].toString()));
                    for (const relatedItem of relatedData) {
                        if (!currentDataSet.has(relatedItem.id.toString())) {
                            await this.knex(relationship['intermediateTable']).insert({
                                [`${primaryKeyIntermediate}`]: id,
                                [`${relationship.foreignKeyName}`]: relatedItem.id,
                            });
                        }
                        currentDataSet.delete(relatedItem.id.toString());
                    }
                    for (const itemId of currentDataSet) {
                        if (itemId) {
                            await this.knex(relationship['intermediateTable'])
                                .where({ [`${primaryKeyIntermediate}`]: id, [`${relationship.foreignKeyName}`]: itemId })
                                .delete();
                        }
                    }
                }
            }
        }
        return await this.getQuery()
            .where({ [primaryKey]: id })
            .select(this.getColumns(this.appInstance.app.serializer))
            .first();
    }
    async add(op) {
        var _a;
        const primaryKeyName = this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const data = op.data;
        const dataToInsert = Object.assign({}, ...Object.keys(data.attributes).map((attribute) => ({
            [this.appInstance.app.serializer.attributeToColumn(attribute)]: data.attributes[attribute],
        })));
        if (data.id) {
            dataToInsert[primaryKeyName] = data.id;
        }
        const [insertedId] = (await this.getQuery().insert(dataToInsert, primaryKeyName));
        // If ID was supplied client-side, use that as a ID for the .whereIn()
        // query afterwards. This partially handles the problem of not having
        // SQL RETURNING support on some engines.
        if (!insertedId[primaryKeyName]) {
            insertedId[primaryKeyName] = data.id;
        }
        for (const relationshipName in this.resourceClass.schema.relationships) {
            const relationship = this.resourceClass.schema.relationships[relationshipName];
            if (relationship.manyToMany) {
                let relatedData = ((_a = data.relationships[relationshipName]) === null || _a === void 0 ? void 0 : _a.data) || [];
                const relationResourceClass = await this.resourceFor(relationship.type().type);
                const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${(0, string_1.pluralize)(this.resourceClass.type)}`].foreignKeyName;
                if (!Array.isArray(relatedData)) {
                    relatedData = [relatedData];
                }
                for (const relatedItem of relatedData) {
                    await this.knex(relationship.intermediateTable).insert({
                        [`${primaryKeyIntermediate}`]: insertedId[primaryKeyName],
                        [`${relationship.foreignKeyName}`]: relatedItem['id'],
                    });
                }
            }
        }
        return await this.getQuery()
            .where(primaryKeyName, insertedId[primaryKeyName])
            .select(this.getColumns(this.appInstance.app.serializer))
            .first();
    }
    get tableName() {
        return this.appInstance.app.serializer.resourceTypeToTableName(this.resourceClass.type);
    }
    getValidAttributes(schema, serializer) {
        const { attributes, relationships, primaryKeyName } = schema;
        const relationshipsKeys = Object.entries(relationships)
            .filter(([, value]) => value.belongsTo || value.manyToMany)
            .map(([key, value]) => value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || types_1.DEFAULT_PRIMARY_KEY));
        return Object.keys(attributes)
            .concat(relationshipsKeys)
            .concat(primaryKeyName || types_1.DEFAULT_PRIMARY_KEY);
    }
    filtersToKnex(queryBuilder, filters) {
        const processedFilters = [];
        Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);
        const validKeys = this.getValidAttributes(this.resourceClass.schema, this.appInstance.app.serializer);
        Object.keys(filters).forEach((key) => {
            if (key in this.attributes) {
                return;
            }
            if (!validKeys.includes(key)) {
                throw json_api_errors_1.default.BadRequest(`${key} is not a valid field to filter`);
            }
            const matches = String(filters[key]).split("|");
            processedFilters.push(...matches.map((match) => {
                let value = "";
                let comparer = "";
                if (match.includes(":")) {
                    [comparer, value] = match.split(":");
                }
                else {
                    comparer = "eq";
                    value = match;
                }
                const operator = operators_1.KnexOperators[comparer];
                return {
                    value,
                    operator,
                    method: getWhereMethod(value, operator),
                    column: key === this.resourceClass.schema.primaryKeyName
                        ? key
                        : this.appInstance.app.serializer.attributeToColumn(key),
                };
            }));
        });
        return processedFilters.forEach((filter) => queryBuilder[filter.method](filter.column, filter.operator, filter.value));
    }
    optionsBuilder(queryBuilder, params) {
        const { sort, page } = params;
        if (sort) {
            buildSortClause(sort, this.resourceClass, this.appInstance.app.serializer).forEach(({ field, direction }) => {
                queryBuilder.orderBy(field, direction);
            });
        }
        if (page) {
            queryBuilder.offset(page.offset || page.number * page.size).limit(page.limit || page.size);
        }
    }
    async eagerFetchRelationship(key, result, relationship, baseResource) {
        const baseTableName = this.appInstance.app.serializer.resourceTypeToTableName(baseResource.type);
        const relationProcessor = (await this.processorFor(relationship.type().type));
        const query = relationProcessor.getQuery();
        const foreignTableName = relationProcessor.tableName;
        const foreignType = relationProcessor.resourceClass.type;
        const sqlOperator = Array.isArray(result) ? "in" : "=";
        const columns = relationProcessor.getColumns(this.appInstance.app.serializer).filter((column) => typeof column == 'string');
        const primaryKey = baseResource.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const queryIn = Array.isArray(result)
            ? result.map((resource) => resource[primaryKey])
            : result[primaryKey];
        if (relationship.belongsTo) {
            const belongingPrimaryKey = relationship.type().schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            const foreignKey = relationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(key, primaryKey);
            const belongingTableName = this.appInstance.app.serializer.foreignResourceToForeignTableName(foreignType);
            return query
                .join(baseTableName, `${belongingTableName}.${belongingPrimaryKey}`, "=", `${baseTableName}.${foreignKey}`)
                .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
                .select(columns.map((field) => `${belongingTableName}.${field}`))
                .from(`${foreignTableName} as ${belongingTableName}`);
        }
        if (relationship.hasMany) {
            const foreignKey = relationship.foreignKeyName ||
                this.appInstance.app.serializer.relationshipToColumn(baseResource.type, primaryKey);
            return query
                .join(baseTableName, `${foreignTableName}.${foreignKey}`, "=", `${baseTableName}.${primaryKey}`)
                .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
                .select(columns.map((field) => `${foreignTableName}.${field}`));
        }
        if (relationship.manyToMany) {
            const foreignKey = relationship.foreignKeyName;
            const relationResourceClass = await this.resourceFor(relationship.type().type);
            const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${(0, string_1.pluralize)(this.resourceClass.type)}`].foreignKeyName;
            return query
                .join(`${relationship['intermediateTable']}`, `${foreignTableName}.${primaryKey}`, "=", `${relationship['intermediateTable']}.${foreignKey}`)
                .join(baseTableName, `${relationship['intermediateTable']}.${primaryKeyIntermediate}`, "=", `${baseTableName}.${primaryKey}`)
                .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
                .select(columns.map((field) => `${foreignTableName}.${field}`));
        }
    }
    async getRelationships(op, record, eagerLoadedData) {
        if (!op.params || !op.params.include) {
            return {};
        }
        return eagerLoadedData;
    }
}
exports.default = KnexProcessor;
//# sourceMappingURL=knex-processor.js.map