import { z } from 'zod';
export declare const createPlantSchema: z.ZodObject<{
    petName: z.ZodOptional<z.ZodString>;
    botanicalName: z.ZodString;
    commonName: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    acquisitionDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    city: z.ZodOptional<z.ZodString>;
    careLevel: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["Easy", "Moderate", "Difficult"]>, z.ZodObject<{
        level: z.ZodEnum<["Easy", "Moderate", "Difficult"]>;
        description: z.ZodString;
        maintenanceTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }>]>>;
    sunRequirements: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["No sun", "Part to Full", "Full sun"]>, z.ZodObject<{
        level: z.ZodEnum<["No sun", "Part to Full", "Full sun"]>;
        description: z.ZodString;
        placementTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }>]>>;
    toxicityLevel: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["Low", "Medium", "High"]>, z.ZodObject<{
        level: z.ZodEnum<["Low", "Medium", "High"]>;
        description: z.ZodString;
        safetyTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }>]>>;
    petFriendliness: z.ZodOptional<z.ZodObject<{
        isFriendly: z.ZodBoolean;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        isFriendly: boolean;
        reason: string;
    }, {
        isFriendly: boolean;
        reason: string;
    }>>;
    commonPestsAndDiseases: z.ZodOptional<z.ZodString>;
    preventiveMeasures: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    botanicalName: string;
    commonName: string;
    type?: string | undefined;
    petName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
    careLevel?: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | undefined;
    sunRequirements?: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | undefined;
    toxicityLevel?: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | undefined;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | undefined;
    commonPestsAndDiseases?: string | undefined;
    preventiveMeasures?: string | undefined;
}, {
    botanicalName: string;
    commonName: string;
    type?: string | undefined;
    petName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
    careLevel?: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | undefined;
    sunRequirements?: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | undefined;
    toxicityLevel?: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | undefined;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | undefined;
    commonPestsAndDiseases?: string | undefined;
    preventiveMeasures?: string | undefined;
}>;
export type CreatePlantDTO = z.infer<typeof createPlantSchema>;
export declare const updatePlantSchema: z.ZodObject<{
    petName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    botanicalName: z.ZodOptional<z.ZodString>;
    commonName: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    acquisitionDate: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    careLevel: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodEnum<["Easy", "Moderate", "Difficult"]>, z.ZodObject<{
        level: z.ZodEnum<["Easy", "Moderate", "Difficult"]>;
        description: z.ZodString;
        maintenanceTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }>]>>>;
    sunRequirements: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodEnum<["No sun", "Part to Full", "Full sun"]>, z.ZodObject<{
        level: z.ZodEnum<["No sun", "Part to Full", "Full sun"]>;
        description: z.ZodString;
        placementTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }>]>>>;
    toxicityLevel: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodEnum<["Low", "Medium", "High"]>, z.ZodObject<{
        level: z.ZodEnum<["Low", "Medium", "High"]>;
        description: z.ZodString;
        safetyTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }>]>>>;
    petFriendliness: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        isFriendly: z.ZodBoolean;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        isFriendly: boolean;
        reason: string;
    }, {
        isFriendly: boolean;
        reason: string;
    }>>>;
    commonPestsAndDiseases: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    preventiveMeasures: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    petName?: string | undefined;
    botanicalName?: string | undefined;
    commonName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
    careLevel?: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | undefined;
    sunRequirements?: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | undefined;
    toxicityLevel?: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | undefined;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | undefined;
    commonPestsAndDiseases?: string | undefined;
    preventiveMeasures?: string | undefined;
}, {
    type?: string | undefined;
    petName?: string | undefined;
    botanicalName?: string | undefined;
    commonName?: string | undefined;
    acquisitionDate?: string | undefined;
    city?: string | undefined;
    careLevel?: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | undefined;
    sunRequirements?: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | undefined;
    toxicityLevel?: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | undefined;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | undefined;
    commonPestsAndDiseases?: string | undefined;
    preventiveMeasures?: string | undefined;
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
    careLevel: z.ZodNullable<z.ZodUnion<[z.ZodEnum<["Easy", "Moderate", "Difficult"]>, z.ZodObject<{
        level: z.ZodEnum<["Easy", "Moderate", "Difficult"]>;
        description: z.ZodString;
        maintenanceTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }, {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    }>]>>;
    sunRequirements: z.ZodNullable<z.ZodUnion<[z.ZodEnum<["No sun", "Part to Full", "Full sun"]>, z.ZodObject<{
        level: z.ZodEnum<["No sun", "Part to Full", "Full sun"]>;
        description: z.ZodString;
        placementTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }, {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    }>]>>;
    toxicityLevel: z.ZodNullable<z.ZodUnion<[z.ZodEnum<["Low", "Medium", "High"]>, z.ZodObject<{
        level: z.ZodEnum<["Low", "Medium", "High"]>;
        description: z.ZodString;
        safetyTips: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }, {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    }>]>>;
    petFriendliness: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        isFriendly: z.ZodBoolean;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        isFriendly: boolean;
        reason: string;
    }, {
        isFriendly: boolean;
        reason: string;
    }>>>;
    commonPestsAndDiseases: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    preventiveMeasures: z.ZodOptional<z.ZodNullable<z.ZodString>>;
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
    userId: string;
    id: string;
    createdAt: Date;
    type: string | null;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    acquisitionDate: Date | null;
    city: string | null;
    careLevel: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | null;
    sunRequirements: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | null;
    toxicityLevel: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | null;
    updatedAt: Date;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | null | undefined;
    commonPestsAndDiseases?: string | null | undefined;
    preventiveMeasures?: string | null | undefined;
    _count?: {
        notes: number;
        photos: number;
    } | undefined;
}, {
    userId: string;
    id: string;
    createdAt: Date;
    type: string | null;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    acquisitionDate: Date | null;
    city: string | null;
    careLevel: "Easy" | "Moderate" | "Difficult" | {
        level: "Easy" | "Moderate" | "Difficult";
        description: string;
        maintenanceTips: string;
    } | null;
    sunRequirements: "No sun" | "Part to Full" | "Full sun" | {
        level: "No sun" | "Part to Full" | "Full sun";
        description: string;
        placementTips: string;
    } | null;
    toxicityLevel: "Low" | "Medium" | "High" | {
        level: "Low" | "Medium" | "High";
        description: string;
        safetyTips: string;
    } | null;
    updatedAt: Date;
    petFriendliness?: {
        isFriendly: boolean;
        reason: string;
    } | null | undefined;
    commonPestsAndDiseases?: string | null | undefined;
    preventiveMeasures?: string | null | undefined;
    _count?: {
        notes: number;
        photos: number;
    } | undefined;
}>;
export type PlantResponseDTO = z.infer<typeof plantResponseSchema>;
//# sourceMappingURL=plant.d.ts.map