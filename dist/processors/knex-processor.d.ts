import { Knex } from "knex";
import Resource from "../resource";
import { ApplicationInstanceInterface, EagerLoadedData, HasId, IJsonApiSerializer, JsonApiParams, KnexRecord, Operation, ResourceSchema, ResourceSchemaRelationship } from "../types";
import OperationProcessor from "./operation-processor";
export default class KnexProcessor<ResourceT extends Resource> extends OperationProcessor<ResourceT> {
    protected knex: Knex.Transaction;
    constructor(appInstance: ApplicationInstanceInterface);
    getQuery(): Knex.QueryBuilder;
    eagerLoad(op: Operation, result: ResourceT | ResourceT[]): Promise<EagerLoadedData>;
    protected getColumns(serializer: IJsonApiSerializer, fields?: {}): any[];
    get(op: Operation): Promise<HasId[] | HasId>;
    remove(op: Operation): Promise<void>;
    update(op: Operation): Promise<HasId>;
    add(op: Operation): Promise<HasId>;
    get tableName(): string;
    getValidAttributes(schema: ResourceSchema, serializer: IJsonApiSerializer): string[];
    filtersToKnex(queryBuilder: Knex.QueryBuilder, filters: {}): void;
    optionsBuilder(queryBuilder: Knex.QueryBuilder, params: JsonApiParams): void;
    eagerFetchRelationship(key: string, result: ResourceT | ResourceT[], relationship: ResourceSchemaRelationship, baseResource: typeof Resource): Promise<KnexRecord[] | void>;
    getRelationships(op: Operation, record: HasId, eagerLoadedData: EagerLoadedData): Promise<EagerLoadedData>;
}
