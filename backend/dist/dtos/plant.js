"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantResponseSchema = exports.updatePlantSchema = exports.createPlantSchema = void 0;
const zod_1 = require("zod");
exports.createPlantSchema = zod_1.z.object({
    petName: zod_1.z.string().optional(),
    botanicalName: zod_1.z.string().min(1, 'Botanical name is required'),
    commonName: zod_1.z.string().min(1, 'Common name is required'),
    type: zod_1.z.string().optional(),
    acquisitionDate: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, 'Invalid date format'),
    city: zod_1.z.string().optional(),
    careLevel: zod_1.z.union([
        zod_1.z.enum(['Easy', 'Moderate', 'Difficult']),
        zod_1.z.object({
            level: zod_1.z.enum(['Easy', 'Moderate', 'Difficult']),
            description: zod_1.z.string(),
            maintenanceTips: zod_1.z.string(),
        })
    ]).optional(),
    sunRequirements: zod_1.z.union([
        zod_1.z.enum(['No sun', 'Part to Full', 'Full sun']),
        zod_1.z.object({
            level: zod_1.z.enum(['No sun', 'Part to Full', 'Full sun']),
            description: zod_1.z.string(),
            placementTips: zod_1.z.string(),
        })
    ]).optional(),
    toxicityLevel: zod_1.z.union([
        zod_1.z.enum(['Low', 'Medium', 'High']),
        zod_1.z.object({
            level: zod_1.z.enum(['Low', 'Medium', 'High']),
            description: zod_1.z.string(),
            safetyTips: zod_1.z.string(),
        })
    ]).optional(),
    petFriendliness: zod_1.z.object({
        isFriendly: zod_1.z.boolean(),
        reason: zod_1.z.string(),
    }).optional(),
    commonPestsAndDiseases: zod_1.z.string().optional(),
    preventiveMeasures: zod_1.z.string().optional(),
});
exports.updatePlantSchema = exports.createPlantSchema.partial();
const careLevelResponseSchema = zod_1.z.union([
    zod_1.z.enum(['Easy', 'Moderate', 'Difficult']),
    zod_1.z.object({
        level: zod_1.z.enum(['Easy', 'Moderate', 'Difficult']),
        description: zod_1.z.string(),
        maintenanceTips: zod_1.z.string(),
    })
]).nullable();
const sunRequirementsResponseSchema = zod_1.z.union([
    zod_1.z.enum(['No sun', 'Part to Full', 'Full sun']),
    zod_1.z.object({
        level: zod_1.z.enum(['No sun', 'Part to Full', 'Full sun']),
        description: zod_1.z.string(),
        placementTips: zod_1.z.string(),
    })
]).nullable();
const toxicityLevelResponseSchema = zod_1.z.union([
    zod_1.z.enum(['Low', 'Medium', 'High']),
    zod_1.z.object({
        level: zod_1.z.enum(['Low', 'Medium', 'High']),
        description: zod_1.z.string(),
        safetyTips: zod_1.z.string(),
    })
]).nullable();
exports.plantResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    petName: zod_1.z.string().nullable(),
    botanicalName: zod_1.z.string().nullable(),
    commonName: zod_1.z.string().nullable(),
    type: zod_1.z.string().nullable(),
    acquisitionDate: zod_1.z.date().nullable(),
    city: zod_1.z.string().nullable(),
    careLevel: careLevelResponseSchema,
    sunRequirements: sunRequirementsResponseSchema,
    toxicityLevel: toxicityLevelResponseSchema,
    petFriendliness: zod_1.z.object({
        isFriendly: zod_1.z.boolean(),
        reason: zod_1.z.string(),
    }).nullable().optional(),
    commonPestsAndDiseases: zod_1.z.string().nullable().optional(),
    preventiveMeasures: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    _count: zod_1.z.object({
        notes: zod_1.z.number(),
        photos: zod_1.z.number(),
    }).optional(),
});
//# sourceMappingURL=plant.js.map