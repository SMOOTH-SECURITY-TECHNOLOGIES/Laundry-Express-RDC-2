import { features } from '../../config/features';
import { realApi, type BackendCampaignDashboardResponse } from '../../services/real-api';
import type { CampaignDashboardSummary } from './campaigns-types';

export const CAMPAIGNS_WRITE_ENABLED = import.meta.env.VITE_CAMPAIGNS_WRITE_ENABLED !== 'false';

let cached: CampaignDashboardSummary | null = null;
let promise: Promise<CampaignDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateCampaignsCache(): void {
  cached = null;
  promise = null;
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
