import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { isAuthenticated } from '../middleware/auth';
import { createPlantTaskSchema, updatePlantTaskSchema } from '../dtos';

const router = Router();

// GET /api/tasks - Get all tasks
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { plantId, taskKey, completed, startDate, endDate } = req.query;
    const userId = (req.user as any).id;
    
    let whereClause: any = {
      plant: {
        userId: userId,
      },
    };
    
    if (plantId) {
      whereClause.plantId = plantId.toString();
    }
    
    if (taskKey) {
      whereClause.taskKey = taskKey.toString();
    }
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      whereClause.lastCompletedOn = isCompleted ? { not: null } : null;
    }
    
    if (startDate) {
      const start = new Date(startDate.toString());
      whereClause.nextDueOn = { ...whereClause.nextDueOn, gte: start };
    }
    
    if (endDate) {
      const end = new Date(endDate.toString());
      whereClause.nextDueOn = { ...whereClause.nextDueOn, lte: end };
    }
    
    const tasks = await prisma.plantTask.findMany({
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
    });
    
    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params['id'];
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId,
        plant: {
          userId: userId,
        },
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
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', isAuthenticated, validate(createPlantTaskSchema), async (req, res) => {
  try {
    const validatedData = createPlantTaskSchema.parse(req.body);
    const userId = (req.user as any).id;
    
    // Verify the plant belongs to the user
    const plant = await prisma.plant.findFirst({
      where: {
        id: validatedData.plantId,
        userId: userId,
      },
    });
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }
    
    const task = await prisma.plantTask.create({
      data: {
        plantId: validatedData.plantId,
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
    console.error('Error creating task:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', isAuthenticated, validate(updatePlantTaskSchema), async (req, res) => {
  try {
    const taskId = req.params['id'];
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    const validatedData = updatePlantTaskSchema.parse(req.body);
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId,
        plant: {
          userId: userId,
        },
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
      where: { id: taskId },
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
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params['id'];
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId,
        plant: {
          userId: userId,
        },
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
      where: { id: taskId },
    });
    
    res.json({
      success: true,
      data: task,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    });
  }
});

// POST /api/tasks/:id/complete - Mark task as completed
router.post('/:id/complete', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params['id'];
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }
    
    const userId = (req.user as any).id;
    
    const task = await prisma.plantTask.findFirst({
      where: {
        id: taskId,
        plant: {
          userId: userId,
        },
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
      where: { id: taskId },
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
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete task',
    });
  }
});

// GET /api/tasks/upcoming - Get upcoming tasks
router.get('/upcoming', isAuthenticated, async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const daysAhead = parseInt(days.toString());
    const userId = (req.user as any).id;
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    const upcomingTasks = await prisma.plantTask.findMany({
      where: {
        plant: {
          userId: userId,
        },
        nextDueOn: {
          gte: now,
          lte: futureDate,
        },
        lastCompletedOn: null,
        active: true,
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
      orderBy: {
        nextDueOn: 'asc',
      },
    });
    
    res.json({
      success: true,
      data: upcomingTasks,
      count: upcomingTasks.length,
    });
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming tasks',
    });
  }
});

// GET /api/tasks/overdue - Get overdue tasks
router.get('/overdue', isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const now = new Date();
    
    const overdueTasks = await prisma.plantTask.findMany({
      where: {
        plant: {
          userId: userId,
        },
        nextDueOn: {
          lt: now,
        },
        lastCompletedOn: null,
        active: true,
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
      orderBy: {
        nextDueOn: 'asc',
      },
    });
    
    res.json({
      success: true,
      data: overdueTasks,
      count: overdueTasks.length,
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue tasks',
    });
  }
});

export { router as tasksRouter };
