"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_1 = require("../decorators/authorize");
const user_1 = require("../resources/user");
const knex_processor_1 = require("./knex-processor");
class UserProcessor extends knex_processor_1.default {
    async identify(op) {
        return super.get({ ...op, params: {} });
    }
    async generateId() { }
    async encryptPassword(op) {
        throw new Error("You must implement a password encryption mechanism.");
    }
    async add(op) {
        var _a;
        const fields = Object.assign({}, ...Object.keys((_a = op.data) === null || _a === void 0 ? void 0 : _a.attributes)
            .filter((attribute) => !this.appInstance.app.serializer.isSensitiveAttribute(this.resourceClass.schema, attribute))
            .map((attribute) => { var _a; return ({ [attribute]: (_a = op.data) === null || _a === void 0 ? void 0 : _a.attributes[attribute] }); }));
        const id = await this.generateId();
        const encryptedPassword = await this.encryptPassword(op);
        return super.add({
            ...op,
            data: {
                ...op.data,
                id,
                attributes: {
                    ...fields,
                    ...encryptedPassword,
                },
            },
        });
    }
    async get(op) {
        return super.get(op);
    }
}
UserProcessor.resourceClass = user_1.default;
exports.default = UserProcessor;
__decorate([
    (0, authorize_1.default)()
], UserProcessor.prototype, "get", null);
//# sourceMappingURL=user-processor.js.map