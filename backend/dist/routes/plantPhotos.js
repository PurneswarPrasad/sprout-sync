"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantPhotosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const cloudinaryService_1 = require("../services/cloudinaryService");
const router = (0, express_1.Router)({ mergeParams: true });
exports.plantPhotosRouter = router;
const checkPlantOwnership = async (req, res, next) => {
    try {
        const plantId = req.params['plantId'];
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
router.post('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(dtos_1.createPhotoSchema), async (req, res) => {
    const plantId = req.params['plantId'];
    let validatedData;
    try {
        validatedData = dtos_1.createPhotoSchema.parse(req.body);
        console.log('Plant ID from params:', plantId);
        console.log('Plant ID type:', typeof plantId);
        console.log('All params:', req.params);
        const photo = await prisma_1.prisma.photo.create({
            data: {
                plantId: plantId,
                cloudinaryPublicId: validatedData.cloudinaryPublicId,
                secureUrl: validatedData.secureUrl,
                takenAt: new Date(validatedData.takenAt),
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
        console.error('Plant ID:', plantId);
        console.error('Validated data:', validatedData);
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
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.delete('/:photoId', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const photoId = req.params['photoId'];
        if (!plantId || !photoId) {
            return res.status(400).json({
                success: false,
                error: 'Plant ID and Photo ID are required',
            });
        }
        const existingPhoto = await prisma_1.prisma.photo.findFirst({
            where: {
                id: photoId,
                plantId: plantId,
            },
        });
        if (!existingPhoto) {
            return res.status(404).json({
                success: false,
                error: 'Photo not found',
            });
        }
        if (existingPhoto.cloudinaryPublicId) {
            try {
                await cloudinaryService_1.CloudinaryService.deleteImage(existingPhoto.cloudinaryPublicId);
                console.log(`Deleted photo from Cloudinary: ${existingPhoto.cloudinaryPublicId}`);
            }
            catch (error) {
                console.error('Error deleting photo from Cloudinary:', error);
            }
        }
        await prisma_1.prisma.photo.delete({
            where: {
                id: photoId,
            },
        });
        res.json({
            success: true,
            message: 'Photo deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting plant photo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plant photo',
        });
    }
});
//# sourceMappingURL=plantPhotos.js.map