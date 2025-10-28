"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gardensRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
exports.gardensRouter = router;
const addCommentSchema = zod_1.z.object({
    comment: zod_1.z.string().min(1).max(500),
});
router.post('/:gardenOwnerId/appreciate', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const gardenOwnerId = req.params['gardenOwnerId'];
        const userId = req.user.userId;
        if (!gardenOwnerId) {
            return res.status(400).json({
                success: false,
                error: 'Garden owner ID is required',
            });
        }
        const gardenOwner = await prisma_1.prisma.user.findUnique({
            where: { id: gardenOwnerId },
        });
        if (!gardenOwner) {
            return res.status(404).json({
                success: false,
                error: 'Garden owner not found',
            });
        }
        const existingAppreciation = await prisma_1.prisma.gardenAppreciation.findUnique({
            where: {
                gardenOwnerId_userId: {
                    gardenOwnerId,
                    userId,
                },
            },
        });
        if (existingAppreciation) {
            await prisma_1.prisma.gardenAppreciation.delete({
                where: { id: existingAppreciation.id },
            });
            return res.json({
                success: true,
                data: { appreciated: false },
                message: 'Appreciation removed',
            });
        }
        else {
            await prisma_1.prisma.gardenAppreciation.create({
                data: {
                    gardenOwnerId,
                    userId,
                },
            });
            return res.json({
                success: true,
                data: { appreciated: true },
                message: 'Appreciation added',
            });
        }
    }
    catch (error) {
        console.error('Error toggling garden appreciation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to toggle appreciation',
        });
    }
});
router.post('/:gardenOwnerId/comments', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(addCommentSchema), async (req, res) => {
    try {
        const gardenOwnerId = req.params['gardenOwnerId'];
        const { comment } = req.body;
        const userId = req.user.userId;
        if (!gardenOwnerId) {
            return res.status(400).json({
                success: false,
                error: 'Garden owner ID is required',
            });
        }
        const gardenOwner = await prisma_1.prisma.user.findUnique({
            where: { id: gardenOwnerId },
        });
        if (!gardenOwner) {
            return res.status(404).json({
                success: false,
                error: 'Garden owner not found',
            });
        }
        const newComment = await prisma_1.prisma.gardenComment.create({
            data: {
                gardenOwnerId,
                userId,
                comment,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            data: {
                id: newComment.id,
                comment: newComment.comment,
                createdAt: newComment.createdAt,
                user: newComment.user,
            },
            message: 'Comment added successfully',
        });
    }
    catch (error) {
        console.error('Error adding garden comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add comment',
        });
    }
});
//# sourceMappingURL=gardens.js.map