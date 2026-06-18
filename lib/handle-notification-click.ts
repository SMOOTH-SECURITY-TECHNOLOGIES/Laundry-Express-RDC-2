import { AppNotification } from '../types';
import { getNotificationOrderId, getNotificationPage, isChatNotification } from './notification-links';

export interface NotificationClickHandlers {
  setCurrentPage: (page: { name: string }) => void;
  setOpenChatForOrderId: (id: string | null) => void;
  setOpenOrderDetailsForOrderId: (id: string | null) => void;
  setOpenLogisticsMissionForOrderId: (id: string | null) => void;
  setOpenDriverMissionForOrderId: (id: string | null) => void;
  setAdminSectionParams: (params: Record<string, string | boolean>) => void;
  setActiveOrder: (order: import('../types').Order | null) => void;
  orderHistory: import('../types').Order[];
}

export function handleAppNotificationClick(
  notification: AppNotification,
  handlers: NotificationClickHandlers,
): void {
  const orderId = getNotificationOrderId(notification);
  const page = getNotificationPage(notification);
  const isChat = isChatNotification(notification);

  if (isChat && orderId) {
    handlers.setOpenChatForOrderId(orderId);
  }

  if (!page) {
    return;
  }

  if (page === 'partner-dashboard' && orderId) {
    if (!isChat) {
      handlers.setOpenOrderDetailsForOrderId(orderId);
    }
  }

  if (page === 'logistics-dashboard' && orderId) {
    handlers.setOpenLogisticsMissionForOrderId(orderId);
  }

  if (page === 'driver-dashboard' && orderId) {
    if (!isChat) {
      handlers.setOpenDriverMissionForOrderId(orderId);
    }
  }

  if (page === 'admin' && notification.link?.params) {
    handlers.setAdminSectionParams(notification.link.params as Record<string, string | boolean>);
  }

  if (page === 'tracking' && orderId) {
    const order = handlers.orderHistory.find((entry) => entry.id === orderId);
    if (order) {
      handlers.setActiveOrder(order);
    }
  }

  handlers.setCurrentPage({ name: page });
}
