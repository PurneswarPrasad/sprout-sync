import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { validatePlantImage } from './plantImageValidator';
import { fetchImageFromUrl, getMimeTypeFromUrl } from '../utils/imageUtils';

const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);

// Define the schema for structured output
const plantIdentificationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    botanicalName: {
      type: SchemaType.STRING,
      description: "Botanical (scientific) name of the plant",
    },
    commonName: {
      type: SchemaType.STRING,
      description: "Common name of the plant",
    },
    plantType: {
      type: SchemaType.STRING,
      description: "General category of the plant",
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "Confidence score between 0.0 and 1.0",
    },
    careLevel: {
      type: SchemaType.OBJECT,
      description: "Care difficulty level with detailed description",
      properties: {
        level: {
          type: SchemaType.STRING,
          description: "Care difficulty level",
          enum: ["Easy", "Moderate", "Difficult"],
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed description of care requirements and maintenance needs",
        },
        maintenanceTips: {
          type: SchemaType.STRING,
          description: "Specific maintenance tips for this care level",
        }
      },
      required: ["level", "description", "maintenanceTips"],
    },
    sunRequirements: {
      type: SchemaType.OBJECT,
      description: "Sunlight requirements with detailed lighting information",
      properties: {
        level: {
          type: SchemaType.STRING,
          description: "Sunlight requirements",
          enum: ["No sun", "Part to Full", "Full sun"],
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed description of light exposure needs and preferences",
        },
        placementTips: {
          type: SchemaType.STRING,
          description: "Specific placement tips for optimal light conditions",
        }
      },
      required: ["level", "description", "placementTips"],
    },
    toxicityLevel: {
      type: SchemaType.OBJECT,
      description: "Toxicity level with detailed safety information",
      properties: {
        level: {
          type: SchemaType.STRING,
          description: "Toxicity level",
          enum: ["Low", "Medium", "High"],
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed description of toxicity risks and effects",
        },
        safetyTips: {
          type: SchemaType.STRING,
          description: "Specific safety tips and precautions for handling",
        }
      },
      required: ["level", "description", "safetyTips"],
    },
    petFriendliness: {
      type: SchemaType.OBJECT,
      properties: {
        isFriendly: {
          type: SchemaType.BOOLEAN,
          description: "Whether the plant is pet-friendly",
        },
        reason: {
          type: SchemaType.STRING,
          description: "Explanation for pet friendliness",
        },
      },
      required: ["isFriendly", "reason"],
    },
    commonPestsAndDiseases: {
      type: SchemaType.STRING,
      description: "Comma-separated list of common issues",
    },
    preventiveMeasures: {
      type: SchemaType.STRING,
      description: "Actionable advice to prevent common issues",
    },
    care: {
      type: SchemaType.OBJECT,
      properties: {
        watering: {
          type: SchemaType.STRING,
          description: "Watering instructions",
        },
        fertilizing: {
          type: SchemaType.STRING,
          description: "Fertilizing instructions",
        },
        pruning: {
          type: SchemaType.STRING,
          description: "Pruning instructions",
        },
        spraying: {
          type: SchemaType.STRING,
          description: "Spraying/misting instructions",
        },
        sunlightRotation: {
          type: SchemaType.STRING,
          description: "Light exposure and rotation instructions",
        },
      },
      required: ["watering", "fertilizing", "pruning", "spraying", "sunlightRotation"],
    },
    suggestedTasks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Task name",
            enum: ["watering", "fertilizing", "pruning", "spraying", "sunlightRotation"],
          },
          frequencyDays: {
            type: SchemaType.NUMBER,
            description: "Frequency in days",
          },
        },
        required: ["name", "frequencyDays"],
      },
    },
  },
  required: [
    "botanicalName",
    "commonName",
    "plantType",
    "confidence",
    "careLevel",
    "sunRequirements",
    "toxicityLevel",
    "petFriendliness",
    "commonPestsAndDiseases",
    "preventiveMeasures",
    "care",
    "suggestedTasks",
  ],
};

export interface AIPlantIdentification {
  botanicalName: string;
  commonName: string;
  plantType: string;
  confidence: number;
  careLevel: {
    level: 'Easy' | 'Moderate' | 'Difficult';
    description: string;
    maintenanceTips: string;
  };
  sunRequirements: {
    level: 'No sun' | 'Part to Full' | 'Full sun';
    description: string;
    placementTips: string;
  };
  toxicityLevel: {
    level: 'Low' | 'Medium' | 'High';
    description: string;
    safetyTips: string;
  };
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

export class PlantIdentificationService {
  private model: any;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  }

  async identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification> {
    try {
      console.log(`Starting AI plant identification. Input type: ${typeof imageData}`);
      
      if (typeof imageData === 'string') {
        console.log(`Processing string input. Is URL: ${imageData.startsWith('http')}`);
      } else {
        console.log(`Processing buffer input. Size: ${imageData.length} bytes`);
      }
      const prompt = `
      You are a world-class Botanist and AI assistant, an expert in plant identification and horticulture. Your primary function is to analyze an image of a single, distinct plant and return a comprehensive data profile in a strict JSON format. Adhere to the schema and guidelines precisely. You must base your identification on visual characteristics such as leaf shape, stem structure, color variations, texture, and any visible flowers, fruits, or unique features. If the image shows multiple plants, ambiguity, or non-plant elements, do not proceed with identification—set botanicalName to "Unknown Plant" and confidence to 0.0.

      Follow these steps precisely before outputting:
      1. **Analyze Image:** In one sentence, describe the main visual features of the plant (e.g., leaf shape, color, texture, overall form). Confirm it is a single, real plant with natural variations; reject if artificial, multiple plants, or ambiguous.
      2. **Identify Plant:** Based on analysis, determine the botanical name. Cross-reference with known botanical characteristics. If uncertain, use "Unknown Plant".
      3. **Gather Details:** For each field, use accurate, evidence-based information. If needed, recall or infer from standard botanical knowledge (e.g., toxicity from ASPCA databases, care from horticultural standards). Ensure all details are practical and specific.
      4. **Apply Rules:** 
         - **FAIL Identification** if image quality is poor, plant is not central/primary, or features don't match any known plant—set botanicalName to "Unknown Plant" and low confidence.
         - **PASS** only if confident in a single plant match.
         - Ensure care instructions are tailored to the identified plant; do not generalize.
         - suggestedTasks frequencies must be realistic integers based on standard care (e.g., watering every 7 days, not arbitrary).
      5. **Final Output:** Return ONLY the raw JSON object matching the schema exactly. No additional text.

      You must return a single JSON object with this exact structure:
      
      {
        "botanicalName": "Botanical (scientific) name of the plant. REQUIRED. Use 'Unknown Plant' if unidentifiable.",
        "commonName": "Common name of the plant. Can be an empty string if unknown.",
        "plantType": "General category of the plant (e.g., 'Tropical Foliage', 'Succulent', 'Flowering Houseplant'). Must not be empty.",
        "confidence": 0.95, // Number between 0.0 and 1.0; lower if features are ambiguous or image is unclear.
        "careLevel": {
          "level": "'Easy' | 'Moderate' | 'Difficult'",
          "description": "Detailed description of care requirements and maintenance needs for this plant",
          "maintenanceTips": "Specific maintenance tips for this care level"
        },
        "sunRequirements": {
          "level": "'No sun' | 'Part to Full' | 'Full sun'",
          "description": "Detailed description of light exposure needs and preferences",
          "placementTips": "Specific placement tips for optimal light conditions"
        },
        "toxicityLevel": {
          "level": "'Low' | 'Medium' | 'High'",
          "description": "Detailed description of toxicity risks and effects",
          "safetyTips": "Specific safety tips and precautions for handling"
        },
        "petFriendliness": {
          "isFriendly": boolean, // True only if non-toxic to cats/dogs.
          "reason": "Briefly explain why (e.g., 'Non-toxic to cats and dogs' or 'Contains calcium oxalate crystals, toxic if ingested'). Max 50 words."
        },
        "commonPestsAndDiseases": "A comma-separated string of common issues (e.g., 'Spider mites, Aphids, Root rot'). No more than 5 items.",
        "preventiveMeasures": "Actionable advice to prevent the common issues listed above. Concise, bullet-point style in a single string.",
        "care": {
          "watering": "Detailed, specific watering instructions. Include frequency, soil moisture checks, and signs of over/under watering. Max 100 words.",
          "fertilizing": "Detailed, specific fertilizing instructions. Include type (e.g., balanced NPK), frequency, and seasonal notes. Max 100 words.",
          "pruning": "Detailed, specific pruning instructions. Include when, how, and tools. Max 100 words.",
          "spraying": "Detailed, specific spraying/misting instructions for humidity or pest control. Include frequency and solutions. Max 100 words.",
          "sunlightRotation": "Detailed instructions on light exposure and plant rotation to prevent legginess. Max 100 words."
        },
        "suggestedTasks": [
          { "name": "watering", "frequencyDays": 3 }, // Integer >0; realistic for plant.
          { "name": "fertilizing", "frequencyDays": 14 },
          { "name": "pruning", "frequencyDays": 30 },
          { "name": "spraying", "frequencyDays": 7 },
          { "name": "sunlightRotation", "frequencyDays": 14 }
        ] // Exactly these 5 tasks; no additions/removals.
      }
      
      ## Detailed Field Guidelines
      
      ### 1. Identification & Confidence
      - **botanicalName**: This field is REQUIRED. If you cannot identify with at least 0.5 confidence, you MUST return "Unknown Plant". Use genus and species (e.g., "Monstera deliciosa").
      - **commonName**: Provide the most common name. If unknown or no common name, return an empty string \`""\`.
      - **confidence**: Use a realistic score from 0.0 to 1.0. Lower the score significantly if identification is uncertain, image is blurry, or features are partial. 1.0 only for perfect matches.
      
      ### 2. Classification
      - **careLevel**, **sunRequirements**, **toxicityLevel**: You MUST use one of the exact string values specified in the schema. Base on standard horticultural data.
      - **petFriendliness**: Base your \`isFriendly\` decision on the plant's known toxicity to common pets like cats and dogs (e.g., from ASPCA lists). The \`reason\` should be concise and factual.
      - **health**: Provide a concise list for \`commonPestsAndDiseases\` (max 5) and actionable, clear \`preventiveMeasures\` (e.g., "Inspect leaves weekly, use neem oil for pests").
      
      ### 3. Care & Tasks
      - **care**: All instructions must be practical, specific to the plant, and easy for a plant owner to follow. Avoid vagueness; include quantifiable advice (e.g., "Water when top 2 inches of soil are dry").
      - **suggestedTasks**: The \`name\` field for each task MUST be one of the following: \`watering\`, \`fertilizing\`, \`pruning\`, \`spraying\`, \`sunlightRotation\`. The \`frequencyDays\` must be a reasonable integer based on the plant's needs (e.g., succulents water every 14 days).
      
      ## Final Output Constraint
      **CRITICAL:** Your entire response must be ONLY the raw JSON object. Do not wrap it in markdown backticks (\\\`\\\`\\\`json), and do not include any text before or after the JSON. Invalid output will be rejected.
      `;

      let imagePart: any;
      
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
          // It's a URL - fetch the image
          console.log('Processing URL input...');
          const imageBuffer = await fetchImageFromUrl(imageData);
          const mimeType = getMimeTypeFromUrl(imageData);
          console.log(`Preparing image part with MIME type: ${mimeType}`);
          
          imagePart = {
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: mimeType
            }
          };
        } else {
          // It's Base64 data (with or without data URL prefix)
          console.log('Processing Base64 input...');
          const base64Data = imageData.startsWith('data:') 
            ? imageData.split(',')[1] 
            : imageData;

          imagePart = {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          };
        }
      } else {
        // Buffer provided
        console.log('Processing Buffer input...');
        imagePart = {
          inlineData: {
            data: imageData.toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      }

      // GUARDRAIL: Validate that the image contains a plant before processing
      const isValidPlant = await validatePlantImage(this.model, imagePart);
      if (!isValidPlant) {
        console.log('Plant validation failed in identifyPlantFromImage - throwing error');
        throw new Error('The uploaded image does not appear to contain a plant. Please upload an image of a plant, tree, flower, or other botanical subject.');
      }

      console.log('Plant validation passed, proceeding with identification...');

      console.log('Sending request to Gemini AI with structured output...');
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: plantIdentificationSchema,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      
      console.log('Received AI response:', text.substring(0, 200) + '...');
      
      // Parse the structured JSON response
      let aiResponse: AIPlantIdentification;
      try {
        aiResponse = JSON.parse(text);
        console.log('Successfully parsed AI response JSON');
      } catch (parseError) {
        console.error('Failed to parse AI response JSON:', parseError);
        console.error('Response text:', text);
        throw new Error('Invalid JSON format in AI response');
      }
      
      // Validate and sanitize the response
      const sanitizedResponse = this.sanitizeAIResponse(aiResponse);
      console.log('AI identification completed successfully');
      return sanitizedResponse;
    } catch (error) {
      console.error('AI identification error:', error);
      // Re-throw the original error to preserve specific error messages (like plant validation)
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to identify plant. Please try again.');
      }
    }
  }

  private sanitizeAIResponse(response: any): AIPlantIdentification {
    // Ensure all required fields exist
    const sanitized: AIPlantIdentification = {
      botanicalName: response.botanicalName || 'Unknown Plant',
      commonName: response.commonName || '',
      plantType: response.plantType || 'Unknown Type',
      confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
      careLevel: response.careLevel || {
        level: 'Moderate',
        description: 'Standard houseplant care requirements',
        maintenanceTips: 'Regular watering and occasional fertilizing'
      },
      sunRequirements: response.sunRequirements || {
        level: 'Part to Full',
        description: 'Moderate light conditions',
        placementTips: 'Place near east or west facing windows'
      },
      toxicityLevel: response.toxicityLevel || {
        level: 'Low',
        description: 'Generally safe for households',
        safetyTips: 'Safe for most environments'
      },
      petFriendliness: response.petFriendliness || {
        isFriendly: true,
        reason: 'Plant safety information not available'
      },
      commonPestsAndDiseases: response.commonPestsAndDiseases || 'Common plant issues information not available',
      preventiveMeasures: response.preventiveMeasures || 'General plant care recommendations not available',
      care: {
        watering: response.care?.watering || 'Water when soil is dry',
        fertilizing: response.care?.fertilizing || 'Fertilize monthly during growing season',
        pruning: response.care?.pruning || 'Prune as needed to maintain shape',
        spraying: response.care?.spraying || 'Mist leaves occasionally for humidity',
        sunlightRotation: response.care?.sunlightRotation || 'Rotate plant for even growth'
      },
      suggestedTasks: []
    };

    // Validate and sanitize suggested tasks
    const validTaskNames = ['watering', 'fertilizing', 'pruning', 'spraying', 'sunlightRotation'];
    const defaultFrequencies = {
      watering: 7,
      fertilizing: 30,
      pruning: 60,
      spraying: 14,
      sunlightRotation: 7
    };

    if (Array.isArray(response.suggestedTasks)) {
      response.suggestedTasks.forEach((task: any) => {
        if (validTaskNames.includes(task.name) && typeof task.frequencyDays === 'number') {
          sanitized.suggestedTasks.push({
            name: task.name,
            frequencyDays: Math.max(1, Math.min(task.frequencyDays, 365)) // Clamp between 1 and 365 days
          });
        }
      });
    }

    // Add default tasks if none provided
    if (sanitized.suggestedTasks.length === 0) {
      validTaskNames.forEach(taskName => {
        sanitized.suggestedTasks.push({
          name: taskName,
          frequencyDays: defaultFrequencies[taskName as keyof typeof defaultFrequencies]
        });
      });
    }

    return sanitized;
  }
}

export const plantIdentificationService = new PlantIdentificationService();

