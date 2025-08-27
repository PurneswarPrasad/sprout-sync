import { z } from 'zod';
export declare const createTagSchema: z.ZodObject<{
    userId: z.ZodString;
    name: z.ZodString;
    colorHex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    userId: string;
    colorHex?: string | undefined;
}, {
    name: string;
    userId: string;
    colorHex?: string | undefined;
}>;
export type CreateTagDTO = z.infer<typeof createTagSchema>;
export declare const tagResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    colorHex: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    userId: string;
    colorHex: string | null;
}, {
    id: string;
    name: string;
    userId: string;
    colorHex: string | null;
}>;
export type TagResponseDTO = z.infer<typeof tagResponseSchema>;
//# sourceMappingURL=tag.d.ts.map