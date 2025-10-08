import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']!);

// Define the Zod schema for the plant image validation response
const keywordsToReject = ['grass', 'lawn', 'background', 'trees in the distance', 'hedge'];

const PlantImageValidationSchema = z.object({
    isPlant: z.boolean(),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
  })
  .refine(data => {
    // If the model says it IS a plant, the reason must NOT contain forbidden keywords.
    if (data.isPlant) {
      const reasonHasRejectedKeyword = keywordsToReject.some(keyword =>
        data.reason.toLowerCase().includes(keyword)
      );
      // If a rejected keyword is found, the refinement fails (returns false).
      return !reasonHasRejectedKeyword;
    }
    // If isPlant is false, we don't need to check the reason.
    return true;
  }, {
    // Custom error message if the refinement fails
    message: "Logical validation failed: The reason mentions non-primary subjects like grass or background elements.",
  });

export interface AIPlantIdentification {
  botanicalName: string;
  commonName: string;
  plantType: string;
  confidence: number;
  careLevel: 'Easy' | 'Moderate' | 'Difficult';
  sunRequirements: 'No sun' | 'Part to Full' | 'Full sun';
  toxicityLevel: 'Low' | 'Medium' | 'High';
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

export class AIService {
  private model: any;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  }

  /**
   * Validates if the image contains a plant before processing
   * This acts as a guardrail to prevent processing non-plant images
   */
  private async validatePlantImage(imagePart: any): Promise<boolean> {
    try {
      const validationPrompt = `
You are a strict PLANT IMAGE VALIDATOR. Your task is to determine if the image's PRIMARY and CENTRAL subject is a plant.

Follow these steps precisely:
1.  **Analyze Subject:** In one sentence, describe the main, central subject of the image. Is it a person, animal, building, or a plant?
2.  **Apply Rules:** Based on your analysis, apply the following strict rules:
    * **FAIL** if the main subject is a person, animal, or object.
    * **FAIL** if the image is a landscape, or if plants are only in the background.
    * **FAIL** if the most prominent plant element is a lawn, grass, or hedge. These do not count as a plant subject.
    * **PASS** only if the clear, intended focus of the photo is a distinct plant (flower, potted plant, tree, leaf close-up).
3.  **Final Decision:** Based on the rules, decide if "isPlant" is true or false.
4.  **Output JSON:** Return ONLY a valid JSON object with your final decision. Do not include your step-by-step analysis in the final JSON output.

    { "isPlant": boolean, 
      "confidence": number (0.0-1.0), 
      "reason": "A brief explanation for your final decision." 
    }
`;

      console.log('Validating if image contains a plant...');
      const result = await this.model.generateContent([validationPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Plant validation response:', text.substring(0, 200) + '...');
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in plant validation response:', text);
        return false;
      }
      
      try {
        const llmOutput = JSON.parse(jsonMatch[0]);
        // Use Zod to parse, validate types, and run our custom refinement logic
        const validationResult = PlantImageValidationSchema.parse(llmOutput);

        console.log(`Zod validation passed. Result: isPlant=${validationResult.isPlant}, confidence=${validationResult.confidence}, reason="${validationResult.reason}"`);
        
        // Only consider it a plant if confidence is above 0.8 and isPlant is true
        return validationResult.isPlant && validationResult.confidence >= 0.8;

      } catch (validationError) {
        console.error('Failed to parse or validate plant validation JSON:', validationError);
        return false;
      }
    } catch (error) {
      console.error('Error during plant validation:', error);
      // If validation fails, err on the side of caution and reject the image
      return false;
    }
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
      You are a world-class botanist and AI assistant, an expert in plant identification and horticulture. Your primary function is to analyze an image of a plant and return a comprehensive data profile in a strict JSON format. Adhere to the schema and guidelines precisely.
      
      You must return a single JSON object with this exact structure:
      
      {
        "botanicalName": "Botanical (scientific) name of the plant. REQUIRED.",
        "commonName": "Common name of the plant. Can be an empty string.",
        "plantType": "General category of the plant (e.g., 'Tropical Foliage', 'Succulent', 'Flowering Houseplant').",
        "confidence": 0.95,
        "careLevel": "'Easy' | 'Moderate' | 'Difficult'",
        "sunRequirements": "'No sun' | 'Part to Full' | 'Full sun'",
        "toxicityLevel": "'Low' | 'Medium' | 'High'",
        "petFriendliness": {
          "isFriendly": boolean,
          "reason": "Briefly explain why (e.g., 'Non-toxic to cats and dogs' or 'Contains calcium oxalate crystals, toxic if ingested')."
        },
        "commonPestsAndDiseases": "A comma-separated string of common issues (e.g., 'Spider mites, Aphids, Root rot').",
        "preventiveMeasures": "Actionable advice to prevent the common issues listed above.",
        "care": {
          "watering": "Detailed, specific watering instructions. Include frequency and signs to look for.",
          "fertilizing": "Detailed, specific fertilizing instructions. Include type and frequency.",
          "pruning": "Detailed, specific pruning instructions.",
          "spraying": "Detailed, specific spraying/misting instructions for humidity or pest control.",
          "sunlightRotation": "Detailed instructions on light exposure and plant rotation."
        },
        "suggestedTasks": [
          { "name": "watering", "frequencyDays": 3 },
          { "name": "fertilizing", "frequencyDays": 14 },
          { "name": "pruning", "frequencyDays": 30 },
          { "name": "spraying", "frequencyDays": 7 },
          { "name": "sunlightRotation", "frequencyDays": 14 }
        ]
      }
      
      ## Detailed Field Guidelines
      
      ### 1. Identification & Confidence
      - **botanicalName**: This field is REQUIRED. If you cannot identify the plant, you MUST return "Unknown Plant".
      - **commonName**: Provide the most common name. If unknown, return an empty string \`""\`.
      - **confidence**: Use a realistic score from 0.0 to 1.0. Lower the score significantly if identification is uncertain.
      
      ### 2. Classification
      - **careLevel**, **sunRequirements**, **toxicityLevel**: You MUST use one of the exact string values specified in the schema.
      - **petFriendliness**: Base your \`isFriendly\` decision on the plant's known toxicity to common pets like cats and dogs. The \`reason\` should be concise.
      - **health**: Provide a concise list for \`commonPestsAndDiseases\` and actionable, clear \`preventiveMeasures\`.
      
      ### 3. Care & Tasks
      - **care**: All instructions must be practical and easy for a plant owner to follow.
      - **suggestedTasks**: The \`name\` field for each task MUST be one of the following: \`watering\`, \`fertilizing\`, \`pruning\`, \`spraying\`, \`sunlightRotation\`. The \`frequencyDays\` must be a reasonable integer.
      
      ## Final Output Constraint
      **CRITICAL:** Your entire response must be ONLY the raw JSON object. Do not wrap it in markdown backticks (\\\`\\\`\\\`json), and do not include any text before or after the JSON.
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

      // GUARDRAIL: Validate that the image contains a plant before processing
      const isValidPlant = await this.validatePlantImage(imagePart);
      if (!isValidPlant) {
        console.log('Plant validation failed in identifyPlantFromImage - throwing error');
        throw new Error('The uploaded image does not appear to contain a plant. Please upload an image of a plant, tree, flower, or other botanical subject.');
      }

      console.log('Plant validation passed, proceeding with identification...');

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
      // Re-throw the original error to preserve specific error messages (like plant validation)
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to identify plant. Please try again.');
      }
    }
  }

  private async fetchImageFromUrl(url: string, maxRedirects: number = 3): Promise<Buffer> {
    try {
      console.log(`Fetching image from URL: ${url}`);
      
      // Extract actual image URL from search engine URLs
      const actualImageUrl = this.extractImageUrlFromSearchEngine(url);
      console.log(`Extracted image URL: ${actualImageUrl}`);
      
      return await this.attemptImageFetch(actualImageUrl, url, maxRedirects);
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch image from URL: ${error.message}`);
      }
      throw new Error('Failed to fetch image from URL: Unknown error');
    }
  }

  private async attemptImageFetch(primaryUrl: string, fallbackUrl: string, maxRedirects: number): Promise<Buffer> {
    const urlsToTry = [primaryUrl];
    if (primaryUrl !== fallbackUrl) {
      urlsToTry.push(fallbackUrl);
    }

    for (const currentUrl of urlsToTry) {
      try {
        console.log(`Attempting to fetch: ${currentUrl}`);
        
        const response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,text/html,application/xhtml+xml,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          console.log(`HTTP ${response.status} for ${currentUrl}, trying next...`);
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        console.log(`Content-Type: ${contentType} for ${currentUrl}`);

        // Fetch the content regardless of content-type
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // First, check if it's an image by examining the actual content
        if (this.isImageBuffer(buffer)) {
          console.log(`Successfully fetched image: ${buffer.length} bytes from ${currentUrl}`);
          return buffer;
        }
        
        // If not an image, check if it's HTML and try to extract image URL
        if (maxRedirects > 0) {
          const text = buffer.toString('utf-8');
          // Simple check to see if content looks like HTML
          if (text.includes('<html') || text.includes('<meta') || text.includes('<img')) {
            const imageUrl = this.extractImageFromHtml(text, currentUrl);
            if (imageUrl && imageUrl !== currentUrl) {
              console.log(`Found image in HTML: ${imageUrl}, recursing...`);
              return this.fetchImageFromUrl(imageUrl, maxRedirects - 1);
            }
          }
        }
        
        console.log(`Content from ${currentUrl} is neither an image nor contains extractable image URL`);
      } catch (error) {
        console.log(`Failed to fetch ${currentUrl}:`, error);
        continue;
      }
    }

    throw new Error('No valid image found at any of the attempted URLs');
  }

  private isImageBuffer(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;
    
    // Check common image file signatures
    const header = buffer.subarray(0, 4);
    
    // JPEG
    if (header[0] === 0xFF && header[1] === 0xD8) return true;
    
    // PNG
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return true;
    
    // GIF
    if (buffer.length >= 6) {
      const gifHeader = buffer.subarray(0, 6);
      if (gifHeader.toString() === 'GIF87a' || gifHeader.toString() === 'GIF89a') return true;
    }
    
    // WebP
    if (buffer.length >= 12) {
      const webpHeader = buffer.subarray(0, 4);
      const webpFormat = buffer.subarray(8, 12);
      if (webpHeader.toString() === 'RIFF' && webpFormat.toString() === 'WEBP') return true;
    }
    
    // BMP
    if (header[0] === 0x42 && header[1] === 0x4D) return true;
    
    return false;
  }

  private extractImageFromHtml(html: string, baseUrl: string): string | null {
    try {
      // Look for Open Graph image
      const ogImageMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
      if (ogImageMatch) {
        return this.resolveUrl(ogImageMatch[1]!, baseUrl);
      }

      // Look for Twitter card image
      const twitterImageMatch = html.match(/<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
      if (twitterImageMatch) {
        return this.resolveUrl(twitterImageMatch[1]!, baseUrl);
      }

      // Look for the largest image in img tags
      const imgMatches = html.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi);
      if (imgMatches && imgMatches.length > 0) {
        // Return the first image found (could be enhanced to find the largest)
        const srcMatch = imgMatches[0].match(/src=['"]([^'"]+)['"]/i);
        if (srcMatch) {
          return this.resolveUrl(srcMatch[1]!, baseUrl);
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting image from HTML:', error);
      return null;
    }
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      // If URL is already absolute, return it
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // If URL starts with //, add protocol
      if (url.startsWith('//')) {
        return new URL(baseUrl).protocol + url;
      }
      
      // If URL starts with /, make it relative to domain
      if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${url}`;
      }
      
      // Otherwise, make it relative to current page
      return new URL(url, baseUrl).href;
    } catch (error) {
      console.error('Error resolving URL:', error);
      return url;
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
    
    // Check if URL ends with image extension (before query params)
    const urlWithoutParams = lowerUrl.split('?')[0]?.split('#')[0];
    const hasImageExtension = imageExtensions.some(ext => urlWithoutParams?.endsWith(ext));
    
    // Check for image-related patterns in URL path
    const hasImagePattern = lowerUrl.includes('/image/') || 
                           lowerUrl.includes('/img/') ||
                           lowerUrl.includes('/photo/') ||
                           lowerUrl.includes('/picture/') ||
                           lowerUrl.includes('/media/') ||
                           lowerUrl.includes('/assets/') ||
                           lowerUrl.includes('/uploads/') ||
                           lowerUrl.includes('/files/') ||
                           lowerUrl.includes('/content/') ||
                           lowerUrl.includes('cdn') ||
                           lowerUrl.includes('static');
    
    return hasImageExtension || hasImagePattern;
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

  private getMimeTypeFromBuffer(buffer: Buffer): string {
    // Check file signature (magic bytes) to determine MIME type
    const bytes = buffer.slice(0, 12);
    
    // JPEG
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }
    
    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }
    
    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'image/gif';
    }
    
    // WebP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && 
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }
    
    // HEIC/HEIF
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      return 'image/heic';
    }
    
    // Default to JPEG if we can't determine
    console.log('Could not determine MIME type from buffer, defaulting to image/jpeg');
    return 'image/jpeg';
  }

  private sanitizeAIResponse(response: any): AIPlantIdentification {
    // Ensure all required fields exist
    const sanitized: AIPlantIdentification = {
      botanicalName: response.botanicalName || 'Unknown Plant',
      commonName: response.commonName || '',
      plantType: response.plantType || 'Unknown Type',
      confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
      careLevel: response.careLevel || 'Moderate',
      sunRequirements: response.sunRequirements || 'Part to Full',
      toxicityLevel: response.toxicityLevel || 'Low',
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

  async analyzePlantHealth(imageData: Buffer | string): Promise<AIPlantHealthAnalysis> {
    try {
      console.log(`Starting AI plant health analysis. Input type: ${typeof imageData}`);
      
      if (typeof imageData === 'string') {
        console.log(`Processing string input. Is URL: ${imageData.startsWith('http')}`);
      } else {
        console.log(`Processing buffer input. Size: ${imageData.length} bytes`);
      }

      let imagePart: any;
      
      if (typeof imageData === 'string') {
        // Handle URL input
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
          const mimeType = this.getMimeTypeFromBuffer(buffer);
          
          imagePart = {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType
            }
          };
        } catch (fetchError) {
          console.error('Error fetching image from URL:', fetchError);
          throw new Error(`Failed to fetch image from URL: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
      } else {
        // Handle Buffer input
        const mimeType = this.getMimeTypeFromBuffer(imageData);
        imagePart = {
          inlineData: {
            data: imageData.toString('base64'),
            mimeType: mimeType
          }
        };
      }

      // GUARDRAIL: Validate that the image contains a plant before processing
      const isValidPlant = await this.validatePlantImage(imagePart);
      if (!isValidPlant) {
        console.log('Plant validation failed in analyzePlantHealth - throwing error');
        throw new Error('The uploaded image does not appear to contain a plant. Please upload an image of a plant, tree, flower, or other botanical subject.');
      }

      console.log('Plant validation passed, proceeding with health analysis...');

      const prompt = `You are a plant health assistant. Analyze the provided plant image and return results strictly in JSON format. 
Do not include explanations or extra text outside the JSON.

The JSON schema must look like this:

{
  "botanicalName": string,            // Botanical (scientific) name of the plant
  "commonName": string,               // Common name of the plant (or empty string if unknown)
  "confidence": number,               // 0–1, model confidence
  "disease": {
    "issue": string | null,           // Name of the detected issue (e.g., "Powdery mildew") or null if none
    "description": string | null,     // Short summary of the issue
    "affected": string | null,        // What kinds of plants are typically affected
    "steps": string | null,           // Actionable care/prevention steps
    "issueConfidence": number | null       // 0–1 confidence for disease detection, null if healthy
  }
}

Rules:
- If the plant looks healthy, set "disease.issue" to null and provide no disease details.
- Keep text concise and user-friendly.
- Do not invent diseases; respond "null" if unsure.`;

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw AI response:', text);

      // Try to extract JSON from the response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', text);
        throw new Error('Failed to parse AI response as JSON');
      }

      console.log('Parsed AI response:', parsedResponse);

      return this.sanitizeHealthAnalysisResponse(parsedResponse);
    } catch (error) {
      console.error('AI plant health analysis error:', error);
      throw error;
    }
  }

  private sanitizeHealthAnalysisResponse(response: any): AIPlantHealthAnalysis {
    // Ensure all required fields exist
    const sanitized: AIPlantHealthAnalysis = {
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

export const aiService = new AIService();