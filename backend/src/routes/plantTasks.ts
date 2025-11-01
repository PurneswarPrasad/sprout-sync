import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { createPlantTaskWithoutIdsSchema, updatePlantTaskSchema } from '../dtos';
import { taskSyncService } from '../services/taskSyncService';
import { resolveUserTimezone, startOfDayInTimezone, startOfDayPlusDaysInTimezone } from '../utils/timezone';

const router = Router({ mergeParams: true });

const getAuthenticatedUserId = (req: any): string => {
  const userId = req.user?.userId ?? req.user?.id;
  if (!userId) {
    throw new Error('Authenticated user is missing identifier');
  }
  return userId;
};

// Middleware to check if user owns the plant
const checkPlantOwnership = async (req: any, res: any, next: any) => {
  try {
    const plantId = req.params.plantId;
    let userId: string;
    try {
      userId = getAuthenticatedUserId(req);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Missing user identifier.',
      });
    }
    
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
    const preferredTimezone = req.headers['x-user-timezone'];
    req.userTimezone = await resolveUserTimezone(userId, preferredTimezone);
    next();
  } catch (error) {
    console.error('Error checking plant ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify plant ownership',
    });
  }
};

// GET /api/plants/:plantId/tasks - Get all tasks for a specific plant
router.get('/', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const { taskKey, completed, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;
    
    let whereClause: any = {
      plantId: plantId,
    };
    
    if (taskKey) {
      whereClause.taskKey = taskKey.toString();
    }
    
    // Removed: lastCompletedOn filtering (field no longer exists)
    
    const [tasks, totalCount] = await Promise.all([
      prisma.plantTask.findMany({
        where: whereClause,
        include: {
          plant: {
            select: {
              id: true,
              petName: true,
              botanicalName: true,
              commonName: true,
              type: true,
            },
          },
        },
        orderBy: {
          nextDueOn: 'asc',
        },
        skip,
        take: limitNum,
      }),
      prisma.plantTask.count({
        where: whereClause,
      }),
    ]);
    
    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching plant tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant tasks',
    });
  }
});

// POST /api/plants/:plantId/tasks - Create new task for a specific plant
router.post('/', authenticateJWT, checkPlantOwnership, validate(createPlantTaskWithoutIdsSchema), async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const validatedData = createPlantTaskWithoutIdsSchema.parse(req.body);
    
    // Override plantId to ensure it matches the URL parameter
    const requestContext = req as any;
    const userTimezone =
      requestContext.userTimezone ??
      (await resolveUserTimezone(getAuthenticatedUserId(req), req.headers['x-user-timezone']));
    const creationMoment = new Date();
    // New tasks should appear in today's tasks (user's timezone)
    const nextDueOn = startOfDayInTimezone(userTimezone, creationMoment);
    
    const task = await prisma.plantTask.create({
      data: {
        plantId: plantId!,
        taskKey: validatedData.taskKey,
        frequencyDays: validatedData.frequencyDays,
        nextDueOn, // New tasks appear in today's tasks (user's timezone)
      },
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    // Trigger Google Calendar sync if enabled
    taskSyncService.syncTaskToCalendar(task.id).catch(error => {
      console.error('Error syncing task to calendar:', error);
    });
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Error creating plant task:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create plant task',
    });
  }
});

// GET /api/plants/:plantId/tasks/:taskId - Get specific task for a plant
router.get('/:taskId', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const { plantId, taskId } = req.params;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId!,
        plantId: plantId!,
      },
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching plant task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant task',
    });
  }
});

// PUT /api/plants/:plantId/tasks/:taskId - Update specific task for a plant
router.put('/:taskId', authenticateJWT, checkPlantOwnership, validate(updatePlantTaskSchema), async (req, res) => {
  try {
    const { plantId, taskId } = req.params;
    const validatedData = updatePlantTaskSchema.parse(req.body);
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId!,
        plantId: plantId!,
      },
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    const updateData: any = {};
    if (validatedData.frequencyDays !== undefined) updateData.frequencyDays = validatedData.frequencyDays;
    if (validatedData.nextDueOn !== undefined) updateData.nextDueOn = new Date(validatedData.nextDueOn);
    if (validatedData.active !== undefined) updateData.active = validatedData.active;
    
    const updatedTask = await prisma.plantTask.update({
      where: { id: taskId! },
      data: updateData,
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    // Trigger Google Calendar sync if enabled
    taskSyncService.updateTaskInCalendar(updatedTask.id).catch(error => {
      console.error('Error updating task in calendar:', error);
    });
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error updating plant task:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update plant task',
    });
  }
});

// DELETE /api/plants/:plantId/tasks/:taskId - Delete specific task for a plant
router.delete('/:taskId', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const { plantId, taskId } = req.params;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId!,
        plantId: plantId!,
      },
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    // Trigger Google Calendar sync removal if enabled
    try {
      await taskSyncService.removeTaskFromCalendar(taskId!);
    } catch (error) {
      console.error('Error removing task from calendar:', error);
    }
    
    await prisma.plantTask.delete({
      where: { id: taskId! },
    });
    
    res.json({
      success: true,
      data: task,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plant task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plant task',
    });
  }
});

// POST /api/plants/:plantId/tasks/:taskId/complete - Mark task as completed
router.post('/:taskId/complete', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const { plantId, taskId } = req.params;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId!,
        plantId: plantId!,
      },
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    // Calculate next due date based on the user's timezone
    const requestContext = req as any;
    const userTimezone =
      requestContext.userTimezone ??
      (await resolveUserTimezone(getAuthenticatedUserId(req), req.headers['x-user-timezone']));
    const nextDueOn = startOfDayPlusDaysInTimezone(userTimezone, task.frequencyDays, new Date());
    
    const updatedTask = await prisma.plantTask.update({
      where: { id: taskId! },
      data: {
        nextDueOn,
      },
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    // Schedule next notification
    try {
      const { notificationService } = await import('../services/notificationService');
      await notificationService.scheduleNextTaskNotification(taskId!);
    } catch (notifError) {
      console.error('Error scheduling next task notification:', notifError);
      // Don't fail the request if notification scheduling fails
    }
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task marked as completed',
    });
  } catch (error) {
    console.error('Error completing plant task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete plant task',
    });
  }
});

// POST /api/plants/:plantId/tasks/:taskId/reschedule - Reschedule task
router.post('/:taskId/reschedule', authenticateJWT, checkPlantOwnership, async (req, res) => {
  try {
    const { plantId, taskId } = req.params;
    const { nextDueOn } = req.body;
    
    if (!nextDueOn) {
      return res.status(400).json({
        success: false,
        error: 'Next due date is required',
      });
    }
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId!,
        plantId: plantId!,
      },
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    
    const updatedTask = await prisma.plantTask.update({
      where: { id: taskId! },
      data: {
        nextDueOn: new Date(nextDueOn),
      },
      include: {
        plant: {
          select: {
            id: true,
            petName: true,
            botanicalName: true,
            commonName: true,
            type: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      data: updatedTask,
      message: 'Task rescheduled successfully',
    });
  } catch (error) {
    console.error('Error rescheduling plant task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule plant task',
    });
  }
});

export { router as plantTasksRouter };
