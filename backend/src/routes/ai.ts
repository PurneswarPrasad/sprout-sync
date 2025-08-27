import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import { isAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

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

// POST /ai/identify - Identify plant from image file
router.post('/identify/file', isAuthenticated, upload.single('image'), async (req, res) => {
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
router.post('/identify/url', isAuthenticated, validate(identifyByUrlSchema), async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const identification = await aiService.identifyPlantFromImage(imageUrl);

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

// POST /ai/identify - Unified endpoint (accepts both file and URL)
router.post('/identify', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    let imageData: Buffer | string;

    if (req.file) {
      // File upload
      imageData = req.file.buffer;
    } else if (req.body.imageUrl) {
      // URL provided
      imageData = req.body.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either image file or imageUrl must be provided',
      });
    }

    const identification = await aiService.identifyPlantFromImage(imageData);

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

export { router as aiRouter };
