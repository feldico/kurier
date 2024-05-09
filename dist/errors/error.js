"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonApiError extends Error {
    constructor(status, code, detail) {
        super(`${status}: ${code}`);
        this.status = status;
        this.code = code;
        this.detail = detail;
    }
}
exports.default = JsonApiError;
//# sourceMappingURL=error.js.map