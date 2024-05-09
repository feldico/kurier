"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promiseHashMap = async (hash, callback) => {
    const keys = Object.keys(hash);
    const result = {};
    for (const key of keys) {
        result[key] = await callback(key);
    }
    return result;
};
exports.default = promiseHashMap;
//# sourceMappingURL=promise-hash-map.js.map