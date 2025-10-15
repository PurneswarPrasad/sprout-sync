"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const notificationService_1 = require("../services/notificationService");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
exports.notificationsRouter = router;
const saveFcmTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1, 'FCM token is required'),
});
const updateNotificationSettingsSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
});
router.post('/token', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(saveFcmTokenSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { fcmToken } = req.body;
        await notificationService_1.notificationService.saveUserToken(userId, fcmToken);
        res.json({
            success: true,
            message: 'FCM token saved successfully',
        });
    }
    catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save FCM token',
        });
    }
});
router.put('/settings', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateNotificationSettingsSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { enabled } = req.body;
        await notificationService_1.notificationService.updateNotificationSettings(userId, enabled);
        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            data: { enabled },
        });
    }
    catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification settings',
        });
    }
});
router.get('/settings', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userSettings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId },
            select: {
                notificationsEnabled: true,
                notificationPromptShown: true,
                fcmToken: true,
                notificationsEnabledAt: true,
            },
        });
        res.json({
            success: true,
            data: {
                notificationsEnabled: userSettings?.notificationsEnabled ?? true,
                notificationPromptShown: userSettings?.notificationPromptShown ?? false,
                hasToken: !!userSettings?.fcmToken,
                notificationsEnabledAt: userSettings?.notificationsEnabledAt?.toISOString(),
            },
        });
    }
    catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification settings',
        });
    }
});
router.post('/prompt-shown', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        await notificationService_1.notificationService.markPromptShown(userId);
        res.json({
            success: true,
            message: 'Notification prompt marked as shown',
        });
    }
    catch (error) {
        console.error('Error marking prompt as shown:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark prompt as shown',
        });
    }
});
router.post('/test', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const success = await notificationService_1.notificationService.sendNotification(userId, {
            title: '🌱 Test Notification',
            body: 'This is a test notification from SproutSync!',
            plantId: 'test',
            plantName: 'Test Plant',
        });
        res.json({
            success,
            message: success ? 'Test notification sent' : 'Failed to send test notification',
        });
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification',
        });
    }
});
//# sourceMappingURL=notifications.js.map