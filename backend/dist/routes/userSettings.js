"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
exports.userSettingsRouter = router;
const updateNewUserFocusSchema = zod_1.z.object({
    hasSeenNewUserFocus: zod_1.z.boolean(),
});
router.get('/', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userSettings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId },
            select: {
                hasSeenNewUserFocus: true,
            }
        });
        if (!userSettings) {
            const newSettings = await prisma_1.prisma.userSettings.create({
                data: {
                    userId,
                    persona: 'PRIMARY',
                    timezone: 'UTC',
                    hasSeenNewUserFocus: false,
                },
                select: {
                    hasSeenNewUserFocus: true,
                }
            });
            return res.json({
                success: true,
                data: newSettings,
            });
        }
        res.json({
            success: true,
            data: userSettings,
        });
    }
    catch (error) {
        console.error('Error getting user settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user settings',
        });
    }
});
router.put('/new-user-focus', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateNewUserFocusSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { hasSeenNewUserFocus } = req.body;
        await prisma_1.prisma.userSettings.upsert({
            where: { userId },
            update: { hasSeenNewUserFocus },
            create: {
                userId,
                persona: 'PRIMARY',
                timezone: 'UTC',
                hasSeenNewUserFocus,
            }
        });
        res.json({
            success: true,
            message: 'New user focus status updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating new user focus status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update new user focus status',
        });
    }
});
//# sourceMappingURL=userSettings.js.map