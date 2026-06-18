import { AppNotification, NotificationType } from '../types';

export function isChatNotification(notification: AppNotification): boolean {
  const type = String(notification.notificationType || '');
  return type === NotificationType.NEW_CHAT_MESSAGE || type === 'new_chat_message';
}

export function getNotificationOrderId(notification: AppNotification): string | undefined {
  const params = notification.link?.params;
  if (!params) return undefined;
  const orderId = params.orderId ?? (params as { order_id?: string }).order_id;
  return orderId ? String(orderId) : undefined;
}

export function getNotificationPage(notification: AppNotification): string | undefined {
  const page = notification.link?.page;
  return page ? String(page) : undefined;
}
