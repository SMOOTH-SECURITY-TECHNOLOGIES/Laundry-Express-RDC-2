import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
// FIX: Changed Notification to the correct simple Notification type for toasts.
import { Notification, AppNotification } from '../types';
import * as api from '../constants';
import { realApi } from '../services/real-api';
import { useAuth } from './AuthContext';
import { appEvents } from '../utils/events';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'info' | 'error') => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
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

  const mapBackendNotification = useCallback((notification: any): AppNotification => {
    const metadata = notification.notification_metadata || notification.link || {};
    return {
      id: String(notification.id),
      recipientId: String(notification.user_id || notification.recipientId || user?.id || ''),
      message: notification.message || notification.title || '',
      notificationType: notification.notification_type || notification.notificationType || 'general',
      link: {
        page: metadata.page || 'notifications',
        params: {
          ...metadata,
          orderId: metadata.orderId,
          taskId: metadata.taskId,
          section: metadata.section,
        },
      },
      createdAt: notification.created_at || notification.createdAt || new Date().toISOString(),
      isRead: Boolean(notification.is_read ?? notification.isRead),
      actions: notification.actions || [],
    };
  }, [user?.id]);
  
  const reloadAppNotifications = useCallback(async () => {
    if (!user) {
      setAppNotifications([]);
      return;
    }

    try {
      const response = await realApi.getNotifications(user.id);
      setAppNotifications((response.notifications || []).map(mapBackendNotification));
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        setAppNotifications([]);
        return;
      }
      const notifications = await api.apiFetchAppNotifications();
      setAppNotifications(notifications);
    }
  }, [mapBackendNotification, user]);
  
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

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addAppNotification = useCallback(async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      await realApi.createNotification({
        user_id: String(notification.recipientId),
        title: notification.message,
        message: notification.message,
        notification_type: String(notification.notificationType),
        notification_metadata: notification.link ? { page: notification.link.page, ...(notification.link.params || {}) } : undefined,
      });
    } catch (error) {
      await api.apiAddAppNotification(notification);
    }
    await reloadAppNotifications();
  }, [reloadAppNotifications]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    setAppNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await realApi.markAllNotificationsAsRead(user.id);
    } catch (error) {
      await api.apiMarkNotificationsAsRead(user.id);
    }
  }, [user]);
  
  const markSingleNotificationAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update for better UX
    setAppNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
    ));
    try {
      await realApi.markNotificationAsRead(notificationId);
    } catch (error) {
      await api.apiMarkSingleNotificationAsRead(notificationId);
    }
  }, []);
  
  const value = useMemo(() => ({
    notifications, 
    addNotification, 
    removeNotification, 
    clearNotifications,
    appNotifications, 
    addAppNotification, 
    markNotificationsAsRead, 
    markSingleNotificationAsRead 
  }), [
    notifications, 
    appNotifications, 
    addNotification, 
    removeNotification, 
    clearNotifications,
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
