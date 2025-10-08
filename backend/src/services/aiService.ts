import { 
  PlantIdentificationService, 
  AIPlantIdentification as PlantIdentificationType,
  plantIdentificationService 
} from './plantIdentificationService';
import { 
  PlantHealthService, 
  AIPlantHealthAnalysis as PlantHealthType,
  plantHealthService 
} from './plantHealthService';

// Re-export types for backward compatibility
export type AIPlantIdentification = PlantIdentificationType;
export type AIPlantHealthAnalysis = PlantHealthType;

// Main AIService class that delegates to specialized services
export class AIService {
  private identificationService: PlantIdentificationService;
  private healthService: PlantHealthService;

  constructor() {
    this.identificationService = new PlantIdentificationService();
    this.healthService = new PlantHealthService();
  }

  async identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification> {
    return this.identificationService.identifyPlantFromImage(imageData);
  }

  async analyzePlantHealth(imageData: Buffer | string): Promise<AIPlantHealthAnalysis> {
    return this.healthService.analyzePlantHealth(imageData);
  }
}

export const aiService = new AIService();