

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { AppNotification, Order, OrderStatus, AppNotificationAction } from '../types';
import { Icon } from '../components/Icon.tsx';
import * as api from '../constants';
import { timeSince } from '../utils/timeSince';
import { NOTIFICATION_META } from '../utils/notificationMeta';

// Modals imported from other pages for reuse
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { EstimateTimeModal } from './partner/Dashboard';
import { ReassignPartnerModal } from './admin/dashboard';

const NotificationItem: React.FC<{ 
    notification: AppNotification; 
    onActionClick: (action: AppNotificationAction, notificationId: string) => void;
    onBodyClick: () => void; 
}> = ({ notification, onActionClick, onBodyClick }) => {
    const meta = NOTIFICATION_META[notification.notificationType] || NOTIFICATION_META.general;
    const actionButtonStyles = {
        ACCEPT_ORDER: 'bg-green-100 text-green-700 hover:bg-green-200',
        REJECT_ORDER: 'bg-red-100 text-red-700 hover:bg-red-200',
        REASSIGN_ORDER: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    };

    return (
        <div className={`border-b last:border-b-0 ${!notification.isRead ? 'bg-blue-50/40' : ''}`}>
            <button
                onClick={onBodyClick}
                className="w-full text-left p-4 hover:bg-slate-50 flex items-start gap-3 transition-colors"
            >
                <div className={`p-2 rounded-lg shrink-0 ${meta.bgColor}`}>
                    <Icon name={meta.icon as any} className={`w-4 h-4 ${meta.color}`} />
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{meta.label}</span>
                      {!notification.isRead && <div className="w-2 h-2 bg-brand-blue rounded-full animate-pulse"></div>}
                    </div>
                    <p className={`text-sm leading-snug ${notification.isRead ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{timeSince(notification.createdAt)}</p>
                </div>
            </button>
            {notification.actions && notification.actions.length > 0 && (
                <div className="px-4 pb-3 flex items-center justify-end gap-2" style={{paddingLeft: 'calc(1rem + 44px)'}}>
                    {notification.actions.map(action => (
                        <button 
                            key={action.actionType}
                            onClick={(e) => {
                                e.stopPropagation();
                                onActionClick(action, notification.id);
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${actionButtonStyles[action.actionType] || 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


export const NotificationsPage: React.FC = () => {
    const { user, appNotifications, markNotificationsAsRead, markSingleNotificationAsRead, setCurrentPage, setActiveOrder, orderHistory, setOpenChatForOrderId, t, updateOrderStatus, reassignPartner, logNotificationEvent, setOpenOrderDetailsForOrderId, setOpenLogisticsMissionForOrderId, setAdminSectionParams, setOpenDriverMissionForOrderId } = useAppContext();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isMarking, setIsMarking] = useState(false);
    const [modalState, setModalState] = useState<{type: 'estimate' | 'reassign', order: Order} | null>(null);

    const userNotifications = useMemo(() => {
        if (!user) return [];
        // FIX: isAdmin does not exist on type User. Use role check instead.
        const targetId = (user.role === 'admin' || user.role === 'superadmin') ? 'admin' : user.id;
        return appNotifications
            .filter(n => n.recipientId === targetId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [appNotifications, user]);
    
    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return userNotifications.filter(n => !n.isRead);
        }
        return userNotifications;
    }, [userNotifications, filter]);

    const handleMarkAllRead = async () => {
        setIsMarking(true);
        await markNotificationsAsRead();
        setIsMarking(false);
    };

    const handleNotificationClick = (notification: AppNotification) => {
        logNotificationEvent(notification, 'click');
        if (!notification.isRead) {
            markSingleNotificationAsRead(notification.id);
        }

        if (notification.link) {
            const { page, params } = notification.link;
            
            // Handle various deep links
            if (page === 'partner-dashboard' && params?.orderId) setOpenOrderDetailsForOrderId(params.orderId);
            if (page === 'logistics-dashboard' && params?.orderId) setOpenLogisticsMissionForOrderId(params.orderId);
            if (page === 'driver-dashboard' && params?.orderId) setOpenDriverMissionForOrderId(params.orderId);
            if (page === 'admin' && params) setAdminSectionParams(params);
            
            if (page === 'tracking' && params?.orderId) {
                const order = orderHistory.find(o => o.id === params.orderId);
                if (order) setActiveOrder(order);
                if (notification.notificationType === 'newChatMessage') setOpenChatForOrderId(params.orderId);
            }

            setCurrentPage({ name: page as any });
        }
    };

    const handleActionClick = async (action: AppNotificationAction, notificationId: string) => {
        const { actionType, payload } = action;
        const order = orderHistory.find(o => o.id === payload.orderId);
        if (!order) return;
        
        // Consume the action to prevent re-triggering
        await api.apiConsumeNotificationActions(notificationId);

        switch (actionType) {
            case 'ACCEPT_ORDER':
                setModalState({ type: 'estimate', order });
                break;
            case 'REJECT_ORDER':
                const reason = prompt(t('partnerDashboard.rejectionReasonPrompt'));
                if (reason !== null) {
                    updateOrderStatus(order.id, OrderStatus.REJECTED, reason || t('partnerDashboard.defaultRejectionReason'));
                }
                break;
            case 'REASSIGN_ORDER':
                setModalState({ type: 'reassign', order });
                break;
            default:
                break;
        }
    };
    
    const handleConfirmEstimate = (estimatedTime: string) => {
        if (modalState?.type === 'estimate') {
            updateOrderStatus(modalState.order.id, OrderStatus.READY_FOR_PICKUP, undefined, estimatedTime);
            setModalState(null);
        }
    };


    return (
        <>
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={handleMarkAllRead} 
                        disabled={isMarking}
                        className="text-sm font-medium text-brand-blue hover:underline disabled:opacity-50"
                    >
                        {t('notificationPanel.markAllAsRead')}
                    </button>
                    <div className="flex p-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        <button onClick={() => setFilter('all')} className={`px-2 py-0.5 text-xs rounded-full ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}>{t('adminSupport.all')}</button>
                        <button onClick={() => setFilter('unread')} className={`px-2 py-0.5 text-xs rounded-full ${filter === 'unread' ? 'bg-white shadow-sm' : ''}`}>{t('common.unread', { default: 'Unread' })}</button>
                    </div>
                </div>
            </div>
            
            <div className="divide-y dark:divide-slate-700">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notif => (
                        <NotificationItem 
                            key={notif.id}
                            notification={notif}
                            onActionClick={handleActionClick}
                            onBodyClick={() => handleNotificationClick(notif)}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <Icon name="bell" className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2"/>
                        <p>{t('notifications.noNotifications')}</p>
                    </div>
                )}
            </div>
        </div>
        {modalState?.type === 'estimate' && (
            <EstimateTimeModal 
                isOpen={!!modalState}
                onClose={() => setModalState(null)}
                onConfirm={handleConfirmEstimate}
                isLoading={false} // Loading state is handled inside the modal or context
            />
        )}
        {modalState?.type === 'reassign' && (
            <ReassignPartnerModal 
                isOpen={!!modalState}
                onClose={() => setModalState(null)}
                order={modalState.order}
            />
        )}
        </>
    );
};

