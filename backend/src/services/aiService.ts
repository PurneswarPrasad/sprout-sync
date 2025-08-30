import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);

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
  private model: any;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
          console.log('Processing URL input...');
          const imageBuffer = await this.fetchImageFromUrl(imageData);
          const mimeType = this.getMimeTypeFromUrl(imageData);
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

      console.log('Sending request to Gemini AI...');
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Received AI response:', text.substring(0, 200) + '...');
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response:', text);
        throw new Error('Invalid response format from AI - no JSON found');
      }

      let aiResponse: AIPlantIdentification;
      try {
        aiResponse = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed AI response JSON');
      } catch (parseError) {
        console.error('Failed to parse AI response JSON:', parseError);
        console.error('JSON string:', jsonMatch[0]);
        throw new Error('Invalid JSON format in AI response');
      }
      
      // Validate and sanitize the response
      const sanitizedResponse = this.sanitizeAIResponse(aiResponse);
      console.log('AI identification completed successfully');
      return sanitizedResponse;
    } catch (error) {
      console.error('AI identification error:', error);
      throw new Error('Failed to identify plant. Please try again.');
    }
  }

  private async fetchImageFromUrl(url: string): Promise<Buffer> {
    try {
      console.log(`Fetching image from URL: ${url}`);
      
      // Extract actual image URL from search engine URLs
      const actualImageUrl = this.extractImageUrlFromSearchEngine(url);
      console.log(`Extracted image URL: ${actualImageUrl}`);
      
      // Validate the extracted URL
      if (!actualImageUrl || actualImageUrl === url) {
        console.log('No valid image URL extracted, attempting to fetch original URL');
      }
      
      let response;
      let finalUrl = actualImageUrl;
      
      try {
        response = await fetch(finalUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        });
      } catch (fetchError) {
        console.log(`Failed to fetch from extracted URL, trying original URL: ${fetchError}`);
        // If extracted URL fails, try the original URL
        if (finalUrl !== url) {
          finalUrl = url;
          response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'image/*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
            },
          });
        } else {
          throw fetchError;
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}. Expected image/*. URL: ${finalUrl}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`Successfully fetched image: ${buffer.length} bytes, content-type: ${contentType} from URL: ${finalUrl}`);
      return buffer;
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch image from URL: ${error.message}`);
      }
      throw new Error('Failed to fetch image from URL: Unknown error');
    }
  }

  private extractImageUrlFromSearchEngine(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Handle Bing search URLs
      if (urlObj.hostname.includes('bing.com') && urlObj.searchParams.has('mediaurl')) {
        const mediaUrl = urlObj.searchParams.get('mediaurl');
        if (mediaUrl) {
          const decodedUrl = decodeURIComponent(mediaUrl);
          console.log(`Extracted Bing media URL: ${decodedUrl}`);
          return decodedUrl;
        }
      }
      
      // Handle Google search URLs
      if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/imgres')) {
        const imgUrl = urlObj.searchParams.get('imgurl');
        if (imgUrl) {
          console.log(`Extracted Google image URL: ${imgUrl}`);
          return imgUrl;
        }
      }
      
      // Handle other search engines or direct image URLs
      // If it's already a direct image URL, return as is
      if (this.isDirectImageUrl(url)) {
        return url;
      }
      
      console.log(`No image URL extraction needed, using original URL: ${url}`);
      return url;
    } catch (error) {
      console.error('Error extracting image URL:', error);
      return url; // Fallback to original URL
    }
  }

  private isDirectImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerUrl = url.toLowerCase();
    
    // Check if URL ends with image extension
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('/image/') || 
           lowerUrl.includes('/img/') ||
           lowerUrl.includes('cdn') ||
           lowerUrl.includes('static');
  }

  private getMimeTypeFromUrl(url: string): string {
    // Remove query parameters and get the file extension
    const cleanUrl = url.split('?')[0] || url;
    const extension = cleanUrl.toLowerCase().split('.').pop();
    
    console.log(`Detected file extension: ${extension} from URL: ${url}`);
    
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
      case 'bmp':
        return 'image/bmp';
      case 'svg':
        return 'image/svg+xml';
      default:
        console.log(`Unknown extension: ${extension}, defaulting to image/jpeg`);
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