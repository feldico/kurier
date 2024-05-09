import Resource from "./resource";
import { BelongsToResourceSchemaRelationship, HasManyResourceSchemaRelationship, ResourceSchemaRelationshipOptions } from "./types";
export declare const HasMany: (resourceType: typeof Resource, options: ResourceSchemaRelationshipOptions) => HasManyResourceSchemaRelationship;
export declare const BelongsTo: (resourceType: typeof Resource, options: ResourceSchemaRelationshipOptions) => BelongsToResourceSchemaRelationship;
