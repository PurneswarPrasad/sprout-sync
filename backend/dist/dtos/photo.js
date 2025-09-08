"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.photoResponseSchema = exports.createPhotoSchema = void 0;
const zod_1 = require("zod");
exports.createPhotoSchema = zod_1.z.object({
    cloudinaryPublicId: zod_1.z.string().min(1, 'Cloudinary public ID is required'),
    secureUrl: zod_1.z.string().url('Invalid secure URL'),
    takenAt: zod_1.z.string().datetime('Invalid taken date'),
});
exports.photoResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    plantId: zod_1.z.string(),
    cloudinaryPublicId: zod_1.z.string(),
    secureUrl: zod_1.z.string(),
    takenAt: zod_1.z.date(),
    pointsAwarded: zod_1.z.number(),
});
//# sourceMappingURL=photo.js.map