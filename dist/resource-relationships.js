"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelongsTo = exports.HasMany = void 0;
const HasMany = (resourceType, options) => ({
    hasMany: true,
    type: () => resourceType,
    ...options,
});
exports.HasMany = HasMany;
const BelongsTo = (resourceType, options) => ({
    belongsTo: true,
    type: () => resourceType,
    ...options,
});
exports.BelongsTo = BelongsTo;
//# sourceMappingURL=resource-relationships.js.map