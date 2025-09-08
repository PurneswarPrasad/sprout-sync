import { z } from 'zod';
export declare const createPhotoSchema: z.ZodObject<{
    cloudinaryPublicId: z.ZodString;
    secureUrl: z.ZodString;
    takenAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cloudinaryPublicId: string;
    secureUrl: string;
    takenAt: string;
}, {
    cloudinaryPublicId: string;
    secureUrl: string;
    takenAt: string;
}>;
export type CreatePhotoDTO = z.infer<typeof createPhotoSchema>;
export declare const photoResponseSchema: z.ZodObject<{
    id: z.ZodString;
    plantId: z.ZodString;
    cloudinaryPublicId: z.ZodString;
    secureUrl: z.ZodString;
    takenAt: z.ZodDate;
    pointsAwarded: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    plantId: string;
    cloudinaryPublicId: string;
    secureUrl: string;
    takenAt: Date;
    pointsAwarded: number;
}, {
    id: string;
    plantId: string;
    cloudinaryPublicId: string;
    secureUrl: string;
    takenAt: Date;
    pointsAwarded: number;
}>;
export type PhotoResponseDTO = z.infer<typeof photoResponseSchema>;
//# sourceMappingURL=photo.d.ts.map