export interface AIPlantIdentification {
    speciesGuess: string;
    plantType: string;
    confidence: number;
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
export declare class AIService {
    private model;
    identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification>;
    private fetchImageFromUrl;
    private getMimeTypeFromUrl;
    private sanitizeAIResponse;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map