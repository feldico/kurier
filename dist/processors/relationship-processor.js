"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class RelationshipProcessor extends __1.KnexProcessor {
    relationshipResourceFor(id) {
        const { type: resourceClassType } = this.resourceClass;
        class RelationshipResource extends this.resourceClass {
            static get type() {
                return resourceClassType;
            }
        }
        return new RelationshipResource({ id });
    }
    async get(op) {
        var _a;
        return ((_a = op.meta) === null || _a === void 0 ? void 0 : _a.belongsTo)
            ? super.get({
                op: "get",
                ref: {
                    type: op.ref.type,
                },
                params: {
                    fields: {
                        [this.resourceClass.type]: [
                            this.resourceClass.schema.relationships[`${op.ref.relationship}`].foreignKeyName ||
                                this.appInstance.app.serializer.relationshipToColumn(`${op.ref.relationship}`),
                        ],
                    },
                },
            })
            : super.get(op);
    }
}
exports.default = RelationshipProcessor;
//# sourceMappingURL=relationship-processor.js.map