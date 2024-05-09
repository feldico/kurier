import { ApplicationInstanceInterface, JsonApiBulkResponse, UrlData, VendorRequest } from "../types";
import JsonApiError from "../errors/error";
import { JsonApiDocument, JsonApiErrorsDocument, Operation, OperationResponse } from "../types";
declare const STATUS_MAPPING: {
    GET: number;
    POST: number;
    PATCH: number;
    PUT: number;
    DELETE: number;
};
declare function authenticate(appInstance: ApplicationInstanceInterface, request: VendorRequest): Promise<void>;
declare function urlData(appInstance: ApplicationInstanceInterface, path: string): UrlData;
declare function handleBulkEndpoint(appInstance: ApplicationInstanceInterface, operations: Operation[]): Promise<JsonApiBulkResponse>;
declare function handleJsonApiEndpoint(appInstance: ApplicationInstanceInterface, request: VendorRequest): Promise<{
    body: JsonApiDocument | JsonApiErrorsDocument;
    status: number;
}>;
declare function convertHttpRequestToOperation(req: VendorRequest): Operation;
declare function convertOperationResponseToHttpResponse(req: VendorRequest, operation: OperationResponse): JsonApiDocument | undefined;
declare function convertErrorToHttpResponse(error: JsonApiError): JsonApiErrorsDocument;
export { STATUS_MAPPING, authenticate, urlData, handleBulkEndpoint, handleJsonApiEndpoint, convertHttpRequestToOperation, convertOperationResponseToHttpResponse, convertErrorToHttpResponse, };
