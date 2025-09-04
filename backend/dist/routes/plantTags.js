"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantTagsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
exports.plantTagsRouter = router;
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
const assignTagSchema = zod_1.z.object({
    tagId: zod_1.z.string().uuid('Invalid tag ID'),
});
const unassignTagSchema = zod_1.z.object({
    tagId: zod_1.z.string().uuid('Invalid tag ID'),
});
router.get('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const plantTags = await prisma_1.prisma.plantTag.findMany({
            where: {
                plantId: plantId,
            },
            include: {
                tag: true,
            },
            orderBy: {
                tag: {
                    name: 'asc',
                },
            },
        });
        res.json({
            success: true,
            data: plantTags,
            count: plantTags.length,
        });
    }
    catch (error) {
        console.error('Error fetching plant tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant tags',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(assignTagSchema), async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const userId = req.user.userId;
        const { tagId } = req.body;
        const tag = await prisma_1.prisma.tag.findFirst({
            where: {
                id: tagId,
                userId: userId,
            },
        });
        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found or you do not own this tag',
            });
        }
        const existingPlantTag = await prisma_1.prisma.plantTag.findFirst({
            where: {
                plantId: plantId,
                tagId: tagId,
            },
        });
        if (existingPlantTag) {
            return res.status(400).json({
                success: false,
                error: 'Tag is already assigned to this plant',
            });
        }
        const plantTag = await prisma_1.prisma.plantTag.create({
            data: {
                plantId: plantId,
                tagId: tagId,
            },
            include: {
                tag: true,
            },
        });
        res.status(201).json({
            success: true,
            data: plantTag,
            message: 'Tag assigned successfully',
        });
    }
    catch (error) {
        console.error('Error assigning tag to plant:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to assign tag to plant',
        });
    }
});
router.delete('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(unassignTagSchema), async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const { tagId } = req.body;
        const plantTag = await prisma_1.prisma.plantTag.findFirst({
            where: {
                plantId: plantId,
                tagId: tagId,
            },
            include: {
                tag: true,
            },
        });
        if (!plantTag) {
            return res.status(404).json({
                success: false,
                error: 'Tag is not assigned to this plant',
            });
        }
        await prisma_1.prisma.plantTag.delete({
            where: {
                plantId_tagId: {
                    plantId: plantId,
                    tagId: tagId,
                },
            },
        });
        res.json({
            success: true,
            data: plantTag,
            message: 'Tag unassigned successfully',
        });
    }
    catch (error) {
        console.error('Error unassigning tag from plant:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to unassign tag from plant',
        });
    }
});
router.delete('/:tagId', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const { plantId, tagId } = req.params;
        const plantTag = await prisma_1.prisma.plantTag.findFirst({
            where: {
                plantId: plantId,
                tagId: tagId,
            },
            include: {
                tag: true,
            },
        });
        if (!plantTag) {
            return res.status(404).json({
                success: false,
                error: 'Tag is not assigned to this plant',
            });
        }
        await prisma_1.prisma.plantTag.delete({
            where: {
                plantId_tagId: {
                    plantId: plantId,
                    tagId: tagId,
                },
            },
        });
        res.json({
            success: true,
            data: plantTag,
            message: 'Tag unassigned successfully',
        });
    }
    catch (error) {
        console.error('Error unassigning tag from plant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unassign tag from plant',
        });
    }
});
//# sourceMappingURL=plantTags.js.map