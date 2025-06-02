"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ifUser = ifUser;
exports.ifUserDoesNotMatches = ifUserDoesNotMatches;
exports.ifUserMatchesEvery = ifUserMatchesEvery;
exports.ifUserHasRole = ifUserHasRole;
exports.ifUserHasEveryRole = ifUserHasEveryRole;
exports.ifUserDoesNotHaveRole = ifUserDoesNotHaveRole;
exports.ifUserHasPermission = ifUserHasPermission;
exports.ifUserHasEveryPermission = ifUserHasEveryPermission;
exports.ifUserDoesNotHavePermission = ifUserDoesNotHavePermission;
function ifUser(attribute, value) {
    return { attribute, value };
}
function ifUserDoesNotMatches(attribute, value) {
    return { attribute, value, operator: "not" };
}
function ifUserMatchesEvery(attribute, value) {
    return { attribute, value, operator: "every" };
}
function ifUserHasRole(value) {
    return ifUser("roles", value);
}
function ifUserHasEveryRole(value) {
    return ifUserMatchesEvery("roles", value);
}
function ifUserDoesNotHaveRole(value) {
    return ifUserDoesNotMatches("roles", value);
}
function ifUserHasPermission(value) {
    return ifUser("permissions", value);
}
function ifUserHasEveryPermission(value) {
    return ifUserMatchesEvery("permissions", value);
}
function ifUserDoesNotHavePermission(value) {
    return ifUserDoesNotMatches("permissions", value);
}
//# sourceMappingURL=if-user.js.map