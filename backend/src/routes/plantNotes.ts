import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { createNoteSchema } from '../dtos';

const router = Router();

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

// GET /api/plants/:plantId/notes - Get all notes for a specific plant
router.get('/', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const { taskKey, preset, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;
    
    let whereClause: any = {
      plantId: plantId,
    };
    
    if (taskKey) {
      whereClause.taskKey = taskKey.toString();
    }
    
    if (preset) {
      whereClause.preset = preset.toString();
    }
    
    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.note.count({
        where: whereClause,
      }),
    ]);
    
    res.json({
      success: true,
      data: notes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching plant notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant notes',
    });
  }
});

// POST /api/plants/:plantId/notes - Create new note for a specific plant
router.post('/', authenticateJWT, checkPlantOwnership, validate(createNoteSchema), async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const validatedData = createNoteSchema.parse(req.body);
    
    // Override plantId to ensure it matches the URL parameter
    const note = await prisma.note.create({
      data: {
        plantId: plantId!,
        taskKey: validatedData.taskKey || null,
        body: validatedData.body,
        preset: validatedData.preset || null,
      },
    });
    
    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Error creating plant note:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create plant note',
    });
  }
});

export { router as plantNotesRouter };
