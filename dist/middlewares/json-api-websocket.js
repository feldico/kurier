"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const application_instance_1 = require("../application-instance");
const hooks_1 = require("../utils/hooks");
function jsonApiWebSocket(websocketServer, app) {
    websocketServer.on("connection", (connection, req) => {
        connection.on("message", async (message) => {
            try {
                const appInstance = new application_instance_1.default(app);
                if (!message) {
                    return;
                }
                const { meta, operations } = JSON.parse(message.toString());
                const hookParameters = {
                    headers: req.headers,
                    connection: req.connection,
                    socket: req.socket,
                };
                await (0, hooks_1.runHookFunctions)(appInstance, "beforeAuthentication", hookParameters);
                // Get user.
                if (meta && meta.token) {
                    appInstance.user = await appInstance.getUserFromToken(meta.token);
                }
                await (0, hooks_1.runHookFunctions)(appInstance, "beforeRequestHandling", hookParameters);
                // Execute and reply.
                const response = await appInstance.app.executeOperations(operations, appInstance);
                connection.send(JSON.stringify({
                    operations: response,
                }));
            }
            catch (e) {
                connection.send(JSON.stringify({
                    errors: [
                        {
                            message: e.message,
                            ...(process.env.NODE_ENV === "development" ? { stack: e.stack } : {}),
                        },
                    ],
                }));
            }
        });
    });
}
exports.default = jsonApiWebSocket;
//# sourceMappingURL=json-api-websocket.js.map