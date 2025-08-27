import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { isAuthenticated } from '../middleware/auth';
import { createTagSchema } from '../dtos';

const router = Router();

// Update tag schema (without userId since it's derived from authenticated user)
const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
});

// GET /api/tags - Get all tags for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;
    
    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              plants: true,
            },
          },
        },
      }),
      prisma.tag.count({
        where: {
          userId: userId,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: tags,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags',
    });
  }
});

// POST /api/tags - Create new tag
router.post('/', isAuthenticated, validate(createTagSchema), async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const validatedData = createTagSchema.parse(req.body);
    
    // Override userId to ensure it matches the authenticated user
    const tag = await prisma.tag.create({
      data: {
        userId: userId,
        name: validatedData.name,
        colorHex: validatedData.colorHex || null,
      },
    });
    
    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully',
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create tag',
    });
  }
});

// GET /api/tags/:id - Get specific tag
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const tagId = req.params['id'];
    const userId = (req.user as any).id;
    
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId!,
        userId: userId,
      },
      include: {
        plants: {
          include: {
            plant: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            plants: true,
          },
        },
      },
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      });
    }
    
    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tag',
    });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', isAuthenticated, validate(updateTagSchema), async (req, res) => {
  try {
    const tagId = req.params['id'];
    const userId = (req.user as any).id;
    const validatedData = updateTagSchema.parse(req.body);
    
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId!,
        userId: userId,
      },
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      });
    }
    
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.colorHex !== undefined) updateData.colorHex = validatedData.colorHex || null;
    
    const updatedTag = await prisma.tag.update({
      where: { id: tagId! },
      data: updateData,
    });
    
    res.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully',
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update tag',
    });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const tagId = req.params['id'];
    const userId = (req.user as any).id;
    
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId!,
        userId: userId,
      },
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
      });
    }
    
    // Delete the tag (cascading will handle related records)
    await prisma.tag.delete({
      where: { id: tagId! },
    });
    
    res.json({
      success: true,
      data: tag,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag',
    });
  }
});

export { router as tagsRouter };
