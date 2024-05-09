"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifUserDoesNotHavePermission = exports.ifUserHasEveryPermission = exports.ifUserHasPermission = exports.ifUserDoesNotHaveRole = exports.ifUserHasEveryRole = exports.ifUserHasRole = exports.ifUserMatchesEvery = exports.ifUserDoesNotMatches = exports.ifUser = void 0;
function ifUser(attribute, value) {
    return { attribute, value };
}
exports.ifUser = ifUser;
function ifUserDoesNotMatches(attribute, value) {
    return { attribute, value, operator: "not" };
}
exports.ifUserDoesNotMatches = ifUserDoesNotMatches;
function ifUserMatchesEvery(attribute, value) {
    return { attribute, value, operator: "every" };
}
exports.ifUserMatchesEvery = ifUserMatchesEvery;
function ifUserHasRole(value) {
    return ifUser("roles", value);
}
exports.ifUserHasRole = ifUserHasRole;
function ifUserHasEveryRole(value) {
    return ifUserMatchesEvery("roles", value);
}
exports.ifUserHasEveryRole = ifUserHasEveryRole;
function ifUserDoesNotHaveRole(value) {
    return ifUserDoesNotMatches("roles", value);
}
exports.ifUserDoesNotHaveRole = ifUserDoesNotHaveRole;
function ifUserHasPermission(value) {
    return ifUser("permissions", value);
}
exports.ifUserHasPermission = ifUserHasPermission;
function ifUserHasEveryPermission(value) {
    return ifUserMatchesEvery("permissions", value);
}
exports.ifUserHasEveryPermission = ifUserHasEveryPermission;
function ifUserDoesNotHavePermission(value) {
    return ifUserDoesNotMatches("permissions", value);
}
exports.ifUserDoesNotHavePermission = ifUserDoesNotHavePermission;
//# sourceMappingURL=if-user.js.map