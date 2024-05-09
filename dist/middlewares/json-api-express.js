"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const compose_middleware_1 = require("compose-middleware");
const application_instance_1 = require("../application-instance");
const http_utils_1 = require("../utils/http-utils");
const json_api_errors_1 = require("../errors/json-api-errors");
const hooks_1 = require("../utils/hooks");
function jsonApiExpress(app, transportLayerOptions = {
    httpBodyPayload: "1mb",
    httpStrictMode: false,
}, ...middlewares) {
    const { httpBodyPayload, httpStrictMode } = transportLayerOptions;
    const checkStrictMode = async (req, res, next) => {
        if (!httpStrictMode) {
            return next();
        }
        if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("application/vnd.api+json")) {
            res
                .status(400)
                .json((0, http_utils_1.convertErrorToHttpResponse)(json_api_errors_1.default.BadRequest("Content-Type must be application/vnd.api+json")));
        }
        else {
            return next();
        }
    };
    const jsonApiExpress = async (req, res, next) => {
        const appInstance = new application_instance_1.default(app);
        const hookParameters = {
            headers: req.headers,
            connection: req.connection,
            socket: req.socket,
        };
        await (0, hooks_1.runHookFunctions)(appInstance, "beforeAuthentication", hookParameters);
        try {
            await (0, http_utils_1.authenticate)(appInstance, req);
        }
        catch (error) {
            res.status(+error.status).json((0, http_utils_1.convertErrorToHttpResponse)(error));
            return next();
        }
        req.href = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
        req.urlData = (0, http_utils_1.urlData)(appInstance, req.path);
        await (0, hooks_1.runHookFunctions)(appInstance, "beforeRequestHandling", hookParameters);
        if (req.method === "PATCH" && req.urlData.resource === "bulk") {
            res.send(await (0, http_utils_1.handleBulkEndpoint)(appInstance, req.body.operations));
            return next();
        }
        const { body, status } = await (0, http_utils_1.handleJsonApiEndpoint)(appInstance, req);
        res.status(status).json(body);
        return next();
    };
    return (0, compose_middleware_1.compose)([
        checkStrictMode,
        express.json({
            type: httpStrictMode ? "application/vnd.api+json" : "application/json",
            strict: false,
            limit: httpBodyPayload,
        }),
        ...middlewares,
        jsonApiExpress,
    ]);
}
exports.default = jsonApiExpress;
//# sourceMappingURL=json-api-express.js.map