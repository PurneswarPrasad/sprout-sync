import { z } from 'zod';

// Task key enum
export const taskKeyEnum = z.enum(['watering', 'fertilizing', 'spraying', 'pruning', 'sunRotation']);

// Create TaskTemplate DTO
export const createTaskTemplateSchema = z.object({
  key: taskKeyEnum,
  label: z.string().min(1, 'Label is required'),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
  defaultFrequencyDays: z.number().positive('Frequency must be positive'),
});

export type CreateTaskTemplateDTO = z.infer<typeof createTaskTemplateSchema>;

// TaskTemplate Response DTO
export const taskTemplateResponseSchema = z.object({
  id: z.string(),
  key: taskKeyEnum,
  label: z.string(),
  colorHex: z.string(),
  defaultFrequencyDays: z.number(),
});

export type TaskTemplateResponseDTO = z.infer<typeof taskTemplateResponseSchema>;

