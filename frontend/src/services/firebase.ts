import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

// Note: Actions are only supported in service worker notifications (background)
// For foreground notifications, we use simple NotificationOptions without actions

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: any = null;

// Check if we're in a browser environment and service worker is supported
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging not supported:', error);
  }
}

export { messaging };

// VAPID key for web push
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export class FCMService {
  private static instance: FCMService;
  private token: string | null = null;
  private currentUserId: string | null = null;
  private onTokenRefreshCallback?: (token: string) => void;
  private onMessageCallback?: (payload: MessagePayload) => void;
  private onNotificationClickCallback?: (plantId: string) => void;
  private messageListenerSetup: boolean = false;

  private constructor() {}

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
        });

        if (token) {
          console.log('FCM token obtained:', token.substring(0, 20) + '...');
          this.token = token;
          return token;
        } else {
          console.log('No registration token available');
          return null;
        }
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set up message listener for foreground notifications
   */
  setupMessageListener(): void {
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return;
    }

    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Message received in foreground:', payload);
      
      // Filter messages by current user ID
      if (this.currentUserId && payload.data?.userId && payload.data.userId !== this.currentUserId) {
        console.log('Message not for current user, ignoring. Expected:', this.currentUserId, 'Got:', payload.data.userId);
        return;
      }
      
      console.log('Processing message for current user:', this.currentUserId);
      
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }

      // Only show foreground notification if the app is actually in the foreground
      if (this.isAppInForeground()) {
        console.log('App is in foreground, showing notification');
        this.showNotification(payload);
      } else {
        console.log('App is in background, letting service worker handle notification');
      }
    });
  }

  /**
   * Set callback for when a new token is generated
   */
  onTokenRefresh(callback: (token: string) => void): void {
    this.onTokenRefreshCallback = callback;
  }

  /**
   * Set callback for when a message is received
   */
  onMessage(callback: (payload: MessagePayload) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Set callback for when a notification is clicked
   */
  onNotificationClick(callback: (plantId: string) => void): void {
    this.onNotificationClickCallback = callback;
  }

  /**
   * Show notification manually (for foreground messages)
   */
  private showNotification(payload: MessagePayload): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = payload.notification;
    if (!notification) return;

    // For foreground notifications, we'll show a simple notification without actions
    // Actions are only supported in service worker notifications (background)
    const notificationOptions: NotificationOptions = {
      body: notification.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.data?.taskId || 'plant-care-notification',
      requireInteraction: true,
      data: payload.data
    };

    const notificationInstance = new Notification(notification.title || 'Plant Care', notificationOptions);

    // Handle notification click
    notificationInstance.onclick = () => {
      window.focus();
      notificationInstance.close();
      
      // Handle notification click - use callback for navigation
      if (payload.data?.plantId && this.onNotificationClickCallback) {
        this.onNotificationClickCallback(payload.data.plantId);
      }
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notificationInstance.close();
    }, 10000);
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && messaging !== null;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Get permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Set current user ID for message filtering
   */
  setCurrentUser(userId: string): void {
    console.log('FCM Service: Setting current user to:', userId);
    this.currentUserId = userId;
    
    // Notify service worker of user change
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_USER_ID',
        userId: userId
      });
    }
  }

  /**
   * Clear current user and reset service state
   */
  clearCurrentUser(): void {
    console.log('FCM Service: Clearing current user');
    this.currentUserId = null;
    this.token = null;
    this.onTokenRefreshCallback = undefined;
    this.onMessageCallback = undefined;
    this.onNotificationClickCallback = undefined;
    this.messageListenerSetup = false;
    
    // Notify service worker to clear user
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_USER_ID'
      });
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUser(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if message listener is set up
   */
  isMessageListenerSetup(): boolean {
    return this.messageListenerSetup;
  }

  /**
   * Force re-setup of message listener (useful after navigation)
   */
  forceSetupMessageListener(): void {
    if (messaging && this.currentUserId) {
      console.log('FCM Service: Force re-setting up message listener for user:', this.currentUserId);
      this.setupMessageListener();
    }
  }

  /**
   * Check if the app is currently in the foreground
   */
  private isAppInForeground(): boolean {
    // Check if the document is visible
    if (document.visibilityState === 'visible') {
      return true;
    }
    
    // Check if the window has focus
    if (document.hasFocus && document.hasFocus()) {
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
export const fcmService = FCMService.getInstance();

