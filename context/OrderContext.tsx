
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { Order, OrderItem, Partner, Service, ServiceType, ClientDetails, PromoCode, OrderStatus, CreateOrderRequest, ServiceItem } from '../types';
import * as api from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useNotification } from './NotificationContext';
import { useLanguageContext } from './LanguageContext';
import { appEvents } from '../utils/events';

export interface OrderDraft {
  serviceType?: ServiceType;
  partner: Partner | null;
  serviceItems?: ServiceItem[];
  pickupTime?: string;
  clientDetails?: ClientDetails;
  totalPrice?: number;
  appliedPromoCode?: string;
  discountAmount?: number;
  pointsDiscount?: number;
  referralDiscount?: number;
}

const initialOrderDraft: OrderDraft = {
  partner: null,
  serviceItems: [],
  totalPrice: 0,
};

interface OrderContextType {
  orderDraft: OrderDraft;
  updateOrderDraft: (updates: Partial<OrderDraft>) => void;
  resetOrderDraft: () => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  guestOrderCount: number;
  addOrderToHistory: (orderData: CreateOrderRequest) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, rejectionReason?: string, estimatedCompletionTime?: string) => Promise<void>;
  submitReview: (orderId: string, rating: number, comment: string) => Promise<void>;
  validatePromoCode: (code: string, orderDraft: Partial<OrderDraft>) => { isValid: boolean, message: string, discountAmount?: number, codeData?: PromoCode };
  getOrdersForPartner: (partnerId: string) => Order[];
  getCompletedOrdersForDriver: (driverId: string) => Order[];
  getOrdersForDriver: (driverId: string) => Order | undefined;
  getAllOrders: () => Order[];
  orderHistory: Order[];
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orderDraft, setOrderDraft] = useLocalStorage<OrderDraft>('orderDraft', initialOrderDraft);
  const [activeOrder, setActiveOrder] = useLocalStorage<Order | null>('activeOrder', null);
  const [guestOrderCount, setGuestOrderCount] = useLocalStorage<number>('guestOrderCount', 0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { orderHistory, promoCodes } = useData();
  const { addNotification } = useNotification();
  const { t } = useLanguageContext();

  useEffect(() => {
    const handleLogout = () => {
        console.log("Logout event received in OrderContext, resetting state.");
        setOrderDraft(initialOrderDraft);
        setGuestOrderCount(0);
        setActiveOrder(null);
    };

    const unsubscribe = appEvents.on('logout', handleLogout);
    return () => unsubscribe();
  }, [setOrderDraft, setGuestOrderCount, setActiveOrder]);

  const updateOrderDraft = useCallback((updates: Partial<OrderDraft>) => {
    setOrderDraft(prev => ({ ...prev, ...updates }));
  }, [setOrderDraft]);

  const resetOrderDraft = useCallback(() => {
    setOrderDraft(initialOrderDraft);
  }, [setOrderDraft]);
  
  const addOrderToHistory = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    setIsLoading(true);
    try {
        const newOrder = await api.apiCreateOrder(orderData, user?.id || 'guest', t);
        if (!user) {
            setGuestOrderCount(prev => prev + 1);
        }
        return newOrder;
    } finally {
        setIsLoading(false);
    }
  }, [setGuestOrderCount, user, t]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, rejectionReason?: string, estimatedCompletionTime?: string) => {
    setIsLoading(true);
    try {
        await api.apiUpdateOrderStatus(orderId, newStatus, t, rejectionReason, estimatedCompletionTime);
        if (activeOrder && activeOrder.id === orderId) {
            const { orderHistory: newOrderHistory } = await api.fetchAllData();
            const updatedActiveOrder = newOrderHistory.find(o => o.id === orderId);
            setActiveOrder(updatedActiveOrder || null);
        }
    } finally {
        setIsLoading(false);
    }
  }, [activeOrder, setActiveOrder, t]);

  const submitReview = useCallback(async (orderId: string, rating: number, comment: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
        // FIX: Corrected argument count for apiSubmitReview call.
        const { pointsEarned, newTotalPoints } = await api.apiSubmitReview(orderId, user.id, rating, comment, t);
        
        if (pointsEarned > 0) {
            addNotification(
                t('notifications.pointsEarnedToast', { 
                    points: pointsEarned, 
                    total: newTotalPoints 
                }),
                'success'
            );
        } else {
            addNotification(t('notifications.reviewThanks'), 'success');
        }
    } finally {
        setIsLoading(false);
    }
  }, [user, addNotification, t]);

  const validatePromoCode = useCallback((code: string, currentOrderDraft: Partial<OrderDraft>): { isValid: boolean, message: string, discountAmount?: number, codeData?: PromoCode } => {
    const promo = promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    
    if (!promo) return { isValid: false, message: t('orderSummary.promoValidation.invalid') };

    if (promo.isForNewUsersOnly) {
        if (!user) return { isValid: false, message: t('orderSummary.promoValidation.newUsersOnly') };
        const userOrders = orderHistory.filter(o => o.userId === user.id);
        if (userOrders.length > 0) {
            return { isValid: false, message: t('orderSummary.promoValidation.newUsersOnly') };
        }
    }
    
    if(promo.partnerId && promo.partnerId !== currentOrderDraft.partner?.id) {
        return { isValid: false, message: t('orderSummary.promoValidation.notForPartner') };
    }

    if (promo.minOrderValue && (currentOrderDraft.totalPrice || 0) < promo.minOrderValue) {
        return { isValid: false, message: t('orderSummary.promoValidation.minValue', { value: promo.minOrderValue }) };
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
        discountAmount = (currentOrderDraft.totalPrice || 0) * (promo.discountValue / 100);
    } else {
        discountAmount = promo.discountValue;
    }

    return { isValid: true, message: t('orderSummary.promoValidation.success'), discountAmount, codeData: promo };
  }, [promoCodes, user, orderHistory, t]);
  
  const getOrdersForPartner = useCallback((partnerId: string) => {
      return orderHistory.filter(o => o.partner?.id === partnerId);
  }, [orderHistory]);

  const getCompletedOrdersForDriver = useCallback((driverId: string) => {
      return orderHistory.filter(o => o.driverId === driverId && o.status === OrderStatus.COMPLETED);
  }, [orderHistory]);

  const getOrdersForDriver = useCallback((driverId: string) => {
      return orderHistory.find(o => o.driverId === driverId && o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.REJECTED);
  }, [orderHistory]);

  const getAllOrders = useCallback(() => orderHistory, [orderHistory]);

  const value = useMemo(() => ({
    orderDraft,
    updateOrderDraft,
    resetOrderDraft,
    activeOrder,
    setActiveOrder,
    orderHistory,
    guestOrderCount,
    addOrderToHistory,
    updateOrderStatus,
    submitReview,
    validatePromoCode,
    getOrdersForPartner,
    getCompletedOrdersForDriver,
    getOrdersForDriver,
    getAllOrders,
    isLoading
  }), [
    orderDraft,
    updateOrderDraft,
    resetOrderDraft,
    activeOrder,
    setActiveOrder,
    orderHistory,
    guestOrderCount,
    addOrderToHistory,
    updateOrderStatus,
    submitReview,
    validatePromoCode,
    getOrdersForPartner,
    getCompletedOrdersForDriver,
    getOrdersForDriver,
    getAllOrders,
    isLoading
  ]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
