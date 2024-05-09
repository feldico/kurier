"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class User extends resource_1.default {
    static get type() {
        return "user";
    }
}
User.schema = {
    attributes: {},
    relationships: {},
};
exports.default = User;
//# sourceMappingURL=user.js.map