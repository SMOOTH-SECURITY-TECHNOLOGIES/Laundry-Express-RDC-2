import { features } from '../../config/features';
import { realApi, type BackendCampaignDashboardResponse, type BackendGrowthDashboardResponse } from '../../services/real-api';
import type { CampaignDashboardSummary, GrowthDashboardSummary } from './campaigns-types';

export const CAMPAIGNS_WRITE_ENABLED = import.meta.env.VITE_CAMPAIGNS_WRITE_ENABLED !== 'false';

let cached: CampaignDashboardSummary | null = null;
let promise: Promise<CampaignDashboardSummary> | null = null;
let cachedDays = 7;
let cachedGrowth: GrowthDashboardSummary | null = null;
let growthPromise: Promise<GrowthDashboardSummary> | null = null;

export function invalidateCampaignsCache(): void {
  cached = null;
  promise = null;
  cachedGrowth = null;
  growthPromise = null;
}

function map(raw: BackendCampaignDashboardResponse): CampaignDashboardSummary {
  return {
    kpis: {
      activeCampaigns: raw.kpis.active_campaigns,
      activeCampaignsChange: raw.kpis.active_campaigns_change,
      activeCampaignsSparkline: raw.kpis.active_campaigns_sparkline ?? [],
      messagesSent: raw.kpis.messages_sent,
      messagesSentChange: raw.kpis.messages_sent_change,
      messagesSentSparkline: raw.kpis.messages_sent_sparkline ?? [],
      openRate: raw.kpis.open_rate,
      openRateChange: raw.kpis.open_rate_change,
      openRateSparkline: raw.kpis.open_rate_sparkline ?? [],
      clickRate: raw.kpis.click_rate,
      clickRateChange: raw.kpis.click_rate_change,
      clickRateSparkline: raw.kpis.click_rate_sparkline ?? [],
      conversions: raw.kpis.conversions,
      conversionsChange: raw.kpis.conversions_change,
      conversionsSparkline: raw.kpis.conversions_sparkline ?? [],
      attributedRevenue: raw.kpis.attributed_revenue,
      attributedRevenueChange: raw.kpis.attributed_revenue_change,
      attributedRevenueSparkline: raw.kpis.attributed_revenue_sparkline ?? [],
    },
    campaigns: raw.campaigns.map((c) => ({
      id: c.id, name: c.name, channel: c.channel, audience: c.audience, segment: c.segment,
      status: c.status, messagesSent: c.messages_sent, opens: c.opens, openRate: c.open_rate,
      clicks: c.clicks, clickRate: c.click_rate, conversions: c.conversions,
      conversionRate: c.conversion_rate, roi: c.roi, revenue: c.revenue, scheduledAt: c.scheduled_at,
    })),
    channels: raw.channels.map((c) => ({ channel: c.channel, percent: c.percent, messages: c.messages, conversions: c.conversions, revenue: c.revenue, color: c.color })),
    funnel: raw.funnel.map((f) => ({ stage: f.stage, count: f.count, rate: f.rate })),
    trends: raw.trends.map((t) => ({ date: t.date, messages: t.messages, conversions: t.conversions, revenue: t.revenue })),
    topCampaigns: raw.top_campaigns.map((c) => ({ id: c.id, name: c.name, channel: c.channel, audience: null, segment: null, status: 'active', messagesSent: 0, opens: 0, openRate: 0, clicks: 0, clickRate: 0, conversions: c.conversions, conversionRate: 0, roi: c.roi, revenue: c.revenue })),
    segments: raw.segments.map((s) => ({ segment: s.segment, segmentKey: s.segment_key, audienceSize: s.audience_size, conversionRate: s.conversion_rate, revenue: s.revenue })),
    automations: raw.automations.map((a) => ({ id: a.id, name: a.name, trigger: a.trigger, status: a.status, conversions: a.conversions, revenue: a.revenue })),
    calendar: raw.calendar.map((e) => ({ id: e.id, title: e.title, date: e.date, time: e.time, channel: e.channel, audience: e.audience })),
    roi: { budgetSpent: raw.roi.budget_spent, revenueGenerated: raw.roi.revenue_generated, globalRoi: raw.roi.global_roi, costPerAcquisition: raw.roi.cost_per_acquisition, customerLifetimeValue: raw.roi.customer_lifetime_value, roas: raw.roi.roas },
    watchlist: raw.watchlist.map((w) => ({ id: w.id, message: w.message, count: w.count, severity: w.severity })),
    source: raw.source,
  };
}

function mapGrowth(raw: BackendGrowthDashboardResponse): GrowthDashboardSummary {
  return {
    acquisition: raw.acquisition,
    activation: raw.activation,
    conversion: raw.conversion,
    retention: raw.retention,
    referral: raw.referral,
    revenue: raw.revenue,
    rfmSegments: raw.rfm_segments.map((s) => ({
      segment: s.segment,
      segmentKey: s.segment_key,
      audienceSize: s.audience_size,
      recencyScore: s.recency_score,
      frequencyScore: s.frequency_score,
      monetaryScore: s.monetary_score,
      recommendedAction: s.recommended_action,
    })),
    automations: raw.automations.map((a) => ({
      key: a.key,
      name: a.name,
      trigger: a.trigger,
      channels: a.channels,
      eligibleCustomers: a.eligible_customers,
      status: a.status,
      nextAction: a.next_action,
    })),
    promoFraudRisks: raw.promo_fraud_risks.map((r) => ({
      promoCode: r.promo_code,
      riskScore: r.risk_score,
      severity: r.severity,
      signals: r.signals,
      recommendedAction: r.recommended_action,
    })),
    trendingOffers: raw.trending_offers.map((o) => ({
      id: o.id,
      title: o.title,
      offerType: o.offer_type,
      score: o.score,
      ctr: o.ctr,
      conversionRate: o.conversion_rate,
      revenue: o.revenue,
      placements: o.placements,
    })),
    roi: {
      promoRevenue: raw.roi.promo_revenue,
      loyaltyRevenue: raw.roi.loyalty_revenue,
      referralRevenue: raw.roi.referral_revenue,
      remarketingRevenue: raw.roi.remarketing_revenue,
      reactivationRevenue: raw.roi.reactivation_revenue,
      estimatedCac: raw.roi.estimated_cac,
      estimatedLtv: raw.roi.estimated_ltv,
      estimatedRoi: raw.roi.estimated_roi,
    },
    source: raw.source,
  };
}

export async function fetchCampaignsBundle(days = 7): Promise<CampaignDashboardSummary> {
  if (cached && cachedDays === days) return cached;
  if (features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true') {
    throw new Error('Le module Campagnes nécessite le backend.');
  }
  if (!promise || cachedDays !== days) {
    cachedDays = days;
    promise = realApi.getCampaignDashboard(days).then((raw) => { cached = map(raw); return cached; });
  }
  return promise;
}

export async function fetchGrowthDashboard(): Promise<GrowthDashboardSummary> {
  if (cachedGrowth) return cachedGrowth;
  if (features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true') {
    throw new Error('Le module Growth nécessite le backend.');
  }
  if (!growthPromise) {
    growthPromise = realApi.getGrowthDashboard().then((raw) => { cachedGrowth = mapGrowth(raw); return cachedGrowth; });
  }
  return growthPromise;
}

export async function reviewGrowthPromoRisk(promoCode: string): Promise<string> {
  const result = await realApi.reviewGrowthPromoRisk(promoCode, 'review requested from Growth Engine UI');
  invalidateCampaignsCache();
  return result.message;
}

export async function suspendGrowthPromo(promoCode: string): Promise<string> {
  const result = await realApi.suspendGrowthPromo(promoCode, 'suspended from Growth Engine UI');
  invalidateCampaignsCache();
  return result.message;
}

export async function prepareGrowthAutomation(automationKey: string): Promise<string> {
  const result = await realApi.prepareGrowthAutomation(automationKey, 'prepared from Growth Engine UI');
  invalidateCampaignsCache();
  return result.message;
}

export async function createCampaign(data: { name: string; channel: string; audience: string; content: string; budget: number; scheduledAt?: string }): Promise<{ id: string }> {
  if (!CAMPAIGNS_WRITE_ENABLED) throw new Error('Écriture campagnes désactivée.');
  const r = await realApi.createCampaign(data);
  invalidateCampaignsCache();
  return r;
}

export async function updateCampaign(id: string, data: Record<string, unknown>): Promise<void> {
  await realApi.updateCampaign(id, data);
  invalidateCampaignsCache();
}

export async function deleteCampaign(id: string): Promise<void> {
  await realApi.deleteCampaign(id);
  invalidateCampaignsCache();
}

export async function pauseCampaign(id: string): Promise<void> {
  await realApi.pauseCampaign(id);
  invalidateCampaignsCache();
}

export async function resumeCampaign(id: string): Promise<void> {
  await realApi.resumeCampaign(id);
  invalidateCampaignsCache();
}

export async function duplicateCampaign(id: string): Promise<{ id: string }> {
  const r = await realApi.duplicateCampaign(id);
  invalidateCampaignsCache();
  return r;
}

export async function getCampaignAnalytics(id: string) {
  return realApi.getCampaignAnalytics(id);
}

export async function exportCampaignsData(format: string, scope: string) {
  return realApi.exportCampaigns({ format, scope });
}

export function trackCampaignEvent(name: string, detail?: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event: name, ...detail } }));
  }
}
