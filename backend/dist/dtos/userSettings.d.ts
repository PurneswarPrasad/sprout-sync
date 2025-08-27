import { z } from 'zod';
export declare const personaEnum: z.ZodEnum<["PRIMARY", "SECONDARY", "TERTIARY"]>;
export declare const updateUserSettingsSchema: z.ZodObject<{
    persona: z.ZodEnum<["PRIMARY", "SECONDARY", "TERTIARY"]>;
    timezone: z.ZodString;
    onesignalPlayerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    persona: "PRIMARY" | "SECONDARY" | "TERTIARY";
    timezone: string;
    onesignalPlayerId?: string | undefined;
}, {
    persona: "PRIMARY" | "SECONDARY" | "TERTIARY";
    timezone: string;
    onesignalPlayerId?: string | undefined;
}>;
export type UpdateUserSettingsDTO = z.infer<typeof updateUserSettingsSchema>;
export declare const userSettingsResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    persona: z.ZodEnum<["PRIMARY", "SECONDARY", "TERTIARY"]>;
    timezone: z.ZodString;
    onesignalPlayerId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    persona: "PRIMARY" | "SECONDARY" | "TERTIARY";
    timezone: string;
    onesignalPlayerId: string | null;
}, {
    id: string;
    userId: string;
    persona: "PRIMARY" | "SECONDARY" | "TERTIARY";
    timezone: string;
    onesignalPlayerId: string | null;
}>;
export type UserSettingsResponseDTO = z.infer<typeof userSettingsResponseSchema>;
//# sourceMappingURL=userSettings.d.ts.map