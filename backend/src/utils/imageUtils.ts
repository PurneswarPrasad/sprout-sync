/**
 * Fetches an image from a URL with support for search engine URLs and HTML extraction
 */
export async function fetchImageFromUrl(url: string, maxRedirects: number = 3): Promise<Buffer> {
  try {
    console.log(`Fetching image from URL: ${url}`);
    
    // Extract actual image URL from search engine URLs
    const actualImageUrl = extractImageUrlFromSearchEngine(url);
    console.log(`Extracted image URL: ${actualImageUrl}`);
    
    return await attemptImageFetch(actualImageUrl, url, maxRedirects);
  } catch (error) {
    console.error('Error fetching image from URL:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch image from URL: ${error.message}`);
    }
    throw new Error('Failed to fetch image from URL: Unknown error');
  }
}

/**
 * Attempts to fetch an image from multiple URLs with fallback support
 */
async function attemptImageFetch(primaryUrl: string, fallbackUrl: string, maxRedirects: number): Promise<Buffer> {
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
      if (isImageBuffer(buffer)) {
        console.log(`Successfully fetched image: ${buffer.length} bytes from ${currentUrl}`);
        return buffer;
      }
      
      // If not an image, check if it's HTML and try to extract image URL
      if (maxRedirects > 0) {
        const text = buffer.toString('utf-8');
        // Simple check to see if content looks like HTML
        if (text.includes('<html') || text.includes('<meta') || text.includes('<img')) {
          const imageUrl = extractImageFromHtml(text, currentUrl);
          if (imageUrl && imageUrl !== currentUrl) {
            console.log(`Found image in HTML: ${imageUrl}, recursing...`);
            return fetchImageFromUrl(imageUrl, maxRedirects - 1);
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

/**
 * Checks if a buffer contains valid image data by examining magic bytes
 */
export function isImageBuffer(buffer: Buffer): boolean {
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

/**
 * Extracts image URL from HTML content using meta tags and img elements
 */
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  try {
    // Look for Open Graph image
    const ogImageMatch = html.match(/<meta[^>]+property=['"]og:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
    if (ogImageMatch) {
      return resolveUrl(ogImageMatch[1]!, baseUrl);
    }

    // Look for Twitter card image
    const twitterImageMatch = html.match(/<meta[^>]+name=['"]twitter:image['"][^>]+content=['"]([^'"]+)['"][^>]*>/i);
    if (twitterImageMatch) {
      return resolveUrl(twitterImageMatch[1]!, baseUrl);
    }

    // Look for the largest image in img tags
    const imgMatches = html.match(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi);
    if (imgMatches && imgMatches.length > 0) {
      // Return the first image found (could be enhanced to find the largest)
      const srcMatch = imgMatches[0].match(/src=['"]([^'"]+)['"]/i);
      if (srcMatch) {
        return resolveUrl(srcMatch[1]!, baseUrl);
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting image from HTML:', error);
    return null;
  }
}

/**
 * Resolves a relative or protocol-relative URL to an absolute URL
 */
function resolveUrl(url: string, baseUrl: string): string {
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

/**
 * Extracts the actual image URL from search engine result pages
 */
function extractImageUrlFromSearchEngine(url: string): string {
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
    if (isDirectImageUrl(url)) {
      return url;
    }
    
    console.log(`No image URL extraction needed, using original URL: ${url}`);
    return url;
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return url; // Fallback to original URL
  }
}

/**
 * Checks if a URL appears to be a direct link to an image file
 */
function isDirectImageUrl(url: string): boolean {
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

/**
 * Determines MIME type from URL file extension
 */
export function getMimeTypeFromUrl(url: string): string {
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

/**
 * Determines MIME type from buffer magic bytes
 */
export function getMimeTypeFromBuffer(buffer: Buffer): string {
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

