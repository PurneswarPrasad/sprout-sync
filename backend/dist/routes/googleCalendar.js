"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const googleCalendarService_1 = require("../services/googleCalendarService");
const taskSyncService_1 = require("../services/taskSyncService");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
const updateSyncSettingsSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    reminderMinutes: zod_1.z.number().min(5).max(1440).optional(),
    syncedPlantIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
const syncTasksSchema = zod_1.z.object({
    taskIds: zod_1.z.array(zod_1.z.string().uuid()),
    reminderMinutes: zod_1.z.number().min(5).max(1440).default(30),
});
router.get('/auth-url', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const authUrl = googleCalendarService_1.googleCalendarService.getAuthUrl(userId);
        res.json({
            success: true,
            data: { authUrl },
        });
    }
    catch (error) {
        console.error('Error getting auth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get authorization URL',
        });
    }
});
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
        const userId = state;
        console.log('Google Calendar OAuth callback received for user:', userId);
        const tokens = await googleCalendarService_1.googleCalendarService.exchangeCodeForTokens(code, userId);
        console.log('Google Calendar access granted successfully for user:', userId);
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
    }
    catch (error) {
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
router.get('/status', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userSettings = await prisma_1.prisma.userSettings.findUnique({
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
        const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(userId);
        res.json({
            success: true,
            data: {
                hasAccess: hasValidAccess,
                syncEnabled: userSettings.googleCalendarSyncEnabled,
                reminderMinutes: userSettings.googleCalendarReminderMinutes,
                syncedPlantIds: userSettings.syncedPlantIds,
            },
        });
    }
    catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sync status',
        });
    }
});
router.put('/settings', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(updateSyncSettingsSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { enabled, reminderMinutes, syncedPlantIds } = req.body;
        const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(userId);
        if (enabled && !hasValidAccess) {
            return res.status(400).json({
                success: false,
                error: 'Google Calendar access is required to enable sync',
            });
        }
        const previousSettings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId },
            select: {
                googleCalendarReminderMinutes: true,
                syncedPlantIds: true,
            }
        });
        const updateData = {
            googleCalendarSyncEnabled: enabled,
        };
        if (reminderMinutes !== undefined) {
            updateData.googleCalendarReminderMinutes = reminderMinutes;
        }
        if (syncedPlantIds !== undefined) {
            updateData.syncedPlantIds = syncedPlantIds;
        }
        await prisma_1.prisma.userSettings.upsert({
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
        const addedPlantIds = nextPlantIds.filter((id) => !previousPlantIds.includes(id));
        const removedPlantIds = previousPlantIds.filter(id => !nextPlantIds.includes(id));
        if (enabled && hasValidAccess && addedPlantIds.length > 0) {
            taskSyncService_1.taskSyncService
                .syncTasksForPlants(userId, addedPlantIds, reminderMinutes)
                .catch(error => {
                console.error('Error syncing selected plants:', error);
            });
        }
        if (hasValidAccess && removedPlantIds.length > 0) {
            taskSyncService_1.taskSyncService
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
    }
    catch (error) {
        console.error('Error updating sync settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update sync settings',
        });
    }
});
router.post('/sync-tasks', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(syncTasksSchema), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { taskIds, reminderMinutes } = req.body;
        const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(userId);
        if (!hasValidAccess) {
            return res.status(400).json({
                success: false,
                error: 'Google Calendar access is required',
            });
        }
        const tasks = await prisma_1.prisma.plantTask.findMany({
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
        const results = [];
        for (const task of tasks) {
            try {
                const eventId = await googleCalendarService_1.googleCalendarService.createTaskEvent(userId, task, reminderMinutes);
                results.push({
                    taskId: task.id,
                    eventId,
                    success: true,
                });
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Error syncing tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync tasks',
        });
    }
});
router.delete('/revoke', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        await googleCalendarService_1.googleCalendarService.revokeAccess(userId);
        res.json({
            success: true,
            data: {
                message: 'Google Calendar access revoked successfully',
            },
        });
    }
    catch (error) {
        console.error('Error revoking access:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to revoke access',
        });
    }
});
exports.default = router;
//# sourceMappingURL=googleCalendar.js.map