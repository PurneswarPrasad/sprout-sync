import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';
import { notificationService } from '../services/notificationService';
import { prisma } from '../lib/prisma';

const router = Router();

// Schema for saving FCM token
const saveFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
});

// Schema for updating notification settings
const updateNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
});

// POST /api/notifications/token - Save or update FCM token
router.post('/token', authenticateJWT, validate(saveFcmTokenSchema), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { fcmToken } = req.body;

    await notificationService.saveUserToken(userId, fcmToken);

    res.json({
      success: true,
      message: 'FCM token saved successfully',
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save FCM token',
    });
  }
});

// PUT /api/notifications/settings - Update notification settings
router.put('/settings', authenticateJWT, validate(updateNotificationSettingsSchema), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { enabled } = req.body;

    await notificationService.updateNotificationSettings(userId, enabled);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: { enabled },
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings',
    });
  }
});

// GET /api/notifications/settings - Get notification settings
router.get('/settings', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    const userSettings = await prisma.userSettings.findUnique({
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
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification settings',
    });
  }
});

// POST /api/notifications/prompt-shown - Mark notification prompt as shown
router.post('/prompt-shown', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    await notificationService.markPromptShown(userId);

    res.json({
      success: true,
      message: 'Notification prompt marked as shown',
    });
  } catch (error) {
    console.error('Error marking prompt as shown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark prompt as shown',
    });
  }
});

// POST /api/notifications/test - Send a test notification (development only)
router.post('/test', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    const success = await notificationService.sendNotification(userId, {
      title: '🌱 Test Notification',
      body: 'This is a test notification from SproutSync!',
      plantId: 'test',
      plantName: 'Test Plant',
    });

    res.json({
      success,
      message: success ? 'Test notification sent' : 'Failed to send test notification',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export { router as notificationsRouter };


