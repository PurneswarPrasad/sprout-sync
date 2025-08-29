import { z } from 'zod';
export declare const createPlantSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    acquisitionDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    city: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}, {
    name: string;
    type?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}>;
export type CreatePlantDTO = z.infer<typeof createPlantSchema>;
export declare const updatePlantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    acquisitionDate: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}, {
    name?: string | undefined;
    type?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
}>;
export type UpdatePlantDTO = z.infer<typeof updatePlantSchema>;
export declare const plantResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
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
    name: string;
    createdAt: Date;
    type: string | null;
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
    name: string;
    createdAt: Date;
    type: string | null;
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