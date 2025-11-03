import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getDeviceInfo, formatDeviceInfo } from '../utils/deviceDetection';

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
let messaging: Messaging | null = null;
let initializationError: Error | null = null;

try {
  messaging = getMessaging(app);
  console.log('🔥 Firebase Messaging initialized');
} catch (error) {
  initializationError = error as Error;
  const deviceInfo = getDeviceInfo();
  console.error('Error initializing Firebase Messaging:', {
    error,
    deviceInfo: formatDeviceInfo(deviceInfo),
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
  });
}

export { app, messaging };

/**
 * Request notification permission and get FCM token
 * @throws Error with detailed information if any step fails
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  const deviceInfo = getDeviceInfo();
  
  try {
    if (!messaging) {
      if (initializationError) {
        throw new Error(
          `Firebase Messaging not initialized: ${initializationError.message}. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }
      throw new Error(
        `Firebase Messaging not initialized. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      throw new Error(
        `Browser does not support notifications. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }

    // Request permission
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      throw new Error(
        `Failed to request notification permission: ${error instanceof Error ? error.message : String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      let token: string;
      try {
        token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
      } catch (error) {
        throw new Error(
          `Failed to get FCM token: ${error instanceof Error ? error.message : String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }
      
      if (!token) {
        throw new Error(
          `FCM token is empty. VAPID key may be invalid or service worker not registered. Device: ${formatDeviceInfo(deviceInfo)}`
        );
      }
      
      console.log('FCM Token:', token);
      return token;
    } else if (permission === 'denied') {
      throw new Error(
        `Notification permission denied by user. Device: ${formatDeviceInfo(deviceInfo)}. Please enable notifications in browser settings.`
      );
    } else {
      throw new Error(
        `Notification permission default (not requested yet). Device: ${formatDeviceInfo(deviceInfo)}`
      );
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    // Re-throw with additional context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `Unknown error requesting notification permission: ${String(error)}. Device: ${formatDeviceInfo(deviceInfo)}`
    );
  }
};

/**
 * Setup foreground message handler
 */
export const setupForegroundMessageHandler = (
  callback: (payload: any) => void
) => {
  const deviceInfo = getDeviceInfo();
  
  if (!messaging) {
    const errorMsg = initializationError 
      ? `Firebase Messaging not initialized: ${initializationError.message}`
      : 'Firebase Messaging not initialized';
    console.error(`${errorMsg}. Device: ${formatDeviceInfo(deviceInfo)}`);
    return;
  }

  try {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
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
    console.error('Error setting up foreground message handler:', {
      error,
      deviceInfo: formatDeviceInfo(deviceInfo),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get initialization error if any
 */
export const getInitializationError = (): Error | null => {
  return initializationError;
};




