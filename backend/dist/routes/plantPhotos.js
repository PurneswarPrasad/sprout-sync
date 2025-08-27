"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantPhotosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.plantPhotosRouter = router;
const checkPlantOwnership = async (req, res, next) => {
    try {
        const plantId = req.params.plantId;
        const userId = req.user.id;
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
router.get('/', auth_1.isAuthenticated, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const { page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const skip = (pageNum - 1) * limitNum;
        const [photos, totalCount] = await Promise.all([
            prisma_1.prisma.photo.findMany({
                where: {
                    plantId: plantId,
                },
                orderBy: {
                    takenAt: 'desc',
                },
                skip,
                take: limitNum,
            }),
            prisma_1.prisma.photo.count({
                where: {
                    plantId: plantId,
                },
            }),
        ]);
        res.json({
            success: true,
            data: photos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Error fetching plant photos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant photos',
        });
    }
});
router.post('/', auth_1.isAuthenticated, checkPlantOwnership, (0, validate_1.validate)(dtos_1.createPhotoSchema), async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const validatedData = dtos_1.createPhotoSchema.parse(req.body);
        const photo = await prisma_1.prisma.photo.create({
            data: {
                plantId: plantId,
                cloudinaryPublicId: validatedData.cloudinaryPublicId,
                secureUrl: validatedData.secureUrl,
                takenAt: new Date(validatedData.takenAt),
                pointsAwarded: 10,
            },
        });
        res.status(201).json({
            success: true,
            data: photo,
            message: 'Photo uploaded successfully',
        });
    }
    catch (error) {
        console.error('Error creating plant photo:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create plant photo',
        });
    }
});
//# sourceMappingURL=plantPhotos.js.map