import { Knex } from "knex";
import Addon from "./addon";
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import JsonApiSerializer from "./serializers/serializer";
import { AddonOptions, ApplicationAddons, ApplicationServices, IJsonApiSerializer, Operation, OperationResponse, NoOpTransaction, MaybeMeta, HookFunction, ApplicationHooks, ApplicationInstanceInterface, ApplicationAttributeTypeFactory } from "./types";
export default class Application {
    namespace: string;
    types: typeof Resource[];
    processors: typeof OperationProcessor[];
    defaultProcessor: typeof OperationProcessor;
    serializer: IJsonApiSerializer;
    services: ApplicationServices;
    addons: ApplicationAddons;
    hooks: ApplicationHooks;
    constructor(settings: {
        namespace?: string;
        types?: typeof Resource[];
        processors?: typeof OperationProcessor[];
        defaultProcessor?: typeof OperationProcessor;
        serializer?: typeof JsonApiSerializer;
        attributeTypes?: ApplicationAttributeTypeFactory[];
        services?: {};
    });
    hook(type: keyof ApplicationHooks, callback: HookFunction): void;
    use(addon: typeof Addon, options?: AddonOptions): void;
    getAddonOptions<T extends AddonOptions = AddonOptions>(addon: typeof Addon): AddonOptions | undefined;
    registerAttributeType(attributeDefinition: ApplicationAttributeTypeFactory): void;
    executeOperations(ops: Operation[], applicationInstance?: ApplicationInstanceInterface): Promise<OperationResponse[]>;
    executeOperation(op: Operation, processor: OperationProcessor<Resource>): Promise<OperationResponse>;
    injectResourceMeta(result: Resource | Resource[], processor: OperationProcessor<Resource>, op: Operation): Promise<void>;
    buildDocumentMeta(data: Resource | Resource[] | void, processor: OperationProcessor<Resource>, op: Operation): Promise<MaybeMeta>;
    createTransaction(): Promise<Knex.Transaction | NoOpTransaction>;
    processorFor(resourceType: string, applicationInstance: ApplicationInstanceInterface, processorType?: typeof OperationProcessor): Promise<OperationProcessor<Resource> | undefined>;
    resourceFor(resourceType: string): Promise<typeof Resource>;
    buildOperationResponse(data: Resource | Resource[] | void, processor: OperationProcessor<Resource>, op: Operation): Promise<OperationResponse>;
    serializeResources(data: Resource | Resource[] | void, op: Operation, appInstance: ApplicationInstanceInterface): Promise<Resource | Resource[] | null>;
}
