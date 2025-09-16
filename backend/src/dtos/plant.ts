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
  careLevel: z.enum(['Easy', 'Moderate', 'Difficult']).optional(),
  sunRequirements: z.enum(['No sun', 'Part to Full', 'Full sun']).optional(),
  toxicityLevel: z.enum(['Low', 'Medium', 'High']).optional(),
});

export type CreatePlantDTO = z.infer<typeof createPlantSchema>;

// Update Plant DTO (partial)
export const updatePlantSchema = createPlantSchema.partial();

export type UpdatePlantDTO = z.infer<typeof updatePlantSchema>;

// Plant Response DTO
export const plantResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  petName: z.string().nullable(),
  botanicalName: z.string().nullable(),
  commonName: z.string().nullable(),
  type: z.string().nullable(),
  acquisitionDate: z.date().nullable(),
  city: z.string().nullable(),
  careLevel: z.enum(['Easy', 'Moderate', 'Difficult']).nullable(),
  sunRequirements: z.enum(['No sun', 'Part to Full', 'Full sun']).nullable(),
  toxicityLevel: z.enum(['Low', 'Medium', 'High']).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    notes: z.number(),
    photos: z.number(),
  }).optional(),
});

export type PlantResponseDTO = z.infer<typeof plantResponseSchema>;

