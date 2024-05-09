"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessResource = void 0;
const json_api_errors_1 = require("../errors/json-api-errors");
const decorator_1 = require("./decorator");
const match = (actual) => (item) => actual.includes(item);
const ACCESS_RULES = Symbol("accessRules");
// This is a replacement function for Array.every().
// For some odd reason, there are type conflicts with AttributeValue
// starting with TypeScript >= 4.x.
const every = (expected, actual) => {
    for (let index = 0; index < expected.length; index += 1) {
        if (!match(actual)(expected[index])) {
            return false;
        }
    }
    return true;
};
function conditionsPass(appInstance, { attribute, value, operator = "some" }) {
    var _a;
    const actual = (_a = appInstance.user) === null || _a === void 0 ? void 0 : _a.attributes[attribute];
    const expected = value;
    if (Array.isArray(actual)) {
        if (Array.isArray(expected)) {
            if (operator === "some") {
                return expected.some(match(actual));
            }
            if (operator === "every") {
                return every(expected, actual);
            }
            if (operator === "not") {
                return !every(expected, actual);
            }
        }
        if (operator === "not") {
            return !match(actual)(expected);
        }
        return match(actual)(expected);
    }
    if (Array.isArray(expected)) {
        return match(expected)(actual);
    }
    if (operator === "not") {
        return actual !== expected;
    }
    return actual === expected;
}
function authorizeMiddleware(operation, conditions) {
    const callback = function () {
        if (!this.appInstance.user) {
            throw json_api_errors_1.default.Unauthorized();
        }
        if (!conditions.every((condition) => conditionsPass(this.appInstance, condition))) {
            throw json_api_errors_1.default.AccessDenied();
        }
        return operation.call(this, ...arguments);
    };
    callback[ACCESS_RULES] = conditions;
    return callback;
}
/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `Unauthorized` error code.
 */
function authorize(...conditions) {
    return (0, decorator_1.default)(authorizeMiddleware, conditions);
}
exports.default = authorize;
async function canAccessResource(resource, operationName, appInstance) {
    const type = Array.isArray(resource) && resource.length ? resource[0].type : resource.type;
    const processor = (await appInstance.processorFor(type));
    const accessRules = processor[operationName][ACCESS_RULES] || [];
    if (!accessRules.length) {
        return true;
    }
    if (!appInstance.user) {
        return false;
    }
    return accessRules.every((condition) => conditionsPass(appInstance, condition));
}
exports.canAccessResource = canAccessResource;
//# sourceMappingURL=authorize.js.map