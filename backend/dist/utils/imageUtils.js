"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchImageFromUrl = fetchImageFromUrl;
exports.isImageBuffer = isImageBuffer;
exports.getMimeTypeFromUrl = getMimeTypeFromUrl;
exports.getMimeTypeFromBuffer = getMimeTypeFromBuffer;
async function fetchImageFromUrl(url, maxRedirects = 3) {
    try {
        console.log(`Fetching image from URL: ${url}`);
        const actualImageUrl = extractImageUrlFromSearchEngine(url);
        console.log(`Extracted image URL: ${actualImageUrl}`);
        return await attemptImageFetch(actualImageUrl, url, maxRedirects);
    }
    catch (error) {
        console.error('Error fetching image from URL:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch image from URL: ${error.message}`);
        }
        throw new Error('Failed to fetch image from URL: Unknown error');
    }
}
async function attemptImageFetch(primaryUrl, fallbackUrl, maxRedirects) {
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
            if (isImageBuffer(buffer)) {
                console.log(`Successfully fetched image: ${buffer.length} bytes from ${currentUrl}`);
                return buffer;
            }
            if (maxRedirects > 0) {
                const text = buffer.toString('utf-8');
                if (text.includes('<html') || text.includes('<meta') || text.includes('<img')) {
                    const imageUrl = extractImageFromHtml(text, currentUrl);
                    if (imageUrl && imageUrl !== currentUrl) {
                        console.log(`Found image in HTML: ${imageUrl}, recursing...`);
                        return fetchImageFromUrl(imageUrl, maxRedirects - 1);
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
function isImageBuffer(buffer) {
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
function extractImageFromHtml(html, baseUrl) {
    try {
        const ogImageMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
        if (ogImageMatch) {
            return resolveUrl(ogImageMatch[1], baseUrl);
        }
        const twitterImageMatch = html.match(/<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
        if (twitterImageMatch) {
            return resolveUrl(twitterImageMatch[1], baseUrl);
        }
        const imgMatches = html.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi);
        if (imgMatches && imgMatches.length > 0) {
            const srcMatch = imgMatches[0].match(/src=['"]([^'"]+)['"]/i);
            if (srcMatch) {
                return resolveUrl(srcMatch[1], baseUrl);
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error extracting image from HTML:', error);
        return null;
    }
}
function resolveUrl(url, baseUrl) {
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
function extractImageUrlFromSearchEngine(url) {
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
        if (isDirectImageUrl(url)) {
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
function isDirectImageUrl(url) {
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
function getMimeTypeFromUrl(url) {
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
function getMimeTypeFromBuffer(buffer) {
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
//# sourceMappingURL=imageUtils.js.map