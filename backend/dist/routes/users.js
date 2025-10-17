"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const slugify_1 = require("../utils/slugify");
const router = (0, express_1.Router)();
exports.usersRouter = router;
const updateUsernameSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(1, 'Username is required')
        .max(30, 'Username must be 30 characters or less')
        .regex(/^[a-z0-9-]+$/, 'Username can only contain lowercase letters, numbers, and hyphens'),
});
router.get('/profile', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        if (!user.username && user.name) {
            const username = await (0, slugify_1.generateUniqueUsername)(user.name);
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { username },
            });
            user.username = username;
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile',
        });
    }
});
router.patch('/username', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateUsernameSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username } = updateUsernameSchema.parse(req.body);
        const slugifiedUsername = (0, slugify_1.toSlug)(username);
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { username: slugifiedUsername },
        });
        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({
                success: false,
                error: 'Username is already taken',
            });
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { username: slugifiedUsername },
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                avatarUrl: true,
            },
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'Username updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating username:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update username',
        });
    }
});
//# sourceMappingURL=users.js.map