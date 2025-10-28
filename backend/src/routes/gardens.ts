import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();

// Schema for adding a comment
const addCommentSchema = z.object({
  comment: z.string().min(1).max(500),
});

// POST /api/gardens/:gardenOwnerId/appreciate - Toggle appreciation for a garden
router.post('/:gardenOwnerId/appreciate', authenticateJWT, async (req, res) => {
  try {
    const gardenOwnerId = req.params['gardenOwnerId'] as string;
    const userId = (req.user as any).userId;

    if (!gardenOwnerId) {
      return res.status(400).json({
        success: false,
        error: 'Garden owner ID is required',
      });
    }

    // Check if the garden owner exists
    const gardenOwner = await prisma.user.findUnique({
      where: { id: gardenOwnerId },
    });

    if (!gardenOwner) {
      return res.status(404).json({
        success: false,
        error: 'Garden owner not found',
      });
    }

    // Check if already appreciated
    const existingAppreciation = await prisma.gardenAppreciation.findUnique({
      where: {
        gardenOwnerId_userId: {
          gardenOwnerId,
          userId,
        },
      },
    });

    if (existingAppreciation) {
      // Remove appreciation
      await prisma.gardenAppreciation.delete({
        where: { id: existingAppreciation.id },
      });

      return res.json({
        success: true,
        data: { appreciated: false },
        message: 'Appreciation removed',
      });
    } else {
      // Add appreciation
      await prisma.gardenAppreciation.create({
        data: {
          gardenOwnerId,
          userId,
        },
      });

      return res.json({
        success: true,
        data: { appreciated: true },
        message: 'Appreciation added',
      });
    }
  } catch (error) {
    console.error('Error toggling garden appreciation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle appreciation',
    });
  }
});

// POST /api/gardens/:gardenOwnerId/comments - Add a comment to a garden
router.post('/:gardenOwnerId/comments', authenticateJWT, validate(addCommentSchema), async (req, res) => {
  try {
    const gardenOwnerId = req.params['gardenOwnerId'] as string;
    const { comment } = req.body;
    const userId = (req.user as any).userId;

    if (!gardenOwnerId) {
      return res.status(400).json({
        success: false,
        error: 'Garden owner ID is required',
      });
    }

    // Check if the garden owner exists
    const gardenOwner = await prisma.user.findUnique({
      where: { id: gardenOwnerId },
    });

    if (!gardenOwner) {
      return res.status(404).json({
        success: false,
        error: 'Garden owner not found',
      });
    }

    // Create the comment
    const newComment = await prisma.gardenComment.create({
      data: {
        gardenOwnerId,
        userId,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: newComment.id,
        comment: newComment.comment,
        createdAt: newComment.createdAt,
        user: newComment.user,
      },
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error adding garden comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

export { router as gardensRouter };


