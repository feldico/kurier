"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pick_1 = require("./pick");
const unpick = (object, list = []) => {
    return (0, pick_1.default)(object, Object.keys(object).filter((key) => !list.includes(key)));
};
exports.default = unpick;
//# sourceMappingURL=unpick.js.map