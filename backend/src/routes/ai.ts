import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';

const router = Router({ mergeParams: true });

// GET /ai/health - Health check for AI service
router.get('/health', authenticateJWT, async (req, res) => {
  try {
    // Check if API key is available
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY not configured',
      });
    }

    res.json({
      success: true,
      message: 'AI service is healthy',
      apiKeyConfigured: !!apiKey,
    });
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: 'AI service health check failed',
    });
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Schema for URL-based identification
const identifyByUrlSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

// Schema for health analysis by URL
const analyzeHealthByUrlSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

// POST /ai/identify - Identify plant from image file
router.post('/identify/file', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const identification = await aiService.identifyPlantFromImage(req.file.buffer);

    res.json({
      success: true,
      data: identification,
      message: 'Plant identified successfully',
    });
  } catch (error) {
    console.error('AI identification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to identify plant',
    });
  }
});

// POST /ai/identify - Identify plant from image URL
router.post('/identify/url', authenticateJWT, validate(identifyByUrlSchema), async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    console.log(`Received URL identification request for: ${imageUrl}`);

    const identification = await aiService.identifyPlantFromImage(imageUrl);

    res.json({
      success: true,
      data: identification,
      message: 'Plant identified successfully',
    });
  } catch (error) {
    console.error('AI identification error:', error);
    
         // Provide more specific error messages
     let errorMessage = 'Failed to identify plant';
     if (error instanceof Error) {
       if (error.message.includes('fetch')) {
         errorMessage = 'Failed to fetch image from URL. Please check the URL and try again.';
       } else if (error.message.includes('Invalid content type')) {
         errorMessage = 'The URL does not point to a valid image file. Please use a direct image URL (ending in .jpg, .png, etc.) instead of a search engine page.';
       } else if (error.message.includes('GEMINI_API_KEY')) {
         errorMessage = 'AI service is not properly configured.';
       } else {
         errorMessage = error.message;
       }
     }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// POST /ai/identify/issue/file - Analyze plant health from image file
// router.post('/identify/issue/file', authenticateJWT, upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         error: 'No image file provided',
//       });
//     }

//     const analysis = await aiService.analyzePlantHealth(req.file.buffer);

//     res.json({
//       success: true,
//       data: analysis,
//       message: 'Plant health analysis completed successfully',
//     });
//   } catch (error) {
//     console.error('AI health analysis error:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to analyze plant health',
//     });
//   }
// });

// POST /ai/identify/issue/url - Analyze plant health from image URL
router.post('/identify/issue/url', authenticateJWT, validate(analyzeHealthByUrlSchema), async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    console.log(`Received health analysis request for URL: ${imageUrl}`);

    const analysis = await aiService.analyzePlantHealth(imageUrl);

    res.json({
      success: true,
      data: analysis,
      message: 'Plant health analysis completed successfully',
    });
  } catch (error) {
    console.error('AI health analysis error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze plant health';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Failed to fetch image from URL. Please check the URL and try again.';
      } else if (error.message.includes('Invalid content type')) {
        errorMessage = 'The URL does not point to a valid image file. Please use a direct image URL (ending in .jpg, .png, etc.) instead of a search engine page.';
      } else if (error.message.includes('GEMINI_API_KEY')) {
        errorMessage = 'AI service is not properly configured.';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export { router as aiRouter };
