import { z } from 'zod';
export declare const createPlantTaskSchema: z.ZodObject<{
    plantId: z.ZodString;
    taskKey: z.ZodString;
    frequencyDays: z.ZodNumber;
    nextDueOn: z.ZodString;
}, "strip", z.ZodTypeAny, {
    plantId: string;
    taskKey: string;
    frequencyDays: number;
    nextDueOn: string;
}, {
    plantId: string;
    taskKey: string;
    frequencyDays: number;
    nextDueOn: string;
}>;
export type CreatePlantTaskDTO = z.infer<typeof createPlantTaskSchema>;
export declare const updatePlantTaskSchema: z.ZodObject<{
    frequencyDays: z.ZodOptional<z.ZodNumber>;
    nextDueOn: z.ZodOptional<z.ZodString>;
    lastCompletedOn: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    frequencyDays?: number | undefined;
    nextDueOn?: string | undefined;
    lastCompletedOn?: string | undefined;
    active?: boolean | undefined;
}, {
    frequencyDays?: number | undefined;
    nextDueOn?: string | undefined;
    lastCompletedOn?: string | undefined;
    active?: boolean | undefined;
}>;
export type UpdatePlantTaskDTO = z.infer<typeof updatePlantTaskSchema>;
export declare const plantTaskResponseSchema: z.ZodObject<{
    id: z.ZodString;
    plantId: z.ZodString;
    taskKey: z.ZodString;
    frequencyDays: z.ZodNumber;
    nextDueOn: z.ZodDate;
    lastCompletedOn: z.ZodNullable<z.ZodDate>;
    active: z.ZodBoolean;
    plant: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: string | null;
    }, {
        id: string;
        name: string;
        type: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    plantId: string;
    taskKey: string;
    frequencyDays: number;
    nextDueOn: Date;
    lastCompletedOn: Date | null;
    active: boolean;
    plant?: {
        id: string;
        name: string;
        type: string | null;
    } | undefined;
}, {
    id: string;
    plantId: string;
    taskKey: string;
    frequencyDays: number;
    nextDueOn: Date;
    lastCompletedOn: Date | null;
    active: boolean;
    plant?: {
        id: string;
        name: string;
        type: string | null;
    } | undefined;
}>;
export type PlantTaskResponseDTO = z.infer<typeof plantTaskResponseSchema>;
//# sourceMappingURL=plantTask.d.ts.map