"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskTemplateResponseSchema = exports.createTaskTemplateSchema = exports.taskKeyEnum = void 0;
const zod_1 = require("zod");
exports.taskKeyEnum = zod_1.z.enum(['watering', 'fertilizing', 'spraying', 'pruning', 'sunRotation']);
exports.createTaskTemplateSchema = zod_1.z.object({
    key: exports.taskKeyEnum,
    label: zod_1.z.string().min(1, 'Label is required'),
    colorHex: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
    defaultFrequencyDays: zod_1.z.number().positive('Frequency must be positive'),
});
exports.taskTemplateResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    key: exports.taskKeyEnum,
    label: zod_1.z.string(),
    colorHex: zod_1.z.string(),
    defaultFrequencyDays: zod_1.z.number(),
});
//# sourceMappingURL=taskTemplate.js.map