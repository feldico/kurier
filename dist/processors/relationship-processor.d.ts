import { KnexProcessor, Resource } from "..";
import { Operation } from "../types";
export default class RelationshipProcessor<ResourceT extends Resource> extends KnexProcessor<ResourceT> {
    relationshipResourceFor(id: string): Resource;
    get(op: Operation): Promise<import("..").HasId | import("..").HasId[]>;
}
