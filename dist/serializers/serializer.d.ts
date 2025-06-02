import Resource from "../resource";
import { ApplicationAttributeType, ApplicationAttributeTypeFactory, ApplicationAttributeTypes, IJsonApiSerializer, Operation, ResourceSchema, Links } from "../types";
export default class JsonApiSerializer implements IJsonApiSerializer {
    attributeTypes: ApplicationAttributeTypes;
    constructor();
    registerAttributeType(attributeDefinition: ApplicationAttributeTypeFactory): void;
    resourceTypeToTableName(resourceType: string): string;
    attributeToColumn(attributeName: string): string;
    columnToAttribute(columnName: string): string;
    columnToRelationship(columnName: string, primaryKeyName?: string): string;
    relationshipToColumn(relationshipName: string, primaryKeyName?: string): string;
    foreignResourceToForeignTableName(foreignResourceType: string, prefix?: string): string;
    generateLinks(resourceType: string, resourceId?: string, relationshipName?: string): Links;
    deserializeResource(op: Operation, resourceType: typeof Resource): Operation;
    getAttributeDefinition(resourceSchema: ResourceSchema, attributeName: string): ApplicationAttributeType | undefined;
    isSensitiveAttribute(resourceSchema: ResourceSchema, attributeName: string): boolean;
    serializeResource(data: Resource, resourceType: typeof Resource): Resource;
    serializeAttribute(resourceSchema: ResourceSchema, attributeName: string, value: unknown): any;
    deserializeAttribute(resourceSchema: ResourceSchema, attributeName: string, value: unknown): any;
    serializeRelationship(relationships: Resource | Resource[] | null | undefined, resourceType: typeof Resource, primaryKeyName?: string): any;
    serializeIncludedResources(data: Resource | Resource[] | void, resourceType: typeof Resource): any;
}
