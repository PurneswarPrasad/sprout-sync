"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const plantIdentificationService_1 = require("./plantIdentificationService");
const plantHealthService_1 = require("./plantHealthService");
class AIService {
    constructor() {
        this.identificationService = new plantIdentificationService_1.PlantIdentificationService();
        this.healthService = new plantHealthService_1.PlantHealthService();
    }
    async identifyPlantFromImage(imageData) {
        return this.identificationService.identifyPlantFromImage(imageData);
    }
    async analyzePlantHealth(imageData) {
        return this.healthService.analyzePlantHealth(imageData);
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=aiService.js.map