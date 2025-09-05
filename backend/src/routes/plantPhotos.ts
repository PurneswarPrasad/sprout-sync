import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { createPhotoSchema } from '../dtos';

const router = Router({ mergeParams: true });

// Middleware to check if user owns the plant
const checkPlantOwnership = async (req: any, res: any, next: any) => {
  try {
    const plantId = req.params['plantId'];
    const userId = (req.user as any).userId;
    
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId: userId,
      },
    });
    
    if (!plant) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Plant not found or you do not own this plant.',
      });
    }
    
    req.plant = plant;
    next();
  } catch (error) {
    console.error('Error checking plant ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify plant ownership',
    });
  }
};

// GET /api/plants/:plantId/photos - Get all photos for a specific plant
router.get('/', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;
    
    const [photos, totalCount] = await Promise.all([
      prisma.photo.findMany({
        where: {
          plantId: plantId!,
        },
        orderBy: {
          takenAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.photo.count({
        where: {
          plantId: plantId!,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: photos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching plant photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant photos',
    });
  }
});

// POST /api/plants/:plantId/photos - Create new photo for a specific plant
router.post('/', authenticateJWT, checkPlantOwnership, validate(createPhotoSchema), async (req, res) => {
  const plantId = req.params['plantId'];
  let validatedData: any;
  
  try {
    validatedData = createPhotoSchema.parse(req.body);
    
    console.log('Plant ID from params:', plantId);
    console.log('Plant ID type:', typeof plantId);
    console.log('All params:', req.params);
    
    // Override plantId to ensure it matches the URL parameter
    const photo = await prisma.photo.create({
      data: {
        plantId: plantId!,
        cloudinaryPublicId: validatedData.cloudinaryPublicId,
        secureUrl: validatedData.secureUrl,
        takenAt: new Date(validatedData.takenAt),
        // pointsAwarded will use the default value from schema (0)
      },
    });
    
    res.status(201).json({
      success: true,
      data: photo,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error creating plant photo:', error);
    console.error('Plant ID:', plantId);
    console.error('Validated data:', validatedData);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create plant photo',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as plantPhotosRouter };
