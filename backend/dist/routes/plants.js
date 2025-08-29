"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.plantsRouter = router;
const createPlantWithTasksSchema = dtos_1.createPlantSchema.extend({
    careTasks: zod_1.z.object({
        watering: zod_1.z.object({
            frequency: zod_1.z.number().positive(),
            lastWatered: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
        fertilizing: zod_1.z.object({
            frequency: zod_1.z.number().positive(),
            lastFertilized: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
        pruning: zod_1.z.object({
            frequency: zod_1.z.number().positive(),
            lastPruned: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
        spraying: zod_1.z.object({
            frequency: zod_1.z.number().positive(),
            lastSprayed: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
        sunlightRotation: zod_1.z.object({
            frequency: zod_1.z.number().positive(),
            lastRotated: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
    }).optional(),
});
router.get('/', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { search, health, tag } = req.query;
        const userId = req.user.id;
        let whereClause = {
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
        const plants = await prisma_1.prisma.plant.findMany({
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
    }
    catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plants',
        });
    }
});
router.get('/:id', auth_1.isAuthenticated, async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.id;
        const plant = await prisma_1.prisma.plant.findFirst({
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
    }
    catch (error) {
        console.error('Error fetching plant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant',
        });
    }
});
router.post('/', auth_1.isAuthenticated, (0, validate_1.validate)(createPlantWithTasksSchema), async (req, res) => {
    try {
        const validatedData = createPlantWithTasksSchema.parse(req.body);
        const userId = req.user.id;
        const taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
        const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
        const plant = await prisma_1.prisma.plant.create({
            data: {
                userId: userId,
                name: validatedData.name,
                type: validatedData.type || null,
                acquisitionDate: validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null,
                city: validatedData.city || null,
                tasks: {
                    create: validatedData.careTasks ? Object.entries(validatedData.careTasks)
                        .filter(([, taskData]) => taskData)
                        .map(([taskKey, taskData]) => {
                        const task = taskData;
                        const template = templateMap.get(taskKey);
                        console.log(taskKey, taskData, template);
                        if (!template) {
                            throw new Error(`Invalid task key: ${taskKey}`);
                        }
                        let lastCompletedOn = null;
                        const lastCompletedKey = `last${taskKey.charAt(0).toUpperCase() + taskKey.slice(1)}`;
                        if (lastCompletedKey in task && task[lastCompletedKey]) {
                            lastCompletedOn = new Date(task[lastCompletedKey]);
                        }
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
    }
    catch (error) {
        console.error('Error creating plant:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/:id', auth_1.isAuthenticated, (0, validate_1.validate)(dtos_1.updatePlantSchema), async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.id;
        const validatedData = dtos_1.updatePlantSchema.parse(req.body);
        const plant = await prisma_1.prisma.plant.findFirst({
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
        const updateData = {};
        if (validatedData.name !== undefined)
            updateData.name = validatedData.name;
        if (validatedData.type !== undefined)
            updateData.type = validatedData.type || null;
        if (validatedData.acquisitionDate !== undefined)
            updateData.acquisitionDate = validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null;
        if (validatedData.city !== undefined)
            updateData.city = validatedData.city || null;
        const updatedPlant = await prisma_1.prisma.plant.update({
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
    }
    catch (error) {
        console.error('Error updating plant:', error);
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/:id', auth_1.isAuthenticated, async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.id;
        const plant = await prisma_1.prisma.plant.findFirst({
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
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.plantTask.deleteMany({
                where: { plantId: plantId },
            }),
            prisma_1.prisma.plantTag.deleteMany({
                where: { plantId: plantId },
            }),
            prisma_1.prisma.note.deleteMany({
                where: { plantId: plantId },
            }),
            prisma_1.prisma.photo.deleteMany({
                where: { plantId: plantId },
            }),
            prisma_1.prisma.plant.delete({
                where: { id: plantId },
            }),
        ]);
        res.json({
            success: true,
            data: plant,
            message: 'Plant deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting plant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plant',
        });
    }
});
router.get('/task-templates', auth_1.isAuthenticated, async (req, res) => {
    try {
        const taskTemplates = await prisma_1.prisma.taskTemplate.findMany({
            orderBy: {
                key: 'asc',
            },
        });
        res.json({
            success: true,
            data: taskTemplates,
            count: taskTemplates.length,
        });
    }
    catch (error) {
        console.error('Error fetching task templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch task templates',
        });
    }
});
router.post('/identify', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image is required for plant identification',
            });
        }
        const taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
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
    }
    catch (error) {
        console.error('Error identifying plant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to identify plant',
        });
    }
});
//# sourceMappingURL=plants.js.map