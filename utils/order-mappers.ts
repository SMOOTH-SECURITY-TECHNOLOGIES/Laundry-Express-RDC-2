import { Order, OrderStatus, Partner, ServiceType, PartnerType } from '../types';
import type { Order as BackendOrder } from '../services/real-api';

export function mapBackendStatus(status: string): OrderStatus {
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
}

export function mapBackendOrderResponseToFrontend(
  backendOrder: BackendOrder,
  partners: Partner[] = [],
): Order {
  const partner =
    partners.find((entry) => entry.id === backendOrder.partner_id) ||
    ({
      id: backendOrder.partner_id,
      name: backendOrder.partner_name || 'Partenaire',
      type: PartnerType.PRESSING,
      currency: 'USD',
    } as Partner);

  const statusHistory = (backendOrder.status_history || []).map((entry) => ({
    status: mapBackendStatus(entry.new_status),
    time: entry.created_at,
  }));

  const serviceItems = (backendOrder.items || []).map((item) => ({
    service: {
      id: item.service_id,
      type: partner.type === PartnerType.PRESSING ? ServiceType.PRESSING : ServiceType.BLANCHISSERIE,
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
        description: item.notes || '',
        iconName: 'shirt',
        price: Number(item.unit_price || 0),
      },
      quantity: Number(item.quantity || 1),
    }],
  }));

  return {
    id: backendOrder.id,
    userId: backendOrder.customer_id,
    partner,
    serviceItems,
    clientDetails: {
      name: backendOrder.pickup_contact_name || backendOrder.customer_name || '',
      phone: backendOrder.pickup_contact_phone || backendOrder.customer_phone || '',
      pickupAddress: {
        commune: backendOrder.pickup_commune || 'Kinshasa',
        quartier: '',
        avenue: '',
        numero: '',
        reference: '',
      },
    },
    pickupTime: '',
    status: mapBackendStatus(backendOrder.status),
    trackingHistory: statusHistory.length > 0 ? statusHistory : [{
      status: mapBackendStatus(backendOrder.status),
      time: backendOrder.created_at,
    }],
    totalPrice: Number(backendOrder.total_amount || 0),
    createdAt: backendOrder.created_at,
    discountAmount: Number(backendOrder.discount_amount || backendOrder.calculation_breakdown?.promo_discount || 0),
    pointsDiscount: Number(backendOrder.calculation_breakdown?.loyalty_discount || 0),
    pointsEarned: Number(backendOrder.calculation_breakdown?.loyalty_points_earned || 0),
    paymentStatus: backendOrder.payment_status,
    amountPaid: Number(backendOrder.amount_paid || 0),
    backendOrderNumber: backendOrder.order_number,
  };
}

export function isLocalMockOrderId(orderId: string | null | undefined): boolean {
  return !orderId || orderId.startsWith('ORD-');
}
