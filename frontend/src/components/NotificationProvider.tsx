import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { NotificationToastContainer } from './NotificationToast';

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

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Setup foreground message handler
    const handleForegroundMessage = (payload: NotificationPayload) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        title: payload.notification?.title || 'SproutSync',
        body: payload.notification?.body || '',
        plantId: payload.data?.plantId,
      };
      
      setNotifications((prev) => [...prev, notification]);
    };

    notificationService.onForegroundMessage(handleForegroundMessage);

    return () => {
      notificationService.offForegroundMessage(handleForegroundMessage);
    };
  }, []);

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




