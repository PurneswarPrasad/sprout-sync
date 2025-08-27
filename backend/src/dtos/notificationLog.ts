import { z } from 'zod';

// Channel enum
export const channelEnum = z.enum(['WEB_PUSH']);

// Create NotificationLog DTO
export const createNotificationLogSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  payloadJson: z.record(z.any()),
  sentAt: z.string().datetime('Invalid sent date'),
  channel: channelEnum,
});

export type CreateNotificationLogDTO = z.infer<typeof createNotificationLogSchema>;

// NotificationLog Response DTO
export const notificationLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  payloadJson: z.string(),
  sentAt: z.date(),
  channel: channelEnum,
});

export type NotificationLogResponseDTO = z.infer<typeof notificationLogResponseSchema>;

