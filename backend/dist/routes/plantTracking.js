"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)({ mergeParams: true });
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
        console.log('Route params:', req.params);
        console.log('Full URL:', req.originalUrl);
        const plantId = req.params['plantId'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const { page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const skip = (pageNum - 1) * limitNum;
        const [trackingUpdates, totalCount] = await Promise.all([
            prisma_1.prisma.plantTracking.findMany({
                where: {
                    plantId: plantId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limitNum,
            }),
            prisma_1.prisma.plantTracking.count({
                where: {
                    plantId: plantId,
                },
            }),
        ]);
        res.json({
            success: true,
            data: trackingUpdates,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Error fetching plant tracking updates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant tracking updates',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(dtos_1.createPlantTrackingSchema), async (req, res) => {
    try {
        console.log('POST Route params:', req.params);
        console.log('POST Full URL:', req.originalUrl);
        const plantId = req.params['plantId'];
        if (!plantId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID is required',
            });
        }
        const validatedData = dtos_1.createPlantTrackingSchema.parse(req.body);
        const trackingUpdate = await prisma_1.prisma.plantTracking.create({
            data: {
                plantId: plantId,
                date: validatedData.date,
                note: validatedData.note,
                photoUrl: validatedData.photoUrl || null,
                cloudinaryPublicId: validatedData.cloudinaryPublicId || null,
            },
        });
        res.status(201).json({
            success: true,
            data: trackingUpdate,
            message: 'Plant tracking update created successfully',
        });
    }
    catch (error) {
        console.error('Error creating plant tracking update:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create plant tracking update',
        });
    }
});
router.delete('/:trackingId', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const trackingId = req.params['trackingId'];
        if (!plantId || !trackingId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID and Tracking ID are required',
            });
        }
        const existingTracking = await prisma_1.prisma.plantTracking.findFirst({
            where: {
                id: trackingId,
                plantId: plantId,
            },
        });
        if (!existingTracking) {
            return res.status(404).json({
                success: false,
                error: 'Tracking update not found',
            });
        }
        await prisma_1.prisma.plantTracking.delete({
            where: {
                id: trackingId,
            },
        });
        res.json({
            success: true,
            message: 'Plant tracking update deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting plant tracking update:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plant tracking update',
        });
    }
});
exports.default = router;
//# sourceMappingURL=plantTracking.js.map