"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantGiftsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
exports.plantGiftsRouter = router;
const createGiftSchema = zod_1.z.object({
    plantId: zod_1.z.string().uuid(),
    message: zod_1.z.string().optional(),
});
const acceptGiftSchema = zod_1.z.object({
    giftToken: zod_1.z.string(),
});
router.post('/', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(createGiftSchema), async (req, res) => {
    try {
        const { plantId, message } = req.body;
        const senderId = req.user.userId;
        const plant = await prisma_1.prisma.plant.findFirst({
            where: {
                id: plantId,
                userId: senderId,
            },
            include: {
                tasks: true,
                photos: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (!plant) {
            return res.status(404).json({
                success: false,
                error: 'Plant not found or you do not own this plant',
            });
        }
        if (plant.isGifted) {
            return res.status(400).json({
                success: false,
                error: 'This plant has already been gifted',
            });
        }
        const gift = await prisma_1.prisma.plantGift.create({
            data: {
                plantId,
                senderId,
                message: message || null,
            },
            include: {
                plant: {
                    include: {
                        tasks: true,
                        photos: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        await prisma_1.prisma.plant.update({
            where: { id: plantId },
            data: { isGifted: true },
        });
        res.status(201).json({
            success: true,
            data: gift,
            message: 'Plant gift created successfully',
        });
    }
    catch (error) {
        console.error('Error creating plant gift:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create plant gift',
        });
    }
});
router.get('/gift/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const gift = await prisma_1.prisma.plantGift.findFirst({
            where: {
                giftToken: token,
                status: 'PENDING',
            },
            include: {
                plant: {
                    include: {
                        tasks: true,
                        photos: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!gift) {
            return res.status(404).json({
                success: false,
                error: 'Gift not found or has already been claimed',
            });
        }
        if (gift.expiresAt && new Date() > gift.expiresAt) {
            await prisma_1.prisma.plantGift.update({
                where: { id: gift.id },
                data: { status: 'EXPIRED' },
            });
            return res.status(410).json({
                success: false,
                error: 'This gift has expired',
            });
        }
        res.json({
            success: true,
            data: gift,
        });
    }
    catch (error) {
        console.error('Error fetching gift:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gift',
        });
    }
});
router.post('/accept', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(acceptGiftSchema), async (req, res) => {
    try {
        const { giftToken } = req.body;
        const receiverId = req.user.userId;
        const gift = await prisma_1.prisma.plantGift.findFirst({
            where: {
                giftToken,
                status: 'PENDING',
            },
            include: {
                plant: {
                    include: {
                        tasks: true,
                        photos: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!gift) {
            return res.status(404).json({
                success: false,
                error: 'Gift not found or has already been claimed',
            });
        }
        if (gift.senderId === receiverId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot accept your own gifts',
            });
        }
        if (gift.expiresAt && new Date() > gift.expiresAt) {
            await prisma_1.prisma.plantGift.update({
                where: { id: gift.id },
                data: { status: 'EXPIRED' },
            });
            return res.status(410).json({
                success: false,
                error: 'This gift has expired',
            });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const updatedGift = await tx.plantGift.update({
                where: { id: gift.id },
                data: {
                    status: 'ACCEPTED',
                    receiverId,
                    acceptedAt: new Date(),
                },
            });
            const newPlant = await tx.plant.create({
                data: {
                    userId: receiverId,
                    petName: gift.plant.petName,
                    botanicalName: gift.plant.botanicalName,
                    commonName: gift.plant.commonName,
                    type: gift.plant.type,
                    acquisitionDate: gift.plant.acquisitionDate,
                    city: gift.plant.city,
                    careLevel: gift.plant.careLevel,
                    sunRequirements: gift.plant.sunRequirements,
                    toxicityLevel: gift.plant.toxicityLevel,
                    isGifted: false,
                },
            });
            if (gift.plant.tasks.length > 0) {
                await tx.plantTask.createMany({
                    data: gift.plant.tasks.map(task => ({
                        plantId: newPlant.id,
                        taskKey: task.taskKey,
                        frequencyDays: task.frequencyDays,
                        nextDueOn: task.nextDueOn,
                        active: task.active,
                    })),
                });
            }
            if (gift.plant.photos.length > 0) {
                await tx.photo.createMany({
                    data: gift.plant.photos.map(photo => ({
                        plantId: newPlant.id,
                        cloudinaryPublicId: photo.cloudinaryPublicId,
                        secureUrl: photo.secureUrl,
                        takenAt: photo.takenAt,
                        pointsAwarded: photo.pointsAwarded,
                    })),
                });
            }
            if (gift.plant.tags.length > 0) {
                for (const plantTag of gift.plant.tags) {
                    let receiverTag = await tx.tag.findFirst({
                        where: {
                            userId: receiverId,
                            name: plantTag.tag.name,
                        },
                    });
                    if (!receiverTag) {
                        receiverTag = await tx.tag.create({
                            data: {
                                userId: receiverId,
                                name: plantTag.tag.name,
                                colorHex: plantTag.tag.colorHex,
                            },
                        });
                    }
                    await tx.plantTag.create({
                        data: {
                            plantId: newPlant.id,
                            tagId: receiverTag.id,
                        },
                    });
                }
            }
            return { updatedGift, newPlant };
        });
        res.json({
            success: true,
            data: result,
            message: 'Plant gift accepted successfully',
        });
    }
    catch (error) {
        console.error('Error accepting plant gift:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to accept plant gift',
        });
    }
});
router.get('/sent', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const gifts = await prisma_1.prisma.plantGift.findMany({
            where: { senderId },
            include: {
                plant: {
                    include: {
                        tasks: true,
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
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json({
            success: true,
            data: gifts,
            count: gifts.length,
        });
    }
    catch (error) {
        console.error('Error fetching sent gifts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sent gifts',
        });
    }
});
router.get('/received', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const receiverId = req.user.userId;
        const gifts = await prisma_1.prisma.plantGift.findMany({
            where: {
                receiverId,
                status: 'ACCEPTED',
            },
            include: {
                plant: {
                    include: {
                        tasks: true,
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
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                acceptedAt: 'desc',
            },
        });
        res.json({
            success: true,
            data: gifts,
            count: gifts.length,
        });
    }
    catch (error) {
        console.error('Error fetching received gifts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch received gifts',
        });
    }
});
router.delete('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const giftId = req.params['id'];
        if (!giftId) {
            return res.status(400).json({
                success: false,
                error: 'Gift ID is required',
            });
        }
        const userId = req.user.userId;
        const gift = await prisma_1.prisma.plantGift.findFirst({
            where: {
                id: giftId,
                senderId: userId,
                status: 'PENDING',
            },
        });
        if (!gift) {
            return res.status(404).json({
                success: false,
                error: 'Gift not found or cannot be cancelled',
            });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.plantGift.update({
                where: { id: giftId },
                data: { status: 'CANCELLED' },
            });
            await tx.plant.update({
                where: { id: gift.plantId },
                data: { isGifted: false },
            });
        });
        res.json({
            success: true,
            message: 'Gift cancelled successfully',
        });
    }
    catch (error) {
        console.error('Error cancelling gift:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel gift',
        });
    }
});
//# sourceMappingURL=plantGifts.js.map