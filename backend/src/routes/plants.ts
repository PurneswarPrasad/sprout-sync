import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { createPlantSchema, updatePlantSchema } from '../dtos';
import { CloudinaryService } from '../services/cloudinaryService';
import { taskSyncService } from '../services/taskSyncService';
import { generatePlantSlug, toSlug } from '../utils/slugify';

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
      lastWatering: z.string().optional().refine((val) => {
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
      lastFertilizing: z.string().optional().refine((val) => {
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
      lastPruning: z.string().optional().refine((val) => {
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
      lastSpraying: z.string().optional().refine((val) => {
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
      lastSunlightRotation: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, 'Invalid date format'),
    }).optional(),
  }).optional(),
});

// GET /api/plants - Get all plants
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { search, health, tag } = req.query;
    const userId = (req.user as any).userId;
    
    let whereClause: any = {
      userId: userId,
      isGifted: false, // Exclude gifted plants from main list
    };
    
    if (search) {
      const searchTerm = search.toString();
      whereClause.OR = [
        { petName: { contains: searchTerm, mode: 'insensitive' } },
        { botanicalName: { contains: searchTerm, mode: 'insensitive' } },
        { commonName: { contains: searchTerm, mode: 'insensitive' } },
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
        photos: {
          orderBy: {
            takenAt: 'desc',
          },
          take: 1, // Only get the most recent photo for the list view
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

// GET /api/plants/task-templates - Get available task templates
router.get('/task-templates', authenticateJWT, async (req, res) => {
  try {
    let taskTemplates = await prisma.taskTemplate.findMany({
      orderBy: {
        key: 'asc',
      },
    });
    
    // If no task templates exist, create default ones
    if (taskTemplates.length === 0) {
      console.log('No task templates found in /task-templates endpoint, creating defaults...');
      const defaultTemplates = [
        { key: 'watering', label: 'Watering', colorHex: '#3B82F6', defaultFrequencyDays: 3 },
        { key: 'fertilizing', label: 'Fertilizing', colorHex: '#8B5CF6', defaultFrequencyDays: 14 },
        { key: 'pruning', label: 'Pruning', colorHex: '#10B981', defaultFrequencyDays: 30 },
        { key: 'spraying', label: 'Spraying', colorHex: '#F59E0B', defaultFrequencyDays: 7 },
        { key: 'sunlightRotation', label: 'Sunlight Rotation', colorHex: '#F97316', defaultFrequencyDays: 14 },
      ];
      
      for (const template of defaultTemplates) {
        await prisma.taskTemplate.upsert({
          where: { key: template.key },
          update: template,
          create: template,
        });
      }
      
      taskTemplates = await prisma.taskTemplate.findMany({
        orderBy: {
          key: 'asc',
        },
      });
    }
    
    console.log('Task templates in database:', taskTemplates.map(t => ({ key: t.key, label: t.label })));
    
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

// GET /api/plants/gifted - Get gifted plants
router.get('/gifted', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    
    const plants = await prisma.plant.findMany({
      where: {
        userId: userId,
        isGifted: true,
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
        photos: {
          orderBy: {
            takenAt: 'desc',
          },
          take: 1, // Only get the most recent photo for the list view
        },
        gift: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
    console.error('Error fetching gifted plants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gifted plants',
    });
  }
});

// GET /api/plants/:id - Get plant by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).userId;
    
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
router.post('/', authenticateJWT, validate(createPlantWithTasksSchema), async (req, res) => {
  try {
    console.log('Received plant creation request:', JSON.stringify(req.body, null, 2));
    const validatedData = createPlantWithTasksSchema.parse(req.body) as any;
    const userId = (req.user as any).userId;
    
    // Get task templates to validate task keys and get defaults
    let taskTemplates = await prisma.taskTemplate.findMany();
    console.log('Available task templates:', taskTemplates.map(t => t.key));
    
    // If no task templates exist, create default ones
    if (taskTemplates.length === 0) {
      console.log('No task templates found, creating defaults...');
      const defaultTemplates = [
        { key: 'watering', label: 'Watering', colorHex: '#3B82F6', defaultFrequencyDays: 3 },
        { key: 'fertilizing', label: 'Fertilizing', colorHex: '#8B5CF6', defaultFrequencyDays: 14 },
        { key: 'pruning', label: 'Pruning', colorHex: '#10B981', defaultFrequencyDays: 30 },
        { key: 'spraying', label: 'Spraying', colorHex: '#F59E0B', defaultFrequencyDays: 7 },
        { key: 'sunlightRotation', label: 'Sunlight Rotation', colorHex: '#F97316', defaultFrequencyDays: 14 },
      ];
      
      for (const template of defaultTemplates) {
        await prisma.taskTemplate.upsert({
          where: { key: template.key },
          update: template,
          create: template,
        });
      }
      
      taskTemplates = await prisma.taskTemplate.findMany();
      console.log('Created default task templates:', taskTemplates.map(t => t.key));
    }
    
    const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
    
    // Generate slug for the plant
    const plantName = (validatedData.petName as string) || (validatedData.commonName as string) || (validatedData.botanicalName as string);
    const slug = await generatePlantSlug(plantName, userId);
    
    // Create the plant with tasks
    const plant = await prisma.plant.create({
      data: {
        userId: userId,
        slug: slug,
        petName: (validatedData.petName as string) || null,
        botanicalName: validatedData.botanicalName as string,
        commonName: validatedData.commonName as string,
        type: (validatedData.type as string) || null,
        acquisitionDate: (validatedData.acquisitionDate as string) ? new Date(validatedData.acquisitionDate as string) : null,
        city: (validatedData.city as string) || null,
        careLevel: validatedData.careLevel || null,
        sunRequirements: validatedData.sunRequirements || null,
        toxicityLevel: validatedData.toxicityLevel || null,
        petFriendliness: validatedData.petFriendliness || null,
        commonPestsAndDiseases: validatedData.commonPestsAndDiseases || null,
        preventiveMeasures: validatedData.preventiveMeasures || null,
        tasks: {
          create: validatedData.careTasks ? Object.entries(validatedData.careTasks)
            .filter(([, taskData]) => taskData)
            .map(([taskKey, taskData]) => {
              const task = taskData as any;
              const template = templateMap.get(taskKey);

              console.log('Processing task key:', taskKey);
              console.log('Task data:', taskData);
              
              if (!template) {
                console.error(`Task template not found for key: ${taskKey}`);
                console.error('Available templates:', Array.from(templateMap.keys()));
                throw new Error(`Invalid task key: ${taskKey}. Available keys: ${Array.from(templateMap.keys()).join(', ')}`);
              }
              
              // New tasks should appear in today's tasks - set nextDueOn to today
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Set to start of day
              
              const nextDueOn = new Date(today);
              
              console.log(`Task ${taskKey}: frequency=${task.frequency}, nextDueOn=${nextDueOn.toISOString().split('T')[0]} (appears in today's tasks)`);
              
              return {
                taskKey,
                frequencyDays: task.frequency,
                nextDueOn,
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
    
    // Sync all tasks to Google Calendar if sync is enabled
    if (plant.tasks && plant.tasks.length > 0) {
      for (const task of plant.tasks) {
        try {
          await taskSyncService.syncTaskToCalendar(task.id);
        } catch (syncError) {
          console.error(`Error syncing task ${task.id} to Google Calendar:`, syncError);
          // Don't fail the request if sync fails
        }
      }
    }
    
    // Send immediate notifications for all tasks
    try {
      const { notificationService } = await import('../services/notificationService');
      await notificationService.sendImmediateTaskNotifications(userId, plant.id);
    } catch (notifError) {
      console.error('Error sending immediate task notifications:', notifError);
      // Don't fail the request if notification fails
    }
    
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

// PUT /api/plants/:id - Update plant(Not implemented yet)
router.put('/:id', authenticateJWT, validate(updatePlantSchema), async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).userId;
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
    if (validatedData.petName !== undefined) updateData.petName = validatedData.petName || null;
    if (validatedData.botanicalName !== undefined) updateData.botanicalName = validatedData.botanicalName;
    if (validatedData.commonName !== undefined) updateData.commonName = validatedData.commonName;
    if (validatedData.type !== undefined) updateData.type = validatedData.type || null;
    if (validatedData.acquisitionDate !== undefined) updateData.acquisitionDate = validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null;
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null;
    if (validatedData.careLevel !== undefined) updateData.careLevel = validatedData.careLevel || null;
    if (validatedData.sunRequirements !== undefined) updateData.sunRequirements = validatedData.sunRequirements || null;
    if (validatedData.toxicityLevel !== undefined) updateData.toxicityLevel = validatedData.toxicityLevel || null;
    if (validatedData.petFriendliness !== undefined) updateData.petFriendliness = validatedData.petFriendliness || null;
    if (validatedData.commonPestsAndDiseases !== undefined) updateData.commonPestsAndDiseases = validatedData.commonPestsAndDiseases || null;
    if (validatedData.preventiveMeasures !== undefined) updateData.preventiveMeasures = validatedData.preventiveMeasures || null;

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
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }
    
    const userId = (req.user as any).userId;
    
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
    
    // First, get all photos to delete from Cloudinary
    const photos = await prisma.photo.findMany({
      where: { plantId: plantId },
      select: { cloudinaryPublicId: true }
    });

    // Get all tracking updates with photos to delete from Cloudinary
    const trackingUpdates = await prisma.plantTracking.findMany({
      where: { plantId: plantId },
      select: { cloudinaryPublicId: true }
    });

    // Delete plant photos from Cloudinary
    for (const photo of photos) {
      try {
        await CloudinaryService.deleteImage(photo.cloudinaryPublicId);
        console.log(`Deleted plant photo from Cloudinary: ${photo.cloudinaryPublicId}`);
      } catch (error) {
        console.error(`Failed to delete plant photo from Cloudinary: ${photo.cloudinaryPublicId}`, error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete tracking photos from Cloudinary
    for (const tracking of trackingUpdates) {
      if (tracking.cloudinaryPublicId) {
        try {
          await CloudinaryService.deleteImage(tracking.cloudinaryPublicId);
          console.log(`Deleted tracking photo from Cloudinary: ${tracking.cloudinaryPublicId}`);
        } catch (error) {
          console.error(`Failed to delete tracking photo from Cloudinary: ${tracking.cloudinaryPublicId}`, error);
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }
    }

    // Delete all related records from database
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
      // Delete tracking updates (health monitoring notes and photos)
      prisma.plantTracking.deleteMany({
        where: { plantId: plantId },
      }),
      // Delete plant gifts (if any)
      prisma.plantGift.deleteMany({
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

// PATCH /api/plants/:id/slug - Update plant slug
const updateSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be 50 characters or less')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
});

router.patch('/:id/slug', authenticateJWT, validate(updateSlugSchema), async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }

    const userId = (req.user as any).userId;
    const { slug } = updateSlugSchema.parse(req.body);

    // Convert to slug format
    const slugified = toSlug(slug);

    // Check if plant exists and belongs to user
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

    // Check if slug is already in use by another plant of this user
    const existingPlant = await prisma.plant.findFirst({
      where: {
        userId,
        slug: slugified,
        NOT: { id: plantId },
      },
    });

    if (existingPlant) {
      return res.status(400).json({
        success: false,
        error: 'Slug is already in use by another plant',
      });
    }

    // Update slug
    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: { slug: slugified },
    });

    res.json({
      success: true,
      data: updatedPlant,
      message: 'Plant slug updated successfully',
    });
  } catch (error) {
    console.error('Error updating plant slug:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update plant slug',
    });
  }
});

// POST /api/plants/:id/appreciate - Toggle appreciation
router.post('/:id/appreciate', authenticateJWT, async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }

    const userId = (req.user as any).userId;

    // Check if plant exists
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }

    // Check if user already appreciated
    const existingAppreciation = await prisma.plantAppreciation.findUnique({
      where: {
        plantId_userId: {
          plantId,
          userId,
        },
      },
    });

    if (existingAppreciation) {
      // Remove appreciation
      await prisma.plantAppreciation.delete({
        where: {
          plantId_userId: {
            plantId,
            userId,
          },
        },
      });

      return res.json({
        success: true,
        data: { appreciated: false },
        message: 'Appreciation removed',
      });
    } else {
      // Add appreciation
      await prisma.plantAppreciation.create({
        data: {
          plantId,
          userId,
        },
      });

      return res.json({
        success: true,
        data: { appreciated: true },
        message: 'Plant appreciated',
      });
    }
  } catch (error) {
    console.error('Error toggling appreciation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle appreciation',
    });
  }
});

// GET /api/plants/:id/appreciations - Get appreciations
router.get('/:id/appreciations', async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }

    const appreciations = await prisma.plantAppreciation.findMany({
      where: { plantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        count: appreciations.length,
        users: appreciations.map((a) => a.user),
      },
    });
  } catch (error) {
    console.error('Error fetching appreciations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appreciations',
    });
  }
});

// POST /api/plants/:id/comments - Add comment
const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment must be 500 characters or less'),
});

router.post('/:id/comments', authenticateJWT, validate(createCommentSchema), async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }

    const userId = (req.user as any).userId;
    const { comment } = createCommentSchema.parse(req.body);

    // Check if plant exists
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    });

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }

    // Create comment
    const newComment = await prisma.plantComment.create({
      data: {
        plantId,
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
      data: newComment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create comment',
    });
  }
});

// GET /api/plants/:id/comments - Get comments
router.get('/:id/comments', async (req, res) => {
  try {
    const plantId = req.params['id'];
    if (!plantId) {
      return res.status(400).json({
        success: false,
        error: 'Plant ID is required',
      });
    }

    const comments = await prisma.plantComment.findMany({
      where: { plantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
    });
  }
});

export { router as plantsRouter };
