import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { createPlantTrackingSchema } from '../dtos';
import { CloudinaryService } from '../services/cloudinaryService';

const router = Router({ mergeParams: true });

// Middleware to check if user owns the plant
const checkPlantOwnership = async (req: any, res: any, next: any) => {
  try {
    const plantId = req.params.plantId;
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

// GET /api/plants/:plantId/tracking - Get all tracking updates for a specific plant
router.get('/', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    console.log('Route params:', req.params);
    console.log('Full URL:', req.originalUrl);
    const plantId = req.params['plantId'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;
    
    const [trackingUpdates, totalCount] = await Promise.all([
      prisma.plantTracking.findMany({
        where: {
          plantId: plantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.plantTracking.count({
        where: {
          plantId: plantId,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: trackingUpdates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching plant tracking updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant tracking updates',
    });
  }
});

// POST /api/plants/:plantId/tracking - Create new tracking update for a specific plant
router.post('/', authenticateJWT, checkPlantOwnership, validate(createPlantTrackingSchema), async (req, res) => {
  try {
    console.log('POST Route params:', req.params);
    console.log('POST Full URL:', req.originalUrl);
    const plantId = req.params['plantId'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const validatedData = createPlantTrackingSchema.parse(req.body);
    
    // Create the tracking update
    const trackingUpdate = await prisma.plantTracking.create({
      data: {
        plantId: plantId,
        date: validatedData.date,
        note: validatedData.note,
        photoUrl: validatedData.photoUrl || null,
        originalPhotoUrl: validatedData.originalPhotoUrl || null,
        cloudinaryPublicId: validatedData.cloudinaryPublicId || null,
      },
    });
    
    res.status(201).json({
      success: true,
      data: trackingUpdate,
      message: 'Plant tracking update created successfully',
    });
  } catch (error) {
    console.error('Error creating plant tracking update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plant tracking update',
    });
  }
});

// DELETE /api/plants/:plantId/tracking/:trackingId - Delete a specific tracking update
router.delete('/:trackingId', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const trackingId = req.params['trackingId'];
    
    if (!plantId || !trackingId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID and Tracking ID are required',
      });
    }

    // Check if the tracking update exists and belongs to the plant
    const existingTracking = await prisma.plantTracking.findFirst({
      where: {
        id: trackingId,
        plantId: plantId,
      },
    });

    if (!existingTracking) {
      return res.status(404).json({
        success: false,
        error: 'Tracking update not found',
      });
    }

    // Delete photo from Cloudinary if it exists
    if (existingTracking.cloudinaryPublicId) {
      try {
        await CloudinaryService.deleteImage(existingTracking.cloudinaryPublicId);
        console.log(`Deleted image from Cloudinary: ${existingTracking.cloudinaryPublicId}`);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete the tracking update from database
    await prisma.plantTracking.delete({
      where: {
        id: trackingId,
      },
    });

    res.json({
      success: true,
      message: 'Plant tracking update deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plant tracking update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plant tracking update',
    });
  }
});

export default router;
