import { requestNotificationPermission, setupForegroundMessageHandler } from '../config/firebase';
import { api } from './api';

export interface NotificationPayload {
  notification?: {
    title: string;
    body: string;
  };
  data?: {
    plantId: string;
    plantName: string;
    taskId?: string;
    taskKey?: string;
  };
}

class NotificationServiceClass {
  private foregroundCallbacks: ((payload: NotificationPayload) => void)[] = [];

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
      }

      // Register Firebase service worker only once
      const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (!existingRegistration) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        console.log('Firebase Service Worker registered:', registration);
      } else {
        console.log('Firebase Service Worker already registered');
      }

      // Setup foreground message handler
      setupForegroundMessageHandler((payload) => {
        this.handleForegroundMessage(payload);
      });
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Request notification permission and save token
   */
  async requestPermission(): Promise<boolean> {
    try {
      const token = await requestNotificationPermission();
      
      if (!token) {
        return false;
      }

      // Save token to backend
      await api.post('/api/notifications/token', { fcmToken: token });
      console.log('✅ FCM token saved to backend');
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(enabled: boolean): Promise<void> {
    try {
      await api.put('/api/notifications/settings', { enabled });
      console.log('✅ Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<{
    notificationsEnabled: boolean;
    notificationPromptShown: boolean;
    hasToken: boolean;
    notificationsEnabledAt?: string;
  }> {
    try {
      const response = await api.get('/api/notifications/settings');
      return response.data.data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      // If there's an error, assume prompt was shown to avoid unwanted redirects
      // But default to disabled notifications to be conservative
      return {
        notificationsEnabled: false,
        notificationPromptShown: true,
        hasToken: false,
      };
    }
  }

  /**
   * Mark notification prompt as shown
   */
  async markPromptShown(): Promise<void> {
    try {
      await api.post('/api/notifications/prompt-shown');
    } catch (error) {
      console.error('Error marking prompt as shown:', error);
    }
  }

  /**
   * Handle foreground messages
   */
  private handleForegroundMessage(payload: NotificationPayload): void {
    console.log('Foreground message:', payload);

    // Show in-app notification
    this.foregroundCallbacks.forEach((callback) => callback(payload));

    // Also show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      const notification = new Notification(
        payload.notification?.title || 'SproutSync',
        {
          body: payload.notification?.body || '',
          icon: '/plant.png',
          badge: '/plant.png',
          tag: payload.data?.taskId || 'notification',
          data: payload.data,
          requireInteraction: false,
        }
      );

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click
      notification.onclick = () => {
        if (payload.data?.plantId) {
          window.location.href = `/plants/${payload.data.plantId}`;
        }
        notification.close();
      };
    }
  }

  /**
   * Register callback for foreground messages
   */
  onForegroundMessage(callback: (payload: NotificationPayload) => void): void {
    this.foregroundCallbacks.push(callback);
  }

  /**
   * Unregister callback
   */
  offForegroundMessage(callback: (payload: NotificationPayload) => void): void {
    this.foregroundCallbacks = this.foregroundCallbacks.filter((cb) => cb !== callback);
  }
}

export const notificationService = new NotificationServiceClass();


