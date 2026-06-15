import { Order, PromoCode, User } from '../types';

export type PromoSegmentKey = 'new' | 'active' | 'dormant' | 'vip' | 'enterprise' | 'high_basket' | 'low_basket';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const SEGMENT_LABELS: Record<string, string> = {
  new: 'Nouveaux',
  active: 'Actifs',
  dormant: 'Inactifs',
  vip: 'VIP',
  enterprise: 'Entreprise',
  high_basket: 'Panier eleve',
  low_basket: 'Panier faible',
};

export const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  push: 'Push',
  web: 'Web',
};

export function isPromoWithinDates(promo: PromoCode, now = new Date()): boolean {
  if (promo.startDate) {
    const start = new Date(promo.startDate);
    start.setHours(0, 0, 0, 0);
    if (now < start) return false;
  }
  if (promo.endDate) {
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

export function getUserPartnerOrders(userId: string, partnerId: string | undefined, orders: Order[]): Order[] {
  return orders.filter((o) => o.userId === userId && (!partnerId || o.partner?.id === partnerId));
}

export function countUserPromoUses(code: string, userId: string, orders: Order[]): number {
  return orders.filter(
    (o) => o.userId === userId && o.appliedPromoCode?.toUpperCase() === code.toUpperCase(),
  ).length;
}

export function matchesSegment(
  segment: PromoSegmentKey,
  user: User | null,
  orders: Order[],
  partnerId?: string,
): boolean {
  if (!user) return segment === 'new';

  const userOrders = getUserPartnerOrders(user.id, partnerId, orders);
  const now = Date.now();
  const totalSpent = userOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgBasket = userOrders.length ? totalSpent / userOrders.length : 0;
  const hasRecentOrder = userOrders.some((o) => now - new Date(o.createdAt).getTime() < THIRTY_DAYS_MS);

  switch (segment) {
    case 'new':
      return userOrders.length === 0;
    case 'active':
      return hasRecentOrder;
    case 'dormant':
      return userOrders.length > 0 && !hasRecentOrder;
    case 'vip':
      return userOrders.length >= 5 || totalSpent >= 150;
    case 'enterprise':
      return (
        (user.name || '').toLowerCase().includes('entreprise') ||
        userOrders.some((o) => (o.clientDetails?.name || '').toLowerCase().includes('entreprise'))
      );
    case 'high_basket':
      return avgBasket >= 40;
    case 'low_basket':
      return userOrders.length > 0 && avgBasket < 20;
    default:
      return true;
  }
}

export function matchesAnySegment(promo: PromoCode, user: User | null, orders: Order[]): boolean {
  const segments = promo.targetSegments;
  if (!segments?.length) {
    if (promo.isForNewUsersOnly) {
      return matchesSegment('new', user, orders, promo.partnerId);
    }
    return true;
  }
  return segments.some((s) => matchesSegment(s as PromoSegmentKey, user, orders, promo.partnerId));
}

export function computePromoDiscount(promo: PromoCode, totalPrice: number): number {
  const isFixedLike =
    promo.promoType === 'cashback' ||
    promo.promoType === 'delivery' ||
    promo.discountType === 'fixed';

  if (isFixedLike) {
    return Math.min(promo.discountValue, totalPrice || promo.discountValue);
  }
  return (totalPrice || 0) * (promo.discountValue / 100);
}

export function isWithinBudget(promo: PromoCode, nextDiscount: number): boolean {
  if (promo.maxBudget == null || promo.maxBudget <= 0) return true;
  return (promo.budgetUsed || 0) + nextDiscount <= promo.maxBudget;
}

export function promoTypeDisplay(promo: PromoCode): string {
  switch (promo.promoType) {
    case 'delivery':
      return 'Livraison gratuite';
    case 'cashback':
      return 'Cashback';
    case 'fixed':
      return 'Montant fixe';
    case 'percentage':
      return 'Pourcentage';
    default:
      return promo.discountType === 'percentage' ? 'Pourcentage' : 'Montant fixe';
  }
}
