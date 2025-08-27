import { z } from 'zod';
export declare const taskKeyEnum: z.ZodEnum<["watering", "fertilizing", "spraying", "pruning", "sunRotation"]>;
export declare const createTaskTemplateSchema: z.ZodObject<{
    key: z.ZodEnum<["watering", "fertilizing", "spraying", "pruning", "sunRotation"]>;
    label: z.ZodString;
    colorHex: z.ZodOptional<z.ZodString>;
    defaultFrequencyDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    key: "watering" | "fertilizing" | "spraying" | "pruning" | "sunRotation";
    label: string;
    defaultFrequencyDays: number;
    colorHex?: string | undefined;
}, {
    key: "watering" | "fertilizing" | "spraying" | "pruning" | "sunRotation";
    label: string;
    defaultFrequencyDays: number;
    colorHex?: string | undefined;
}>;
export type CreateTaskTemplateDTO = z.infer<typeof createTaskTemplateSchema>;
export declare const taskTemplateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodEnum<["watering", "fertilizing", "spraying", "pruning", "sunRotation"]>;
    label: z.ZodString;
    colorHex: z.ZodString;
    defaultFrequencyDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    key: "watering" | "fertilizing" | "spraying" | "pruning" | "sunRotation";
    label: string;
    colorHex: string;
    defaultFrequencyDays: number;
}, {
    id: string;
    key: "watering" | "fertilizing" | "spraying" | "pruning" | "sunRotation";
    label: string;
    colorHex: string;
    defaultFrequencyDays: number;
}>;
export type TaskTemplateResponseDTO = z.infer<typeof taskTemplateResponseSchema>;
//# sourceMappingURL=taskTemplate.d.ts.map