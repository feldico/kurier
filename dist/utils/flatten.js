"use strict";
// Thanks 30 seconds of code...
// https://github.com/30-seconds/30-seconds-of-code#flatten
Object.defineProperty(exports, "__esModule", { value: true });
function flatten(arr, depth = 1) {
    return arr.reduce((a, v) => a.concat(depth > 1 && Array.isArray(v) ? flatten(v, depth - 1) : v), []);
}
exports.default = flatten;
//# sourceMappingURL=flatten.js.map