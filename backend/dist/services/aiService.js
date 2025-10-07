"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env['GEMINI_API_KEY']);
const keywordsToReject = ['grass', 'lawn', 'background', 'trees in the distance', 'hedge'];
const PlantImageValidationSchema = zod_1.z.object({
    isPlant: zod_1.z.boolean(),
    confidence: zod_1.z.number().min(0).max(1),
    reason: zod_1.z.string(),
})
    .refine(data => {
    if (data.isPlant) {
        const reasonHasRejectedKeyword = keywordsToReject.some(keyword => data.reason.toLowerCase().includes(keyword));
        return !reasonHasRejectedKeyword;
    }
    return true;
}, {
    message: "Logical validation failed: The reason mentions non-primary subjects like grass or background elements.",
});
class AIService {
    constructor() {
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            console.error('GEMINI_API_KEY environment variable is not set');
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    }
    async validatePlantImage(imagePart) {
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
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in plant validation response:', text);
                return false;
            }
            try {
                const llmOutput = JSON.parse(jsonMatch[0]);
                const validationResult = PlantImageValidationSchema.parse(llmOutput);
                console.log(`Zod validation passed. Result: isPlant=${validationResult.isPlant}, confidence=${validationResult.confidence}, reason="${validationResult.reason}"`);
                return validationResult.isPlant && validationResult.confidence >= 0.8;
            }
            catch (validationError) {
                console.error('Failed to parse or validate plant validation JSON:', validationError);
                return false;
            }
        }
        catch (error) {
            console.error('Error during plant validation:', error);
            return false;
        }
    }
    async identifyPlantFromImage(imageData) {
        try {
            console.log(`Starting AI plant identification. Input type: ${typeof imageData}`);
            if (typeof imageData === 'string') {
                console.log(`Processing string input. Is URL: ${imageData.startsWith('http')}`);
            }
            else {
                console.log(`Processing buffer input. Size: ${imageData.length} bytes`);
            }
            const prompt = `
You are a plant identification expert. Analyze the provided image and return a JSON response with the following structure:

{
  "botanicalName": "Botanical (scientific) name of the plant — REQUIRED (use \"Unknown Plant\" if you cannot identify)",
  "commonName": "Common name of the plant (or empty string if unknown)",
  "plantType": "Category of the plant",
  "confidence": 0.92,
  "careLevel": "Easy" | "Moderate" | "Difficult",
  "sunRequirements": "No sun" | "Part to Full" | "Full sun",
  "toxicityLevel": "Low" | "Medium" | "High",
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
- Return ONLY valid JSON, no additional text.
- The field \"botanicalName\" is REQUIRED. If you can't identify the plant clearly, set \"botanicalName\": \"Unknown Plant\" and lower the confidence.
- \"commonName\" may be empty if unknown.
- Use realistic confidence scores between 0.70 and 0.95.
- Provide specific, actionable care instructions (how much, how often, environmental cues).
- Use reasonable frequencyDays for suggestedTasks.
- Ensure all task names match exactly: watering, fertilizing, pruning, spraying, sunlightRotation.
- For careLevel: "Easy" for beginner-friendly plants, "Moderate" for plants needing some attention, "Difficult" for plants requiring expert care.
- For sunRequirements: "No sun" for shade-loving plants, "Part to Full" for plants that tolerate partial shade, "Full sun" for sun-loving plants.
- For toxicityLevel: "Low" for safe plants, "Medium" for plants with mild toxicity, "High" for plants that are highly toxic to humans/pets.
`;
            let imagePart;
            if (typeof imageData === 'string') {
                if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
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
                }
                else {
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
            }
            else {
                console.log('Processing Buffer input...');
                imagePart = {
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                };
            }
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
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No JSON found in AI response:', text);
                throw new Error('Invalid response format from AI - no JSON found');
            }
            let aiResponse;
            try {
                aiResponse = JSON.parse(jsonMatch[0]);
                console.log('Successfully parsed AI response JSON');
            }
            catch (parseError) {
                console.error('Failed to parse AI response JSON:', parseError);
                console.error('JSON string:', jsonMatch[0]);
                throw new Error('Invalid JSON format in AI response');
            }
            const sanitizedResponse = this.sanitizeAIResponse(aiResponse);
            console.log('AI identification completed successfully');
            return sanitizedResponse;
        }
        catch (error) {
            console.error('AI identification error:', error);
            if (error instanceof Error) {
                throw error;
            }
            else {
                throw new Error('Failed to identify plant. Please try again.');
            }
        }
    }
    async fetchImageFromUrl(url, maxRedirects = 3) {
        try {
            console.log(`Fetching image from URL: ${url}`);
            const actualImageUrl = this.extractImageUrlFromSearchEngine(url);
            console.log(`Extracted image URL: ${actualImageUrl}`);
            return await this.attemptImageFetch(actualImageUrl, url, maxRedirects);
        }
        catch (error) {
            console.error('Error fetching image from URL:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch image from URL: ${error.message}`);
            }
            throw new Error('Failed to fetch image from URL: Unknown error');
        }
    }
    async attemptImageFetch(primaryUrl, fallbackUrl, maxRedirects) {
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
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                if (this.isImageBuffer(buffer)) {
                    console.log(`Successfully fetched image: ${buffer.length} bytes from ${currentUrl}`);
                    return buffer;
                }
                if (maxRedirects > 0) {
                    const text = buffer.toString('utf-8');
                    if (text.includes('<html') || text.includes('<meta') || text.includes('<img')) {
                        const imageUrl = this.extractImageFromHtml(text, currentUrl);
                        if (imageUrl && imageUrl !== currentUrl) {
                            console.log(`Found image in HTML: ${imageUrl}, recursing...`);
                            return this.fetchImageFromUrl(imageUrl, maxRedirects - 1);
                        }
                    }
                }
                console.log(`Content from ${currentUrl} is neither an image nor contains extractable image URL`);
            }
            catch (error) {
                console.log(`Failed to fetch ${currentUrl}:`, error);
                continue;
            }
        }
        throw new Error('No valid image found at any of the attempted URLs');
    }
    isImageBuffer(buffer) {
        if (buffer.length < 4)
            return false;
        const header = buffer.subarray(0, 4);
        if (header[0] === 0xFF && header[1] === 0xD8)
            return true;
        if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47)
            return true;
        if (buffer.length >= 6) {
            const gifHeader = buffer.subarray(0, 6);
            if (gifHeader.toString() === 'GIF87a' || gifHeader.toString() === 'GIF89a')
                return true;
        }
        if (buffer.length >= 12) {
            const webpHeader = buffer.subarray(0, 4);
            const webpFormat = buffer.subarray(8, 12);
            if (webpHeader.toString() === 'RIFF' && webpFormat.toString() === 'WEBP')
                return true;
        }
        if (header[0] === 0x42 && header[1] === 0x4D)
            return true;
        return false;
    }
    extractImageFromHtml(html, baseUrl) {
        try {
            const ogImageMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
            if (ogImageMatch) {
                return this.resolveUrl(ogImageMatch[1], baseUrl);
            }
            const twitterImageMatch = html.match(/<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
            if (twitterImageMatch) {
                return this.resolveUrl(twitterImageMatch[1], baseUrl);
            }
            const imgMatches = html.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi);
            if (imgMatches && imgMatches.length > 0) {
                const srcMatch = imgMatches[0].match(/src=['"]([^'"]+)['"]/i);
                if (srcMatch) {
                    return this.resolveUrl(srcMatch[1], baseUrl);
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error extracting image from HTML:', error);
            return null;
        }
    }
    resolveUrl(url, baseUrl) {
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            if (url.startsWith('//')) {
                return new URL(baseUrl).protocol + url;
            }
            if (url.startsWith('/')) {
                const base = new URL(baseUrl);
                return `${base.protocol}//${base.host}${url}`;
            }
            return new URL(url, baseUrl).href;
        }
        catch (error) {
            console.error('Error resolving URL:', error);
            return url;
        }
    }
    extractImageUrlFromSearchEngine(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('bing.com') && urlObj.searchParams.has('mediaurl')) {
                const mediaUrl = urlObj.searchParams.get('mediaurl');
                if (mediaUrl) {
                    const decodedUrl = decodeURIComponent(mediaUrl);
                    console.log(`Extracted Bing media URL: ${decodedUrl}`);
                    return decodedUrl;
                }
            }
            if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/imgres')) {
                const imgUrl = urlObj.searchParams.get('imgurl');
                if (imgUrl) {
                    console.log(`Extracted Google image URL: ${imgUrl}`);
                    return imgUrl;
                }
            }
            if (this.isDirectImageUrl(url)) {
                return url;
            }
            console.log(`No image URL extraction needed, using original URL: ${url}`);
            return url;
        }
        catch (error) {
            console.error('Error extracting image URL:', error);
            return url;
        }
    }
    isDirectImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const lowerUrl = url.toLowerCase();
        const urlWithoutParams = lowerUrl.split('?')[0]?.split('#')[0];
        const hasImageExtension = imageExtensions.some(ext => urlWithoutParams?.endsWith(ext));
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
    getMimeTypeFromUrl(url) {
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
                return 'image/jpeg';
        }
    }
    getMimeTypeFromBuffer(buffer) {
        const bytes = buffer.slice(0, 12);
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'image/jpeg';
        }
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
        }
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            return 'image/gif';
        }
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
            bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
            return 'image/webp';
        }
        if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
            return 'image/heic';
        }
        console.log('Could not determine MIME type from buffer, defaulting to image/jpeg');
        return 'image/jpeg';
    }
    sanitizeAIResponse(response) {
        const sanitized = {
            botanicalName: response.botanicalName || 'Unknown Plant',
            commonName: response.commonName || '',
            plantType: response.plantType || 'Unknown Type',
            confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
            careLevel: response.careLevel || 'Moderate',
            sunRequirements: response.sunRequirements || 'Part to Full',
            toxicityLevel: response.toxicityLevel || 'Low',
            care: {
                watering: response.care?.watering || 'Water when soil is dry',
                fertilizing: response.care?.fertilizing || 'Fertilize monthly during growing season',
                pruning: response.care?.pruning || 'Prune as needed to maintain shape',
                spraying: response.care?.spraying || 'Mist leaves occasionally for humidity',
                sunlightRotation: response.care?.sunlightRotation || 'Rotate plant for even growth'
            },
            suggestedTasks: []
        };
        const validTaskNames = ['watering', 'fertilizing', 'pruning', 'spraying', 'sunlightRotation'];
        const defaultFrequencies = {
            watering: 7,
            fertilizing: 30,
            pruning: 60,
            spraying: 14,
            sunlightRotation: 7
        };
        if (Array.isArray(response.suggestedTasks)) {
            response.suggestedTasks.forEach((task) => {
                if (validTaskNames.includes(task.name) && typeof task.frequencyDays === 'number') {
                    sanitized.suggestedTasks.push({
                        name: task.name,
                        frequencyDays: Math.max(1, Math.min(task.frequencyDays, 365))
                    });
                }
            });
        }
        if (sanitized.suggestedTasks.length === 0) {
            validTaskNames.forEach(taskName => {
                sanitized.suggestedTasks.push({
                    name: taskName,
                    frequencyDays: defaultFrequencies[taskName]
                });
            });
        }
        return sanitized;
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
                    const mimeType = this.getMimeTypeFromBuffer(buffer);
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
                const mimeType = this.getMimeTypeFromBuffer(imageData);
                imagePart = {
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType: mimeType
                    }
                };
            }
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
            let jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in AI response');
            }
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(jsonMatch[0]);
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
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=aiService.js.map