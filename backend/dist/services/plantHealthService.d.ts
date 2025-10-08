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
export declare class PlantHealthService {
    private model;
    constructor();
    analyzePlantHealth(imageData: Buffer | string): Promise<AIPlantHealthAnalysis>;
    private sanitizeHealthAnalysisResponse;
}
export declare const plantHealthService: PlantHealthService;
//# sourceMappingURL=plantHealthService.d.ts.map