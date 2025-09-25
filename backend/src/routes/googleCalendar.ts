import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';
import { googleCalendarService } from '../services/googleCalendarService';
import { taskSyncService } from '../services/taskSyncService';
import { prisma } from '../lib/prisma';

const router = Router();

// Validation schemas
const updateSyncSettingsSchema = z.object({
  enabled: z.boolean(),
  reminderMinutes: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
  syncedPlantIds: z.array(z.string().uuid()).optional(),
});

const syncTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
  reminderMinutes: z.number().min(5).max(1440).default(30),
});

// GET /api/google-calendar/auth-url - Get Google Calendar authorization URL
router.get('/auth-url', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const authUrl = googleCalendarService.getAuthUrl(userId);
    
    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authorization URL',
    });
  }
});

// GET /api/google-calendar/callback - Handle Google Calendar authorization callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'GOOGLE_CALENDAR_AUTH_ERROR' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    }

    const userId = state as string;
    console.log('Google Calendar OAuth callback received for user:', userId);

    const tokens = await googleCalendarService.exchangeCodeForTokens(code as string, userId);
    
    console.log('Google Calendar access granted successfully for user:', userId);
    
    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_CALENDAR_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_CALENDAR_AUTH_ERROR' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

// GET /api/google-calendar/status - Get sync status and settings
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        googleCalendarSyncEnabled: true,
        googleCalendarReminderMinutes: true,
        syncedPlantIds: true,
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarTokenExpiry: true,
      }
    });

    if (!userSettings) {
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          syncEnabled: false,
          reminderMinutes: 30,
          syncedPlantIds: [],
        },
      });
    }

    const hasValidAccess = await googleCalendarService.hasValidAccess(userId);

    res.json({
      success: true,
      data: {
        hasAccess: hasValidAccess,
        syncEnabled: userSettings.googleCalendarSyncEnabled,
        reminderMinutes: userSettings.googleCalendarReminderMinutes,
        syncedPlantIds: userSettings.syncedPlantIds,
      },
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
    });
  }
});

// PUT /api/google-calendar/settings - Update sync settings
router.put('/settings', authenticateJWT, validate(updateSyncSettingsSchema), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { enabled, reminderMinutes, syncedPlantIds } = req.body;

    // Check if user has valid Google Calendar access
    const hasValidAccess = await googleCalendarService.hasValidAccess(userId);
    
    if (enabled && !hasValidAccess) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar access is required to enable sync',
      });
    }

    const previousSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        googleCalendarReminderMinutes: true,
        syncedPlantIds: true,
      }
    });

    // Update user settings
    const updateData: any = {
      googleCalendarSyncEnabled: enabled,
    };

    if (reminderMinutes !== undefined) {
      updateData.googleCalendarReminderMinutes = reminderMinutes;
    }

    if (syncedPlantIds !== undefined) {
      updateData.syncedPlantIds = syncedPlantIds;
    }

    await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        persona: 'PRIMARY',
        timezone: 'UTC',
        ...updateData,
      }
    });

    const previousPlantIds = previousSettings?.syncedPlantIds || [];
    const nextPlantIds = syncedPlantIds || [];

    const addedPlantIds = nextPlantIds.filter((id: any) => !previousPlantIds.includes(id));
    const removedPlantIds = previousPlantIds.filter(id => !nextPlantIds.includes(id));

    if (enabled && hasValidAccess && addedPlantIds.length > 0) {
      taskSyncService
        .syncTasksForPlants(userId, addedPlantIds, reminderMinutes)
        .catch(error => {
          console.error('Error syncing selected plants:', error);
        });
    }

    if (hasValidAccess && removedPlantIds.length > 0) {
      taskSyncService
        .syncTasksForPlants(userId, removedPlantIds, reminderMinutes, true)
        .catch(error => {
          console.error('Error removing deselected plants:', error);
        });
    }

    res.json({
      success: true,
      data: {
        message: 'Sync settings updated successfully',
        syncEnabled: enabled,
        reminderMinutes: reminderMinutes || 30,
        syncedPlantIds: syncedPlantIds || [],
      },
    });
  } catch (error) {
    console.error('Error updating sync settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sync settings',
    });
  }
});

// POST /api/google-calendar/sync-tasks - Sync specific tasks to Google Calendar
router.post('/sync-tasks', authenticateJWT, validate(syncTasksSchema), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { taskIds, reminderMinutes } = req.body;

    // Check if user has valid Google Calendar access
    const hasValidAccess = await googleCalendarService.hasValidAccess(userId);
    
    if (!hasValidAccess) {
      return res.status(400).json({
        success: false,
        error: 'Google Calendar access is required',
      });
    }

    // Get tasks with plant information
    const tasks = await prisma.plantTask.findMany({
      where: {
        id: { in: taskIds },
        plant: { userId },
        active: true,
      },
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
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid tasks found',
      });
    }

    // Create calendar events for each task
    const results = [];
    for (const task of tasks) {
      try {
        const eventId = await googleCalendarService.createTaskEvent(userId, task, reminderMinutes);
        results.push({
          taskId: task.id,
          eventId,
          success: true,
        });
      } catch (error) {
        console.error(`Error syncing task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          success: false,
          error: 'Failed to create calendar event',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        message: `Synced ${successCount} tasks successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        results,
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tasks',
    });
  }
});

// DELETE /api/google-calendar/revoke - Revoke Google Calendar access
router.delete('/revoke', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    
    await googleCalendarService.revokeAccess(userId);
    
    res.json({
      success: true,
      data: {
        message: 'Google Calendar access revoked successfully',
      },
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke access',
    });
  }
});

export default router;
