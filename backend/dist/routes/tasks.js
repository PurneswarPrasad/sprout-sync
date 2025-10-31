"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const taskSyncService_1 = require("../services/taskSyncService");
const router = (0, express_1.Router)();
exports.tasksRouter = router;
router.get('/', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const { plantId, taskKey, completed, startDate, endDate } = req.query;
        const userId = req.user.userId;
        let whereClause = {
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
        if (startDate) {
            const start = new Date(startDate.toString());
            whereClause.nextDueOn = { ...whereClause.nextDueOn, gte: start };
        }
        if (endDate) {
            const end = new Date(endDate.toString());
            whereClause.nextDueOn = { ...whereClause.nextDueOn, lte: end };
        }
        const tasks = await prisma_1.prisma.plantTask.findMany({
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
        });
        res.json({
            success: true,
            data: tasks,
            count: tasks.length,
        });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tasks',
        });
    }
});
router.get('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = req.params['id'];
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required',
            });
        }
        const userId = req.user.userId;
        const task = await prisma_1.prisma.plantTask.findFirst({
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
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch task',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(dtos_1.createPlantTaskSchema), async (req, res) => {
    try {
        const validatedData = dtos_1.createPlantTaskSchema.parse(req.body);
        const userId = req.user.userId;
        const plant = await prisma_1.prisma.plant.findFirst({
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const task = await prisma_1.prisma.plantTask.create({
            data: {
                plantId: validatedData.plantId,
                taskKey: validatedData.taskKey,
                frequencyDays: validatedData.frequencyDays,
                nextDueOn: today,
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
        taskSyncService_1.taskSyncService.syncTaskToCalendar(task.id).catch(error => {
            console.error('Error syncing task to calendar:', error);
        });
        res.status(201).json({
            success: true,
            data: task,
            message: 'Task created successfully',
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(dtos_1.updatePlantTaskSchema), async (req, res) => {
    try {
        const taskId = req.params['id'];
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required',
            });
        }
        const userId = req.user.userId;
        const validatedData = dtos_1.updatePlantTaskSchema.parse(req.body);
        const task = await prisma_1.prisma.plantTask.findFirst({
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
        const updateData = {};
        if (validatedData.frequencyDays !== undefined)
            updateData.frequencyDays = validatedData.frequencyDays;
        if (validatedData.nextDueOn !== undefined)
            updateData.nextDueOn = new Date(validatedData.nextDueOn);
        if (validatedData.active !== undefined)
            updateData.active = validatedData.active;
        const updatedTask = await prisma_1.prisma.plantTask.update({
            where: { id: taskId },
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
        taskSyncService_1.taskSyncService.updateTaskInCalendar(updatedTask.id).catch(error => {
            console.error('Error updating task in calendar:', error);
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Task updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating task:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const taskId = req.params['id'];
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required',
            });
        }
        const userId = req.user.userId;
        const task = await prisma_1.prisma.plantTask.findFirst({
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
        taskSyncService_1.taskSyncService.removeTaskFromCalendar(taskId).catch(error => {
            console.error('Error removing task from calendar:', error);
        });
        await prisma_1.prisma.plantTask.delete({
            where: { id: taskId },
        });
        res.json({
            success: true,
            data: task,
            message: 'Task deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete task',
        });
    }
});
router.post('/:id/complete', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        console.log(`🎯 TASK COMPLETION ENDPOINT CALLED for task: ${req.params['id']}`);
        const taskId = req.params['id'];
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'Task ID is required',
            });
        }
        const userId = req.user.userId;
        const task = await prisma_1.prisma.plantTask.findFirst({
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDueOn = new Date(today);
        nextDueOn.setDate(today.getDate() + task.frequencyDays);
        const updatedTask = await prisma_1.prisma.plantTask.update({
            where: { id: taskId },
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
        try {
            console.log(`🔄 Task completion sync: Starting sync for task ${taskId}`);
            await taskSyncService_1.taskSyncService.updateTaskInCalendar(taskId);
            console.log(`✅ Task completion sync: Completed sync for task ${taskId}`);
        }
        catch (syncError) {
            console.error(`❌ Task completion sync: Error syncing completed task ${taskId} to Google Calendar:`, syncError);
        }
        res.json({
            success: true,
            data: updatedTask,
            message: 'Task marked as completed',
        });
    }
    catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete task',
        });
    }
});
router.get('/upcoming', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const { days = '7' } = req.query;
        const daysAhead = parseInt(days.toString());
        const userId = req.user.userId;
        const now = new Date();
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const upcomingTasks = await prisma_1.prisma.plantTask.findMany({
            where: {
                plant: {
                    userId: userId,
                },
                nextDueOn: {
                    gte: now,
                    lte: futureDate,
                },
                active: true,
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
            orderBy: {
                nextDueOn: 'asc',
            },
        });
        res.json({
            success: true,
            data: upcomingTasks,
            count: upcomingTasks.length,
        });
    }
    catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch upcoming tasks',
        });
    }
});
router.get('/overdue', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const overdueTasks = await prisma_1.prisma.plantTask.findMany({
            where: {
                plant: {
                    userId: userId,
                },
                nextDueOn: {
                    lt: now,
                },
                active: true,
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
            orderBy: {
                nextDueOn: 'asc',
            },
        });
        res.json({
            success: true,
            data: overdueTasks,
            count: overdueTasks.length,
        });
    }
    catch (error) {
        console.error('Error fetching overdue tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overdue tasks',
        });
    }
});
//# sourceMappingURL=tasks.js.map