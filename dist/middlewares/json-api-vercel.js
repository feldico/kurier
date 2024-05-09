"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const application_instance_1 = require("../application-instance");
const http_utils_1 = require("../utils/http-utils");
const json_api_errors_1 = require("../errors/json-api-errors");
const hooks_1 = require("../utils/hooks");
const checkStrictMode = async (transportLayerOptions, req, res) => {
    if (!transportLayerOptions.httpStrictMode) {
        return;
    }
    if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("application/vnd.api+json")) {
        res.status(400);
        res.send((0, http_utils_1.convertErrorToHttpResponse)(json_api_errors_1.default.BadRequest("Content-Type must be application/vnd.api+json")));
    }
    else {
        // Vercel's magic body parser is limited to certain MIME types. The JSONAPI MIME type isn't one of them.
        // As a result, `req.body` becomes undefined. So, we trick Vercel into thinking this is an `application/json`
        // request, and keep parsing the data as JSON.
        req.headers["content-type"] = "application/json";
    }
};
function jsonApiVercel(app, transportLayerOptions = {
    httpStrictMode: false,
}) {
    return async (req, res) => {
        await checkStrictMode(transportLayerOptions, req, res);
        if (transportLayerOptions.httpStrictMode && res.statusCode === 400) {
            return;
        }
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
            res.status(error.status);
            res.json((0, http_utils_1.convertErrorToHttpResponse)(error));
        }
        // This `href` property is used later in the parsing process to extract query parameters.
        // Protocol is there just to make a valid URL. It has no behavioural signifance.
        req.href = `https://${req.headers.host}${req.url}`;
        const urlObject = new url_1.URL(req.href);
        req.urlData = (0, http_utils_1.urlData)(appInstance, urlObject.pathname);
        await (0, hooks_1.runHookFunctions)(appInstance, "beforeRequestHandling", hookParameters);
        if (req.method === "PATCH" && req.urlData.resource === "bulk") {
            const bulkResponse = await (0, http_utils_1.handleBulkEndpoint)(appInstance, req.body.operations);
            res.json(bulkResponse);
            return;
        }
        const { body, status } = await (0, http_utils_1.handleJsonApiEndpoint)(appInstance, req);
        res.status(status);
        res.json(body);
    };
}
exports.default = jsonApiVercel;
//# sourceMappingURL=json-api-vercel.js.map