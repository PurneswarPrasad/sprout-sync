"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteResponseSchema = exports.createNoteSchema = exports.presetEnum = void 0;
const zod_1 = require("zod");
exports.presetEnum = zod_1.z.enum(['STRESSED', 'NEEDS_PRUNING', 'FERTILIZER_DUE', 'PEST_ISSUE']);
exports.createNoteSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID'),
    taskKey: zod_1.z.string().optional(),
    body: zod_1.z.string().min(1, 'Note body is required'),
    preset: exports.presetEnum.optional(),
});
exports.noteResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    plantId: zod_1.z.string(),
    taskKey: zod_1.z.string().nullable(),
    body: zod_1.z.string(),
    preset: exports.presetEnum.nullable(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=note.js.map