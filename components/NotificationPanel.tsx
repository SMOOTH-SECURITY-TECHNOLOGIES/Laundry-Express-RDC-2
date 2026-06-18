import React from 'react';
import { AppNotification } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';
import { timeSince } from '../utils/timeSince';
import { NOTIFICATION_META } from '../utils/notificationMeta';
import { handleAppNotificationClick } from '../lib/handle-notification-click';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
}

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

    handleAppNotificationClick(notification, {
      setCurrentPage,
      setOpenChatForOrderId,
      setOpenOrderDetailsForOrderId,
      setOpenLogisticsMissionForOrderId,
      setOpenDriverMissionForOrderId,
      setAdminSectionParams,
      setActiveOrder,
      orderHistory,
    });

    onClose();
  };

  return (
    <div 
        className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-brand-dark dark:text-slate-100">{t('notifications.title')}</h3>
        {notifications.some(n => !n.isRead) && (
          <button onClick={() => markNotificationsAsRead()} className="text-xs font-medium text-brand-blue hover:underline">
            Tout marquer lu
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notif => {
            const meta = NOTIFICATION_META[notif.notificationType] || NOTIFICATION_META.general;
            return (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left block p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b dark:border-slate-700 last:border-b-0 transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${meta.bgColor}`}>
                    <Icon name={meta.icon as any} className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{meta.label}</p>
                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-800 dark:text-slate-100 font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 bg-brand-blue rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <Icon name="bell" className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
            <p className="text-sm">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </div>
      {notifications.length > 0 && (
        <div className="p-2 border-t bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 flex justify-center">
          <button onClick={() => { setCurrentPage({ name: 'notifications' }); onClose(); }} className="font-medium text-sm text-brand-blue hover:underline p-1">
            {t('notificationPanel.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
};
