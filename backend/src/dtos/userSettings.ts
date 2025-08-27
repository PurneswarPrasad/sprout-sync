import { z } from 'zod';

// Persona enum
export const personaEnum = z.enum(['PRIMARY', 'SECONDARY', 'TERTIARY']);

// Update UserSettings DTO
export const updateUserSettingsSchema = z.object({
  persona: personaEnum,
  timezone: z.string().min(1, 'Timezone is required'),
  onesignalPlayerId: z.string().optional(),
});

export type UpdateUserSettingsDTO = z.infer<typeof updateUserSettingsSchema>;

// UserSettings Response DTO
export const userSettingsResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  persona: personaEnum,
  timezone: z.string(),
  onesignalPlayerId: z.string().nullable(),
});

export type UserSettingsResponseDTO = z.infer<typeof userSettingsResponseSchema>;

