"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionalOperators = exports.KnexOperators = void 0;
exports.KnexOperators = {
    eq: '=',
    ne: '!=',
    lt: '<',
    gt: '>',
    le: '<=',
    ge: '>=',
    like: 'like',
    ilike: 'ilike',
    nlike: 'not like',
    in: 'in',
    nin: 'not in',
};
exports.FunctionalOperators = {
    eq: (actual, expected) => actual === expected,
    ne: (actual, expected) => actual !== expected,
    lt: (actual, expected) => actual < expected,
    gt: (actual, expected) => actual > expected,
    le: (actual, expected) => actual <= expected,
    ge: (actual, expected) => actual >= expected,
    like: (actual, expected) => {
        if (expected.startsWith('%') && expected.endsWith('%')) {
            return actual.includes(expected.replace(/%/g, ''));
        }
        if (expected.startsWith('%')) {
            return actual.endsWith(expected.replace(/%/g, ''));
        }
        if (expected.endsWith('%')) {
            return actual.startsWith(expected.replace(/%/g, ''));
        }
        return false;
    },
    ilike: (actual, expected) => {
        if (expected.startsWith('%') && expected.endsWith('%')) {
            return actual.toLowerCase().includes(expected.replace(/%/g, '').toLowerCase());
        }
        if (expected.startsWith('%')) {
            return actual.toLowerCase().endsWith(expected.replace(/%/g, '').toLowerCase());
        }
        if (expected.endsWith('%')) {
            return actual.toLowerCase().startsWith(expected.replace(/%/g, '').toLowerCase());
        }
        return false;
    },
    nlike: (actual, expected) => {
        if (expected.startsWith('%') && expected.endsWith('%')) {
            return !actual.includes(expected.replace(/%/g, ''));
        }
        if (expected.startsWith('%')) {
            return !actual.endsWith(expected.replace(/%/g, ''));
        }
        if (expected.endsWith('%')) {
            return !actual.startsWith(expected.replace(/%/g, ''));
        }
        return false;
    },
    in: (actual, expected) => expected.includes(actual),
    nin: (actual, expected) => !expected.includes(actual),
};
//# sourceMappingURL=operators.js.map