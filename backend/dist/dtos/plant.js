"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantResponseSchema = exports.updatePlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
exports.createPlantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Plant name is required'),
    type: zod_1.z.string().optional(),
    acquisitionDate: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, 'Invalid date format'),
    city: zod_1.z.string().optional(),
});
exports.updatePlantSchema = exports.createPlantSchema.partial();
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