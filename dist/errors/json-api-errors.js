"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const error_1 = require("./error");
exports.default = {
    UnhandledError: (detail) => new error_1.default(types_1.HttpStatusCode.InternalServerError, "unhandled_error", detail),
    AccessDenied: (detail) => new error_1.default(types_1.HttpStatusCode.Forbidden, "access_denied", detail),
    Unauthorized: (detail) => new error_1.default(types_1.HttpStatusCode.Unauthorized, "unauthorized", detail),
    RecordNotExists: (detail) => new error_1.default(types_1.HttpStatusCode.NotFound, "not_found", detail),
    ResourceNotFound: (detail) => new error_1.default(types_1.HttpStatusCode.NotFound, "resource_not_found", detail),
    InvalidToken: (detail) => new error_1.default(types_1.HttpStatusCode.UnprocessableEntity, "invalid_token", detail),
    InvalidData: (detail) => new error_1.default(types_1.HttpStatusCode.UnprocessableEntity, "invalid_data", detail),
    BadRequest: (detail) => new error_1.default(types_1.HttpStatusCode.BadRequest, "bad_request", detail),
};
//# sourceMappingURL=json-api-errors.js.map