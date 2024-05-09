"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("../resources/session");
const knex_processor_1 = require("./knex-processor");
const types_1 = require("../types");
const json_api_errors_1 = require("../errors/json-api-errors");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = require("jsonwebtoken");
const pick_1 = require("../utils/pick");
class SessionProcessor extends knex_processor_1.default {
    async login(op, userDataSource) {
        console.warn("WARNING: You're using the default login callback with UserManagementAddon." +
            "ANY LOGIN REQUEST WILL PASS. Implement this callback in your addon configuration.");
        return true;
    }
    async add(op) {
        var _a;
        const fields = Object.assign({}, ...Object.keys((_a = op.data) === null || _a === void 0 ? void 0 : _a.attributes)
            .filter((attribute) => !this.appInstance.app.serializer.isSensitiveAttribute(this.resourceClass.schema, attribute))
            .map((attribute) => { var _a; return ({ [attribute]: (_a = op.data) === null || _a === void 0 ? void 0 : _a.attributes[attribute] }); }));
        if (Object.keys(fields).length === 0) {
            throw json_api_errors_1.default.InvalidData();
        }
        const userType = this.resourceClass.schema.relationships.user.type();
        const user = await this.knex(this.appInstance.app.serializer.resourceTypeToTableName(userType.type))
            .where(fields)
            .first();
        if (!user) {
            throw json_api_errors_1.default.AccessDenied();
        }
        const isLoggedIn = await this.login(op, user);
        if (!isLoggedIn) {
            throw json_api_errors_1.default.AccessDenied();
        }
        const userId = user[userType.schema.primaryKeyName || types_1.DEFAULT_PRIMARY_KEY];
        const userAttributes = (0, pick_1.default)(user, Object.keys(userType.schema.attributes)
            .filter((attribute) => !this.appInstance.app.serializer.isSensitiveAttribute(userType.schema, attribute))
            .map((attribute) => this.appInstance.app.serializer.attributeToColumn(attribute)));
        const secureData = this.appInstance.app.serializer.serializeResource({
            type: userType.type,
            id: userId,
            attributes: {
                ...userAttributes,
            },
            relationships: {},
        }, userType);
        const token = (0, jsonwebtoken_1.sign)(secureData, process.env.SESSION_KEY, {
            subject: String(userId),
            expiresIn: "1d",
        });
        const session = {
            token,
            [this.appInstance.app.serializer.relationshipToColumn(userType.type, userType.schema.primaryKeyName)]: userId,
            id: (0, crypto_1.randomBytes)(16).toString("hex"),
        };
        return session;
    }
}
SessionProcessor.resourceClass = session_1.default;
exports.default = SessionProcessor;
//# sourceMappingURL=session-processor.js.map