"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagResponseSchema = exports.createTagSchema = void 0;
const zod_1 = require("zod");
exports.createTagSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    name: zod_1.z.string().min(1, 'Tag name is required'),
    colorHex: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
});
exports.tagResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string(),
    colorHex: zod_1.z.string().nullable(),
});
//# sourceMappingURL=tag.js.map