import { features } from '../../config/features';
import { realApi, type BackendReferralDashboardResponse } from '../../services/real-api';
import type { ReferralDashboardSummary, ReferralSettings } from './referrals-types';

export const REFERRALS_WRITE_ENABLED = import.meta.env.VITE_REFERRALS_WRITE_ENABLED !== 'false';

let cached: ReferralDashboardSummary | null = null;
let promise: Promise<ReferralDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateReferralsCache(): void {
  cached = null;
  promise = null;
}

function map(raw: BackendReferralDashboardResponse): ReferralDashboardSummary {
  return {
    kpis: {
      usersWithCode: raw.kpis.users_with_code,
      usersWithCodeChange: raw.kpis.users_with_code_change,
      usersWithCodeSparkline: raw.kpis.users_with_code_sparkline ?? [],
      referredUsers: raw.kpis.referred_users,
      referredUsersChange: raw.kpis.referred_users_change,
      referredUsersSparkline: raw.kpis.referred_users_sparkline ?? [],
      discountsUsed: raw.kpis.discounts_used,
      discountsUsedChange: raw.kpis.discounts_used_change,
      discountsUsedSparkline: raw.kpis.discounts_used_sparkline ?? [],
      bonusPoints: raw.kpis.bonus_points,
      bonusPointsChange: raw.kpis.bonus_points_change,
      bonusPointsSparkline: raw.kpis.bonus_points_sparkline ?? [],
      completedConversions: raw.kpis.completed_conversions,
      completedConversionsChange: raw.kpis.completed_conversions_change,
      completedConversionsSparkline: raw.kpis.completed_conversions_sparkline ?? [],
      revenueGenerated: raw.kpis.revenue_generated,
      revenueGeneratedChange: raw.kpis.revenue_generated_change,
      revenueGeneratedSparkline: raw.kpis.revenue_generated_sparkline ?? [],
    },
    settings: {
      isEnabled: raw.settings.is_enabled,
      referrerBonusPoints: raw.settings.referrer_bonus_points,
      refereeDiscountAmount: raw.settings.referee_discount_amount,
      referrerConversionBonus: raw.settings.referrer_conversion_bonus,
      refereeConversionBonus: raw.settings.referee_conversion_bonus,
      pointsExpiryDays: raw.settings.points_expiry_days,
      bonusCapPerReferrer: raw.settings.bonus_cap_per_referrer,
      allowedChannels: raw.settings.allowed_channels,
    },
    channels: raw.channels.map((c) => ({ channel: c.channel, percent: c.percent, conversions: c.conversions, roi: c.roi, color: c.color })),
    topReferrers: raw.top_referrers.map((r) => ({
      rank: r.rank, userId: r.user_id, name: r.name, email: r.email, referralCode: r.referral_code,
      referees: r.referees, conversions: r.conversions, bonusPoints: r.bonus_points, revenueGenerated: r.revenue_generated,
    })),
    recentConversions: raw.recent_conversions.map((c) => ({
      id: c.id, refereeName: c.referee_name, refereeEmail: c.referee_email, orderId: c.order_id,
      date: c.date, discountUsed: c.discount_used, status: c.status,
    })),
    watchlist: raw.watchlist.map((w) => ({ id: w.id, message: w.message, count: w.count, severity: w.severity })),
    trends: raw.trends.map((t) => ({ date: t.date, conversions: t.conversions, revenue: t.revenue })),
    impact: raw.impact.map((i) => ({ indicator: i.indicator, referred: i.referred, nonReferred: i.non_referred, difference: i.difference })),
    popularCodes: raw.popular_codes.map((p) => ({ code: p.code, uses: p.uses, conversions: p.conversions, roi: p.roi })),
    totalRevenue: raw.total_revenue,
    source: raw.source,
  };
}

export async function fetchReferralsBundle(days = 7): Promise<ReferralDashboardSummary> {
  if (cached && cachedDays === days) return cached;
  if (features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true') {
    throw new Error('Le module Parrainage nécessite le backend.');
  }
  if (!promise || cachedDays !== days) {
    cachedDays = days;
    promise = realApi.getReferralDashboard(days).then((raw) => { cached = map(raw); return cached; });
  }
  return promise;
}

export async function saveReferralSettings(s: ReferralSettings): Promise<void> {
  if (!REFERRALS_WRITE_ENABLED) throw new Error('Écriture parrainage désactivée.');
  await realApi.updateReferralAdminSettings({
    is_enabled: s.isEnabled,
    referrer_bonus_points: s.referrerBonusPoints,
    referee_discount_amount: s.refereeDiscountAmount,
    referee_bonus_points: s.refereeConversionBonus,
    points_expiry_days: s.pointsExpiryDays,
    bonus_cap_per_referrer: s.bonusCapPerReferrer,
    allowed_channels: s.allowedChannels,
  });
  invalidateReferralsCache();
}

export async function createReferralCampaign(
  name: string, audience: string, budget: number, startDate: string, endDate: string,
): Promise<{ id: string }> {
  const r = await realApi.createReferralCampaign({ name, audience, budget, start_date: startDate, end_date: endDate });
  invalidateReferralsCache();
  return r;
}

export async function sendManualBonus(userId: string, points: number, reason: string): Promise<void> {
  await realApi.sendReferralManualBonus({ user_id: userId, points, reason });
  invalidateReferralsCache();
}

export async function exportReferralsData(format: string, scope: string): Promise<{ filename: string; count: number }> {
  const r = await realApi.exportReferrals({ format, scope });
  return { filename: r.filename, count: r.count };
}

export function trackReferralEvent(name: string, detail?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event: name, ...detail } }));
  }
}
