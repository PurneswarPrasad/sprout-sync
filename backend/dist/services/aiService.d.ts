import { AIPlantIdentification as PlantIdentificationType } from './plantIdentificationService';
import { AIPlantHealthAnalysis as PlantHealthType } from './plantHealthService';
export type AIPlantIdentification = PlantIdentificationType;
export type AIPlantHealthAnalysis = PlantHealthType;
export declare class AIService {
    private identificationService;
    private healthService;
    constructor();
    identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification>;
    analyzePlantHealth(imageData: Buffer | string): Promise<AIPlantHealthAnalysis>;
}
export declare const aiService: AIService;
//# sourceMappingURL=aiService.d.ts.map