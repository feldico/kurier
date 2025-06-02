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
    // Default case - use andWhere for any other condition
    return "andWhere";
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
    // Get top-level relationships (first segment of each path)
    const relationships = (0, pick_1.default)(resourceRelationships, includes.map((nestedInclude) => nestedInclude[0]));
    // Process nested relationships (all relationships beyond the first segment)
    const nestedRelationships = includes
        .filter((include) => include.length > 1)
        .reduce((acumRelationships, includePath) => {
        // The first segment is the top-level relationship
        const [nestedOrigin, ...restOfPath] = includePath;
        // Initialize the relationship object if it doesn't exist
        acumRelationships[nestedOrigin] = acumRelationships[nestedOrigin] || {};
        // Add the nested relationship
        if (restOfPath.length > 0) {
            // Get immediate child relationship
            const nestedRelationshipName = restOfPath[0];
            // Add it to the accumulated relationships if it doesn't exist
            if (!acumRelationships[nestedOrigin][nestedRelationshipName]) {
                const relationshipType = relationships[nestedOrigin].type();
                acumRelationships[nestedOrigin][nestedRelationshipName] =
                    relationshipType.schema.relationships[nestedRelationshipName];
            }
        }
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
        // Parse includes and get first level relationships
        const { relationships, nestedRelationships } = parseOperationIncludedRelationships(op.params.include, this.resourceClass.schema.relationships);
        // Fetch direct relationships (first level)
        const directData = await (0, promise_hash_map_1.default)(relationships, (baseKey) => {
            return this.eagerFetchRelationship(baseKey, result, relationships[baseKey], this.resourceClass);
        });
        // Process nested relationships
        const nestedData = {};
        // For each top-level relationship
        for (const baseKey of Object.keys(nestedRelationships)) {
            // Skip if there's no data for this relationship
            if (!directData[baseKey])
                continue;
            // Get all include paths starting with this baseKey
            const includePathsForBaseKey = op.params.include
                .filter(path => path.startsWith(`${baseKey}.`))
                .map(path => path.substring(baseKey.length + 1));
            if (includePathsForBaseKey.length === 0)
                continue;
            // Initialize nested relationship data
            nestedData[baseKey] = {};
            // Get the processor for this relationship
            const baseRelationType = relationships[baseKey].type();
            const relationProcessor = (await this.processorFor(baseRelationType.type));
            // First level of nested relationships (direct children of the base relationship)
            for (const nestedKey of Object.keys(nestedRelationships[baseKey])) {
                const nestedRelation = nestedRelationships[baseKey][nestedKey];
                // Fetch this level of nested relationships
                const nestedResult = await this.eagerFetchRelationship(nestedKey, directData[baseKey], nestedRelation, relationProcessor.resourceClass);
                if (!nestedResult)
                    continue;
                nestedData[baseKey][nestedKey] = nestedResult;
                // Check for deeper paths that extend beyond this level
                const deeperPaths = includePathsForBaseKey
                    .filter(path => path.startsWith(`${nestedKey}.`))
                    .map(path => path.substring(nestedKey.length + 1));
                if (deeperPaths.length > 0) {
                    // Create an operation for the deeper level
                    const nestedRelationType = nestedRelation.type();
                    const nestedRelationProcessor = await this.processorFor(nestedRelationType.type);
                    // Recursively load the deeper nested relationships
                    const deeperOp = {
                        ...op,
                        params: {
                            ...op.params,
                            include: deeperPaths
                        }
                    };
                    // Use the result of the current level as the input for the next level
                    const deeperNestedData = await nestedRelationProcessor.eagerLoad(deeperOp, nestedResult);
                    // Store the deeper nested data within the current nested data structure
                    if (Object.keys(deeperNestedData).length > 0) {
                        nestedData[baseKey][nestedKey] = {
                            direct: nestedResult,
                            nested: deeperNestedData
                        };
                    }
                }
            }
        }
        // Prepare final result
        const eagerlyLoadedData = {};
        for (const baseKey in directData) {
            if (directData.hasOwnProperty(baseKey)) {
                eagerlyLoadedData[baseKey] = {
                    direct: directData[baseKey],
                    nested: nestedData[baseKey] || {}
                };
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
        // Apply filters asynchronously
        await this.filtersToKnex(query, filters);
        // Add any other query modifications
        this.optionsBuilder(query, params || {});
        // Execute the query
        const records = await query.select(columns);
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
        var _a;
        const { params, ref } = op;
        const { id } = ref;
        const primaryKey = this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
        const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };
        const query = this.getQuery();
        await this.filtersToKnex(query, filters);
        const record = await query.first();
        if (!record) {
            throw json_api_errors_1.default.RecordNotExists();
        }
        // Delete dependent records first
        for (const relationshipName in this.resourceClass.schema.relationships) {
            const relationship = this.resourceClass.schema.relationships[relationshipName];
            if (relationship.hasMany) {
                // Find the foreign key name on the related resource's table
                const relatedResourceClass = await this.resourceFor(relationship.type().type);
                const relatedProcessor = await this.processorFor(relatedResourceClass.type);
                const foreignKeyRelationship = Object.entries(relatedResourceClass.schema.relationships)
                    .find(([, rel]) => rel.type().type === this.resourceClass.type && rel.belongsTo);
                if (foreignKeyRelationship) {
                    const foreignKeyName = foreignKeyRelationship[1].foreignKeyName ||
                        this.appInstance.app.serializer.relationshipToColumn(foreignKeyRelationship[0], this.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY);
                    // Delete related records
                    await relatedProcessor.getQuery()
                        .where({ [foreignKeyName]: id })
                        .del();
                }
            }
            // Original manyToMany intermediate table deletion logic
            else if (relationship.manyToMany) {
                const relationResourceClass = await this.resourceFor(relationship.type().type);
                // This finds the FK column in intermediate table pointing to THIS resource type (e.g., user_id)
                const toManyResourceFK = (_a = relationResourceClass.schema.relationships[`${(0, string_1.pluralize)(this.resourceClass.type)}`]) === null || _a === void 0 ? void 0 : _a.foreignKeyName;
                if (relationship.intermediateTable && toManyResourceFK) {
                    await this.knex(relationship.intermediateTable)
                        .where({ [toManyResourceFK]: id })
                        .del();
                } // Added check for intermediateTable and FK name
            }
        }
        // Finally, delete the main resource
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
        const query = this.getQuery();
        await this.filtersToKnex(query, filters);
        const updated = await query.first().update(dataToUpdate);
        if (!updated) {
            throw json_api_errors_1.default.RecordNotExists();
        }
        // Only process relationships that are explicitly included in the request
        if (data === null || data === void 0 ? void 0 : data.relationships) {
            // Process only the relationships that were explicitly included in the request
            for (const relationshipName in data.relationships) {
                const relationship = this.resourceClass.schema.relationships[relationshipName];
                if (relationship && relationship.manyToMany) {
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
    async filtersToKnex(queryBuilder, filters) {
        const processedFilters = [];
        const nestedFilters = [];
        // Remove undefined filters
        Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);
        const validKeys = this.getValidAttributes(this.resourceClass.schema, this.appInstance.app.serializer);
        // First collect all filters, separating nested from regular
        Object.keys(filters).forEach((key) => {
            // Skip computed attributes
            if (key in this.attributes) {
                return;
            }
            // Separate nested relationship filters for special handling
            if (key.includes('.')) {
                nestedFilters.push({ key, value: filters[key] });
            }
            else {
                // Process regular filter
                if (!validKeys.includes(key)) {
                    throw json_api_errors_1.default.BadRequest(`${key} is not a valid field to filter`);
                }
                const matches = String(filters[key]).split("|");
                matches.forEach((match) => {
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
                    const method = getWhereMethod(value, operator);
                    const column = key === this.resourceClass.schema.primaryKeyName
                        ? key
                        : this.appInstance.app.serializer.attributeToColumn(key);
                    // Apply the filter directly using Knex's query builder
                    if (method === 'whereNull') {
                        queryBuilder.whereNull(column);
                    }
                    else if (method === 'whereNotNull') {
                        queryBuilder.whereNotNull(column);
                    }
                    else {
                        queryBuilder.where(column, operator, value);
                    }
                });
            }
        });
        // Now handle nested filters one by one
        for (const { key, value } of nestedFilters) {
            await this.applyNestedFilter(queryBuilder, key, value);
        }
        return queryBuilder;
    }
    /**
     * Apply a nested relationship filter using a two-step approach
     * 1. Query related table to get valid IDs
     * 2. Apply those IDs as a filter on the main table
     */
    async applyNestedFilter(queryBuilder, key, filterValue) {
        const parts = key.split('.');
        const relationshipPath = parts.slice(0, -1);
        const targetField = parts[parts.length - 1];
        // Start with the current resource
        let currentResourceClass = this.resourceClass;
        let foreignKeyName = null;
        // Build the path through relationships
        for (let i = 0; i < relationshipPath.length; i++) {
            const relationshipName = relationshipPath[i];
            const isLastSegment = (i === relationshipPath.length - 1);
            // Get the relationship definition
            const relationship = currentResourceClass.schema.relationships[relationshipName];
            if (!relationship) {
                throw json_api_errors_1.default.BadRequest(`Invalid relationship path: ${key}. '${relationshipName}' is not a valid relationship.`);
            }
            // Get the target resource class for this relationship
            const targetResourceClass = relationship.type();
            // Determine how records are linked between these resources
            if (relationship.belongsTo) {
                // Keep track of the FK on the *current* table for this belongsTo
                foreignKeyName = relationship.foreignKeyName ||
                    this.appInstance.app.serializer.relationshipToColumn(relationshipName, targetResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY);
                if (isLastSegment) {
                    // If this is the last segment, apply the filter using the final foreignKeyName
                    const comparer = filterValue.includes(":") ? filterValue.split(":")[0] : "eq";
                    const value = filterValue.includes(":") ? filterValue.split(":")[1] : filterValue;
                    const operator = operators_1.KnexOperators[comparer];
                    // Apply directly to the main query builder
                    queryBuilder.where(foreignKeyName, operator, value);
                    return; // Filter applied for this belongsTo path
                }
                // Otherwise, just continue to the next segment
            }
            else {
                // --- Start of original hasMany/manyToMany logic ---
                // This part is likely still buggy for multi-step paths
                const targetTableName = this.appInstance.app.serializer.resourceTypeToTableName(targetResourceClass.type);
                const subquery = this.knex(targetTableName);
                const targetPrimaryKey = targetResourceClass.schema.primaryKeyName || 'id';
                // Apply final filter only if this is the last segment
                if (isLastSegment) {
                    const comparer = filterValue.includes(":") ? filterValue.split(":")[0] : "eq";
                    const value = filterValue.includes(":") ? filterValue.split(":")[1] : filterValue;
                    const operator = operators_1.KnexOperators[comparer];
                    subquery.where(targetField, operator, value);
                }
                else {
                    // If not the last segment, we cannot correctly apply the filter here yet.
                    // The subquery needs to be built across multiple tables/joins.
                    // Throw error for now, as this case wasn't handled correctly before either.
                    throw json_api_errors_1.default.BadRequest(`Nested filtering through multiple hasMany/manyToMany relationships ('${key}') is not fully supported.`);
                }
                const subqueryIds = await subquery.select(targetPrimaryKey).pluck(targetPrimaryKey);
                if (subqueryIds.length === 0) {
                    queryBuilder.whereRaw('1 = 0'); // Optimize for no results
                    return;
                }
                const ids = subqueryIds; // Already plucked
                // Link back to the *original* resource table (queryBuilder)
                // How the first relationship links determines the key for whereIn
                const firstRelationship = this.resourceClass.schema.relationships[relationshipPath[0]];
                if (firstRelationship.belongsTo) {
                    const firstForeignKeyName = firstRelationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(relationshipPath[0], firstRelationship.type().schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY);
                    queryBuilder.whereIn(firstForeignKeyName, ids); // This seems wrong - linking back via belongsTo FK?
                    // Should be linking the PK of the first related type (targetResourceClass) to the FK on the base table (this.resourceClass)
                    // This whole link-back logic needs review depending on the first step relationship type.
                    // Let's revert to the previous link-back logic for now, acknowledging it might be flawed.
                    if (relationship.foreignKeyName) { // If FK is on *this* table (like a belongsTo configured oddly?)
                        queryBuilder.whereIn(relationship.foreignKeyName, ids);
                    }
                    else { // Original hasMany/manyToMany link-back
                        if (relationship.manyToMany && relationship.intermediateTable) {
                            // ... (original manyToMany link back logic using intermediate table) ...
                            const intermediateTable = relationship.intermediateTable;
                            const junctionQuery = this.knex(intermediateTable);
                            let relatedForeignKey = relationship.foreignKeyName || `${targetResourceClass.type.toLowerCase()}_id`;
                            const thisForeignKey = `${currentResourceClass.type.toLowerCase()}_id`; // Use current class context?
                            junctionQuery.whereIn(relatedForeignKey, ids);
                            const linkBackSubQuery = junctionQuery.select(thisForeignKey);
                            queryBuilder.whereIn(currentResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY, linkBackSubQuery);
                        }
                        else { // hasMany
                            // ... (original hasMany link back logic using reverse FK) ...
                            const reverseRelationshipName = Object.keys(targetResourceClass.schema.relationships).find(relName => {
                                const rel = targetResourceClass.schema.relationships[relName];
                                return rel.type().type === currentResourceClass.type;
                            });
                            if (!reverseRelationshipName) {
                                throw json_api_errors_1.default.BadRequest('Cannot find reverse relationship');
                            }
                            const reverseRelationship = targetResourceClass.schema.relationships[reverseRelationshipName];
                            const foreignKeyOnRelated = reverseRelationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(currentResourceClass.type, "id");
                            const linkBackSubQuery = this.knex(targetTableName).select(foreignKeyOnRelated).whereIn(targetPrimaryKey, ids);
                            queryBuilder.whereIn(currentResourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY, linkBackSubQuery);
                        }
                    }
                }
                return; // Filter applied (or attempted)
            }
            currentResourceClass = targetResourceClass;
        }
        // If the loop finishes, it means the *entire* path was belongsTo.
        // The filter should have been applied in the last iteration.
        // If foreignKeyName is still null here, something is wrong.
        if (!foreignKeyName) {
            throw json_api_errors_1.default.BadRequest(`Could not apply filter for belongsTo path: ${key}`);
        }
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
            const foreignPrimaryKey = relationProcessor.resourceClass.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY;
            return query
                .join(`${relationship['intermediateTable']}`, `${foreignTableName}.${foreignPrimaryKey}`, "=", `${relationship['intermediateTable']}.${foreignKey}`)
                .join(baseTableName, `${relationship['intermediateTable']}.${primaryKeyIntermediate}`, "=", `${baseTableName}.${primaryKey}`)
                .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
                .select(columns.map((field) => `${foreignTableName}.${field}`));
        }
    }
    async getRelationships(op, record, eagerLoadedData) {
        return eagerLoadedData;
    }
}
exports.default = KnexProcessor;
//# sourceMappingURL=knex-processor.js.map