import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { isAuthenticated } from '../middleware/auth';
import { createPlantSchema, updatePlantSchema } from '../dtos';

const router = Router();

// Extended schema for plant creation with care tasks
const createPlantWithTasksSchema = createPlantSchema.extend({
  careTasks: z.object({
    watering: z.object({
      frequency: z.number().positive(),
      lastWatered: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
    fertilizing: z.object({
      frequency: z.number().positive(),
      lastFertilized: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
    pruning: z.object({
      frequency: z.number().positive(),
      lastPruned: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
    spraying: z.object({
      frequency: z.number().positive(),
      lastSprayed: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
    sunlightRotation: z.object({
      frequency: z.number().positive(),
      lastRotated: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
  }).optional(),
});

// GET /api/plants - Get all plants
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, health, tag } = req.query;
    const userId = (req.user as any).id;
    
    let whereClause: any = {
      userId: userId,
    };
    
    if (search) {
      const searchTerm = search.toString();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { type: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (tag) {
      whereClause.tags = {
        some: {
          tag: {
            name: { equals: tag.toString(), mode: 'insensitive' },
          },
        },
      };
    }
    
    const plants = await prisma.plant.findMany({
      where: whereClause,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        tasks: {
          include: {
            plant: true,
          },
        },
        _count: {
          select: {
            notes: true,
            photos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({
      success: true,
      data: plants,
      count: plants.length,
    });
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plants',
    });
  }
});

// GET /api/plants/:id - Get plant by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId: userId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        tasks: {
          include: {
            plant: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        photos: {
          orderBy: {
            takenAt: 'desc',
          },
        },
        _count: {
          select: {
            notes: true,
            photos: true,
          },
        },
      },
    });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }
    
    res.json({
      success: true,
      data: plant,
    });
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant',
    });
  }
});

// POST /api/plants - Create new plant
router.post('/', isAuthenticated, validate(createPlantWithTasksSchema), async (req, res) => {
  try {
    const validatedData = createPlantWithTasksSchema.parse(req.body) as any;
    const userId = (req.user as any).id;
    
    // Get task templates to validate task keys and get defaults
    const taskTemplates = await prisma.taskTemplate.findMany();
    const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
    
    // Create the plant with tasks
    const plant = await prisma.plant.create({
      data: {
        userId: userId,
        name: validatedData.name as string,
        type: (validatedData.type as string) || null,
        acquisitionDate: (validatedData.acquisitionDate as string) ? new Date(validatedData.acquisitionDate as string) : null,
        city: (validatedData.city as string) || null,
        tasks: {
          create: validatedData.careTasks ? Object.entries(validatedData.careTasks)
            .filter(([, taskData]) => taskData)
            .map(([taskKey, taskData]) => {
              const task = taskData as any;
              const template = templateMap.get(taskKey);

              console.log(taskKey, taskData, template);
              
              if (!template) {
                throw new Error(`Invalid task key: ${taskKey}`);
              }
              
              // Extract last completed date based on task type
              let lastCompletedOn: Date | null = null;
              const lastCompletedKey = `last${taskKey.charAt(0).toUpperCase() + taskKey.slice(1)}`;
              if (lastCompletedKey in task && task[lastCompletedKey]) {
                lastCompletedOn = new Date(task[lastCompletedKey]);
              }
              
              // Calculate nextDueOn: (lastCompletedOn ?? today) + frequencyDays
              const baseDate = lastCompletedOn || new Date();
              const nextDueOn = new Date(baseDate);
              nextDueOn.setDate(nextDueOn.getDate() + task.frequency);
              
              return {
                taskKey,
                frequencyDays: task.frequency,
                nextDueOn,
                lastCompletedOn,
              };
            }) : [],
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        tasks: {
          orderBy: {
            taskKey: 'asc',
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: plant,
      message: 'Plant created successfully',
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create plant',
    });
  }
});

// PUT /api/plants/:id - Update plant
router.put('/:id', isAuthenticated, validate(updatePlantSchema), async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    const validatedData = updatePlantSchema.parse(req.body) as any;
    
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId: userId,
      },
    });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }
    
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type || null;
    if (validatedData.acquisitionDate !== undefined) updateData.acquisitionDate = validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null;
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null;

    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        tasks: true,
      },
    });
    
    res.json({
      success: true,
      data: updatedPlant,
      message: 'Plant updated successfully',
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update plant',
    });
  }
});

// DELETE /api/plants/:id - Delete plant
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId: userId,
      },
    });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }
    
    // Delete all related records first
    await prisma.$transaction([
      // Delete plant tasks
      prisma.plantTask.deleteMany({
        where: { plantId: plantId },
      }),
      // Delete plant tags
      prisma.plantTag.deleteMany({
        where: { plantId: plantId },
      }),
      // Delete notes
      prisma.note.deleteMany({
        where: { plantId: plantId },
      }),
      // Delete photos
      prisma.photo.deleteMany({
        where: { plantId: plantId },
      }),
      // Finally delete the plant
      prisma.plant.delete({
        where: { id: plantId },
      }),
    ]);
    
    res.json({
      success: true,
      data: plant,
      message: 'Plant deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plant',
    });
  }
});

// GET /api/plants/task-templates - Get available task templates
router.get('/task-templates', isAuthenticated, async (req, res) => {
  try {
    const taskTemplates = await prisma.taskTemplate.findMany({
      orderBy: {
        key: 'asc',
      },
    });
    
    res.json({
      success: true,
      data: taskTemplates,
      count: taskTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching task templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task templates',
    });
  }
});

// POST /api/plants/identify - Identify plant from image
router.post('/identify', isAuthenticated, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required for plant identification',
      });
    }
    
    // Get task templates for suggested tasks
    const taskTemplates = await prisma.taskTemplate.findMany();
    
    // Mock plant identification response
    // In production, this would call Google Cloud Vision API or similar
    const mockIdentification = {
      name: 'Monstera Deliciosa',
      type: 'Tropical',
      confidence: 0.95,
      careTips: {
        watering: 'Water when top 2-3 inches of soil is dry',
        sunlight: 'Bright, indirect light',
        temperature: '65-85°F (18-29°C)',
        humidity: 'High humidity preferred',
      },
      suggestedTasks: taskTemplates.map(template => ({
        key: template.key,
        label: template.label,
        colorHex: template.colorHex,
        frequency: template.defaultFrequencyDays,
        description: `${template.label} every ${template.defaultFrequencyDays} days`,
      })),
    };
    
    res.json({
      success: true,
      data: mockIdentification,
    });
  } catch (error) {
    console.error('Error identifying plant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to identify plant',
    });
  }
});

export { router as plantsRouter };
