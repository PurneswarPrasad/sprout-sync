import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fcmService } from '../services/firebase';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export interface FCMStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  isInitialized: boolean;
  error: string | null;
}

export const useFCM = () => {
  const [status, setStatus] = useState<FCMStatus>({
    isSupported: false,
    permission: 'default',
    token: null,
    isInitialized: false,
    error: null,
  });

  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Initialize FCM
  const initializeFCM = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }));

      if (!fcmService.isSupported()) {
        setStatus(prev => ({
          ...prev,
          isSupported: false,
          error: 'Push notifications are not supported in this browser',
        }));
        return;
      }

      setStatus(prev => ({ ...prev, isSupported: true }));

      // Get current permission status
      const permission = fcmService.getPermissionStatus();
      setStatus(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        // Get existing token
        const token = await fcmService.requestPermission();
        if (token) {
          setStatus(prev => ({ ...prev, token, isInitialized: true }));
          await sendTokenToServer(token);
        }
      } else if (permission === 'default') {
        // Request permission
        const token = await fcmService.requestPermission();
        if (token) {
          setStatus(prev => ({ 
            ...prev, 
            token, 
            permission: 'granted',
            isInitialized: true 
          }));
          await sendTokenToServer(token);
        } else {
          setStatus(prev => ({ 
            ...prev, 
            permission: 'denied',
            error: 'Notification permission denied' 
          }));
        }
      } else {
        setStatus(prev => ({ 
          ...prev, 
          error: 'Notification permission was previously denied' 
        }));
      }

      // Set up message listener
      fcmService.setupMessageListener();

      // Set up token refresh listener
      fcmService.onTokenRefresh(async (newToken) => {
        console.log('FCM token refreshed:', newToken.substring(0, 20) + '...');
        setStatus(prev => ({ ...prev, token: newToken }));
        await sendTokenToServer(newToken);
      });

      // Set up message received listener
      fcmService.onMessage((payload) => {
        console.log('FCM message received:', payload);
        // Handle the message (e.g., show toast, update UI, etc.)
        handleMessageReceived(payload);
      });

      // Set up notification click listener
      fcmService.onNotificationClick((plantId) => {
        console.log('FCM notification clicked, navigating to plant:', plantId);
        navigate(`/plants/${plantId}`);
      });

    } catch (error: any) {
      console.error('Error initializing FCM:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to initialize notifications' 
      }));
    }
  }, []);

  // Send FCM token to server
  const sendTokenToServer = async (token: string) => {
    try {
      if (!user) {
        console.log('User not authenticated, skipping token registration');
        return;
      }

      await api.post('/api/notifications/fcm-token', { fcmToken: token });
      console.log('FCM token sent to server successfully');
    } catch (error) {
      console.error('Error sending FCM token to server:', error);
    }
  };

  // Handle received message
  const handleMessageReceived = (payload: any) => {
    // You can customize this based on your app's needs
    console.log('Handling FCM message:', payload);
    
    // Example: Show a toast notification or update UI state
    // This could trigger a re-fetch of overdue tasks, show a notification, etc.
  };

  // Request permission manually
  const requestPermission = useCallback(async () => {
    try {
      const token = await fcmService.requestPermission();
      if (token) {
        setStatus(prev => ({ 
          ...prev, 
          token, 
          permission: 'granted',
          isInitialized: true,
          error: null 
        }));
        await sendTokenToServer(token);
        return true;
      }
      return false;
    } catch (error: any) {
      setStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to request permission' 
      }));
      return false;
    }
  }, []);

  // Initialize when user is authenticated
  useEffect(() => {
    if (user && !status.isInitialized) {
      // Set current user in FCM service
      fcmService.setCurrentUser(user.id);
      initializeFCM();
    } else if (!user) {
      // Clear FCM service when user logs out
      fcmService.clearCurrentUser();
    }
  }, [user, status.isInitialized, initializeFCM]);

  // Ensure message listener is set up after navigation
  useEffect(() => {
    if (user && status.isInitialized && !fcmService.isMessageListenerSetup()) {
      console.log('FCM: Re-setting up message listener after navigation');
      fcmService.forceSetupMessageListener();
    }
  }, [user, status.isInitialized]);

  return {
    ...status,
    requestPermission,
    initializeFCM,
  };
};

