import { z } from 'zod';

// Create PlantTask DTO (for /api/tasks endpoint where plantId and nextDueOn come from request body)
export const createPlantTaskSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID'),
  taskKey: z.string().min(1, 'Task key is required'),
  frequencyDays: z.number().positive('Frequency must be positive'),
  nextDueOn: z.string().datetime('Invalid due date'),
});

export type CreatePlantTaskDTO = z.infer<typeof createPlantTaskSchema>;

// Create PlantTask DTO (for /api/plants/:plantId/tasks endpoint where plantId comes from URL and nextDueOn is set by server)
export const createPlantTaskWithoutIdsSchema = z.object({
  taskKey: z.string().min(1, 'Task key is required'),
  frequencyDays: z.number().positive('Frequency must be positive'),
});

export type CreatePlantTaskWithoutIdsDTO = z.infer<typeof createPlantTaskWithoutIdsSchema>;

// Update PlantTask DTO (partial)
export const updatePlantTaskSchema = z.object({
  frequencyDays: z.number().positive('Frequency must be positive').optional(),
  nextDueOn: z.string().datetime('Invalid due date').optional(),
  active: z.boolean().optional(),
});

export type UpdatePlantTaskDTO = z.infer<typeof updatePlantTaskSchema>;

// PlantTask Response DTO
export const plantTaskResponseSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  taskKey: z.string(),
  frequencyDays: z.number(),
  nextDueOn: z.date(),
  active: z.boolean(),
  plant: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().nullable(),
  }).optional(),
});

export type PlantTaskResponseDTO = z.infer<typeof plantTaskResponseSchema>;

