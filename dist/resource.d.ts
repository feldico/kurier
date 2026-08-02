import { Meta, ResourceAttributes, ResourceRelationships, ResourceSchema, Links } from "./types";
export default class Resource {
    static get type(): string;
    static schema: ResourceSchema;
    id?: string;
    type: string;
    attributes: ResourceAttributes;
    relationships: ResourceRelationships;
    meta?: Meta;
    links?: Links;
    preventSerialization?: boolean;
    constructor({ id, attributes, relationships, meta, links, }: {
        id?: string;
        attributes?: ResourceAttributes;
        relationships?: ResourceRelationships;
        meta?: Meta;
        links?: Links;
    });
}
