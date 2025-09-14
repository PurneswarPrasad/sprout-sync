"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const firebaseNotificationService_1 = require("../services/firebaseNotificationService");
const overdueTaskService_1 = require("../services/overdueTaskService");
const notificationScheduler_1 = require("../services/notificationScheduler");
const router = (0, express_1.Router)();
const updateFCMTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1, 'FCM token is required')
});
const markTaskCompletedSchema = zod_1.z.object({
    taskId: zod_1.z.string().min(1, 'Task ID is required')
});
router.post('/fcm-token', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateFCMTokenSchema), async (req, res) => {
    try {
        const { fcmToken } = updateFCMTokenSchema.parse(req.body);
        const userId = req.user.userId;
        await firebaseNotificationService_1.firebaseNotificationService.updateUserFCMToken(userId, fcmToken);
        res.json({
            success: true,
            message: 'FCM token updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating FCM token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update FCM token'
        });
    }
});
router.post('/mark-task-completed', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(markTaskCompletedSchema), async (req, res) => {
    try {
        const { taskId } = markTaskCompletedSchema.parse(req.body);
        const userId = req.user.userId;
        const task = await prisma_1.prisma.plantTask.findFirst({
            where: {
                id: taskId,
                plant: {
                    userId: userId
                }
            }
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found or does not belong to user'
            });
        }
        await overdueTaskService_1.overdueTaskService.markTaskCompleted(taskId);
        res.json({
            success: true,
            message: 'Task marked as completed successfully'
        });
    }
    catch (error) {
        console.error('Error marking task as completed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark task as completed'
        });
    }
});
router.get('/overdue-tasks', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const overdueTasks = await overdueTaskService_1.overdueTaskService.findOverdueTasksForUser(userId);
        res.json({
            success: true,
            data: overdueTasks,
            count: overdueTasks.length
        });
    }
    catch (error) {
        console.error('Error fetching overdue tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overdue tasks'
        });
    }
});
router.get('/stats', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const stats = await overdueTaskService_1.overdueTaskService.getOverdueTaskStats();
        const schedulerStatus = notificationScheduler_1.notificationScheduler.getStatus();
        res.json({
            success: true,
            data: {
                overdueTasks: stats,
                scheduler: schedulerStatus
            }
        });
    }
    catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification stats'
        });
    }
});
router.post('/test', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userSettings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId },
            select: { fcmToken: true, persona: true }
        });
        if (!userSettings?.fcmToken) {
            return res.status(400).json({
                success: false,
                error: 'User does not have an FCM token registered'
            });
        }
        const result = await firebaseNotificationService_1.firebaseNotificationService.sendNotification(userSettings.fcmToken, 'Test Notification', 'This is a test notification from Plant Care App!', { type: 'test' });
        if (result.success) {
            res.json({
                success: true,
                message: 'Test notification sent successfully',
                messageId: result.messageId
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to send test notification'
            });
        }
    }
    catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification'
        });
    }
});
router.post('/trigger', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        await notificationScheduler_1.notificationScheduler.triggerNotificationProcess();
        res.json({
            success: true,
            message: 'Notification process triggered successfully'
        });
    }
    catch (error) {
        console.error('Error triggering notification process:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to trigger notification process'
        });
    }
});
router.get('/scheduler-status', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const status = notificationScheduler_1.notificationScheduler.getStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('Error fetching scheduler status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch scheduler status'
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map