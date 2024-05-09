"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertErrorToHttpResponse = exports.convertOperationResponseToHttpResponse = exports.convertHttpRequestToOperation = exports.handleJsonApiEndpoint = exports.handleBulkEndpoint = exports.urlData = exports.authenticate = exports.STATUS_MAPPING = void 0;
const escapeStringRegexp = require("escape-string-regexp");
const json_api_errors_1 = require("../errors/json-api-errors");
const json_api_params_1 = require("../utils/json-api-params");
const string_1 = require("../utils/string");
const object_1 = require("./object");
const STATUS_MAPPING = {
    GET: 200,
    POST: 201,
    PATCH: 200,
    PUT: 200,
    DELETE: 204,
};
exports.STATUS_MAPPING = STATUS_MAPPING;
async function authenticate(appInstance, request) {
    const authHeader = request.headers.authorization;
    let currentUser;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const [, token] = authHeader.split(" ");
        currentUser = await appInstance.getUserFromToken(token, request);
    }
    appInstance.user = currentUser;
}
exports.authenticate = authenticate;
function urlData(appInstance, path) {
    const urlRegexp = new RegExp(`^(\/+)?((?<namespace>${escapeStringRegexp(appInstance.app.namespace)})(\/+|$))?(?<resource>[^\\s\/?]+)?(\/+)?((?<id>[^\\s\/?]+)?(\/+)?(?<relationships>relationships)?(\/+)?)?` +
        "(?<relationship>[^\\s/?]+)?(/+)?$");
    const { resource, id, relationships, relationship } = (path.match(urlRegexp) || {})["groups"] || {};
    return {
        id,
        resource,
        relationship,
        isRelationships: !!relationships,
    };
}
exports.urlData = urlData;
async function handleBulkEndpoint(appInstance, operations) {
    return { operations: await appInstance.app.executeOperations(operations || [], appInstance) };
}
exports.handleBulkEndpoint = handleBulkEndpoint;
async function handleJsonApiEndpoint(appInstance, request) {
    const op = convertHttpRequestToOperation(request);
    try {
        const [result] = await appInstance.app.executeOperations([op], appInstance);
        return {
            body: convertOperationResponseToHttpResponse(request, result),
            status: STATUS_MAPPING[request.method],
        };
    }
    catch (error) {
        return {
            body: convertErrorToHttpResponse(error),
            status: error.status || 500,
        };
    }
}
exports.handleJsonApiEndpoint = handleJsonApiEndpoint;
function convertHttpRequestToOperation(req) {
    const { id, resource, relationship } = req.urlData;
    const type = (0, string_1.camelize)((0, string_1.singularize)(resource));
    const opMap = {
        GET: "get",
        POST: "add",
        PATCH: "update",
        PUT: "update",
        DELETE: "remove",
    };
    return {
        op: opMap[req.method],
        params: (0, json_api_params_1.parse)(req.href),
        ref: { id, type, relationship },
        data: (req.body || {}).data,
    };
}
exports.convertHttpRequestToOperation = convertHttpRequestToOperation;
function convertOperationResponseToHttpResponse(req, operation) {
    const responseMethods = ["GET", "POST", "PATCH", "PUT"];
    if (responseMethods.includes(req.method)) {
        const document = {
            data: operation.data,
        };
        if (operation.included) {
            document.included = operation.included;
        }
        if (!(0, object_1.isEmptyObject)(operation.meta)) {
            document.meta = operation.meta;
        }
        return document;
    }
}
exports.convertOperationResponseToHttpResponse = convertOperationResponseToHttpResponse;
function convertErrorToHttpResponse(error) {
    const isJsonApiError = error && error.status;
    if (!isJsonApiError)
        console.error("Kurier: ", error);
    const jsonApiError = isJsonApiError ? error : json_api_errors_1.default.UnhandledError();
    if ((!process.env.NODE_ENV || process.env.NODE_ENV !== "production") && error.stack && !isJsonApiError) {
        const stackTrace = error.stack.split("\n");
        const [firstLineErrorStack, secondLineErrorStack] = stackTrace;
        const detail = firstLineErrorStack.startsWith("Error:") ? firstLineErrorStack.slice(7) : "";
        jsonApiError.detail = detail;
        jsonApiError.source = {
            pointer: secondLineErrorStack,
        };
    }
    return { errors: [jsonApiError] };
}
exports.convertErrorToHttpResponse = convertErrorToHttpResponse;
//# sourceMappingURL=http-utils.js.map