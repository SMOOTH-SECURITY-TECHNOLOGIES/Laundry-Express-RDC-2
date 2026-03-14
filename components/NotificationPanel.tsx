import React, { useMemo } from 'react';
import { AppNotification } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
}

const TimeSince: React.FC<{ dateString: string }> = ({ dateString }) => {
    const { t } = useAppContext();

    const timeAgo = useMemo(() => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return t('notifications.time.years', { count: Math.floor(interval) });
        interval = seconds / 2592000;
        if (interval > 1) return t('notifications.time.months', { count: Math.floor(interval) });
        interval = seconds / 86400;
        if (interval > 1) return t('notifications.time.days', { count: Math.floor(interval) });
        interval = seconds / 3600;
        if (interval > 1) return t('notifications.time.hours', { count: Math.floor(interval) });
        interval = seconds / 60;
        if (interval > 1) return t('notifications.time.minutes', { count: Math.floor(interval) });
        return t('notifications.time.justNow');
    }, [dateString, t]);

    return <>{timeAgo}</>;
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose }) => {
  const { 
    t,
    setCurrentPage, 
    setOpenChatForOrderId, 
    setOpenOrderDetailsForOrderId, 
    setOpenLogisticsMissionForOrderId, 
    setAdminSectionParams, 
    setOpenDriverMissionForOrderId,
    setActiveOrder,
    orderHistory,
    markSingleNotificationAsRead,
    markNotificationsAsRead,
    logNotificationEvent
  } = useAppContext();

  const handleNotificationClick = (notification: AppNotification) => {
    logNotificationEvent(notification, 'click');
    if (!notification.isRead) {
      markSingleNotificationAsRead(notification.id);
    }

    if (notification.link) {
      const { page, params } = notification.link;

      // Handle Partner Dashboard deep links
      if (page === 'partner-dashboard' && params?.orderId) {
        if (notification.notificationType === 'newChatMessage') {
          setOpenChatForOrderId(params.orderId);
        } else {
          setOpenOrderDetailsForOrderId(params.orderId);
        }
      }

      // Handle Logistics Dashboard deep links
      if (page === 'logistics-dashboard' && params?.orderId) {
        setOpenLogisticsMissionForOrderId(params.orderId);
      }

      // Handle Driver Dashboard deep links
      if (page === 'driver-dashboard' && params?.orderId) {
        setOpenDriverMissionForOrderId(params.orderId);
      }

      // Handle Admin Dashboard deep links
      if (page === 'admin' && params) {
        setAdminSectionParams(params);
      }
      
      // Handle Customer Tracking page
      if (page === 'tracking' && params?.orderId) {
        const order = orderHistory.find(o => o.id === params.orderId);
        if (order) {
            setActiveOrder(order);
        }
        if (notification.notificationType === 'newChatMessage') {
            setOpenChatForOrderId(params.orderId);
        }
      }

      setCurrentPage({ name: page as any });
    }
    onClose();
  };

  return (
    <div 
        className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b dark:border-slate-700">
        <h3 className="font-semibold text-brand-dark dark:text-slate-100">{t('notifications.title')}</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="w-full text-left block p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b dark:border-slate-700 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                 {!notif.isRead && <div className="w-2.5 h-2.5 bg-brand-blue rounded-full mt-1.5 shrink-0"></div>}
                 <div className={`flex-grow ${notif.isRead ? 'pl-[22px]' : ''}`}>
                    <p className={`text-sm ${notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-800 dark:text-slate-100 font-semibold'}`}>
                        {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1"><TimeSince dateString={notif.createdAt} /></p>
                 </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <Icon name="bell" className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
            <p className="text-sm">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </div>
       {notifications.length > 0 && (
         <div className="p-2 border-t bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 flex justify-between items-center text-xs">
            <button onClick={() => { markNotificationsAsRead(); }} className="font-medium text-brand-blue hover:underline p-1">
                {t('notificationPanel.markAllAsRead')}
            </button>
            <button onClick={() => { setCurrentPage({ name: 'notifications' }); onClose(); }} className="font-medium text-brand-blue hover:underline p-1">
                {t('notificationPanel.viewAll')}
            </button>
        </div>
       )}
    </div>
  );
};
