"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const url_1 = require("url");
const JSON_API_OBJECT_KEYS = ["fields", "filter"];
const JSON_API_ARRAY_VALUES = ["include", "sort", "fields"];
function parse(url) {
    const params = {};
    const nestedParamRegexp = new RegExp(/(\w+)\[(.*?)\]?$/);
    for (const param of new url_1.URL(url).searchParams) {
        const [paramKey, paramValue] = param;
        const nestedParam = nestedParamRegexp.exec(paramKey);
        if (nestedParam) {
            const [, key, nestedKey] = nestedParam;
            if (!(params[key] instanceof Object)) {
                params[key] = {};
            }
            if (paramValue !== "") {
                params[key][nestedKey] = parseValueForKey(key, paramValue);
            }
        }
        else {
            if (paramValue !== "") {
                const value = parseValueForKey(paramKey, paramValue);
                params[paramKey] = JSON_API_OBJECT_KEYS.includes(paramKey) ? { ...value } : value;
            }
        }
    }
    return params;
}
exports.parse = parse;
function parseValueForKey(key, value = "") {
    if (JSON_API_ARRAY_VALUES.includes(key)) {
        return value.split(",");
    }
    return value;
}
//# sourceMappingURL=json-api-params.js.map