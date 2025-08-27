import { z } from 'zod';

// Create Tag DTO
export const createTagSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Tag name is required'),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
});

export type CreateTagDTO = z.infer<typeof createTagSchema>;

// Tag Response DTO
export const tagResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  colorHex: z.string().nullable(),
});

export type TagResponseDTO = z.infer<typeof tagResponseSchema>;

