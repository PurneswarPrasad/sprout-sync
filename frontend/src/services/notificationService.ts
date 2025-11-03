import { requestNotificationPermission, setupForegroundMessageHandler, getInitializationError } from '../config/firebase';
import { api } from './api';
import { getDeviceInfo, formatDeviceInfo } from '../utils/deviceDetection';

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
   * @throws Error with detailed information if initialization fails
   */
  async initialize(): Promise<void> {
    const deviceInfo = getDeviceInfo();
    
    try {
      // Check Firebase initialization error first
      const initError = getInitializationError();
      if (initError) {
        throw new Error(
          `Firebase Messaging initialization failed: ${initError.message}. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        throw new Error(
          `Service Worker not supported in this browser. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }

      // Register Firebase service worker only once
      let registration: ServiceWorkerRegistration;
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        
        if (!existingRegistration) {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });
          console.log('Firebase Service Worker registered:', registration);
        } else {
          registration = existingRegistration;
          console.log('Firebase Service Worker already registered');
        }
      } catch (error) {
        throw new Error(
          `Failed to register service worker: ${error instanceof Error ? error.message : String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }

      // Setup foreground message handler
      try {
        setupForegroundMessageHandler((payload) => {
          try {
            this.handleForegroundMessage(payload);
          } catch (error) {
            console.error('Error handling foreground message:', {
              error,
              deviceInfo: formatDeviceInfo(deviceInfo),
              payload,
            });
            // Don't throw here - just log the error
          }
        });
      } catch (error) {
        throw new Error(
          `Failed to setup foreground message handler: ${error instanceof Error ? error.message : String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unknown error initializing notification service: ${String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
  }

  /**
   * Request notification permission and save token
   * @throws Error with detailed information if any step fails
   */
  async requestPermission(): Promise<boolean> {
    const deviceInfo = getDeviceInfo();
    
    try {
      // Request permission and get token (this may throw)
      const token = await requestNotificationPermission();
      
      if (!token) {
        throw new Error(
          `FCM token is null after permission request. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }

      // Save token to backend
      try {
        await api.post('/api/notifications/token', { fcmToken: token });
        console.log('✅ FCM token saved to backend');
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || String(error);
        throw new Error(
          `Failed to save FCM token to backend: ${errorMessage}. Device: ${formatDeviceInfo(deviceInfo)}. Token: ${token.substring(0, 20)}...`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Unknown error requesting notification permission: ${String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
  }

  /**
   * Update notification settings
   * @throws Error with detailed information if update fails
   */
  async updateSettings(enabled: boolean): Promise<void> {
    const deviceInfo = getDeviceInfo();
    
    try {
      await api.put('/api/notifications/settings', { enabled });
      console.log('✅ Notification settings updated');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || String(error);
      const statusCode = error.response?.status;
      console.error('Error updating notification settings:', error);
      throw new Error(
        `Failed to update notification settings (${statusCode ? `HTTP ${statusCode}` : 'network error'}): ${errorMessage}. Device: ${formatDeviceInfo(deviceInfo)}. Setting: ${enabled ? 'enabled' : 'disabled'}`
      );
    }
  }

  /**
   * Get notification settings
   * @throws Error with detailed information if fetch fails
   */
  async getSettings(): Promise<{
    notificationsEnabled: boolean;
    notificationPromptShown: boolean;
    hasToken: boolean;
    notificationsEnabledAt?: string;
  }> {
    const deviceInfo = getDeviceInfo();
    
    try {
      const response = await api.get('/api/notifications/settings');
      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || String(error);
      const statusCode = error.response?.status;
      console.error('Error getting notification settings:', error);
      
      // For 401/403, don't throw - just return defaults to avoid blocking auth flow
      if (statusCode === 401 || statusCode === 403) {
        return {
          notificationsEnabled: false,
          notificationPromptShown: true,
          hasToken: false,
        };
      }
      
      // For other errors, throw with details
      throw new Error(
        `Failed to get notification settings (${statusCode ? `HTTP ${statusCode}` : 'network error'}): ${errorMessage}. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
  }

  /**
   * Mark notification prompt as shown
   * @throws Error with detailed information if update fails
   */
  async markPromptShown(): Promise<void> {
    const deviceInfo = getDeviceInfo();
    
    try {
      await api.post('/api/notifications/prompt-shown');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || String(error);
      const statusCode = error.response?.status;
      console.error('Error marking prompt as shown:', error);
      
      // Don't throw for auth errors - just log
      if (statusCode === 401 || statusCode === 403) {
        console.warn('Auth error marking prompt as shown, continuing anyway');
        return;
      }
      
      throw new Error(
        `Failed to mark notification prompt as shown (${statusCode ? `HTTP ${statusCode}` : 'network error'}): ${errorMessage}. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
  }

  /**
   * Handle foreground messages
   */
  private handleForegroundMessage(payload: NotificationPayload): void {
    const deviceInfo = getDeviceInfo();
    console.log('Foreground message:', payload);

    // Show in-app notification (toast)
    try {
      this.foregroundCallbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in foreground message callback:', {
            error,
            deviceInfo: formatDeviceInfo(deviceInfo),
            payload,
          });
        }
      });
    } catch (error) {
      console.error('Error invoking foreground callbacks:', {
        error,
        deviceInfo: formatDeviceInfo(deviceInfo),
        payload,
      });
    }

    // For mobile and PWA, use service worker to show notification
    // This ensures notifications appear properly on all devices
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((registration) => {
          try {
            return registration.showNotification(
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
          } catch (error) {
            console.error('Error showing notification via service worker:', {
              error,
              deviceInfo: formatDeviceInfo(deviceInfo),
              payload,
            });
            throw error;
          }
        })
        .then(() => {
          // Auto-dismiss after 10 seconds
          setTimeout(() => {
            navigator.serviceWorker.ready
              .then((registration) => {
                registration.getNotifications({ tag: payload.data?.taskId || 'notification' })
                  .then((notifications) => {
                    notifications.forEach((notification) => notification.close());
                  })
                  .catch((error) => {
                    console.error('Error closing notifications:', {
                      error,
                      deviceInfo: formatDeviceInfo(deviceInfo),
                    });
                  });
              })
              .catch((error) => {
                console.error('Error getting service worker registration for dismiss:', {
                  error,
                  deviceInfo: formatDeviceInfo(deviceInfo),
                });
              });
          }, 10000);
        })
        .catch((error) => {
          console.error('Error in service worker notification flow:', {
            error,
            deviceInfo: formatDeviceInfo(deviceInfo),
            payload,
          });
        });
    } else if (Notification.permission === 'granted') {
      // Fallback for browsers without service worker
      try {
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
          try {
            notification.close();
          } catch (error) {
            console.error('Error closing notification:', {
              error,
              deviceInfo: formatDeviceInfo(deviceInfo),
            });
          }
        }, 10000);

        // Handle click
        notification.onclick = () => {
          try {
            if (payload.data?.plantId) {
              window.location.href = `/plants/${payload.data.plantId}`;
            }
            notification.close();
          } catch (error) {
            console.error('Error handling notification click:', {
              error,
              deviceInfo: formatDeviceInfo(deviceInfo),
              payload,
            });
          }
        };
      } catch (error) {
        console.error('Error creating fallback notification:', {
          error,
          deviceInfo: formatDeviceInfo(deviceInfo),
          payload,
        });
      }
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


