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
    constructor();
    identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification>;
    private fetchImageFromUrl;
    private attemptImageFetch;
    private isImageBuffer;
    private extractImageFromHtml;
    private resolveUrl;
    private extractImageUrlFromSearchEngine;
    private isDirectImageUrl;
    private getMimeTypeFromUrl;
    private sanitizeAIResponse;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map