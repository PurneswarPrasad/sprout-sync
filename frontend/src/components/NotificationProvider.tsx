import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { NotificationToastContainer } from './NotificationToast';
import { useErrorToast } from './ErrorToastProvider';

interface Notification {
  id: string;
  title: string;
  body: string;
  plantId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { showError } = useErrorToast();

  useEffect(() => {
    // Initialize notification service
    const initializeService = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = error instanceof Error ? error.stack : undefined;
        showError(
          `Failed to initialize notification service: ${errorMessage}`,
          errorDetails
        );
      }
    };

    initializeService();

    // Setup foreground message handler
    const handleForegroundMessage = (payload: NotificationPayload) => {
      try {
        const notification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          title: payload.notification?.title || 'SproutSync',
          body: payload.notification?.body || '',
          plantId: payload.data?.plantId,
        };
        
        setNotifications((prev) => [...prev, notification]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showError(
          `Failed to handle foreground notification: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    };

    notificationService.onForegroundMessage(handleForegroundMessage);

    return () => {
      notificationService.offForegroundMessage(handleForegroundMessage);
    };
  }, [showError]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification }}>
      {children}
      <NotificationToastContainer notifications={notifications} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
};




