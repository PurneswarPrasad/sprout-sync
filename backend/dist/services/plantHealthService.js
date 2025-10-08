"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantHealthService = exports.PlantHealthService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const plantImageValidator_1 = require("./plantImageValidator");
const imageUtils_1 = require("../utils/imageUtils");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env['GEMINI_API_KEY']);
const plantHealthSchema = {
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        botanicalName: {
            type: generative_ai_1.SchemaType.STRING,
            description: "Botanical (scientific) name of the plant",
        },
        commonName: {
            type: generative_ai_1.SchemaType.STRING,
            description: "Common name of the plant",
        },
        confidence: {
            type: generative_ai_1.SchemaType.NUMBER,
            description: "Confidence score between 0.0 and 1.0",
        },
        disease: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                issue: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "Name of the detected issue, null if healthy",
                    nullable: true,
                },
                description: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "Short summary of the issue",
                    nullable: true,
                },
                affected: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "What kinds of plants are typically affected",
                    nullable: true,
                },
                steps: {
                    type: generative_ai_1.SchemaType.STRING,
                    description: "Actionable care/prevention steps",
                    nullable: true,
                },
                issueConfidence: {
                    type: generative_ai_1.SchemaType.NUMBER,
                    description: "Confidence for disease detection",
                    nullable: true,
                },
            },
            required: ["issue", "description", "affected", "steps", "issueConfidence"],
        },
    },
    required: ["botanicalName", "commonName", "confidence", "disease"],
};
class PlantHealthService {
    constructor() {
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            console.error('GEMINI_API_KEY environment variable is not set');
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    }
    async analyzePlantHealth(imageData) {
        try {
            console.log(`Starting AI plant health analysis. Input type: ${typeof imageData}`);
            if (typeof imageData === 'string') {
                console.log(`Processing string input. Is URL: ${imageData.startsWith('http')}`);
            }
            else {
                console.log(`Processing buffer input. Size: ${imageData.length} bytes`);
            }
            let imagePart;
            if (typeof imageData === 'string') {
                if (!imageData.startsWith('http')) {
                    throw new Error('Invalid URL format');
                }
                try {
                    const response = await fetch(imageData);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.startsWith('image/')) {
                        throw new Error('Invalid content type. URL must point to an image file.');
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const mimeType = (0, imageUtils_1.getMimeTypeFromBuffer)(buffer);
                    imagePart = {
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType: mimeType
                        }
                    };
                }
                catch (fetchError) {
                    console.error('Error fetching image from URL:', fetchError);
                    throw new Error(`Failed to fetch image from URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
                }
            }
            else {
                const mimeType = (0, imageUtils_1.getMimeTypeFromBuffer)(imageData);
                imagePart = {
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType: mimeType
                    }
                };
            }
            const isValidPlant = await (0, plantImageValidator_1.validatePlantImage)(this.model, imagePart);
            if (!isValidPlant) {
                console.log('Plant validation failed in analyzePlantHealth - throwing error');
                throw new Error('The uploaded image does not appear to contain a plant. Please upload an image of a plant, tree, flower, or other botanical subject.');
            }
            console.log('Plant validation passed, proceeding with health analysis...');
            const prompt = `You are a plant health assistant and diagnostic expert. Analyze the provided plant image to assess its health and identify any diseases, pests, or deficiencies. Return results strictly in JSON format.

Follow these steps precisely before outputting:
1. **Identify Plant:** First, determine the botanical name of the plant based on visible characteristics (leaf shape, color, texture, overall form). If uncertain, use "Unknown Plant".
2. **Assess Health:** Carefully examine the plant for signs of disease, pest damage, nutrient deficiencies, or environmental stress. Look for:
   - Discoloration (yellowing, browning, spots, lesions)
   - Physical damage (holes, wilting, curling, deformities)
   - Visible pests or pest evidence (webbing, egg clusters)
   - Growth abnormalities (stunted growth, leggy stems)
3. **Diagnose Issue:** If problems are detected:
   - Identify the specific issue (e.g., "Powdery mildew", "Spider mite infestation", "Nitrogen deficiency")
   - Provide a brief description of the problem
   - Note which plants are typically affected
   - Give actionable treatment/prevention steps
   - Rate your confidence in the diagnosis (0.0-1.0)
4. **Healthy Plant:** If the plant appears healthy with no visible issues:
   - Set all disease fields to null
   - Confirm health in your assessment
5. **Final Output:** Return ONLY the raw JSON object. No additional text.

The JSON schema must look like this:

{
  "botanicalName": string,            // Botanical (scientific) name of the plant. Use "Unknown Plant" if unidentifiable.
  "commonName": string,               // Common name of the plant (or empty string if unknown)
  "confidence": number,               // 0–1, model confidence in plant identification
  "disease": {
    "issue": string | null,           // Name of the detected issue (e.g., "Powdery mildew") or null if healthy
    "description": string | null,     // Short summary of the issue (max 100 words) or null if healthy
    "affected": string | null,        // What kinds of plants are typically affected or null if healthy
    "steps": string | null,           // Actionable care/prevention steps (bullet-point style in single string) or null if healthy
    "issueConfidence": number | null  // 0–1 confidence for disease detection, null if healthy
  }
}

Rules:
- Base your diagnosis on visual evidence only; do not speculate beyond what is visible
- If the plant looks healthy, set ALL disease fields ("issue", "description", "affected", "steps", "issueConfidence") to null
- Keep text concise, user-friendly, and actionable
- Do not invent diseases; respond with null values if unsure or no issues are visible
- For issueConfidence, use 0.8+ only if clear diagnostic signs are present
- Include specific treatment recommendations (e.g., "Apply neem oil spray weekly", "Increase watering frequency")`;
            console.log('Sending request to Gemini AI with structured output...');
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: plantHealthSchema,
                },
            });
            const response = await result.response;
            const text = response.text();
            console.log('Raw AI response:', text);
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(text);
            }
            catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw response:', text);
                throw new Error('Failed to parse AI response as JSON');
            }
            console.log('Parsed AI response:', parsedResponse);
            return this.sanitizeHealthAnalysisResponse(parsedResponse);
        }
        catch (error) {
            console.error('AI plant health analysis error:', error);
            throw error;
        }
    }
    sanitizeHealthAnalysisResponse(response) {
        const sanitized = {
            botanicalName: response.botanicalName || 'Unknown Plant',
            commonName: response.commonName || '',
            confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
            disease: {
                issue: response.disease?.issue || null,
                description: response.disease?.description || null,
                affected: response.disease?.affected || null,
                steps: response.disease?.steps || null,
                issueConfidence: response.disease?.issueConfidence ? Math.min(Math.max(response.disease.issueConfidence, 0), 1) : null
            }
        };
        return sanitized;
    }
}
exports.PlantHealthService = PlantHealthService;
exports.plantHealthService = new PlantHealthService();
//# sourceMappingURL=plantHealthService.js.map