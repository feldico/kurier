"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const koaBody = require("koa-body");
const compose = require("koa-compose");
const application_instance_1 = require("../application-instance");
const http_utils_1 = require("../utils/http-utils");
const json_api_errors_1 = require("../errors/json-api-errors");
const hooks_1 = require("../utils/hooks");
function jsonApiKoa(app, transportLayerOptions = {
    httpBodyPayload: "1mb",
    httpStrictMode: false,
}, ...middlewares) {
    const { httpBodyPayload, httpStrictMode } = transportLayerOptions;
    const checkStrictMode = async (ctx, next) => {
        if (!httpStrictMode) {
            return next();
        }
        if (!ctx.headers["content-type"] || !ctx.headers["content-type"].startsWith("application/vnd.api+json")) {
            ctx.status = 400;
            ctx.body = (0, http_utils_1.convertErrorToHttpResponse)(json_api_errors_1.default.BadRequest("Content-Type must be application/vnd.api+json"));
        }
        return next();
    };
    const jsonApiKoa = async (ctx, next) => {
        if (httpStrictMode && ctx.status === 400) {
            return next();
        }
        const appInstance = new application_instance_1.default(app);
        const hookParameters = {
            headers: ctx.headers,
            connection: ctx.req.connection,
            socket: ctx.socket,
        };
        await (0, hooks_1.runHookFunctions)(appInstance, "beforeAuthentication", hookParameters);
        try {
            await (0, http_utils_1.authenticate)(appInstance, ctx.request);
        }
        catch (error) {
            ctx.body = (0, http_utils_1.convertErrorToHttpResponse)(error);
            ctx.status = error.status;
            return next();
        }
        ctx.request.urlData = (0, http_utils_1.urlData)(appInstance, ctx.path);
        await (0, hooks_1.runHookFunctions)(appInstance, "beforeRequestHandling", hookParameters);
        if (ctx.method === "PATCH" && ctx.request.urlData.resource === "bulk") {
            ctx.body = await (0, http_utils_1.handleBulkEndpoint)(appInstance, ctx.request.body.operations);
            return next();
        }
        try {
            const { body, status } = await (0, http_utils_1.handleJsonApiEndpoint)(appInstance, ctx.request);
            ctx.body = body;
            ctx.status = status;
        }
        catch (error) {
            ctx.body = (0, http_utils_1.convertErrorToHttpResponse)(error);
            ctx.status = error.status;
        }
        finally {
            return next();
        }
    };
    const koaBodySettings = {
        json: true,
        jsonLimit: httpBodyPayload,
    };
    return compose([checkStrictMode, koaBody(koaBodySettings), ...middlewares, jsonApiKoa]);
}
exports.default = jsonApiKoa;
//# sourceMappingURL=json-api-koa.js.map