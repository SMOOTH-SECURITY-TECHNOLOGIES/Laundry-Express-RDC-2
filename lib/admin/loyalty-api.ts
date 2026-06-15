import { features } from '../../config/features';
import { realApi, type BackendLoyaltyDashboardResponse } from '../../services/real-api';
import type { LoyaltyCenterBundle, LoyaltySettingsCard } from './loyalty-types';

export const LOYALTY_WRITE_ENABLED = import.meta.env.VITE_LOYALTY_WRITE_ENABLED !== 'false';

let cachedBundle: LoyaltyCenterBundle | null = null;
let bundlePromise: Promise<LoyaltyCenterBundle> | null = null;
let cachedDays = 7;

export function invalidateLoyaltyCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function mapDashboard(raw: BackendLoyaltyDashboardResponse): LoyaltyCenterBundle {
  return {
    kpis: {
      members: raw.kpis.members,
      membersChange: raw.kpis.members_change,
      membersSparkline: raw.kpis.members_sparkline ?? [],
      pointsCirculation: raw.kpis.points_circulation,
      pointsCirculationChange: raw.kpis.points_circulation_change,
      pointsCirculationSparkline: raw.kpis.points_circulation_sparkline ?? [],
      pointsEarned: raw.kpis.points_earned,
      pointsEarnedChange: raw.kpis.points_earned_change,
      pointsEarnedSparkline: raw.kpis.points_earned_sparkline ?? [],
      pointsRedeemed: raw.kpis.points_redeemed,
      pointsRedeemedChange: raw.kpis.points_redeemed_change,
      pointsRedeemedSparkline: raw.kpis.points_redeemed_sparkline ?? [],
      pointsValue: raw.kpis.points_value,
      pointsValueChange: raw.kpis.points_value_change,
      pointsValueSparkline: raw.kpis.points_value_sparkline ?? [],
      redemptionRate: raw.kpis.redemption_rate,
      redemptionRateChange: raw.kpis.redemption_rate_change,
      redemptionRateSparkline: raw.kpis.redemption_rate_sparkline ?? [],
      influencedRevenue: raw.kpis.influenced_revenue,
      influencedRevenueChange: raw.kpis.influenced_revenue_change,
      influencedRevenueSparkline: raw.kpis.influenced_revenue_sparkline ?? [],
      retentionRate: raw.kpis.retention_rate,
      retentionRateChange: raw.kpis.retention_rate_change,
      retentionRateSparkline: raw.kpis.retention_rate_sparkline ?? [],
    },
    health: {
      score: raw.health.score,
      status: raw.health.status,
      redemptionRate: raw.health.redemption_rate,
      pointsLiability: raw.health.points_liability,
      retentionUplift: raw.health.retention_uplift,
      fraudRisk: raw.health.fraud_risk,
      unusedPoints: raw.health.unused_points,
    },
    settings: {
      isEnabled: raw.settings.is_enabled,
      pointsPerDollar: raw.settings.points_per_dollar,
      pointsToDollar: raw.settings.points_to_dollar,
      pointsExpiryDays: raw.settings.points_expiry_days,
      redemptionCap: raw.settings.redemption_cap,
      firstOrderBonus: raw.settings.first_order_bonus,
    },
    rewards: raw.rewards.map((r) => ({
      id: r.id, name: r.name, pointsRequired: r.points_required,
      valueDollars: r.value_dollars, usesCount: r.uses_count, status: r.status,
    })),
    earningRules: raw.earning_rules.map((e) => ({
      id: e.id, name: e.name, condition: e.condition, points: e.points,
      status: e.status, performance: e.performance,
    })),
    activity: raw.activity.map((a) => ({
      id: a.id, clientName: a.client_name, clientEmail: a.client_email,
      entryType: a.entry_type, orderNumber: a.order_number,
      pointsDelta: a.points_delta, balanceAfter: a.balance_after,
      createdAt: a.created_at, source: a.source,
    })),
    topUsers: raw.top_users.map((u) => ({
      userId: u.user_id, name: u.name, email: u.email, points: u.points,
      estimatedValue: u.estimated_value, ordersCount: u.orders_count, lastActivity: u.last_activity,
    })),
    topRedeemers: raw.top_redeemers.map((r) => ({
      userId: r.user_id, name: r.name, pointsUsed: r.points_used,
      amountSaved: r.amount_saved, linkedOrders: r.linked_orders,
    })),
    retention: raw.retention.map((r) => ({ period: r.period, members: r.members, nonMembers: r.non_members })),
    revenueImpact: {
      influencedRevenue: raw.revenue_impact.influenced_revenue,
      influencedRevenueChange: raw.revenue_impact.influenced_revenue_change,
      avgBasketMembers: raw.revenue_impact.avg_basket_members,
      avgBasketNonMembers: raw.revenue_impact.avg_basket_non_members,
      orderFrequencyMembers: raw.revenue_impact.order_frequency_members,
      pointsCost: raw.revenue_impact.points_cost,
      loyaltyRoi: raw.revenue_impact.loyalty_roi,
    },
    cohorts: raw.cohorts.map((c) => ({ month: c.month, m0: c.m0, m1: c.m1, m2: c.m2, m3: c.m3, m4: c.m4 })),
    risks: raw.risks.map((r) => ({ id: r.id, message: r.message, count: r.count, severity: r.severity })),
    segments: raw.segments.map((s) => ({ segment: s.segment, segmentKey: s.segment_key, count: s.count, percent: s.percent })),
    integrations: raw.integrations.map((i) => ({ module: i.module, status: i.status, connected: i.connected })),
    source: raw.source,
  };
}

export async function fetchLoyaltyBundle(days = 7): Promise<LoyaltyCenterBundle> {
  if (cachedBundle && cachedDays === days) return cachedBundle;
  if (features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true') {
    throw new Error('Le module Fidélité nécessite le backend — désactivez VITE_USE_MOCK_API.');
  }
  if (!bundlePromise || cachedDays !== days) {
    cachedDays = days;
    bundlePromise = realApi.getLoyaltyDashboard(days).then((raw) => {
      const bundle = mapDashboard(raw);
      cachedBundle = bundle;
      return bundle;
    });
  }
  return bundlePromise;
}

export async function saveLoyaltySettings(settings: LoyaltySettingsCard): Promise<void> {
  if (!LOYALTY_WRITE_ENABLED) throw new Error('Modification fidélité désactivée.');
  await realApi.updateLoyaltyAdminSettings({
    is_enabled: settings.isEnabled,
    points_per_dollar: settings.pointsPerDollar,
    points_to_dollar: settings.pointsToDollar,
    points_expiry_days: settings.pointsExpiryDays,
    redemption_cap: settings.redemptionCap,
    first_order_bonus: settings.firstOrderBonus,
  });
  invalidateLoyaltyCache();
}

export async function runLoyaltyExpiration(): Promise<{ expiredPoints: number }> {
  const result = await realApi.runLoyaltyAdminExpiration();
  invalidateLoyaltyCache();
  return { expiredPoints: result.expired_points };
}

export async function createReward(name: string, pointsRequired: number, valueDollars: number): Promise<{ id: string }> {
  if (!LOYALTY_WRITE_ENABLED) throw new Error('Création récompense désactivée.');
  const result = await realApi.createLoyaltyReward({ name, points_required: pointsRequired, value_dollars: valueDollars });
  invalidateLoyaltyCache();
  return { id: result.id };
}

export async function disableReward(id: string): Promise<void> {
  await realApi.updateLoyaltyReward(id, { is_active: false });
  invalidateLoyaltyCache();
}

export async function exportLoyaltyData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: string = 'activity',
): Promise<{ filename: string; count: number }> {
  const result = await realApi.exportLoyalty({ format, scope });
  return { filename: result.filename, count: result.count };
}
