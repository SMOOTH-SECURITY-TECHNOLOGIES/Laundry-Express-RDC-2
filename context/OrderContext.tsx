
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { Order, OrderItem, Partner, Service, ServiceType, ClientDetails, PromoCode, OrderStatus, CreateOrderRequest, ServiceItem } from '../types';
import { PartnerType } from '../types';
import * as api from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useNotification } from './NotificationContext';
import { useLanguageContext } from './LanguageContext';
import { appEvents } from '../utils/events';
import { realApi, CatalogPartnerService, CatalogPartnerSummary } from '../services/real-api';

export interface OrderDraft {
  serviceType?: ServiceType;
  partner: Partner | null;
  serviceItems?: ServiceItem[];
  pickupTime?: string;
  clientDetails?: ClientDetails;
  totalPrice?: number;
  appliedPromoCode?: string;
  discountAmount?: number;
  loyaltyPointsToRedeem?: number;
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
  const { orderHistory, promoCodes, partners } = useData();
  const { addNotification } = useNotification();
  const { t } = useLanguageContext();
  const [partnerLiveOrders, setPartnerLiveOrders] = useState<Order[]>([]);

  const normalizeText = useCallback((value?: string | null) => {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }, []);

  const mapBackendStatus = useCallback((status: string): OrderStatus => {
    switch (status) {
      case 'pending_confirmation':
        return OrderStatus.AWAITING_CONFIRMATION;
      case 'confirmed':
        return OrderStatus.CONFIRMED;
      case 'pickup_scheduled':
      case 'pickup_driver_assigned':
        return OrderStatus.READY_FOR_PICKUP;
      case 'pickup_in_progress':
      case 'picked_up':
        return OrderStatus.PICKUP;
      case 'received_by_partner':
      case 'cleaning_in_progress':
      case 'quality_check':
        return OrderStatus.PROCESSING;
      case 'ready_for_delivery':
      case 'delivery_driver_assigned':
        return OrderStatus.READY_FOR_DELIVERY;
      case 'delivery_in_progress':
      case 'delivered':
        return OrderStatus.DELIVERY;
      case 'completed':
        return OrderStatus.COMPLETED;
      case 'cancelled':
      case 'failed':
        return OrderStatus.REJECTED;
      default:
        return OrderStatus.AWAITING_CONFIRMATION;
    }
  }, []);

  const mapFrontendStatusToBackend = useCallback((currentStatus: OrderStatus, nextStatus: OrderStatus) => {
    if (nextStatus === OrderStatus.REJECTED) {
      return 'cancelled';
    }

    if (nextStatus === OrderStatus.READY_FOR_PICKUP) {
      return currentStatus === OrderStatus.AWAITING_CONFIRMATION ? 'confirmed' : 'pickup_scheduled';
    }

    if (nextStatus === OrderStatus.PROCESSING) {
      return 'received_by_partner';
    }

    if (nextStatus === OrderStatus.READY_FOR_DELIVERY) {
      return 'ready_for_delivery';
    }

    if (nextStatus === OrderStatus.COMPLETED) {
      return 'completed';
    }

    if (nextStatus === OrderStatus.PICKUP) {
      return 'pickup_in_progress';
    }

    if (nextStatus === OrderStatus.DELIVERY) {
      return 'delivery_in_progress';
    }

    return 'cancelled';
  }, []);

  const createIdempotencyKey = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `ui-${crypto.randomUUID()}`;
    }
    return `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const resolveRealPartner = useCallback(async (partner: Partner) => {
    const catalogPartners = await realApi.getCatalogPartners();
    const normalizedPartnerName = normalizeText(partner.name);

    const exactMatch =
      catalogPartners.find((item) => normalizeText(item.name) === normalizedPartnerName) ||
      catalogPartners.find((item) => normalizeText(item.business_name) === normalizedPartnerName);

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatch = catalogPartners.find((item) => {
      const candidateNames = [normalizeText(item.name), normalizeText(item.business_name)];
      return candidateNames.some((candidate) => candidate.includes(normalizedPartnerName) || normalizedPartnerName.includes(candidate));
    });

    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    throw new Error(t('orderPage.partnerNotFound', { name: partner.name }));
  }, [normalizeText, t]);

  const resolveRealService = useCallback(async (partnerId: string, serviceItem: ServiceItem) => {
    const catalogServices = await realApi.getPartnerCatalogServices(partnerId);
    const frontendTitle = normalizeText(serviceItem.service.title);
    const frontendType = normalizeText(serviceItem.service.type);

    const exactMatch = catalogServices.find((service) => {
      const category = normalizeText(service.service_category_name);
      const type = normalizeText(service.service_type_name);
      return category === frontendTitle || type === frontendTitle;
    });

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatch = catalogServices.find((service) => {
      const candidateText = [service.service_category_name, service.service_type_name]
        .map((value) => normalizeText(value))
        .join(' ');
      return candidateText.includes(frontendTitle) || candidateText.includes(frontendType);
    });

    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    if (catalogServices.length === 1) {
      return catalogServices[0];
    }

    throw new Error(t('orderPage.serviceNotFound', { name: serviceItem.service.title }));
  }, [normalizeText, t]);

  const mapFrontendOrderToBackendItems = useCallback(async (partnerId: string, serviceItems: ServiceItem[]) => {
    const backendItems = [];

    for (const serviceItem of serviceItems) {
      const backendService = await resolveRealService(partnerId, serviceItem);
      const backendUnitPrice = Number(backendService.base_price || 0);

      if (serviceItem.service.priceModel === 'per_kg') {
        const weight = serviceItem.weight || 0;
        if (weight <= 0) {
          continue;
        }

        backendItems.push({
          service_id: backendService.id,
          item_name: serviceItem.service.title,
          quantity: weight.toFixed(2),
          unit_price: backendUnitPrice.toFixed(2),
          notes: serviceItem.service.description,
          detected_by_ai: false,
        });
        continue;
      }

      for (const item of serviceItem.items || []) {
        if (item.quantity <= 0) {
          continue;
        }

        backendItems.push({
          service_id: backendService.id,
          item_name: item.article.name,
          quantity: item.quantity.toString(),
          unit_price: backendUnitPrice.toFixed(2),
          notes: item.article.description,
          detected_by_ai: false,
        });
      }
    }

    return backendItems;
  }, [resolveRealService]);

  const mapBackendOrderToFrontend = useCallback((
    backendOrder: {
      id: string;
      order_number: string;
      customer_id: string;
      total_amount: number | string;
      amount_paid?: number | string;
      payment_status?: string;
      status: string;
      created_at: string;
      calculation_breakdown?: Record<string, unknown> | null;
      status_history?: Array<{ new_status: string; created_at: string }>;
    },
    orderData: CreateOrderRequest,
  ): Order => {
    const statusHistory = (backendOrder.status_history || []).map((entry) => ({
      status: mapBackendStatus(entry.new_status),
      time: entry.created_at,
    }));

    return {
      id: backendOrder.id,
      userId: backendOrder.customer_id,
      partner: orderData.partner,
      serviceItems: orderData.serviceItems,
      clientDetails: orderData.clientDetails,
      pickupTime: orderData.pickupTime,
      status: mapBackendStatus(backendOrder.status),
      trackingHistory: statusHistory.length > 0 ? statusHistory : [{
        status: mapBackendStatus(backendOrder.status),
        time: backendOrder.created_at,
      }],
      totalPrice: Number(backendOrder.total_amount || 0),
      createdAt: backendOrder.created_at,
      appliedPromoCode: orderData.appliedPromoCode,
      discountAmount: Number((backendOrder.calculation_breakdown?.promo_discount as number) || orderData.discountAmount || 0),
      pointsDiscount: Number((backendOrder.calculation_breakdown?.loyalty_discount as number) || orderData.pointsDiscount || 0),
      pointsEarned: Number((backendOrder.calculation_breakdown?.loyalty_points_earned as number) || 0),
      referralDiscount: orderData.referralDiscount,
      paymentStatus: backendOrder.payment_status,
      amountPaid: Number(backendOrder.amount_paid || 0),
      backendOrderNumber: backendOrder.order_number,
    };
  }, [mapBackendStatus]);

  const mapBackendPartnerOrderToFrontend = useCallback((backendOrder: {
    id: string;
    order_number: string;
    customer_id: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    partner_id: string;
    total_amount: number | string;
    amount_paid?: number | string;
    payment_status?: string;
    status: string;
    created_at: string;
    pickup_contact_name?: string | null;
    pickup_contact_phone?: string | null;
    pickup_commune?: string | null;
    items?: Array<{
      id: string;
      service_id: string;
      item_name: string;
      quantity: number | string;
      unit_price: number | string;
      line_total: number | string;
      notes?: string | null;
    }>;
    status_history?: Array<{ new_status: string; created_at: string }>;
  }): Order => {
    const partner = partners.find((entry) => entry.id === backendOrder.partner_id) || null;
    const serviceItems = (backendOrder.items || []).map((item) => ({
      service: {
        id: item.service_id,
        type: partner?.type === PartnerType.PRESSING ? ServiceType.PRESSING : ServiceType.BLANCHISSERIE,
        title: item.item_name,
        description: item.notes || '',
        iconName: 'shirt',
        imageUrl: '',
        priceModel: 'per_item' as const,
        price: Number(item.unit_price || 0),
      },
      items: [{
        article: {
          id: item.id,
          name: item.item_name,
          price: Number(item.unit_price || 0),
          description: item.notes || undefined,
        },
        quantity: Number(item.quantity || 0),
      }],
    }));

    return {
      id: backendOrder.id,
      userId: backendOrder.customer_id,
      partner,
      serviceItems,
      clientDetails: {
        name: backendOrder.customer_name || backendOrder.pickup_contact_name || backendOrder.order_number,
        phone: backendOrder.customer_phone || backendOrder.pickup_contact_phone || '',
        pickupAddress: {
          commune: backendOrder.pickup_commune || '',
          avenue: '',
          numero: '',
        },
      },
      pickupTime: '',
      status: mapBackendStatus(backendOrder.status),
      trackingHistory: (backendOrder.status_history || []).map((entry) => ({
        status: mapBackendStatus(entry.new_status),
        time: entry.created_at,
      })),
      totalPrice: Number(backendOrder.total_amount || 0),
      createdAt: backendOrder.created_at,
      paymentStatus: backendOrder.payment_status,
      amountPaid: Number(backendOrder.amount_paid || 0),
      backendOrderNumber: backendOrder.order_number,
    };
  }, [mapBackendStatus, partners]);

  const refreshPartnerOrders = useCallback(async () => {
    if (!user?.partnerId || !String(user.role).startsWith('partner-')) {
      setPartnerLiveOrders([]);
      return;
    }

    try {
      const response = await realApi.getOrders({
        page: 1,
        page_size: 100,
        partner_id: user.partnerId,
      });
      setPartnerLiveOrders((response.orders || []).map(mapBackendPartnerOrderToFrontend));
    } catch {
      // Fallback: load orders from local mock data
      setPartnerLiveOrders(orderHistory.filter(o => o.partner?.id === user.partnerId));
    }
  }, [user?.partnerId, user?.role, mapBackendPartnerOrderToFrontend, orderHistory]);

  useEffect(() => {
    const handleLogout = () => {
        setOrderDraft(initialOrderDraft);
        setGuestOrderCount(0);
        setActiveOrder(null);
        setPartnerLiveOrders([]);
    };

    const unsubscribe = appEvents.on('logout', handleLogout);
    return () => unsubscribe();
  }, [setOrderDraft, setGuestOrderCount, setActiveOrder]);

  useEffect(() => {
    let isMounted = true;

    const loadPartnerOrders = async () => {
      if (!isMounted) {
        return;
      }
      await refreshPartnerOrders();
    };

    loadPartnerOrders();
    const unsubscribe = appEvents.on('data_changed', loadPartnerOrders);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [refreshPartnerOrders]);

  const updateOrderDraft = useCallback((updates: Partial<OrderDraft>) => {
    setOrderDraft(prev => ({ ...prev, ...updates }));
  }, [setOrderDraft]);

  const resetOrderDraft = useCallback(() => {
    setOrderDraft(initialOrderDraft);
  }, [setOrderDraft]);
  
  const addOrderToHistory = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    setIsLoading(true);
    try {
        if (!user) {
            throw new Error(t('orderPage.loginRequired'));
        }

        if (!orderData.partner) {
            throw new Error(t('orderPage.partnerRequired'));
        }

        try {
            let backendAddressId = user.backendAddressId;
            if (!backendAddressId) {
                const pickupAddress = orderData.clientDetails?.pickupAddress || user.pickupAddress;
                const createdAddress = await realApi.createAddress({
                    user_id: user.id,
                    label: 'Maison',
                    contact_name: orderData.clientDetails?.name || user.name,
                    contact_phone: orderData.clientDetails?.phone || user.phone,
                    address_line_1: pickupAddress.avenue || 'Adresse principale',
                    address_line_2: pickupAddress.numero || 'N/A',
                    city: 'Kinshasa',
                    commune: pickupAddress.commune || 'Kinshasa',
                    zone: pickupAddress.quartier,
                    reference_point: pickupAddress.reference,
                    instructions: pickupAddress.reference,
                    is_default: true,
                });
                backendAddressId = createdAddress.id;
            }

            const backendPartner = await resolveRealPartner(orderData.partner);
            const backendItems = await mapFrontendOrderToBackendItems(backendPartner.id, orderData.serviceItems);

            if (backendItems.length === 0) {
                throw new Error(t('orderPage.noConvertibleItems'));
            }

            const backendOrder = await realApi.createOrder({
                partner_id: backendPartner.id,
                pickup_address_id: backendAddressId,
                delivery_address_id: backendAddressId,
                items: backendItems,
                currency: orderData.partner.currency || 'USD',
                special_instructions: orderData.clientDetails?.pickupAddress?.reference,
                pickup_time_slot: orderData.pickupTime,
                express: false,
                pickup_requested: true,
                delivery_requested: true,
                promo_code: orderData.appliedPromoCode || undefined,
                loyalty_points_to_redeem: orderData.useLoyaltyPoints || 0,
                idempotency_key: createIdempotencyKey(),
            });

            const newOrder = mapBackendOrderToFrontend(backendOrder, orderData);
            if (user && String(user.role).startsWith('partner-')) {
                await refreshPartnerOrders();
            } else {
                appEvents.emit('data_changed');
            }
            return newOrder;
        } catch (apiError: any) {
            if (apiError?.status === 401 || apiError?.status === 403) {
                console.warn('Backend unavailable, creating local order');
                const localOrder: Order = {
                    id: `ORD-${Date.now()}`,
                    userId: user.id,
                    partner: orderData.partner,
                    serviceItems: orderData.serviceItems,
                    clientDetails: orderData.clientDetails,
                    pickupTime: orderData.pickupTime,
                    status: OrderStatus.AWAITING_CONFIRMATION,
                    trackingHistory: [{ status: OrderStatus.AWAITING_CONFIRMATION, time: new Date().toISOString() }],
                    totalPrice: orderData.totalPrice || 0,
                    createdAt: new Date().toISOString(),
                };
                appEvents.emit('data_changed');
                return localOrder;
            }
            throw apiError;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : t('orderPage.orderCreationError');
        addNotification(message, 'error');
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [user, createIdempotencyKey, resolveRealPartner, mapFrontendOrderToBackendItems, mapBackendOrderToFrontend, addNotification, t, refreshPartnerOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, rejectionReason?: string, estimatedCompletionTime?: string) => {
    setIsLoading(true);
    try {
        if (user && String(user.role).startsWith('partner-')) {
            const currentOrder =
              partnerLiveOrders.find((order) => order.id === orderId) ||
              orderHistory.find((order) => order.id === orderId);

            if (!currentOrder) {
              throw new Error('Order not found');
            }

            const updatedBackendOrder = await realApi.updateOrderStatus(orderId, {
              new_status: mapFrontendStatusToBackend(currentOrder.status, newStatus),
              change_reason: rejectionReason || estimatedCompletionTime,
            });
            const updatedFrontendOrder = mapBackendPartnerOrderToFrontend(updatedBackendOrder);
            setPartnerLiveOrders((previousOrders) =>
              previousOrders.map((order) =>
                order.id === orderId ? updatedFrontendOrder : order
              )
            );
            appEvents.emit('data_changed');
        } else {
            await api.apiUpdateOrderStatus(orderId, newStatus, t, rejectionReason, estimatedCompletionTime);
        }
        if (activeOrder && activeOrder.id === orderId) {
            const { orderHistory: newOrderHistory } = await api.fetchAllData();
            const updatedActiveOrder = newOrderHistory.find(o => o.id === orderId);
            setActiveOrder(updatedActiveOrder || null);
        }
    } finally {
        setIsLoading(false);
    }
  }, [activeOrder, setActiveOrder, t, user, partnerLiveOrders, orderHistory, mapFrontendStatusToBackend, mapBackendPartnerOrderToFrontend]);

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
      if (user?.partnerId === partnerId && String(user.role).startsWith('partner-')) {
          return partnerLiveOrders;
      }
      return orderHistory.filter(o => o.partner?.id === partnerId);
  }, [orderHistory, partnerLiveOrders, user?.partnerId, user?.role]);

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
