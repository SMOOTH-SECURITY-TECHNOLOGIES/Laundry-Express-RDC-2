import React, { useEffect, useState } from 'react';
import { ChatModal } from './ChatModal';
import { useAppContext } from '../context/AppContext';
import { Order } from '../types';
import { realApi } from '../services/real-api';
import { mapBackendOrderResponseToFrontend } from '../utils/order-mappers';

export const GlobalChatModal: React.FC = () => {
  const {
    openChatForOrderId,
    setOpenChatForOrderId,
    orderHistory,
    partners,
    user,
    getOrdersForPartner,
    getOrdersForDriver,
    setActiveOrder,
  } = useAppContext();

  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!openChatForOrderId) return;

    const orderId = openChatForOrderId;
    let cancelled = false;

    const resolveOrder = async () => {
      let order =
        orderHistory.find((entry) => entry.id === orderId) ||
        orderHistory.find((entry) => String(entry.id) === String(orderId));

      if (!order && user?.role === 'driver' && user.id) {
        const activeOrder = getOrdersForDriver(user.id);
        if (activeOrder && (activeOrder.id === orderId || String(activeOrder.id) === String(orderId))) {
          order = activeOrder;
        }
      }

      if (!order && user?.partnerId) {
        order = getOrdersForPartner(user.partnerId).find(
          (entry) => entry.id === orderId || String(entry.id) === String(orderId),
        );
      }

      if (!order && realApi.hasAuthSession()) {
        try {
          const backendOrder = await realApi.getOrder(orderId);
          order = mapBackendOrderResponseToFrontend(backendOrder, partners);
        } catch {
          // order unavailable — chat cannot open
        }
      }

      if (cancelled) return;

      if (order) {
        setActiveOrder(order);
        setChatOrder(order);
      }
      setOpenChatForOrderId(null);
    };

    void resolveOrder();

    return () => {
      cancelled = true;
    };
  }, [
    openChatForOrderId,
    orderHistory,
    partners,
    user,
    getOrdersForPartner,
    getOrdersForDriver,
    setActiveOrder,
    setOpenChatForOrderId,
  ]);

  return (
    <ChatModal
      isOpen={!!chatOrder}
      onClose={() => setChatOrder(null)}
      order={chatOrder}
    />
  );
};

export default GlobalChatModal;
