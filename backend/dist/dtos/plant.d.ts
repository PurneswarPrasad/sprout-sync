import { z } from 'zod';
export declare const createPlantSchema: z.ZodObject<{
    petName: z.ZodOptional<z.ZodString>;
    botanicalName: z.ZodString;
    commonName: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    acquisitionDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    city: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    botanicalName: string;
    commonName: string;
    type?: string | undefined;
    petName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}, {
    botanicalName: string;
    commonName: string;
    type?: string | undefined;
    petName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}>;
export type CreatePlantDTO = z.infer<typeof createPlantSchema>;
export declare const updatePlantSchema: z.ZodObject<{
    petName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    botanicalName: z.ZodOptional<z.ZodString>;
    commonName: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    acquisitionDate: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    petName?: string | undefined;
    botanicalName?: string | undefined;
    commonName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}, {
    type?: string | undefined;
    petName?: string | undefined;
    botanicalName?: string | undefined;
    commonName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}>;
export type UpdatePlantDTO = z.infer<typeof updatePlantSchema>;
export declare const plantResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    petName: z.ZodNullable<z.ZodString>;
    botanicalName: z.ZodNullable<z.ZodString>;
    commonName: z.ZodNullable<z.ZodString>;
    type: z.ZodNullable<z.ZodString>;
    acquisitionDate: z.ZodNullable<z.ZodDate>;
    city: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    _count: z.ZodOptional<z.ZodObject<{
        notes: z.ZodNumber;
        photos: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        notes: number;
        photos: number;
    }, {
        notes: number;
        photos: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    type: string | null;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    acquisitionDate: Date | null;
    city: string | null;
    userId: string;
    updatedAt: Date;
    _count?: {
        notes: number;
        photos: number;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    type: string | null;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    acquisitionDate: Date | null;
    city: string | null;
    userId: string;
    updatedAt: Date;
    _count?: {
        notes: number;
        photos: number;
    } | undefined;
}>;
export type PlantResponseDTO = z.infer<typeof plantResponseSchema>;
//# sourceMappingURL=plant.d.ts.map