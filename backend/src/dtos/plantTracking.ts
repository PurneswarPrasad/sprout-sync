import { z } from 'zod';

// Create Plant Tracking Update DTO
export const createPlantTrackingSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required'),
  photoUrl: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
});

export type CreatePlantTrackingDTO = z.infer<typeof createPlantTrackingSchema>;

// Plant Tracking Response DTO
export const plantTrackingResponseSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  date: z.string(),
  note: z.string(),
  photoUrl: z.string().nullable(),
  cloudinaryPublicId: z.string().nullable(),
  createdAt: z.date(),
});

export type PlantTrackingResponseDTO = z.infer<typeof plantTrackingResponseSchema>;

