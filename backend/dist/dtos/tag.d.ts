import { z } from 'zod';
export declare const createTagSchema: z.ZodObject<{
    userId: z.ZodString;
    name: z.ZodString;
    colorHex: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    name: string;
    colorHex?: string | undefined;
}, {
    userId: string;
    name: string;
    colorHex?: string | undefined;
}>;
export type CreateTagDTO = z.infer<typeof createTagSchema>;
export declare const tagResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    colorHex: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id: string;
    name: string;
    colorHex: string | null;
}, {
    userId: string;
    id: string;
    name: string;
    colorHex: string | null;
}>;
export type TagResponseDTO = z.infer<typeof tagResponseSchema>;
//# sourceMappingURL=tag.d.ts.map