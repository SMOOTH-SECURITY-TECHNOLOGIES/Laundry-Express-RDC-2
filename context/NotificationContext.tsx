import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
// FIX: Changed Notification to the correct simple Notification type for toasts.
import { Notification, AppNotification } from '../types';
import * as api from '../constants';
import { useAuth } from './AuthContext';
import { appEvents } from '../utils/events';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'info' | 'error') => void;
  removeNotification: (id: string) => void;
  appNotifications: AppNotification[];
  addAppNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  markSingleNotificationAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  
  const reloadAppNotifications = useCallback(async () => {
    const notifications = await api.apiFetchAppNotifications();
    setAppNotifications(notifications);
  }, []);
  
  useEffect(() => {
    reloadAppNotifications(); // Initial fetch
    
    // Listen for data changes to refresh notifications
    const unsubscribe = appEvents.on('data_changed', reloadAppNotifications);
    return () => unsubscribe();
  }, [reloadAppNotifications]);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'error') => {
    const newNotification: Notification = {
      id: `NOTIF-${Date.now()}`,
      message,
      type
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addAppNotification = useCallback(async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    await api.apiAddAppNotification(notification);
  }, []);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    await api.apiMarkNotificationsAsRead(user.id);
  }, [user]);
  
  const markSingleNotificationAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update for better UX
    setAppNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
    ));
    await api.apiMarkSingleNotificationAsRead(notificationId);
  }, []);
  
  const value = useMemo(() => ({
    notifications, 
    addNotification, 
    removeNotification, 
    appNotifications, 
    addAppNotification, 
    markNotificationsAsRead, 
    markSingleNotificationAsRead 
  }), [
    notifications, 
    appNotifications, 
    addNotification, 
    removeNotification, 
    addAppNotification, 
    markNotificationsAsRead, 
    markSingleNotificationAsRead
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};