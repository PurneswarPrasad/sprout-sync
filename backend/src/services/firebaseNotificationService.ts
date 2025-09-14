import * as admin from 'firebase-admin';
import { prisma } from '../lib/prisma';
import { getNotificationMessage, getAlternativeNotificationMessage } from './notificationMessages';
import { Persona } from '@prisma/client';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize Firebase Admin SDK with service account
    const serviceAccount = {
      type: "service_account",
      project_id: process.env['FIREBASE_PROJECT_ID'],
      private_key_id: process.env['FIREBASE_PRIVATE_KEY_ID'],
      private_key: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
      client_email: process.env['FIREBASE_CLIENT_EMAIL'],
      client_id: process.env['FIREBASE_CLIENT_ID'],
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env['FIREBASE_CLIENT_EMAIL']}`
    };

    const projectId = process.env['FIREBASE_PROJECT_ID'];
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: projectId,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

export interface OverdueTask {
  id: string;
  plantId: string;
  plantName: string;
  taskKey: string;
  nextDueOn: Date;
  userId: string;
  userPersona: Persona;
  fcmToken: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fcmToken?: string;
}

export class FirebaseNotificationService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    const app = initializeFirebase();
    this.messaging = admin.messaging(app);
  }

  /**
   * Send a single notification to a user
   */
  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<NotificationResult> {
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        webpush: {
          notification: {
            title,
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            requireInteraction: true,
            // Actions are only supported in service worker notifications
            // We'll handle actions in the service worker, not in the notification payload
          },
          fcmOptions: {
            link: process.env['FRONTEND_URL'] || 'http://localhost:3000'
          }
        }
      };

      const response = await this.messaging.send(message);
      
      return {
        success: true,
        messageId: response
      };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      // Handle invalid FCM token
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        // Remove invalid token from database
        await this.removeInvalidToken(fcmToken);
      }

      return {
        success: false,
        error: error.message,
        fcmToken
      };
    }
  }

  /**
   * Send care reminder notification for overdue tasks
   */
  async sendCareReminderNotification(
    overdueTask: OverdueTask,
    messageVariation: number = 0
  ): Promise<NotificationResult> {
    const { plantName, taskKey, userPersona, fcmToken } = overdueTask;

    // Get notification message based on task type and user persona
    const message = messageVariation === 0 
      ? getNotificationMessage(plantName, taskKey, userPersona)
      : getAlternativeNotificationMessage(plantName, taskKey, userPersona, messageVariation);

     const data = {
       plantId: overdueTask.plantId,
       taskId: overdueTask.id,
       taskKey: taskKey,
       type: 'care_reminder',
       userId: overdueTask.userId // Add user ID for message filtering
     };

    const result = await this.sendNotification(
      fcmToken,
      message.title,
      message.body,
      data
    );

    // Log the notification
    if (result.success) {
      await this.logNotification(overdueTask.userId, {
        title: message.title,
        body: message.body,
        data,
        ...(result.messageId && { messageId: result.messageId })
      });
    }

    return result;
  }

  /**
   * Send multiple notifications for different overdue tasks
   * This handles the cycling through multiple overdue tasks
   */
  async sendMultipleCareReminders(
    overdueTasks: OverdueTask[],
    startIndex: number = 0
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    // Group tasks by user to avoid sending multiple notifications to the same user
    const tasksByUser = new Map<string, OverdueTask[]>();
    
    for (const task of overdueTasks) {
      if (!tasksByUser.has(task.userId)) {
        tasksByUser.set(task.userId, []);
      }
      tasksByUser.get(task.userId)!.push(task);
    }

    // Send one notification per user, cycling through their overdue tasks
    for (const [userId, userTasks] of tasksByUser) {
      const taskIndex = startIndex % userTasks.length;
      const taskToNotify = userTasks[taskIndex];
      
      if (!taskToNotify) {
        console.warn(`No task found at index ${taskIndex} for user ${userId}`);
        continue;
      }
      
      const result = await this.sendCareReminderNotification(
        taskToNotify,
        startIndex
      );
      
      results.push(result);
    }

    return results;
  }

  /**
   * Remove invalid FCM token from database
   */
  private async removeInvalidToken(fcmToken: string): Promise<void> {
    try {
      await prisma.userSettings.updateMany({
        where: { fcmToken },
        data: { fcmToken: null }
      });
      console.log(`Removed invalid FCM token: ${fcmToken.substring(0, 20)}...`);
    } catch (error) {
      console.error('Error removing invalid FCM token:', error);
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      data: Record<string, string>;
      messageId?: string;
    }
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          userId,
          payloadJson: JSON.stringify(payload),
          channel: 'WEB_PUSH'
        }
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Update user's FCM token
   */
  async updateUserFCMToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await prisma.userSettings.upsert({
        where: { userId },
        update: { fcmToken },
        create: {
          userId,
          fcmToken,
          persona: 'PRIMARY', // Default persona
          timezone: 'UTC' // Default timezone
        }
      });
      console.log(`Updated FCM token for user: ${userId}`);
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  }

  /**
   * Get all users with valid FCM tokens
   */
  async getUsersWithFCMTokens(): Promise<Array<{ userId: string; fcmToken: string; persona: Persona }>> {
    try {
      const users = await prisma.userSettings.findMany({
        where: {
          fcmToken: { not: null }
        },
        select: {
          userId: true,
          fcmToken: true,
          persona: true
        }
      });

      return users.filter(user => user.fcmToken !== null) as Array<{
        userId: string;
        fcmToken: string;
        persona: Persona;
      }>;
    } catch (error) {
      console.error('Error fetching users with FCM tokens:', error);
      return [];
    }
  }
}

// Export singleton instance
export const firebaseNotificationService = new FirebaseNotificationService();

