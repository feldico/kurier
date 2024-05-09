"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
const user_1 = require("./user");
const password_1 = require("../attribute-types/password");
class Session extends resource_1.default {
    static get type() {
        return "session";
    }
}
Session.schema = {
    attributes: {
        token: String,
        username: String,
        password: password_1.default,
    },
    relationships: {
        user: {
            type: () => user_1.default,
            belongsTo: true,
        },
    },
};
exports.default = Session;
//# sourceMappingURL=session.js.map