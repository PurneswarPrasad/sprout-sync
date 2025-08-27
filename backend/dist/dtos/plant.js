"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantResponseSchema = exports.updatePlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
exports.createPlantSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    name: zod_1.z.string().min(1, 'Plant name is required'),
    type: zod_1.z.string().optional(),
    acquisitionDate: zod_1.z.string().datetime('Invalid acquisition date').optional(),
    city: zod_1.z.string().optional(),
});
exports.updatePlantSchema = exports.createPlantSchema.partial().omit({ userId: true });
exports.plantResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.string().nullable(),
    acquisitionDate: zod_1.z.date().nullable(),
    city: zod_1.z.string().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    _count: zod_1.z.object({
        notes: zod_1.z.number(),
        photos: zod_1.z.number(),
    }).optional(),
});
//# sourceMappingURL=plant.js.map