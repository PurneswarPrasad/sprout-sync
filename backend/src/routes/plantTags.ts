import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();

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

// Schema for assigning tags
const assignTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID'),
});

// Schema for unassigning tags
const unassignTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID'),
});

// GET /api/plants/:plantId/tags - Get all tags assigned to a plant
router.get('/', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    
    const plantTags = await prisma.plantTag.findMany({
      where: {
        plantId: plantId!,
      },
      include: {
        tag: true,
      },
      orderBy: {
        tag: {
          name: 'asc',
        },
      },
    });
    
    res.json({
      success: true,
      data: plantTags,
      count: plantTags.length,
    });
  } catch (error) {
    console.error('Error fetching plant tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant tags',
    });
  }
});

// POST /api/plants/:plantId/tags - Assign a tag to a plant
router.post('/', authenticateJWT, checkPlantOwnership, validate(assignTagSchema), async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const userId = (req.user as any).userId;
    const { tagId } = req.body;
    
    // Verify the tag belongs to the user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: userId,
      },
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found or you do not own this tag',
      });
    }
    
    // Check if the tag is already assigned to this plant
    const existingPlantTag = await prisma.plantTag.findFirst({
      where: {
        plantId: plantId!,
        tagId: tagId,
      },
    });
    
    if (existingPlantTag) {
      return res.status(400).json({
        success: false,
        error: 'Tag is already assigned to this plant',
      });
    }
    
    // Assign the tag to the plant
    const plantTag = await prisma.plantTag.create({
      data: {
        plantId: plantId!,
        tagId: tagId,
      },
      include: {
        tag: true,
      },
    });
    
    res.status(201).json({
      success: true,
      data: plantTag,
      message: 'Tag assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning tag to plant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to assign tag to plant',
    });
  }
});

// DELETE /api/plants/:plantId/tags - Unassign a tag from a plant
router.delete('/', authenticateJWT, checkPlantOwnership, validate(unassignTagSchema), async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const { tagId } = req.body;
    
    // Find the plant tag relationship
    const plantTag = await prisma.plantTag.findFirst({
      where: {
        plantId: plantId!,
        tagId: tagId,
      },
      include: {
        tag: true,
      },
    });
    
    if (!plantTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag is not assigned to this plant',
      });
    }
    
    // Remove the tag from the plant
    await prisma.plantTag.delete({
      where: {
        plantId_tagId: {
          plantId: plantId!,
          tagId: tagId!,
        },
      },
    });
    
    res.json({
      success: true,
      data: plantTag,
      message: 'Tag unassigned successfully',
    });
  } catch (error) {
    console.error('Error unassigning tag from plant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to unassign tag from plant',
    });
  }
});

// DELETE /api/plants/:plantId/tags/:tagId - Unassign a specific tag from a plant
router.delete('/:tagId', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const { plantId, tagId } = req.params;
    
    // Find the plant tag relationship
    const plantTag = await prisma.plantTag.findFirst({
      where: {
        plantId: plantId!,
        tagId: tagId!,
      },
      include: {
        tag: true,
      },
    });
    
    if (!plantTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag is not assigned to this plant',
      });
    }
    
    // Remove the tag from the plant
    await prisma.plantTag.delete({
      where: {
        plantId_tagId: {
          plantId: plantId!,
          tagId: tagId!,
        },
      },
    });
    
    res.json({
      success: true,
      data: plantTag,
      message: 'Tag unassigned successfully',
    });
  } catch (error) {
    console.error('Error unassigning tag from plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign tag from plant',
    });
  }
});

export { router as plantTagsRouter };
