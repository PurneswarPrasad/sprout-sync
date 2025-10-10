import { z } from 'zod';

// Create Plant DTO
export const createPlantSchema = z.object({
  petName: z.string().optional(),
  botanicalName: z.string().min(1, 'Botanical name is required'),
  commonName: z.string().min(1, 'Common name is required'),
  type: z.string().optional(),
  acquisitionDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  city: z.string().optional(),
  careLevel: z.union([
    z.enum(['Easy', 'Moderate', 'Difficult']),
    z.object({
      level: z.enum(['Easy', 'Moderate', 'Difficult']),
      description: z.string(),
      maintenanceTips: z.string(),
    })
  ]).optional(),
  sunRequirements: z.union([
    z.enum(['No sun', 'Part to Full', 'Full sun']),
    z.object({
      level: z.enum(['No sun', 'Part to Full', 'Full sun']),
      description: z.string(),
      placementTips: z.string(),
    })
  ]).optional(),
  toxicityLevel: z.union([
    z.enum(['Low', 'Medium', 'High']),
    z.object({
      level: z.enum(['Low', 'Medium', 'High']),
      description: z.string(),
      safetyTips: z.string(),
    })
  ]).optional(),
  petFriendliness: z.object({
    isFriendly: z.boolean(),
    reason: z.string(),
  }).optional(),
  commonPestsAndDiseases: z.string().optional(),
  preventiveMeasures: z.string().optional(),
});

export type CreatePlantDTO = z.infer<typeof createPlantSchema>;

// Update Plant DTO (partial)
export const updatePlantSchema = createPlantSchema.partial();

export type UpdatePlantDTO = z.infer<typeof updatePlantSchema>;

// Plant Response DTO
const careLevelResponseSchema = z.union([
  z.enum(['Easy', 'Moderate', 'Difficult']),
  z.object({
    level: z.enum(['Easy', 'Moderate', 'Difficult']),
    description: z.string(),
    maintenanceTips: z.string(),
  })
]).nullable();

const sunRequirementsResponseSchema = z.union([
  z.enum(['No sun', 'Part to Full', 'Full sun']),
  z.object({
    level: z.enum(['No sun', 'Part to Full', 'Full sun']),
    description: z.string(),
    placementTips: z.string(),
  })
]).nullable();

const toxicityLevelResponseSchema = z.union([
  z.enum(['Low', 'Medium', 'High']),
  z.object({
    level: z.enum(['Low', 'Medium', 'High']),
    description: z.string(),
    safetyTips: z.string(),
  })
]).nullable();

export const plantResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  petName: z.string().nullable(),
  botanicalName: z.string().nullable(),
  commonName: z.string().nullable(),
  type: z.string().nullable(),
  acquisitionDate: z.date().nullable(),
  city: z.string().nullable(),
  careLevel: careLevelResponseSchema,
  sunRequirements: sunRequirementsResponseSchema,
  toxicityLevel: toxicityLevelResponseSchema,
  petFriendliness: z.object({
    isFriendly: z.boolean(),
    reason: z.string(),
  }).nullable().optional(),
  commonPestsAndDiseases: z.string().nullable().optional(),
  preventiveMeasures: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    notes: z.number(),
    photos: z.number(),
  }).optional(),
});

export type PlantResponseDTO = z.infer<typeof plantResponseSchema>;

