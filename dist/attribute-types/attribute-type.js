"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("../utils/string");
function AttributeType(name, options) {
    const { jsonType, serialize, deserialize } = options;
    let attributeClass;
    if (jsonType === Object) {
        attributeClass = class ThisAttributeTypeDefinition {
            constructor() {
                this.isSensitive = options.isSensitive || false;
            }
            serialize(value) {
                return value;
            }
            deserialize(value) {
                return value;
            }
        };
    }
    else {
        attributeClass = class ThisAttributeTypeDefinition extends jsonType {
            constructor() {
                super(...arguments);
                this.isSensitive = options.isSensitive || false;
            }
            serialize(value) {
                return value;
            }
            deserialize(value) {
                return value;
            }
        };
    }
    if (serialize) {
        attributeClass.prototype.serialize = serialize.bind(attributeClass.prototype);
    }
    if (deserialize) {
        attributeClass.prototype.deserialize = deserialize.bind(attributeClass.prototype);
    }
    Object.defineProperty(attributeClass, "name", { value: `${(0, string_1.capitalize)(name)}` });
    return attributeClass;
}
exports.default = AttributeType;
//# sourceMappingURL=attribute-type.js.map