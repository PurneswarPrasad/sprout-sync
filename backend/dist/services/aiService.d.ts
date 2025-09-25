export interface AIPlantIdentification {
    botanicalName: string;
    commonName: string;
    plantType: string;
    confidence: number;
    careLevel: 'Easy' | 'Moderate' | 'Difficult';
    sunRequirements: 'No sun' | 'Part to Full' | 'Full sun';
    toxicityLevel: 'Low' | 'Medium' | 'High';
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
export interface AIPlantHealthAnalysis {
    botanicalName: string;
    commonName: string;
    confidence: number;
    disease: {
        issue: string | null;
        description: string | null;
        affected: string | null;
        steps: string | null;
        issueConfidence: number | null;
    };
}
export declare class AIService {
    private model;
    constructor();
    private validatePlantImage;
    identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification>;
    private fetchImageFromUrl;
    private attemptImageFetch;
    private isImageBuffer;
    private extractImageFromHtml;
    private resolveUrl;
    private extractImageUrlFromSearchEngine;
    private isDirectImageUrl;
    private getMimeTypeFromUrl;
    private getMimeTypeFromBuffer;
    private sanitizeAIResponse;
    analyzePlantHealth(imageData: Buffer | string): Promise<AIPlantHealthAnalysis>;
    private sanitizeHealthAnalysisResponse;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map