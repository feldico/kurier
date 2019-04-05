import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import { Operation, OperationResponse, ProcessorConstructor, ResourceConstructor } from "./types";

export default class Application {
  namespace: string;
  types: ResourceConstructor[];
  processors: ProcessorConstructor[];
  defaultProcessor: ProcessorConstructor;
  user: Resource;
  services: { [key: string]: any };

  constructor(settings: {
    namespace?: string;
    types?: ResourceConstructor[];
    processors?: ProcessorConstructor[];
    defaultProcessor?: ProcessorConstructor;
    services?: {};
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || {};
    this.defaultProcessor = settings.defaultProcessor || OperationProcessor;
  }

  async executeOperations(ops: Operation[]): Promise<OperationResponse[]> {
    return await this.createTransaction(
      ops
        .map(async op => {
          const processor = await this.processorFor(op.ref.type);

          if (processor) {
            return this.executeOperation(op, processor);
          }
        })
        .filter(Boolean)
    );
  }

  async executeOperation(
    op: Operation,
    processor: OperationProcessor
  ): Promise<OperationResponse> {
    const result = await processor.execute(op);
    return this.buildOperationResponse(result);
  }

  async createTransaction(ops: Promise<OperationResponse>[]) {
    return await Promise.all(ops);
  }

  async processorFor(
    resourceType: string
  ): Promise<OperationProcessor | undefined> {
    const processors = await Promise.all(
      this.processors.map(async processor =>
        (await processor.shouldHandle(resourceType)) ? processor : false
      )
    );

    const processor = processors.find(p => p !== false);
    const resourceClass = await this.resourceFor(resourceType);

    if (processor && resourceClass) {
      return new processor(this, resourceClass);
    }

    if (resourceClass) {
      return new this.defaultProcessor(this, resourceClass);
    }
  }

  async resourceFor(
    resourceType: string
  ): Promise<ResourceConstructor | undefined> {
    return this.types.find(({ type }) => type && type === resourceType);
  }

  buildOperationResponse(
    data: Resource | Resource[] | void
  ): OperationResponse {
    return {
      data: data || null
    };
  }
}
