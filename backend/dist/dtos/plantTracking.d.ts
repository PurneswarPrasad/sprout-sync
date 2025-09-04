import { z } from 'zod';
export declare const createPlantTrackingSchema: z.ZodObject<{
    plantId: z.ZodString;
    date: z.ZodString;
    note: z.ZodString;
    photoUrl: z.ZodOptional<z.ZodString>;
    originalPhotoUrl: z.ZodOptional<z.ZodString>;
    cloudinaryPublicId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    note: string;
    date: string;
    plantId: string;
    cloudinaryPublicId?: string | undefined;
    photoUrl?: string | undefined;
    originalPhotoUrl?: string | undefined;
}, {
    note: string;
    date: string;
    plantId: string;
    cloudinaryPublicId?: string | undefined;
    photoUrl?: string | undefined;
    originalPhotoUrl?: string | undefined;
}>;
export type CreatePlantTrackingDTO = z.infer<typeof createPlantTrackingSchema>;
export declare const plantTrackingResponseSchema: z.ZodObject<{
    id: z.ZodString;
    plantId: z.ZodString;
    date: z.ZodString;
    note: z.ZodString;
    photoUrl: z.ZodNullable<z.ZodString>;
    originalPhotoUrl: z.ZodNullable<z.ZodString>;
    cloudinaryPublicId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    note: string;
    id: string;
    createdAt: Date;
    date: string;
    plantId: string;
    cloudinaryPublicId: string | null;
    photoUrl: string | null;
    originalPhotoUrl: string | null;
}, {
    note: string;
    id: string;
    createdAt: Date;
    date: string;
    plantId: string;
    cloudinaryPublicId: string | null;
    photoUrl: string | null;
    originalPhotoUrl: string | null;
}>;
export type PlantTrackingResponseDTO = z.infer<typeof plantTrackingResponseSchema>;
//# sourceMappingURL=plantTracking.d.ts.map