"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_1 = require("../config/firebase");
const prisma_1 = require("../lib/prisma");
class NotificationService {
    async sendNotification(userId, payload) {
        try {
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId },
            });
            if (!userSettings?.fcmToken) {
                console.log(`No FCM token found for user ${userId}`);
                return false;
            }
            if (!userSettings.notificationsEnabled) {
                console.log(`Notifications disabled for user ${userId}`);
                return false;
            }
            const message = {
                token: userSettings.fcmToken,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: {
                    plantId: payload.plantId,
                    plantName: payload.plantName,
                    taskId: payload.taskId || '',
                    taskKey: payload.taskKey || '',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    url: `/plants/${payload.plantId}`,
                },
                webpush: {
                    fcmOptions: {
                        link: `/plants/${payload.plantId}`,
                    },
                    notification: {
                        icon: '/plant.png',
                        badge: '/plant.png',
                        requireInteraction: false,
                        tag: `task-${payload.taskId || payload.plantId}`,
                        renotify: true,
                    },
                },
            };
            const response = await firebase_1.messaging.send(message);
            console.log('✅ Notification sent successfully:', response);
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId,
                    payloadJson: JSON.stringify(payload),
                    channel: 'WEB_PUSH',
                },
            });
            return true;
        }
        catch (error) {
            console.error('❌ Error sending notification:', error);
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token') {
                console.log('Invalid token, removing from database');
                await prisma_1.prisma.userSettings.update({
                    where: { userId },
                    data: { fcmToken: null },
                });
            }
            return false;
        }
    }
    async sendImmediateTaskNotifications(userId, plantId) {
        try {
            const plant = await prisma_1.prisma.plant.findUnique({
                where: { id: plantId },
                include: {
                    tasks: true,
                    user: {
                        include: {
                            settings: true,
                        },
                    },
                },
            });
            if (!plant) {
                console.log(`Plant ${plantId} not found`);
                return;
            }
            const userSettings = plant.user.settings;
            if (!userSettings?.notificationsEnabled || !userSettings.fcmToken) {
                console.log(`Notifications not enabled for user ${userId}, skipping immediate notifications`);
                return;
            }
            if (userSettings.notificationsEnabledAt) {
                const plantCreatedAt = new Date(plant.createdAt);
                const notificationsEnabledAt = new Date(userSettings.notificationsEnabledAt);
                if (plantCreatedAt > notificationsEnabledAt) {
                    console.log(`Plant ${plantId} created after notifications were enabled, sending immediate notifications`);
                }
                else {
                    console.log(`Plant ${plantId} created before notifications were enabled, skipping immediate notifications`);
                    return;
                }
            }
            const plantName = plant.petName || plant.commonName || plant.botanicalName || 'Your plant';
            const taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
            const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
            for (const task of plant.tasks) {
                const template = templateMap.get(task.taskKey);
                const taskLabel = template?.label || task.taskKey;
                await this.sendNotification(userId, {
                    title: `🌱 New Task: ${taskLabel}`,
                    body: `Time to ${taskLabel.toLowerCase()} ${plantName}!`,
                    plantId: plant.id,
                    plantName,
                    taskId: task.id,
                    taskKey: task.taskKey,
                });
            }
        }
        catch (error) {
            console.error('Error sending immediate task notifications:', error);
        }
    }
    async checkAndSendDueTaskNotifications() {
        try {
            const now = new Date();
            const dueTasks = await prisma_1.prisma.plantTask.findMany({
                where: {
                    nextDueOn: {
                        lte: now,
                    },
                    active: true,
                },
                include: {
                    plant: {
                        include: {
                            user: {
                                include: {
                                    settings: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log(`Found ${dueTasks.length} due tasks`);
            const taskTemplates = await prisma_1.prisma.taskTemplate.findMany();
            const templateMap = new Map(taskTemplates.map(t => [t.key, t]));
            for (const task of dueTasks) {
                const { plant } = task;
                const userId = plant.userId;
                const userSettings = plant.user.settings;
                if (!userSettings?.notificationsEnabled || !userSettings.fcmToken) {
                    continue;
                }
                if (userSettings.notificationsEnabledAt) {
                    const taskDueDate = new Date(task.nextDueOn);
                    const notificationsEnabledAt = new Date(userSettings.notificationsEnabledAt);
                    if (taskDueDate < notificationsEnabledAt) {
                        console.log(`Skipping notification for task ${task.id} - task was already due before notifications were enabled`);
                        continue;
                    }
                }
                const lastNotificationSentAt = task.lastCompletedOn || new Date(plant.createdAt);
                const recentNotification = await prisma_1.prisma.notificationLog.findFirst({
                    where: {
                        userId,
                        sentAt: {
                            gte: lastNotificationSentAt,
                        },
                        payloadJson: {
                            contains: task.id,
                        },
                    },
                });
                if (recentNotification) {
                    console.log(`Skipping notification for task ${task.id} - already notified for current due date`);
                    continue;
                }
                const plantName = plant.petName || plant.commonName || plant.botanicalName || 'Your plant';
                const template = templateMap.get(task.taskKey);
                const taskLabel = template?.label || task.taskKey;
                await this.sendNotification(userId, {
                    title: `🌱 Task Due: ${taskLabel}`,
                    body: `Time to ${taskLabel.toLowerCase()} ${plantName}!`,
                    plantId: plant.id,
                    plantName,
                    taskId: task.id,
                    taskKey: task.taskKey,
                });
            }
        }
        catch (error) {
            console.error('Error checking and sending due task notifications:', error);
        }
    }
    async scheduleNextTaskNotification(taskId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
                where: { id: taskId },
                include: {
                    plant: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            if (!task) {
                console.log(`Task ${taskId} not found`);
                return;
            }
            console.log(`Task ${taskId} will trigger notification at ${task.nextDueOn}`);
        }
        catch (error) {
            console.error('Error scheduling next task notification:', error);
        }
    }
    async saveUserToken(userId, fcmToken) {
        try {
            await prisma_1.prisma.userSettings.upsert({
                where: { userId },
                update: { fcmToken },
                create: {
                    userId,
                    fcmToken,
                    persona: 'PRIMARY',
                    timezone: 'UTC',
                    notificationsEnabled: true,
                    notificationPromptShown: true,
                },
            });
            console.log(`✅ FCM token saved for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error saving FCM token:', error);
            throw error;
        }
    }
    async updateNotificationSettings(userId, enabled) {
        try {
            const updateData = { notificationsEnabled: enabled };
            if (enabled) {
                updateData.notificationsEnabledAt = new Date();
            }
            else {
                updateData.notificationsEnabledAt = null;
            }
            await prisma_1.prisma.userSettings.update({
                where: { userId },
                data: updateData,
            });
            console.log(`✅ Notification settings updated for user ${userId}: ${enabled}`);
        }
        catch (error) {
            console.error('❌ Error updating notification settings:', error);
            throw error;
        }
    }
    async markPromptShown(userId) {
        try {
            await prisma_1.prisma.userSettings.upsert({
                where: { userId },
                update: { notificationPromptShown: true },
                create: {
                    userId,
                    persona: 'PRIMARY',
                    timezone: 'UTC',
                    notificationsEnabled: false,
                    notificationPromptShown: true,
                },
            });
        }
        catch (error) {
            console.error('Error marking prompt as shown:', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map