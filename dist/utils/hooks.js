"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHookFunctions = void 0;
const json_api_errors_1 = require("../errors/json-api-errors");
const runHookFunctions = async (appInstance, hookType, parameters = {}) => {
    for (const hook of appInstance.app.hooks[hookType]) {
        try {
            await hook(appInstance, parameters);
        }
        catch (e) {
            throw json_api_errors_1.default.UnhandledError(`Hook ${hookType}:${hook.name} failed: ${e.message}, ${e.stack}`);
        }
    }
};
exports.runHookFunctions = runHookFunctions;
//# sourceMappingURL=hooks.js.map