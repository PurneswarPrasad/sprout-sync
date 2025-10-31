import { messaging } from '../config/firebase';
import { prisma } from '../lib/prisma';

export interface NotificationPayload {
  title: string;
  body: string;
  plantId: string;
  plantName: string;
  taskId?: string;
  taskKey?: string;
}

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  async sendNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's FCM token and notification settings
      const userSettings = await prisma.userSettings.findUnique({
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

      // Send the notification
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
          url: `/plants/${payload.plantId}`, // URL to navigate to when clicked
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

      const response = await messaging.send(message);
      console.log('✅ Notification sent successfully:', response);

      // Log the notification
      await prisma.notificationLog.create({
        data: {
          userId,
          payloadJson: JSON.stringify(payload),
          channel: 'WEB_PUSH',
        },
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      
      // If token is invalid, remove it
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        console.log('Invalid token, removing from database');
        await prisma.userSettings.update({
          where: { userId },
          data: { fcmToken: null },
        });
      }
      
      return false;
    }
  }

  /**
   * Send immediate notifications for all tasks of a newly created plant
   */
  async sendImmediateTaskNotifications(userId: string, plantId: string): Promise<void> {
    try {
      const plant = await prisma.plant.findUnique({
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

      // Check if user has notifications enabled
      const userSettings = plant.user.settings;
      if (!userSettings?.notificationsEnabled || !userSettings.fcmToken) {
        console.log(`Notifications not enabled for user ${userId}, skipping immediate notifications`);
        return;
      }

      // Only send immediate notifications if notifications were enabled before this plant was created
      if (userSettings.notificationsEnabledAt) {
        const plantCreatedAt = new Date(plant.createdAt);
        const notificationsEnabledAt = new Date(userSettings.notificationsEnabledAt);
        
        if (plantCreatedAt > notificationsEnabledAt) {
          console.log(`Plant ${plantId} created after notifications were enabled, sending immediate notifications`);
        } else {
          console.log(`Plant ${plantId} created before notifications were enabled, skipping immediate notifications`);
          return;
        }
      }

      const plantName = plant.petName || plant.commonName || plant.botanicalName || 'Your plant';

      // Get task templates for labels
      const taskTemplates = await prisma.taskTemplate.findMany();
      const templateMap = new Map(taskTemplates.map(t => [t.key, t]));

      // Send notification for each task
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
    } catch (error) {
      console.error('Error sending immediate task notifications:', error);
    }
  }

  /**
   * Check for due tasks and send notifications
   * This should be called by a cron job every minute
   */
  async checkAndSendDueTaskNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all tasks that are due (nextDueOn is in the past or current minute)
      // and haven't been completed yet
      const dueTasks = await prisma.plantTask.findMany({
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

      // Get task templates for labels
      const taskTemplates = await prisma.taskTemplate.findMany();
      const templateMap = new Map(taskTemplates.map(t => [t.key, t]));

      for (const task of dueTasks) {
        const { plant } = task;
        const userId = plant.userId;
        
        // Check if user has notifications enabled
        const userSettings = plant.user.settings;
        if (!userSettings?.notificationsEnabled || !userSettings.fcmToken) {
          continue;
        }

        // For scheduled notifications, we send notifications for ALL plants
        // BUT only for tasks that became due AFTER notifications were enabled
        // This prevents notifying about already-overdue tasks when user enables notifications
        if (userSettings.notificationsEnabledAt) {
          const taskDueDate = new Date(task.nextDueOn);
          const notificationsEnabledAt = new Date(userSettings.notificationsEnabledAt);
          
          // Only notify if task became due AFTER notifications were enabled
          if (taskDueDate < notificationsEnabledAt) {
            console.log(`Skipping notification for task ${task.id} - task was already due before notifications were enabled`);
            continue;
          }
        }

        // Check if we've already sent a notification for this task since plant creation
        // This prevents sending repeated notifications for overdue tasks
        const lastNotificationSentAt = new Date(plant.createdAt);
        const recentNotification = await prisma.notificationLog.findFirst({
          where: {
            userId,
            sentAt: {
              gte: lastNotificationSentAt, // Since last completion or plant creation
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
    } catch (error) {
      console.error('Error checking and sending due task notifications:', error);
    }
  }

  /**
   * Send notification for next due task after completion
   */
  async scheduleNextTaskNotification(taskId: string): Promise<void> {
    try {
      const task = await prisma.plantTask.findUnique({
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

      // The notification will be sent by the cron job when nextDueOn is reached
      console.log(`Task ${taskId} will trigger notification at ${task.nextDueOn}`);
    } catch (error) {
      console.error('Error scheduling next task notification:', error);
    }
  }

  /**
   * Save or update user's FCM token
   */
  async saveUserToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await prisma.userSettings.upsert({
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
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      const updateData: any = { notificationsEnabled: enabled };
      
      // If enabling notifications, record the timestamp
      if (enabled) {
        updateData.notificationsEnabledAt = new Date();
      } else {
        // If disabling, clear the timestamp
        updateData.notificationsEnabledAt = null;
      }
      
      await prisma.userSettings.update({
        where: { userId },
        data: updateData,
      });
      console.log(`✅ Notification settings updated for user ${userId}: ${enabled}`);
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Mark notification prompt as shown
   */
  async markPromptShown(userId: string): Promise<void> {
    try {
      await prisma.userSettings.upsert({
        where: { userId },
        update: { notificationPromptShown: true },
        create: {
          userId,
          persona: 'PRIMARY',
          timezone: 'UTC',
          notificationsEnabled: false, // Default to false when prompt is shown
          notificationPromptShown: true,
        },
      });
    } catch (error) {
      console.error('Error marking prompt as shown:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

