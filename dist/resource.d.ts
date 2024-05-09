import { Meta, ResourceAttributes, ResourceRelationships, ResourceSchema } from "./types";
export default class Resource {
    static get type(): string;
    static schema: ResourceSchema;
    id?: string;
    type: string;
    attributes: ResourceAttributes;
    relationships: ResourceRelationships;
    meta?: Meta;
    preventSerialization?: boolean;
    constructor({ id, attributes, relationships, meta, }: {
        id?: string;
        attributes?: ResourceAttributes;
        relationships?: ResourceRelationships;
        meta?: Meta;
    });
}
