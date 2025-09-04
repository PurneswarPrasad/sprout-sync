"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env['GEMINI_API_KEY']);
class AIService {
    constructor() {
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            console.error('GEMINI_API_KEY environment variable is not set');
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
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
            throw new Error('Failed to identify plant. Please try again.');
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
    sanitizeAIResponse(response) {
        const sanitized = {
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
}
exports.AIService = AIService;
exports.aiService = new AIService();
//# sourceMappingURL=aiService.js.map