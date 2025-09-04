"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantTrackingResponseSchema = exports.createPlantTrackingSchema = void 0;
const zod_1 = require("zod");
exports.createPlantTrackingSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid('Invalid plant ID'),
    date: zod_1.z.string().min(1, 'Date is required'),
    note: zod_1.z.string().min(1, 'Note is required'),
    photoUrl: zod_1.z.string().optional(),
    cloudinaryPublicId: zod_1.z.string().optional(),
});
exports.plantTrackingResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    plantId: zod_1.z.string(),
    date: zod_1.z.string(),
    note: zod_1.z.string(),
    photoUrl: zod_1.z.string().nullable(),
    cloudinaryPublicId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=plantTracking.js.map