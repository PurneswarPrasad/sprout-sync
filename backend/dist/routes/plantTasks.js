"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantTasksRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.plantTasksRouter = router;
const checkPlantOwnership = async (req, res, next) => {
    try {
        const plantId = req.params.plantId;
        const userId = req.user.userId;
        const plant = await prisma_1.prisma.plant.findFirst({
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
    }
    catch (error) {
        console.error('Error checking plant ownership:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify plant ownership',
        });
    }
};
router.get('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const { taskKey, completed, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const skip = (pageNum - 1) * limitNum;
        let whereClause = {
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
            prisma_1.prisma.plantTask.findMany({
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
            prisma_1.prisma.plantTask.count({
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
    }
    catch (error) {
        console.error('Error fetching plant tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant tasks',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(dtos_1.createPlantTaskSchema), async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const validatedData = dtos_1.createPlantTaskSchema.parse(req.body);
        const task = await prisma_1.prisma.plantTask.create({
            data: {
                plantId: plantId,
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
    }
    catch (error) {
        console.error('Error creating plant task:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/:taskId', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const { plantId, taskId } = req.params;
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plantId: plantId,
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
    }
    catch (error) {
        console.error('Error fetching plant task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant task',
        });
    }
});
router.put('/:taskId', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(dtos_1.updatePlantTaskSchema), async (req, res) => {
    try {
        const { plantId, taskId } = req.params;
        const validatedData = dtos_1.updatePlantTaskSchema.parse(req.body);
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plantId: plantId,
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
        if (validatedData.lastCompletedOn !== undefined) {
            updateData.lastCompletedOn = validatedData.lastCompletedOn ? new Date(validatedData.lastCompletedOn) : null;
        }
        if (validatedData.active !== undefined)
            updateData.active = validatedData.active;
        const updatedTask = await prisma_1.prisma.plantTask.update({
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
    }
    catch (error) {
        console.error('Error updating plant task:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:taskId', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const { plantId, taskId } = req.params;
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plantId: plantId,
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
        console.error('Error deleting plant task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plant task',
        });
    }
});
router.post('/:taskId/complete', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const { plantId, taskId } = req.params;
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plantId: plantId,
            },
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        const completionTime = new Date();
        const nextDueOn = new Date(completionTime);
        nextDueOn.setDate(nextDueOn.getDate() + task.frequencyDays);
        const updatedTask = await prisma_1.prisma.plantTask.update({
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
    }
    catch (error) {
        console.error('Error completing plant task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete plant task',
        });
    }
});
router.post('/:taskId/reschedule', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const { plantId, taskId } = req.params;
        const { nextDueOn } = req.body;
        if (!nextDueOn) {
            return res.status(400).json({
                success: false,
                error: 'Next due date is required',
            });
        }
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plantId: plantId,
            },
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        const updatedTask = await prisma_1.prisma.plantTask.update({
            where: { id: taskId },
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
    }
    catch (error) {
        console.error('Error rescheduling plant task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reschedule plant task',
        });
    }
});
//# sourceMappingURL=plantTasks.js.map