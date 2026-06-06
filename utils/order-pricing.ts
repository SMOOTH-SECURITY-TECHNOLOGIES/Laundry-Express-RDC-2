import { ServiceItem } from '../types';
import { OrderDraft } from '../context/OrderContext';

export function calculateSubtotal(serviceItems: ServiceItem[]): number {
  return serviceItems.reduce((sum, si) => {
    if (si.items) {
      return sum + si.items.reduce((s, item) => s + item.article.price * item.quantity, 0);
    }
    if (si.weight && si.service.price) {
      return sum + si.weight * si.service.price;
    }
    return sum;
  }, 0);
}

export function calculateItemLineTotal(price: number, quantity: number): number {
  return price * quantity;
}

export function getEstimatedTotal(orderDraft: OrderDraft): number {
  return orderDraft.totalPrice ?? calculateSubtotal(orderDraft.serviceItems ?? []);
}

export function getDiscountTotal(discountAmount?: number, pointsDiscount?: number, referralDiscount?: number): number {
  return (discountAmount || 0) + (pointsDiscount || 0) + (referralDiscount || 0);
}

export function getFinalTotal(orderDraft: OrderDraft): number {
  const base = getEstimatedTotal(orderDraft);
  const discounts = getDiscountTotal(
    orderDraft.discountAmount,
    orderDraft.pointsDiscount,
    orderDraft.referralDiscount
  );
  return Math.max(0, base - discounts);
}
