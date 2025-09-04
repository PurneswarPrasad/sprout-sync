import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/jwtAuth';
import { CloudinaryService } from '../services/cloudinaryService';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed formats: jpg, jpeg, png, webp, heic, heif
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, HEIC, and HEIF are allowed.'));
    }
  },
});

// POST /api/upload/image - Upload image to Cloudinary
router.post('/image', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadImage(req.file.buffer, 'plant-care');

    // Return both original and optimized URLs
    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/w_800,h_800,c_limit,q_auto:good,f_auto/');

    res.json({
      success: true,
      data: {
        public_id: result.public_id,
        original_url: result.secure_url,
        optimized_url: optimizedUrl,
        width: result.width,
        height: result.height,
        format: result.format,
        size: req.file.size,
      },
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    if (error instanceof Error && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    
    if (error instanceof Error && error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
});

export default router;

