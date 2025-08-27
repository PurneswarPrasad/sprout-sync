"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResponseSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    googleId: zod_1.z.string().min(1, 'Google ID is required'),
    email: zod_1.z.string().email('Invalid email format'),
    name: zod_1.z.string().min(1, 'Name is required'),
    avatarUrl: zod_1.z.string().url('Invalid avatar URL').optional(),
});
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    name: zod_1.z.string().nullable(),
    avatarUrl: zod_1.z.string().nullable(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=user.js.map