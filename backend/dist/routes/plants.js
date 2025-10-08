"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const cloudinaryService_1 = require("../services/cloudinaryService");
const taskSyncService_1 = require("../services/taskSyncService");
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
            lastWatering: zod_1.z.string().optional().refine((val) => {
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
            lastFertilizing: zod_1.z.string().optional().refine((val) => {
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
            lastPruning: zod_1.z.string().optional().refine((val) => {
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
            lastSpraying: zod_1.z.string().optional().refine((val) => {
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
            lastSunlightRotation: zod_1.z.string().optional().refine((val) => {
                if (!val)
                    return true;
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, 'Invalid date format'),
        }).optional(),
    }).optional(),
});
router.get('/', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const { search, health, tag } = req.query;
        const userId = req.user.userId;
        let whereClause = {
            userId: userId,
            isGifted: false,
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
                photos: {
                    orderBy: {
                        takenAt: 'desc',
                    },
                    take: 1,
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
router.get('/gifted', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const plants = await prisma_1.prisma.plant.findMany({
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
                    take: 1,
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
    }
    catch (error) {
        console.error('Error fetching gifted plants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gifted plants',
        });
    }
});
router.get('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.userId;
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
router.post('/', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(createPlantWithTasksSchema), async (req, res) => {
    try {
        console.log('Received plant creation request:', JSON.stringify(req.body, null, 2));
        const validatedData = createPlantWithTasksSchema.parse(req.body);
        const userId = req.user.userId;
        let taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
        console.log('Available task templates:', taskTemplates.map(t => t.key));
        if (taskTemplates.length === 0) {
            console.log('No task templates found, creating defaults...');
            const defaultTemplates = [
                { key: 'watering', label: 'Water', colorHex: '#3B82F6', defaultFrequencyDays: 3 },
                { key: 'fertilizing', label: 'Fertilizing', colorHex: '#8B5CF6', defaultFrequencyDays: 14 },
                { key: 'pruning', label: 'Pruning', colorHex: '#10B981', defaultFrequencyDays: 30 },
                { key: 'spraying', label: 'Spraying', colorHex: '#F59E0B', defaultFrequencyDays: 7 },
                { key: 'sunlightRotation', label: 'Sunlight Rotation', colorHex: '#F97316', defaultFrequencyDays: 14 },
            ];
            for (const template of defaultTemplates) {
                await prisma_1.prisma.taskTemplate.upsert({
                    where: { key: template.key },
                    update: template,
                    create: template,
                });
            }
            taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
            console.log('Created default task templates:', taskTemplates.map(t => t.key));
        }
        const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
        const plant = await prisma_1.prisma.plant.create({
            data: {
                userId: userId,
                petName: validatedData.petName || null,
                botanicalName: validatedData.botanicalName,
                commonName: validatedData.commonName,
                type: validatedData.type || null,
                acquisitionDate: validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null,
                city: validatedData.city || null,
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
                        const task = taskData;
                        const template = templateMap.get(taskKey);
                        console.log('Processing task key:', taskKey);
                        console.log('Task data:', taskData);
                        if (!template) {
                            console.error(`Task template not found for key: ${taskKey}`);
                            console.error('Available templates:', Array.from(templateMap.keys()));
                            throw new Error(`Invalid task key: ${taskKey}. Available keys: ${Array.from(templateMap.keys()).join(', ')}`);
                        }
                        let lastCompletedOn = null;
                        const lastCompletedKey = `last${taskKey.charAt(0).toUpperCase() + taskKey.slice(1)}`;
                        if (lastCompletedKey in task && task[lastCompletedKey]) {
                            lastCompletedOn = new Date(task[lastCompletedKey]);
                            lastCompletedOn.setHours(0, 0, 0, 0);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (lastCompletedOn > today) {
                                console.warn(`Last completed date for ${taskKey} is in the future, setting to today`);
                                lastCompletedOn = new Date(today);
                            }
                        }
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        let nextDueOn;
                        if (lastCompletedOn) {
                            const calculatedNextDue = new Date(lastCompletedOn);
                            calculatedNextDue.setDate(calculatedNextDue.getDate() + task.frequency);
                            console.log(`Task ${taskKey}: lastCompletedOn=${lastCompletedOn.toISOString().split('T')[0]}, frequency=${task.frequency}, calculatedNextDue=${calculatedNextDue.toISOString().split('T')[0]}, today=${today.toISOString().split('T')[0]}`);
                            if (calculatedNextDue.getTime() === today.getTime()) {
                                nextDueOn = new Date(today);
                                console.log(`Task ${taskKey}: Task is due today`);
                            }
                            else if (calculatedNextDue < today) {
                                nextDueOn = calculatedNextDue;
                                console.log(`Task ${taskKey}: Task is overdue (was due on ${nextDueOn.toISOString().split('T')[0]})`);
                            }
                            else {
                                nextDueOn = calculatedNextDue;
                                console.log(`Task ${taskKey}: Task is due in the future on ${nextDueOn.toISOString().split('T')[0]}`);
                            }
                        }
                        else {
                            nextDueOn = new Date(today);
                            console.log(`Task ${taskKey}: No last completed date, task is due today`);
                        }
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
        if (plant.tasks && plant.tasks.length > 0) {
            for (const task of plant.tasks) {
                try {
                    await taskSyncService_1.taskSyncService.syncTaskToCalendar(task.id);
                }
                catch (syncError) {
                    console.error(`Error syncing task ${task.id} to Google Calendar:`, syncError);
                }
            }
        }
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
router.put('/:id', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(dtos_1.updatePlantSchema), async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.userId;
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
        if (validatedData.petName !== undefined)
            updateData.petName = validatedData.petName || null;
        if (validatedData.botanicalName !== undefined)
            updateData.botanicalName = validatedData.botanicalName;
        if (validatedData.commonName !== undefined)
            updateData.commonName = validatedData.commonName;
        if (validatedData.type !== undefined)
            updateData.type = validatedData.type || null;
        if (validatedData.acquisitionDate !== undefined)
            updateData.acquisitionDate = validatedData.acquisitionDate ? new Date(validatedData.acquisitionDate) : null;
        if (validatedData.city !== undefined)
            updateData.city = validatedData.city || null;
        if (validatedData.careLevel !== undefined)
            updateData.careLevel = validatedData.careLevel || null;
        if (validatedData.sunRequirements !== undefined)
            updateData.sunRequirements = validatedData.sunRequirements || null;
        if (validatedData.toxicityLevel !== undefined)
            updateData.toxicityLevel = validatedData.toxicityLevel || null;
        if (validatedData.petFriendliness !== undefined)
            updateData.petFriendliness = validatedData.petFriendliness || null;
        if (validatedData.commonPestsAndDiseases !== undefined)
            updateData.commonPestsAndDiseases = validatedData.commonPestsAndDiseases || null;
        if (validatedData.preventiveMeasures !== undefined)
            updateData.preventiveMeasures = validatedData.preventiveMeasures || null;
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
router.delete('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const plantId = req.params['id'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const userId = req.user.userId;
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
        const photos = await prisma_1.prisma.photo.findMany({
            where: { plantId: plantId },
            select: { cloudinaryPublicId: true }
        });
        const trackingUpdates = await prisma_1.prisma.plantTracking.findMany({
            where: { plantId: plantId },
            select: { cloudinaryPublicId: true }
        });
        for (const photo of photos) {
            try {
                await cloudinaryService_1.CloudinaryService.deleteImage(photo.cloudinaryPublicId);
                console.log(`Deleted plant photo from Cloudinary: ${photo.cloudinaryPublicId}`);
            }
            catch (error) {
                console.error(`Failed to delete plant photo from Cloudinary: ${photo.cloudinaryPublicId}`, error);
            }
        }
        for (const tracking of trackingUpdates) {
            if (tracking.cloudinaryPublicId) {
                try {
                    await cloudinaryService_1.CloudinaryService.deleteImage(tracking.cloudinaryPublicId);
                    console.log(`Deleted tracking photo from Cloudinary: ${tracking.cloudinaryPublicId}`);
                }
                catch (error) {
                    console.error(`Failed to delete tracking photo from Cloudinary: ${tracking.cloudinaryPublicId}`, error);
                }
            }
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
            prisma_1.prisma.plantTracking.deleteMany({
                where: { plantId: plantId },
            }),
            prisma_1.prisma.plantGift.deleteMany({
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
router.get('/task-templates', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        let taskTemplates = await prisma_1.prisma.taskTemplate.findMany({
            orderBy: {
                key: 'asc',
            },
        });
        if (taskTemplates.length === 0) {
            console.log('No task templates found in /task-templates endpoint, creating defaults...');
            const defaultTemplates = [
                { key: 'watering', label: 'Water', colorHex: '#3B82F6', defaultFrequencyDays: 3 },
                { key: 'fertilizing', label: 'Fertilizing', colorHex: '#8B5CF6', defaultFrequencyDays: 14 },
                { key: 'pruning', label: 'Pruning', colorHex: '#10B981', defaultFrequencyDays: 30 },
                { key: 'spraying', label: 'Spraying', colorHex: '#F59E0B', defaultFrequencyDays: 7 },
                { key: 'sunlightRotation', label: 'Sunlight Rotation', colorHex: '#F97316', defaultFrequencyDays: 14 },
            ];
            for (const template of defaultTemplates) {
                await prisma_1.prisma.taskTemplate.upsert({
                    where: { key: template.key },
                    update: template,
                    create: template,
                });
            }
            taskTemplates = await prisma_1.prisma.taskTemplate.findMany({
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
    }
    catch (error) {
        console.error('Error fetching task templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch task templates',
        });
    }
});
//# sourceMappingURL=plants.js.map