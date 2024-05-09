"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const json_api_errors_1 = require("./errors/json-api-errors");
const user_management_1 = require("./addons/user-management");
const hooks_1 = require("./utils/hooks");
class ApplicationInstance {
    constructor(app) {
        this.app = app;
    }
    async processorFor(resourceType) {
        return this.app.processorFor(resourceType, this);
    }
    async getUserFromToken(token, request) {
        const tokenPayload = (0, jsonwebtoken_1.decode)(token);
        let userIdSourceKey = "";
        const userManagementAddonOptions = this.app.getAddonOptions(user_management_1.default);
        if (userManagementAddonOptions) {
            userIdSourceKey = userManagementAddonOptions.jwtClaimForUserID;
        }
        else {
            userIdSourceKey = "id";
        }
        if (!tokenPayload) {
            throw json_api_errors_1.default.InvalidToken();
        }
        const id = tokenPayload[userIdSourceKey];
        if (!id) {
            throw json_api_errors_1.default.InvalidToken();
        }
        let op = {
            op: "identify",
            ref: {
                type: "user",
                id,
            },
            params: {},
        };
        if (userManagementAddonOptions.includeTokenInIdentifyOpDataPayload) {
            op.data = {
                type: "user",
                attributes: {
                    token,
                },
                relationships: {},
            };
        }
        const updateOperation = (updatedOperation) => {
            op = updatedOperation;
        };
        await (0, hooks_1.runHookFunctions)(this, "beforeExecutingIdentifyOperation", { op, request, updateOperation });
        let user;
        try {
            [user] = await this.app.executeOperations([op], this);
        }
        catch (error) {
            if (error.code === "not_found") {
                throw json_api_errors_1.default.InvalidToken();
            }
            throw error;
        }
        this.transaction = await this.app.createTransaction();
        const data = user.data;
        if (this.app.services.roles) {
            data.attributes["roles"] = await this.app.services.roles.bind(this)(user.data);
        }
        if (this.app.services.permissions) {
            data.attributes["permissions"] = await this.app.services.permissions.bind(this)(user.data);
        }
        await this.transaction.commit();
        return data;
    }
}
exports.default = ApplicationInstance;
//# sourceMappingURL=application-instance.js.map