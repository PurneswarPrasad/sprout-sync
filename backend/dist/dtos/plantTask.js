"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantTaskResponseSchema = exports.updatePlantTaskSchema = exports.createPlantTaskSchema = void 0;
const zod_1 = require("zod");
exports.createPlantTaskSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID'),
    taskKey: zod_1.z.string().min(1, 'Task key is required'),
    frequencyDays: zod_1.z.number().positive('Frequency must be positive'),
    nextDueOn: zod_1.z.string().datetime('Invalid due date'),
});
exports.updatePlantTaskSchema = zod_1.z.object({
    frequencyDays: zod_1.z.number().positive('Frequency must be positive').optional(),
    nextDueOn: zod_1.z.string().datetime('Invalid due date').optional(),
    active: zod_1.z.boolean().optional(),
});
exports.plantTaskResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    plantId: zod_1.z.string(),
    taskKey: zod_1.z.string(),
    frequencyDays: zod_1.z.number(),
    nextDueOn: zod_1.z.date(),
    active: zod_1.z.boolean(),
    plant: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        type: zod_1.z.string().nullable(),
    }).optional(),
});
//# sourceMappingURL=plantTask.js.map