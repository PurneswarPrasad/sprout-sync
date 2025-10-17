"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const healthScore_1 = require("../utils/healthScore");
const router = (0, express_1.Router)();
exports.publicRouter = router;
router.get('/u/:username/:plantSlug', async (req, res) => {
    try {
        const { username, plantSlug } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const plant = await prisma_1.prisma.plant.findFirst({
            where: {
                userId: user.id,
                slug: plantSlug,
            },
            include: {
                tasks: {
                    where: { active: true },
                    orderBy: { taskKey: 'asc' },
                },
                photos: {
                    orderBy: { takenAt: 'desc' },
                    take: 1,
                },
                appreciations: {
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
                },
                comments: {
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
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
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
        const healthScore = (0, healthScore_1.calculateHealthScore)(plant.tasks);
        const careStreak = (0, healthScore_1.calculateCareStreak)(plant.tasks, plant.createdAt);
        const badge = (0, healthScore_1.getBadgeTier)(careStreak);
        const today = new Date();
        const createdDate = new Date(plant.createdAt);
        const daysThriving = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        res.json({
            success: true,
            data: {
                plant: {
                    id: plant.id,
                    petName: plant.petName,
                    botanicalName: plant.botanicalName,
                    commonName: plant.commonName,
                    slug: plant.slug,
                    type: plant.type,
                    city: plant.city,
                    careLevel: plant.careLevel,
                    sunRequirements: plant.sunRequirements,
                    createdAt: plant.createdAt,
                    photo: plant.photos[0] || null,
                },
                owner: plant.user,
                tasks: plant.tasks,
                healthScore,
                careStreak,
                daysThriving,
                badge,
                appreciations: {
                    count: plant.appreciations.length,
                    users: plant.appreciations.map((a) => a.user),
                },
                comments: plant.comments.map((c) => ({
                    id: c.id,
                    comment: c.comment,
                    createdAt: c.createdAt,
                    user: c.user,
                })),
            },
        });
    }
    catch (error) {
        console.error('Error fetching public plant profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant profile',
        });
    }
});
//# sourceMappingURL=public.js.map