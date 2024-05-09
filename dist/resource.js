"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("./utils/string");
class Resource {
    static get type() {
        return (0, string_1.camelize)(this.name);
    }
    constructor({ id, attributes, relationships, meta, }) {
        this.id = id;
        this.type = this.constructor.type;
        this.attributes = attributes || {};
        this.relationships = relationships || {};
        if (meta) {
            this.meta = meta;
        }
    }
}
Resource.schema = {
    primaryKeyName: "",
    attributes: {},
    relationships: {},
};
exports.default = Resource;
//# sourceMappingURL=resource.js.map