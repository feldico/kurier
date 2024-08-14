import { Knex } from "knex";
import JsonApiErrors from "../errors/json-api-errors";
import Resource from "../resource";
import {
  ApplicationInstanceInterface,
  DEFAULT_PRIMARY_KEY,
  EagerLoadedData,
  HasId,
  IJsonApiSerializer,
  JsonApiParams,
  KnexRecord,
  Operation,
  ResourceSchema,
  ResourceSchemaRelationship,
  ResourceSchemaRelationships,
} from "../types";
import pick from "../utils/pick";
import promiseHashMap from "../utils/promise-hash-map";
import OperationProcessor from "./operation-processor";
import { KnexOperators as operators } from "../utils/operators";
import { underscore, pluralize } from "../utils/string";

const getWhereMethod = (value: string, operator: string) => {
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

const buildSortClause = (sort: string[], resourceClass: typeof Resource, serializer: IJsonApiSerializer) => {
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

const parseOperationIncludedRelationships = (
  operationIncludes: string[],
  resourceRelationships: ResourceSchemaRelationships,
): {
  relationships: ResourceSchemaRelationships;
  nestedRelationships: { [key: string]: ResourceSchemaRelationships };
} => {
  const includes = operationIncludes.map((relationship: string) => relationship.split("."));

  const relationships = pick<ResourceSchemaRelationships, ResourceSchemaRelationships>(
    resourceRelationships,
    includes.map((nestedInclude) => nestedInclude[0]),
  );

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

export default class KnexProcessor<ResourceT extends Resource> extends OperationProcessor<ResourceT> {
  protected knex: Knex.Transaction;

  constructor(appInstance: ApplicationInstanceInterface) {
    super(appInstance);
    this.knex = appInstance.transaction as Knex.Transaction;
  }

  getQuery(): Knex.QueryBuilder {
    return this.knex(this.tableName);
  }

  async eagerLoad(op: Operation, result: ResourceT | ResourceT[]): Promise<EagerLoadedData> {
    if (!op.params || !op.params.include) {
      return {};
    }

    const { relationships, nestedRelationships } = parseOperationIncludedRelationships(
      op.params.include,
      this.resourceClass.schema.relationships,
    );
    const directData = await promiseHashMap(relationships, (baseKey: string) => {
      return this.eagerFetchRelationship(baseKey, result, relationships[baseKey], this.resourceClass);
    });

    const nestedData: { [key: string]: KnexRecord[] | undefined } = await promiseHashMap(
      nestedRelationships,
      async (baseKey: string) => {
        return await promiseHashMap(nestedRelationships[baseKey], async (key: string) => {
          const relationProcessor = (await this.processorFor(
            relationships[baseKey].type().type,
          )) as KnexProcessor<Resource>;
          return this.eagerFetchRelationship(
            key,
            directData[baseKey],
            nestedRelationships[baseKey][key],
            relationProcessor.resourceClass,
          );
        });
      },
    );

    const eagerlyLoadedData = {};
    for (const baseKey in directData) {
      if (directData.hasOwnProperty(baseKey)) {
        eagerlyLoadedData[baseKey] = { direct: directData[baseKey], nested: nestedData[baseKey] };
      }
    }

    return eagerlyLoadedData;
  }

  protected getColumns(serializer: IJsonApiSerializer, fields = {}): any[] {
    const { type, schema } = this.resourceClass;
    const { attributes, relationships, primaryKeyName } = schema;
    const relationshipsKeys = Object.entries(relationships)
      .filter(([, value]) => value.belongsTo)
      .map(
        ([key, value]) =>
          value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || DEFAULT_PRIMARY_KEY),
      );
    const typeFields = (fields[type] || []).filter((key: string) => Object.keys(attributes).includes(key));

    const attributesKeys: string[] = typeFields.length ? typeFields : Object.keys(attributes);

    return [
      ...attributesKeys.map((key) => `${serializer.attributeToColumn(key)} as ${key}`),
      ...relationshipsKeys,
      this.knex.raw('count(*) OVER() AS total'),
      primaryKeyName || DEFAULT_PRIMARY_KEY,
    ];
  }

  async get(op: Operation): Promise<HasId[] | HasId> {
    const { params, ref } = op;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    let query = this.getQuery();

    let columns = this.getColumns(this.appInstance.app.serializer, (params || {}).fields);

    if(params?.include){
      let isIncluded = false;
      for (const include of params.include) {
        if(include.includes('.')){
          continue;
        }
        const relationship = this.resourceClass.schema.relationships[include];
        if (relationship.manyToMany && relationship.foreignKeyName&& relationship.intermediateTable && filters.hasOwnProperty(relationship.foreignKeyName)) {
          if(!isIncluded){
            columns = columns.map(column => {
              if(typeof column !== 'string' && columns.toString().includes('count')){
                return column
              }
            return `${this.tableName}.${column}`})
            isIncluded = true
          }
          const intermediateTableColumn = `${underscore(op.ref.type)}_id`
          query.innerJoin(relationship.intermediateTable, `${this.tableName}.${primaryKey}`, `${relationship.intermediateTable}.${intermediateTableColumn}`)
          columns.push(`${relationship.intermediateTable}.${relationship.foreignKeyName} as ${relationship.foreignKeyName}`)
        }
      }
    }

    const records: KnexRecord[] = await query
      .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
      .modify((queryBuilder) => this.optionsBuilder(queryBuilder, params || {}))
      .select(columns);

    if (!records.length && id) {
      throw JsonApiErrors.RecordNotExists();
    }

    if (op.params?.page) {
      op.meta = op.meta || {};
      op.meta.total = records[0]?.total;
    }

    if (id) {
      return records[0];
    }
    return records;
  }

  async remove(op: Operation): Promise<void> {
    const { params, ref } = op;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    const record = await this.getQuery()
      .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
      .first();

    if (!record) {
      throw JsonApiErrors.RecordNotExists();
    }

    for (const relationshipName in this.resourceClass.schema.relationships) {
      const relationship = this.resourceClass.schema.relationships[relationshipName];

      if (relationship.manyToMany) {
        const relationResourceClass = await this.resourceFor(relationship.type().type)
        const toManyResourceFK = relationResourceClass.schema.relationships[`${pluralize(this.resourceClass.type)}`].foreignKeyName;
        await this.knex(relationship['intermediateTable'])
          .where({ [`${toManyResourceFK}`]: id })
          .del()
      }
    }

    return await this.getQuery()
      .where({ [primaryKey]: id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { params, ref } = op;
    const data = op.data as Resource;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    const dataToUpdate = Object.assign(
      {},
      ...Object.keys(data.attributes).map((attribute) => ({
        [this.appInstance.app.serializer.attributeToColumn(attribute)]: data.attributes[attribute],
      })),
    );

    const updated = await this.getQuery()
      .where((queryBuilder) => this.filtersToKnex(queryBuilder, filters))
      .first()
      .update(dataToUpdate);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    for (const relationshipName in this.resourceClass.schema.relationships) {
      const relationship = this.resourceClass.schema.relationships[relationshipName];

      if (relationship.manyToMany && data?.relationships && Object.keys(data.relationships).length > 0) {
        let relatedData = data.relationships[relationshipName]?.data || [];

        if (!Array.isArray(relatedData)) {
          relatedData = [relatedData];
        }

        const relationResourceClass = await this.resourceFor(relationship.type().type)
        const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${pluralize(this.resourceClass.type)}`].foreignKeyName;

        if(relationship['intermediateTable']){
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
              .where({ [`${primaryKeyIntermediate}`]: id,  [`${relationship.foreignKeyName}`]: itemId })
              .delete();}
          }
        }
      }
    }
    return await this.getQuery()
      .where({ [primaryKey]: id })
      .select(this.getColumns(this.appInstance.app.serializer))
      .first();
  }

  async add(op: Operation): Promise<HasId> {
    const primaryKeyName = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const data = op.data as Resource;

    const dataToInsert = Object.assign(
      {},
      ...Object.keys(data.attributes).map((attribute) => ({
        [this.appInstance.app.serializer.attributeToColumn(attribute)]: data.attributes[attribute],
      })),
    );

    if (data.id) {
      dataToInsert[primaryKeyName] = data.id;
    }

    const [insertedId] = (await this.getQuery().insert(dataToInsert, primaryKeyName)) as HasId[];

    // If ID was supplied client-side, use that as a ID for the .whereIn()
    // query afterwards. This partially handles the problem of not having
    // SQL RETURNING support on some engines.
    if (!insertedId[primaryKeyName]) {
      insertedId[primaryKeyName] = data.id;
    }

    for (const relationshipName in this.resourceClass.schema.relationships) {
      const relationship = this.resourceClass.schema.relationships[relationshipName];

      if (relationship.manyToMany) {
        let relatedData = data.relationships[relationshipName]?.data || [];
        const relationResourceClass = await this.resourceFor(relationship.type().type)
        const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${pluralize(this.resourceClass.type)}`].foreignKeyName;

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

  getValidAttributes(schema: ResourceSchema, serializer: IJsonApiSerializer) {
    const { attributes, relationships, primaryKeyName } = schema;
    const relationshipsKeys = Object.entries(relationships)
      .filter(([, value]) => value.belongsTo || value.manyToMany)
      .map(
        ([key, value]) =>
          value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || DEFAULT_PRIMARY_KEY),
      );

    return Object.keys(attributes)
      .concat(relationshipsKeys)
      .concat(primaryKeyName || DEFAULT_PRIMARY_KEY);
  }

  filtersToKnex(queryBuilder: Knex.QueryBuilder, filters: {}) {
    const processedFilters: { method: string; column: string; operator: string; value: string }[] = [];

    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

    const validKeys = this.getValidAttributes(this.resourceClass.schema, this.appInstance.app.serializer);

    Object.keys(filters).forEach((key) => {
      if (key in this.attributes) {
        return;
      }

      if (!validKeys.includes(key)) {
        throw JsonApiErrors.BadRequest(`${key} is not a valid field to filter`);
      }

      const matches = String(filters[key]).split("|");

      processedFilters.push(
        ...(matches.map((match: string) => {
          let value = "";
          let comparer = "";

          if (match.includes(":")) {
            [comparer, value] = match.split(":");
          } else {
            comparer = "eq";
            value = match;
          }

          const operator = operators[comparer];

          return {
            value,
            operator,
            method: getWhereMethod(value, operator),
            column:
              key === this.resourceClass.schema.primaryKeyName
                ? key
                : this.appInstance.app.serializer.attributeToColumn(key),
          };
        }) as { method: string; column: string; operator: string; value: string }[]),
      );
    });

    return processedFilters.forEach((filter) =>
      queryBuilder[filter.method](filter.column, filter.operator, filter.value),
    );
  }

  optionsBuilder(queryBuilder: Knex.QueryBuilder, params: JsonApiParams) {
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

  async eagerFetchRelationship(
    key: string,
    result: ResourceT | ResourceT[],
    relationship: ResourceSchemaRelationship,
    baseResource: typeof Resource,
  ): Promise<KnexRecord[] | void> {
    const baseTableName = this.appInstance.app.serializer.resourceTypeToTableName(baseResource.type);
    const relationProcessor = (await this.processorFor(relationship.type().type)) as KnexProcessor<Resource>;

    const query = relationProcessor.getQuery();
    const foreignTableName = relationProcessor.tableName;
    const foreignType = relationProcessor.resourceClass.type;
    const sqlOperator = Array.isArray(result) ? "in" : "=";
    const columns = relationProcessor.getColumns(this.appInstance.app.serializer).filter((column) => typeof column == 'string');

    const primaryKey = baseResource.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

    const queryIn: string | string[] = Array.isArray(result)
      ? result.map((resource: Resource) => resource[primaryKey])
      : result[primaryKey];

    if (relationship.belongsTo) {
      const belongingPrimaryKey = relationship.type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
      const foreignKey =
        relationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(key, primaryKey);
      const belongingTableName = this.appInstance.app.serializer.foreignResourceToForeignTableName(foreignType);

      return query
        .join(baseTableName, `${belongingTableName}.${belongingPrimaryKey}`, "=", `${baseTableName}.${foreignKey}`)
        .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
        .select(columns.map((field) => `${belongingTableName}.${field}`))
        .from(`${foreignTableName} as ${belongingTableName}`);
    }

    if (relationship.hasMany) {
      const foreignKey =
        relationship.foreignKeyName ||
        this.appInstance.app.serializer.relationshipToColumn(baseResource.type, primaryKey);
      return query
        .join(baseTableName, `${foreignTableName}.${foreignKey}`, "=", `${baseTableName}.${primaryKey}`)
        .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
        .select(columns.map((field) => `${foreignTableName}.${field}`));
    }

    if(relationship.manyToMany){
      const foreignKey = relationship.foreignKeyName;
      const relationResourceClass = await this.resourceFor(relationship.type().type)
      const primaryKeyIntermediate = relationResourceClass.schema.relationships[`${pluralize(this.resourceClass.type)}`].foreignKeyName;

      return query
          .join(`${relationship['intermediateTable']}`, `${foreignTableName}.${primaryKey}`,"=",`${relationship['intermediateTable']}.${foreignKey}` )
          .join(baseTableName,`${relationship['intermediateTable']}.${primaryKeyIntermediate}`, "=", `${baseTableName}.${primaryKey}`)
          .where(`${baseTableName}.${primaryKey}`, sqlOperator, queryIn)
          .select(columns.map((field) => `${foreignTableName}.${field}`))
      }
  }

  async getRelationships(op: Operation, record: HasId, eagerLoadedData: EagerLoadedData) {
    if (!op.params || !op.params.include) {
      return {};
    }

    return eagerLoadedData;
  }
}
