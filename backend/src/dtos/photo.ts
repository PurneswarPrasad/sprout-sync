import { z } from 'zod';

// Create Photo DTO
export const createPhotoSchema = z.object({
  cloudinaryPublicId: z.string().min(1, 'Cloudinary public ID is required'),
  secureUrl: z.string().url('Invalid secure URL'),
  takenAt: z.string().datetime('Invalid taken date'),
});

export type CreatePhotoDTO = z.infer<typeof createPhotoSchema>;

// Photo Response DTO
export const photoResponseSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  cloudinaryPublicId: z.string(),
  secureUrl: z.string(),
  takenAt: z.date(),
  pointsAwarded: z.number(),
});

export type PhotoResponseDTO = z.infer<typeof photoResponseSchema>;

