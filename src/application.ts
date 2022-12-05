import { Knex } from "knex";
import JsonApiErrors from "./errors/json-api-errors";
import Addon from "./addon";
import ApplicationInstance from "./application-instance";
import { canAccessResource } from "./decorators/authorize";
import KnexProcessor from "./processors/knex-processor";
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import JsonApiSerializer from "./serializers/serializer";
import {
  AddonOptions,
  ApplicationAddons,
  ApplicationServices,
  IJsonApiSerializer,
  Operation,
  OperationResponse,
  ResourceSchemaRelationship,
  NoOpTransaction,
  MaybeMeta,
  Meta,
} from "./types";
import flatten from "./utils/flatten";
import { classify } from "./utils/string";
import { isEmptyObject } from "./utils/object";

const OPERATIONS_INCOMPATIBLE_WITH_META_INJECTION = ["identify"];

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  serializer: IJsonApiSerializer;
  services: ApplicationServices;
  addons: ApplicationAddons;

  constructor(settings: {
    namespace?: string;
    types?: typeof Resource[];
    processors?: typeof OperationProcessor[];
    defaultProcessor?: typeof OperationProcessor;
    serializer?: typeof JsonApiSerializer;
    services?: {};
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || ({} as ApplicationServices);
    this.defaultProcessor = settings.defaultProcessor || KnexProcessor;
    this.addons = [];
    this.serializer = new (settings.serializer || JsonApiSerializer)();
  }

  use(addon: typeof Addon, options: AddonOptions = {}) {
    if (this.addons.find((installedAddon) => installedAddon.addon === addon)) {
      return;
    }

    new addon(this, options).install().then(() => {
      this.addons.push({ addon, options });
    });
  }

  async executeOperations(
    ops: Operation[],
    applicationInstance = new ApplicationInstance(this),
  ): Promise<OperationResponse[]> {
    applicationInstance.transaction = await this.createTransaction();

    try {
      const result: OperationResponse[] = (await Promise.all(
        ops
          .map(async (op) => {
            const processor = await applicationInstance.processorFor(op.ref.type);

            if (processor) {
              return this.executeOperation(op, processor);
            }
          })
          .filter(Boolean),
      )) as OperationResponse[];

      await applicationInstance.transaction.commit();

      return result;
    } catch (error) {
      await applicationInstance.transaction.rollback(error);
      throw error;
    } finally {
      applicationInstance.transaction = {} as NoOpTransaction;
    }
  }

  async executeOperation(op: Operation, processor: OperationProcessor<Resource>): Promise<OperationResponse> {
    const resourceClass = await this.resourceFor(op.ref.type);

    if (op.ref.relationship) {
      const relationship = resourceClass.schema.relationships[op.ref.relationship];
      const relatedResourceClass = relationship.type();

      if (relatedResourceClass) {
        let relatedOp: Operation = {} as Operation;

        if (relationship.hasMany) {
          const relatedResourceClassRelationships = Object.entries(relatedResourceClass.schema.relationships);
          const [relatedRelationshipName, relatedRelationship]: [string, ResourceSchemaRelationship] =
            relatedResourceClassRelationships.find(([_relName, relData]) => relData.type().type === op.ref.type) as [
              string,
              ResourceSchemaRelationship,
            ];

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
                this.serializer.relationshipToColumn(
                  relatedRelationshipName,
                  relatedResourceClass.schema.primaryKeyName,
                )]: op.ref.id,
              },
            },
          } as Operation;
        } else if (relationship.belongsTo) {
          const deserializedOriginalOperation = await this.serializer.deserializeResource(
            { ...op, op: "get" },
            resourceClass,
          );
          const result = (await processor.execute(deserializedOriginalOperation)) as Resource;

          relatedOp = {
            ...op,
            ref: {
              type: relatedResourceClass.type,
              id: result.attributes[
                resourceClass.schema.relationships[op.ref.relationship].foreignKeyName ||
                  this.serializer.relationshipToColumn(op.ref.relationship)
              ] as string,
            },
          };
        }

        const deserializedOperation = this.serializer.deserializeResource(relatedOp, relatedResourceClass);
        const relatedProcessor = (await this.processorFor(
          relatedResourceClass.type,
          processor.appInstance,
        )) as OperationProcessor<Resource>;
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

  async injectResourceMeta(
    result: Resource | Resource[],
    processor: OperationProcessor<Resource>,
    op: Operation,
  ): Promise<void> {
    if (OPERATIONS_INCOMPATIBLE_WITH_META_INJECTION.includes(op.op)) {
      return;
    }

    const resourceMetaHookToCallForOperation = `resourceMetaFor${classify(op.op)}`;
    if (Array.isArray(result)) {
      for (const resource of result) {
        const resourceMeta = await processor.resourceMeta(resource);
        const resourceMetaFor = await processor.resourceMetaFor(op, resource);
        const resourceMetaForOp = await processor[resourceMetaHookToCallForOperation](resource);
        resource.meta = {
          ...resourceMetaForOp,
          ...resourceMetaFor,
          ...resourceMeta,
        } as Meta;
        if (isEmptyObject(resource.meta)) {
          delete resource.meta;
        }
      }
    } else {
      const resourceMeta = await processor.resourceMeta(result);
      const resourceMetaFor = await processor.resourceMetaFor(op, result);
      const resourceMetaForOp = await processor[resourceMetaHookToCallForOperation](result);
      result.meta = {
        ...resourceMetaForOp,
        ...resourceMetaFor,
        ...resourceMeta,
      } as Meta;
      if (isEmptyObject(result.meta)) {
        delete result.meta;
      }
    }
  }

  async buildDocumentMeta(
    data: Resource | Resource[] | void,
    processor: OperationProcessor<Resource>,
    op: Operation,
  ): Promise<MaybeMeta> {
    if (!data) {
      return;
    }

    const metaHookToCallForOperation = `metaFor${classify(op.op)}`;
    const meta = await processor.meta(data);
    const metaFor = await processor.metaFor(op, data);
    const metaForOp = await processor[metaHookToCallForOperation](data);

    return {
      ...metaForOp,
      ...metaFor,
      ...meta,
    };
  }

  async createTransaction(): Promise<Knex.Transaction | NoOpTransaction> {
    const { knex }: { knex?: Knex } = this.services;

    if (!knex) {
      return {
        commit: () => {},
        rollback: () => {},
      };
    }

    return knex.transaction();
  }

  async processorFor(
    resourceType: string,
    applicationInstance: ApplicationInstance,
    processorType = this.defaultProcessor,
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async (processor) => ((await processor.shouldHandle(resourceType)) ? processor : false)),
    );

    const ProcessorClass = processors.find((p) => p !== false);

    if (ProcessorClass) {
      return new ProcessorClass(applicationInstance);
    }

    class ResourceProcessor extends processorType<Resource> {
      static resourceClass = resourceClass;
    }

    return new ResourceProcessor(applicationInstance);
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    const resource = this.types.find(({ type }) => type && type === resourceType) as typeof Resource;

    if (!resource) {
      throw JsonApiErrors.ResourceNotFound(`Resource ${resourceType} is not registered in the API Application`);
    }

    if (!resource.schema.relationships) {
      resource.schema.relationships = {};
    }

    return resource;
  }

  async buildOperationResponse(
    data: Resource | Resource[] | void,
    processor: OperationProcessor<Resource>,
    op: Operation,
  ): Promise<OperationResponse> {
    let resourceType: string | null;
    const { appInstance } = processor;

    if (Array.isArray(data)) {
      resourceType = data[0] ? data[0].type : null;
    } else if (data) {
      resourceType = data.type;
    } else {
      resourceType = null;
    }

    const allIncluded: (Resource | Resource[])[] = !resourceType
      ? []
      : flatten(this.serializer.serializeIncludedResources(data, await this.resourceFor(resourceType)) || []);

    let included: Resource[] = [];

    await Promise.all(
      allIncluded.map((resource) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve) => {
          const result = await canAccessResource(resource, "get", appInstance);

          if (result) {
            included = included.concat(resource);
          }

          resolve();
        });
      }),
    );

    const serializedResources = await this.serializeResources(data);
    const meta = await this.buildDocumentMeta(data, processor, op);

    const response: OperationResponse = {
      data: serializedResources,
    };

    if (included.length) {
      response.included = included;
    }

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  async serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      if (!data.length) {
        return [];
      }

      const resource = await this.resourceFor(data[0].type);

      return data
        .filter((record) => !record.preventSerialization)
        .map((record) => this.serializer.serializeResource(record, resource));
    }

    const resource = await this.resourceFor(data.type);
    return this.serializer.serializeResource(data, resource);
  }
}
