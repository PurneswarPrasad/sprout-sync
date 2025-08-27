import { z } from 'zod';
export declare const channelEnum: z.ZodEnum<["WEB_PUSH"]>;
export declare const createNotificationLogSchema: z.ZodObject<{
    userId: z.ZodString;
    payloadJson: z.ZodRecord<z.ZodString, z.ZodAny>;
    sentAt: z.ZodString;
    channel: z.ZodEnum<["WEB_PUSH"]>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    payloadJson: Record<string, any>;
    sentAt: string;
    channel: "WEB_PUSH";
}, {
    userId: string;
    payloadJson: Record<string, any>;
    sentAt: string;
    channel: "WEB_PUSH";
}>;
export type CreateNotificationLogDTO = z.infer<typeof createNotificationLogSchema>;
export declare const notificationLogResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    payloadJson: z.ZodString;
    sentAt: z.ZodDate;
    channel: z.ZodEnum<["WEB_PUSH"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    payloadJson: string;
    sentAt: Date;
    channel: "WEB_PUSH";
}, {
    id: string;
    userId: string;
    payloadJson: string;
    sentAt: Date;
    channel: "WEB_PUSH";
}>;
export type NotificationLogResponseDTO = z.infer<typeof notificationLogResponseSchema>;
//# sourceMappingURL=notificationLog.d.ts.map