"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singularize = exports.pluralize = exports.underscore = exports.decamelize = exports.dasherize = exports.classify = exports.capitalize = exports.camelize = void 0;
const inflection_1 = require("inflection");
Object.defineProperty(exports, "pluralize", { enumerable: true, get: function () { return inflection_1.pluralize; } });
Object.defineProperty(exports, "singularize", { enumerable: true, get: function () { return inflection_1.singularize; } });
var ember_cli_string_utils_1 = require("ember-cli-string-utils");
Object.defineProperty(exports, "camelize", { enumerable: true, get: function () { return ember_cli_string_utils_1.camelize; } });
Object.defineProperty(exports, "capitalize", { enumerable: true, get: function () { return ember_cli_string_utils_1.capitalize; } });
Object.defineProperty(exports, "classify", { enumerable: true, get: function () { return ember_cli_string_utils_1.classify; } });
Object.defineProperty(exports, "dasherize", { enumerable: true, get: function () { return ember_cli_string_utils_1.dasherize; } });
Object.defineProperty(exports, "decamelize", { enumerable: true, get: function () { return ember_cli_string_utils_1.decamelize; } });
Object.defineProperty(exports, "underscore", { enumerable: true, get: function () { return ember_cli_string_utils_1.underscore; } });
//# sourceMappingURL=string.js.map