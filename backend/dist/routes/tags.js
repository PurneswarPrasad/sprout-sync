"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.tagsRouter = router;
const updateTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Tag name is required'),
    colorHex: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex format').optional(),
});
router.get('/', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const skip = (pageNum - 1) * limitNum;
        const [tags, totalCount] = await Promise.all([
            prisma_1.prisma.tag.findMany({
                where: {
                    userId: userId,
                },
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limitNum,
                include: {
                    _count: {
                        select: {
                            plants: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.tag.count({
                where: {
                    userId: userId,
                },
            }),
        ]);
        res.json({
            success: true,
            data: tags,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tags',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(dtos_1.createTagSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = dtos_1.createTagSchema.parse(req.body);
        const tag = await prisma_1.prisma.tag.create({
            data: {
                userId: userId,
                name: validatedData.name,
                colorHex: validatedData.colorHex || null,
            },
        });
        res.status(201).json({
            success: true,
            data: tag,
            message: 'Tag created successfully',
        });
    }
    catch (error) {
        console.error('Error creating tag:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create tag',
        });
    }
});
router.get('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const tagId = req.params['id'];
        const userId = req.user.userId;
        const tag = await prisma_1.prisma.tag.findFirst({
            where: {
                id: tagId,
                userId: userId,
            },
            include: {
                plants: {
                    include: {
                        plant: {
                            select: {
                                id: true,
                                petName: true,
                                botanicalName: true,
                                commonName: true,
                                type: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        plants: true,
                    },
                },
            },
        });
        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found',
            });
        }
        res.json({
            success: true,
            data: tag,
        });
    }
    catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tag',
        });
    }
});
router.put('/:id', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateTagSchema), async (req, res) => {
    try {
        const tagId = req.params['id'];
        const userId = req.user.userId;
        const validatedData = updateTagSchema.parse(req.body);
        const tag = await prisma_1.prisma.tag.findFirst({
            where: {
                id: tagId,
                userId: userId,
            },
        });
        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found',
            });
        }
        const updateData = {};
        if (validatedData.name !== undefined)
            updateData.name = validatedData.name;
        if (validatedData.colorHex !== undefined)
            updateData.colorHex = validatedData.colorHex || null;
        const updatedTag = await prisma_1.prisma.tag.update({
            where: { id: tagId },
            data: updateData,
        });
        res.json({
            success: true,
            data: updatedTag,
            message: 'Tag updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating tag:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update tag',
        });
    }
});
router.delete('/:id', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const tagId = req.params['id'];
        const userId = req.user.userId;
        const tag = await prisma_1.prisma.tag.findFirst({
            where: {
                id: tagId,
                userId: userId,
            },
        });
        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found',
            });
        }
        await prisma_1.prisma.tag.delete({
            where: { id: tagId },
        });
        res.json({
            success: true,
            data: tag,
            message: 'Tag deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete tag',
        });
    }
});
//# sourceMappingURL=tags.js.map