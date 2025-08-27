import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env['GOOGLE_CLOUD_VISION_API_KEY']!);

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

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  async identifyPlantFromImage(imageData: Buffer | string): Promise<AIPlantIdentification> {
    try {
             const prompt = `
You are a plant identification expert. Analyze the provided image and return a JSON response with the following structure:

{
  "speciesGuess": "Scientific name or common name of the plant",
  "plantType": "Category of the plant",
  "confidence": 0.92,
  "care": {
    "watering": "Detailed watering instructions",
    "fertilizing": "Detailed fertilizing instructions", 
    "pruning": "Detailed pruning instructions",
    "spraying": "Detailed spraying/misting instructions",
    "sunlightRotation": "Detailed sunlight and rotation instructions"
  },
  "suggestedTasks": [
    { "name": "watering", "frequencyDays": 3 },
    { "name": "fertilizing", "frequencyDays": 14 },
    { "name": "pruning", "frequencyDays": 30 },
    { "name": "spraying", "frequencyDays": 7 },
    { "name": "sunlightRotation", "frequencyDays": 14 }
  ]
}

Important guidelines:
- Return ONLY valid JSON, no additional text
- Use realistic confidence scores (0.7-0.95)
- Provide specific, actionable care instructions
- Use reasonable frequency days for tasks
- If you can't identify the plant clearly, use "Unknown Plant" as speciesGuess with lower confidence
- Ensure all task names match exactly: watering, fertilizing, pruning, spraying, sunlightRotation
`;

      let imagePart: any;
      
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
          // It's a URL - fetch the image
          const imageBuffer = await this.fetchImageFromUrl(imageData);
          imagePart = {
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: this.getMimeTypeFromUrl(imageData)
            }
          };
        } else {
          // It's Base64 data (with or without data URL prefix)
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
        imagePart = {
          inlineData: {
            data: imageData.toString('base64'),
            mimeType: 'image/jpeg'
          }
        };
      }

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse: AIPlantIdentification = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return this.sanitizeAIResponse(aiResponse);
    } catch (error) {
      console.error('AI identification error:', error);
      throw new Error('Failed to identify plant. Please try again.');
    }
  }

  private async fetchImageFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      throw new Error('Failed to fetch image from URL');
    }
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = url.toLowerCase().split('.').pop()?.split('?')[0]; // Handle query params
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }

  private sanitizeAIResponse(response: any): AIPlantIdentification {
    // Ensure all required fields exist
    const sanitized: AIPlantIdentification = {
      speciesGuess: response.speciesGuess || 'Unknown Plant',
      plantType: response.plantType || 'Unknown Type',
      confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
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

export const aiService = new AIService();