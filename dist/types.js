"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRIMARY_KEY = exports.HttpStatusCode = void 0;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
    HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
    HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
    HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
    HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
    HttpStatusCode[HttpStatusCode["UnprocessableEntity"] = 422] = "UnprocessableEntity";
    HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
exports.DEFAULT_PRIMARY_KEY = "id";
//# sourceMappingURL=types.js.map