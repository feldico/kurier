import { AttributeValueMatch, ApplicationInstanceInterface } from "../types";
import OperationProcessor from "../processors/operation-processor";
import Resource from "../resource";
/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `Unauthorized` error code.
 */
export default function authorize(...conditions: AttributeValueMatch[]): (target: Function | OperationProcessor<any>, propertyKey?: string | undefined, descriptor?: TypedPropertyDescriptor<any> | undefined) => any;
export declare function canAccessResource(resource: Resource | Resource[], operationName: string, appInstance: ApplicationInstanceInterface): Promise<any>;
