import { z } from 'zod';

// Create Plant DTO
export const createPlantSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Plant name is required'),
  type: z.string().optional(),
  acquisitionDate: z.string().datetime('Invalid acquisition date').optional(),
  city: z.string().optional(),
});

export type CreatePlantDTO = z.infer<typeof createPlantSchema>;

// Update Plant DTO (partial)
export const updatePlantSchema = createPlantSchema.partial().omit({ userId: true });

export type UpdatePlantDTO = z.infer<typeof updatePlantSchema>;

// Plant Response DTO
export const plantResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: z.string().nullable(),
  acquisitionDate: z.date().nullable(),
  city: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    notes: z.number(),
    photos: z.number(),
  }).optional(),
});

export type PlantResponseDTO = z.infer<typeof plantResponseSchema>;

