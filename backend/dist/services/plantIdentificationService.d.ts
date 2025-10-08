export interface AIPlantIdentification {
    botanicalName: string;
    commonName: string;
    plantType: string;
    confidence: number;
    careLevel: 'Easy' | 'Moderate' | 'Difficult';
    sunRequirements: 'No sun' | 'Part to Full' | 'Full sun';
    toxicityLevel: 'Low' | 'Medium' | 'High';
    petFriendliness: {
        isFriendly: boolean;
        reason: string;
    };
    commonPestsAndDiseases: string;
    preventiveMeasures: string;
    care: {
        watering: string;
        fertilizing: string;
        pruning: string;
        spraying: string;
        sunlightRotation: string;
    };
    suggestedTasks: Array<{
        name: string;
        frequencyDays: number;
    }>;
}
export declare class PlantIdentificationService {
    private model;
    constructor();
    identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification>;
    private sanitizeAIResponse;
}
export declare const plantIdentificationService: PlantIdentificationService;
//# sourceMappingURL=plantIdentificationService.d.ts.map