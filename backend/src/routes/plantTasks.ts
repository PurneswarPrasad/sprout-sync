import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { isAuthenticated } from '../middleware/auth';
import { createPlantTaskSchema, updatePlantTaskSchema } from '../dtos';

const router = Router();

// Middleware to check if user owns the plant
const checkPlantOwnership = async (req: any, res: any, next: any) => {
  try {
    const plantId = req.params.plantId;
    const userId = (req.user as any).id;
    
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

// GET /api/plants/:plantId/tasks - Get all tasks for a specific plant
router.get('/', isAuthenticated, checkPlantOwnership, async (req, res) => {
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
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      whereClause.lastCompletedOn = isCompleted ? { not: null } : null;
    }
    
    const [tasks, totalCount] = await Promise.all([
      prisma.plantTask.findMany({
        where: whereClause,
        include: {
          plant: {
            select: {
              id: true,
              name: true,
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
router.post('/', isAuthenticated, checkPlantOwnership, validate(createPlantTaskSchema), async (req, res) => {
  try {
    const plantId = req.params['plantId'];
    const validatedData = createPlantTaskSchema.parse(req.body);
    
    // Override plantId to ensure it matches the URL parameter
    const task = await prisma.plantTask.create({
      data: {
        plantId: plantId!,
        taskKey: validatedData.taskKey,
        frequencyDays: validatedData.frequencyDays,
        nextDueOn: new Date(validatedData.nextDueOn),
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Error creating plant task:', error);
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
router.get('/:taskId', isAuthenticated, checkPlantOwnership, async (req, res) => {
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
            name: true,
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
router.put('/:taskId', isAuthenticated, checkPlantOwnership, validate(updatePlantTaskSchema), async (req, res) => {
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
    if (validatedData.lastCompletedOn !== undefined) {
      updateData.lastCompletedOn = validatedData.lastCompletedOn ? new Date(validatedData.lastCompletedOn) : null;
    }
    if (validatedData.active !== undefined) updateData.active = validatedData.active;
    
    const updatedTask = await prisma.plantTask.update({
      where: { id: taskId! },
      data: updateData,
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
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
router.delete('/:taskId', isAuthenticated, checkPlantOwnership, async (req, res) => {
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
            name: true,
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
router.post('/:taskId/complete', isAuthenticated, checkPlantOwnership, async (req, res) => {
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
    
    // Calculate next due date
    const nextDueOn = new Date();
    nextDueOn.setDate(nextDueOn.getDate() + task.frequencyDays);
    
    const updatedTask = await prisma.plantTask.update({
      where: { id: taskId! },
      data: {
        lastCompletedOn: new Date(),
        nextDueOn,
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
    
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
router.post('/:taskId/reschedule', isAuthenticated, checkPlantOwnership, async (req, res) => {
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
            name: true,
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
