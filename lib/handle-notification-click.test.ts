import { describe, expect, it, vi } from 'vitest';
import { NotificationType } from '../types';
import { getNotificationOrderId, isChatNotification } from './notification-links';
import { handleAppNotificationClick } from './handle-notification-click';

describe('notification-links', () => {
  it('detects chat notifications', () => {
    expect(isChatNotification({ notificationType: NotificationType.NEW_CHAT_MESSAGE } as any)).toBe(true);
  });

  it('reads order id from snake_case metadata', () => {
    expect(
      getNotificationOrderId({
        link: { page: 'driver-dashboard', params: { order_id: 'order-123' } },
      } as any),
    ).toBe('order-123');
  });
});

describe('handleAppNotificationClick', () => {
  it('opens chat for driver dashboard message notifications', () => {
    const setOpenChatForOrderId = vi.fn();
    const setOpenDriverMissionForOrderId = vi.fn();
    const setCurrentPage = vi.fn();

    handleAppNotificationClick(
      {
        notificationType: NotificationType.NEW_CHAT_MESSAGE,
        link: { page: 'driver-dashboard', params: { orderId: 'order-123' } },
      } as any,
      {
        setCurrentPage,
        setOpenChatForOrderId,
        setOpenOrderDetailsForOrderId: vi.fn(),
        setOpenLogisticsMissionForOrderId: vi.fn(),
        setOpenDriverMissionForOrderId,
        setAdminSectionParams: vi.fn(),
        setActiveOrder: vi.fn(),
        orderHistory: [],
      },
    );

    expect(setOpenChatForOrderId).toHaveBeenCalledWith('order-123');
    expect(setOpenDriverMissionForOrderId).not.toHaveBeenCalled();
    expect(setCurrentPage).toHaveBeenCalledWith({ name: 'driver-dashboard' });
  });
});
