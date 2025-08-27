import { z } from 'zod';
export declare const presetEnum: z.ZodEnum<["STRESSED", "NEEDS_PRUNING", "FERTILIZER_DUE", "PEST_ISSUE"]>;
export declare const createNoteSchema: z.ZodObject<{
    plantId: z.ZodString;
    taskKey: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    preset: z.ZodOptional<z.ZodEnum<["STRESSED", "NEEDS_PRUNING", "FERTILIZER_DUE", "PEST_ISSUE"]>>;
}, "strip", z.ZodTypeAny, {
    plantId: string;
    body: string;
    taskKey?: string | undefined;
    preset?: "STRESSED" | "NEEDS_PRUNING" | "FERTILIZER_DUE" | "PEST_ISSUE" | undefined;
}, {
    plantId: string;
    body: string;
    taskKey?: string | undefined;
    preset?: "STRESSED" | "NEEDS_PRUNING" | "FERTILIZER_DUE" | "PEST_ISSUE" | undefined;
}>;
export type CreateNoteDTO = z.infer<typeof createNoteSchema>;
export declare const noteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    plantId: z.ZodString;
    taskKey: z.ZodNullable<z.ZodString>;
    body: z.ZodString;
    preset: z.ZodNullable<z.ZodEnum<["STRESSED", "NEEDS_PRUNING", "FERTILIZER_DUE", "PEST_ISSUE"]>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    plantId: string;
    taskKey: string | null;
    body: string;
    preset: "STRESSED" | "NEEDS_PRUNING" | "FERTILIZER_DUE" | "PEST_ISSUE" | null;
}, {
    id: string;
    createdAt: Date;
    plantId: string;
    taskKey: string | null;
    body: string;
    preset: "STRESSED" | "NEEDS_PRUNING" | "FERTILIZER_DUE" | "PEST_ISSUE" | null;
}>;
export type NoteResponseDTO = z.infer<typeof noteResponseSchema>;
//# sourceMappingURL=note.d.ts.map