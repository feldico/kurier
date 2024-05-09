"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pick = (object, list = []) => {
    return list.reduce((acc, key) => {
        const hasProperty = key in object;
        if (!hasProperty)
            return acc;
        acc[key] = object[key];
        return acc;
    }, {});
};
exports.default = pick;
//# sourceMappingURL=pick.js.map