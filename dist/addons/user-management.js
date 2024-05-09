"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addon_1 = require("../addon");
const user_1 = require("../resources/user");
const password_1 = require("../attribute-types/password");
const resource_1 = require("../resource");
const user_processor_1 = require("../processors/user-processor");
const session_processor_1 = require("../processors/session-processor");
const defaults = {
    userResource: user_1.default,
    userProcessor: user_processor_1.default,
    sessionProcessor: session_processor_1.default,
    userRolesProvider: async () => [],
    userPermissionsProvider: async () => [],
    userLoginCallback: async () => {
        console.warn("WARNING: You're using the default login callback with UserManagementAddon." +
            "ANY LOGIN REQUEST WILL PASS. Implement this callback in your addon configuration.");
        return true;
    },
    userEncryptPasswordCallback: async (op) => {
        var _a;
        console.warn("WARNING: You're using the default encryptPassword callback with UserManagementAddon." +
            "Your password is NOT being encrypted. Implement this callback in your addon configuration.");
        return { password: (_a = op.data) === null || _a === void 0 ? void 0 : _a.attributes.password.toString() };
    },
    usernameRequestParameter: "username",
    passwordRequestParameter: "password",
    jwtClaimForUserID: "id",
    includeTokenInIdentifyOpDataPayload: false,
};
class UserManagementAddon extends addon_1.default {
    constructor(app, options = {}) {
        super(app);
        this.app = app;
        this.options = options;
        this.options = { ...defaults, ...options };
    }
    async install() {
        const sessionResourceType = this.createSessionResource();
        this.app.services.roles = this.options.userRolesProvider;
        this.app.services.permissions = this.options.userPermissionsProvider;
        this.app.types.push(this.options.userResource, sessionResourceType);
        this.app.processors.push(this.createUserProcessor(), this.createSessionProcessor(sessionResourceType));
    }
    createUserProcessor() {
        const { userProcessor, userEncryptPasswordCallback, userGenerateIdCallback } = this.options;
        let generateIdCallback = async () => "";
        let encryptPasswordCallback = async (op) => ({});
        if (userProcessor === user_processor_1.default) {
            generateIdCallback = userGenerateIdCallback || generateIdCallback;
            encryptPasswordCallback = userEncryptPasswordCallback;
        }
        else {
            generateIdCallback = userProcessor === null || userProcessor === void 0 ? void 0 : userProcessor.prototype["generateId"];
            encryptPasswordCallback = userProcessor === null || userProcessor === void 0 ? void 0 : userProcessor.prototype["encryptPassword"];
        }
        return ((options) => { var _a; return _a = class UserProcessor extends (options.userProcessor || user_processor_1.default) {
                static async shouldHandle(resourceType) {
                    return this.resourceClass && resourceType === this.resourceClass.type;
                }
                async generateId() {
                    return generateIdCallback.bind(this)();
                }
                async encryptPassword(op) {
                    return encryptPasswordCallback.bind(this)(op);
                }
            },
            _a.resourceClass = options.userResource,
            _a; })(this.options);
    }
    createSessionProcessor(sessionResourceType) {
        const { sessionProcessor } = this.options;
        if (sessionProcessor === session_processor_1.default) {
            return ((options) => { var _a; return _a = class SessionProcessor extends session_processor_1.default {
                    async login(op, userDataSource) {
                        return (options.userLoginCallback || ((_, __) => true))(op, userDataSource);
                    }
                },
                _a.resourceClass = sessionResourceType,
                _a; })(this.options);
        }
        if (sessionProcessor !== undefined) {
            return ((options) => { var _a; return _a = class SessionProcessor extends (options.sessionProcessor) {
                },
                _a.resourceClass = sessionResourceType,
                _a; })(this.options);
        }
    }
    createSessionResource() {
        return ((options) => { var _a; return _a = class Session extends resource_1.default {
                static get type() {
                    return "session";
                }
            },
            _a.schema = {
                attributes: {
                    token: String,
                    [options.usernameRequestParameter]: String,
                    [options.passwordRequestParameter]: password_1.default,
                },
                relationships: {
                    user: {
                        type: () => options.userResource,
                        belongsTo: true,
                    },
                },
            },
            _a; })(this.options);
    }
}
exports.default = UserManagementAddon;
//# sourceMappingURL=user-management.js.map