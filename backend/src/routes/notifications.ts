import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';
import { firebaseNotificationService } from '../services/firebaseNotificationService';
import { overdueTaskService } from '../services/overdueTaskService';
import { notificationScheduler } from '../services/notificationScheduler';

const router = Router();

// Schema for FCM token update
const updateFCMTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required')
});

// Schema for marking task as completed
const markTaskCompletedSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required')
});

// POST /api/notifications/fcm-token - Update user's FCM token
router.post('/fcm-token', authenticateJWT, validate(updateFCMTokenSchema), async (req, res) => {
  try {
    const { fcmToken } = updateFCMTokenSchema.parse(req.body);
    const userId = (req.user as any).userId;

    await firebaseNotificationService.updateUserFCMToken(userId, fcmToken);

    res.json({
      success: true,
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update FCM token'
    });
  }
});

// POST /api/notifications/mark-task-completed - Mark a task as completed
router.post('/mark-task-completed', authenticateJWT, validate(markTaskCompletedSchema), async (req, res) => {
  try {
    const { taskId } = markTaskCompletedSchema.parse(req.body);
    const userId = (req.user as any).userId;

    // Verify the task belongs to the user
    const task = await prisma.plantTask.findFirst({
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

    await overdueTaskService.markTaskCompleted(taskId);

    res.json({
      success: true,
      message: 'Task marked as completed successfully'
    });
  } catch (error) {
    console.error('Error marking task as completed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark task as completed'
    });
  }
});

// GET /api/notifications/overdue-tasks - Get user's overdue tasks
router.get('/overdue-tasks', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const overdueTasks = await overdueTaskService.findOverdueTasksForUser(userId);

    res.json({
      success: true,
      data: overdueTasks,
      count: overdueTasks.length
    });
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue tasks'
    });
  }
});

// GET /api/notifications/stats - Get notification statistics (admin only)
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const stats = await overdueTaskService.getOverdueTaskStats();
    const schedulerStatus = notificationScheduler.getStatus();

    res.json({
      success: true,
      data: {
        overdueTasks: stats,
        scheduler: schedulerStatus
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification stats'
    });
  }
});

// POST /api/notifications/test - Send test notification (admin only)
router.post('/test', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    
    // Get user's FCM token
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { fcmToken: true, persona: true }
    });

    if (!userSettings?.fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'User does not have an FCM token registered'
      });
    }

    // Send test notification
    const result = await firebaseNotificationService.sendNotification(
      userSettings.fcmToken,
      'Test Notification',
      'This is a test notification from Plant Care App!',
      { type: 'test' }
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Test notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test notification'
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

// POST /api/notifications/trigger - Manually trigger notification process (admin only)
router.post('/trigger', authenticateJWT, async (req, res) => {
  try {
    await notificationScheduler.triggerNotificationProcess();

    res.json({
      success: true,
      message: 'Notification process triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering notification process:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification process'
    });
  }
});

// GET /api/notifications/scheduler-status - Get scheduler status
router.get('/scheduler-status', authenticateJWT, async (req, res) => {
  try {
    const status = notificationScheduler.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler status'
    });
  }
});

export default router;
