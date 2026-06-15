import type { AdminPromoCode, AdminPromoCodeUpsertRequest, PartnerPromoCode } from '../services/real-api';
import { PromoCode } from '../types';

const STORAGE_KEY = 'promo-code-extras';

type PromoExtras = Pick<
  PromoCode,
  'name' | 'promoType' | 'maxBudget' | 'budgetUsed' | 'targetSegments' | 'channels'
>;

function readExtrasStore(): Record<string, PromoExtras> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function savePromoExtras(id: string, promo: Partial<PromoCode>): void {
  const store = readExtrasStore();
  store[id] = {
    name: promo.name,
    promoType: promo.promoType,
    maxBudget: promo.maxBudget,
    budgetUsed: promo.budgetUsed ?? 0,
    targetSegments: promo.targetSegments,
    channels: promo.channels,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function mergePromoExtras(promo: PromoCode): PromoCode {
  const extras = readExtrasStore()[promo.id];
  return extras ? { ...promo, ...extras } : promo;
}

export function mapApiPromoToFrontend(
  api: AdminPromoCode | PartnerPromoCode,
  extras?: Partial<PromoCode>,
): PromoCode {
  const mapped: PromoCode = {
    id: api.id,
    code: api.code,
    discountType: api.discount_type,
    discountValue: api.discount_value,
    minOrderValue: api.min_order_value ?? undefined,
    isForNewUsersOnly: api.is_for_new_users_only,
    isActive: api.is_active,
    partnerId: api.partner_id ?? undefined,
    usageCount: api.usage_count,
    maxUsage: api.max_usage,
    usageLimitPerCustomer: api.usage_limit_per_customer ?? undefined,
    startDate: api.start_date ?? undefined,
    endDate: api.end_date,
    applicableServices: api.applicable_services ?? undefined,
    description: api.description ?? undefined,
    createdAt: api.created_at,
    name: extras?.name,
    promoType: extras?.promoType,
    maxBudget: extras?.maxBudget,
    budgetUsed: extras?.budgetUsed,
    targetSegments: extras?.targetSegments,
    channels: extras?.channels,
  };
  return mergePromoExtras(mapped);
}

export function mapFrontendPromoToApiCreate(
  promo: Omit<PromoCode, 'id' | 'createdAt'>,
): AdminPromoCodeUpsertRequest {
  return {
    code: promo.code,
    discount_type: promo.discountType,
    discount_value: promo.discountValue,
    min_order_value: promo.minOrderValue ?? null,
    is_for_new_users_only: promo.isForNewUsersOnly ?? false,
    is_active: promo.isActive,
    partner_id: promo.partnerId ?? null,
    max_usage: promo.maxUsage ?? null,
    usage_limit_per_customer: promo.usageLimitPerCustomer ?? null,
    start_date: promo.startDate ?? null,
    end_date: promo.endDate ?? null,
    applicable_services: promo.applicableServices,
    description: promo.description ?? promo.name ?? null,
  };
}
