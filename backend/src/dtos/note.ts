import { z } from 'zod';

// Preset enum
export const presetEnum = z.enum(['STRESSED', 'NEEDS_PRUNING', 'FERTILIZER_DUE', 'PEST_ISSUE']);

// Create Note DTO
export const createNoteSchema = z.object({
  plantId: z.string().uuid('Invalid plant ID'),
  taskKey: z.string().optional(),
  body: z.string().min(1, 'Note body is required'),
  preset: presetEnum.optional(),
});

export type CreateNoteDTO = z.infer<typeof createNoteSchema>;

// Note Response DTO
export const noteResponseSchema = z.object({
  id: z.string(),
  plantId: z.string(),
  taskKey: z.string().nullable(),
  body: z.string(),
  preset: presetEnum.nullable(),
  createdAt: z.date(),
});

export type NoteResponseDTO = z.infer<typeof noteResponseSchema>;

