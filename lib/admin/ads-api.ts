import { features } from '../../config/features';
import { realApi, type BackendAdsDashboardResponse } from '../../services/real-api';
import type { AdCreatePayload, AdsCenterBundle } from './ads-types';

export const ADS_WRITE_ENABLED = import.meta.env.VITE_ADS_WRITE_ENABLED !== 'false';

let cachedBundle: AdsCenterBundle | null = null;
let bundlePromise: Promise<AdsCenterBundle> | null = null;
let cachedDays = 7;

export function invalidateAdsCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function mapDashboard(raw: BackendAdsDashboardResponse): AdsCenterBundle {
  return {
    kpis: {
      activeAds: raw.kpis.active_ads,
      activeAdsChange: raw.kpis.active_ads_change,
      activeAdsSparkline: raw.kpis.active_ads_sparkline ?? [],
      impressions: raw.kpis.impressions,
      impressionsChange: raw.kpis.impressions_change,
      impressionsSparkline: raw.kpis.impressions_sparkline ?? [],
      clicks: raw.kpis.clicks,
      clicksChange: raw.kpis.clicks_change,
      clicksSparkline: raw.kpis.clicks_sparkline ?? [],
      ctr: raw.kpis.ctr,
      ctrChange: raw.kpis.ctr_change,
      ctrSparkline: raw.kpis.ctr_sparkline ?? [],
      conversions: raw.kpis.conversions,
      conversionsChange: raw.kpis.conversions_change,
      conversionsSparkline: raw.kpis.conversions_sparkline ?? [],
      spend: raw.kpis.spend,
      spendChange: raw.kpis.spend_change,
      spendSparkline: raw.kpis.spend_sparkline ?? [],
      roi: raw.kpis.roi,
      roiChange: raw.kpis.roi_change,
      roiSparkline: raw.kpis.roi_sparkline ?? [],
    },
    ads: raw.ads.map((a) => ({
      id: a.id,
      title: a.title,
      campaign: a.campaign,
      channel: a.channel,
      zone: a.zone,
      budget: a.budget,
      spend: a.spend,
      impressions: a.impressions,
      clicks: a.clicks,
      ctr: a.ctr,
      conversions: a.conversions,
      roi: a.roi,
      status: a.status,
    })),
    funnel: raw.funnel.map((f) => ({ stage: f.stage, count: f.count, rate: f.rate })),
    channels: raw.channels.map((c) => ({
      channel: c.channel,
      percent: c.percent,
      budget: c.budget,
      conversions: c.conversions,
      roi: c.roi,
      color: c.color,
    })),
    zones: raw.zones.map((z) => ({
      id: z.id,
      name: z.name,
      budget: z.budget,
      conversions: z.conversions,
      roi: z.roi,
      mapX: z.map_x,
      mapY: z.map_y,
      heatColor: z.heat_color,
    })),
    campaigns: raw.campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      objective: c.objective,
      budget: c.budget,
      spend: c.spend,
      conversions: c.conversions,
      roi: c.roi,
      status: c.status,
    })),
    segments: raw.segments.map((s) => ({
      segment: s.segment,
      segmentKey: s.segment_key,
      clients: s.clients,
      percent: s.percent,
    })),
    reactivation: {
      dormantClients: raw.reactivation.dormant_clients,
      reactivated: raw.reactivation.reactivated,
      revenueRecovered: raw.reactivation.revenue_recovered,
      reactivationRate: raw.reactivation.reactivation_rate,
    },
    abTests: raw.ab_tests.map((t) => ({
      id: String(t.id),
      variantA: String(t.variant_a),
      variantB: String(t.variant_b),
      winner: t.winner ? String(t.winner) : null,
      variantACtr: Number(t.variant_a_ctr ?? 0),
      variantBCtr: Number(t.variant_b_ctr ?? 0),
      variantAConversion: Number(t.variant_a_conversion ?? 0),
      variantBConversion: Number(t.variant_b_conversion ?? 0),
      variantARoi: Number(t.variant_a_roi ?? 0),
      variantBRoi: Number(t.variant_b_roi ?? 0),
    })),
    topAds: raw.top_ads.map((t) => ({ title: t.title, roi: t.roi, rank: t.rank })),
    insights: raw.insights.map((i) => ({ id: i.id, text: i.text, type: i.type })),
    truthAnomalies: raw.truth_anomalies.map((a) => ({
      id: a.id,
      message: a.message,
      severity: a.severity,
    })),
    attribution: {
      cpa: raw.attribution.cpa,
      cac: raw.attribution.cac,
      roas: raw.attribution.roas,
      roi: raw.attribution.roi,
      attributedRevenue: raw.attribution.attributed_revenue,
    },
    source: raw.source,
    degraded: false,
  };
}

export async function fetchAdsBundle(days = 7): Promise<AdsCenterBundle> {
  if (cachedBundle && cachedDays === days) return cachedBundle;
  if (features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true') {
    throw new Error('Le module Publicités nécessite le backend — désactivez VITE_USE_MOCK_API.');
  }
  if (!bundlePromise || cachedDays !== days) {
    cachedDays = days;
    bundlePromise = realApi.getAdsDashboard(days).then((raw) => {
      const bundle = mapDashboard(raw);
      cachedBundle = bundle;
      return bundle;
    });
  }
  return bundlePromise;
}

export async function pauseAd(id: string): Promise<void> {
  if (!ADS_WRITE_ENABLED) throw new Error('Actions publicités désactivées.');
  await realApi.pauseAd(id);
  invalidateAdsCache();
}

export async function archiveAd(id: string): Promise<void> {
  if (!ADS_WRITE_ENABLED) throw new Error('Actions publicités désactivées.');
  await realApi.deleteAd(id);
  invalidateAdsCache();
}

export async function duplicateAd(id: string): Promise<{ id: string }> {
  if (!ADS_WRITE_ENABLED) throw new Error('Actions publicités désactivées.');
  const result = await realApi.duplicateAd(id);
  invalidateAdsCache();
  return { id: result.id };
}

export async function createAd(payload: AdCreatePayload): Promise<{ id: string }> {
  if (!ADS_WRITE_ENABLED) throw new Error('Création publicité désactivée.');
  const result = await realApi.createAd({
    title: payload.title,
    description: payload.description,
    creative_type: payload.creativeType,
    image_url: payload.imageUrl,
    video_url: payload.videoUrl,
    cta_text: payload.ctaText,
    cta_url: payload.ctaUrl,
    status: payload.status,
    campaign_id: payload.campaignId,
    budget_total: payload.budgetTotal,
    channel: payload.channel,
    zone: payload.zone,
    partner_id: payload.partnerId,
  });
  invalidateAdsCache();
  return { id: result.id };
}

export async function createCampaign(
  name: string,
  objective: string,
  budget: number,
  targetAudience?: string,
): Promise<{ id: string }> {
  if (!ADS_WRITE_ENABLED) throw new Error('Création campagne désactivée.');
  const result = await realApi.createAdCampaign({ name, objective, budget, target_audience: targetAudience });
  invalidateAdsCache();
  return { id: result.id };
}

export async function exportAdsData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'campaigns' | 'performances' | 'roi' | 'segments' | 'attribution' = 'campaigns',
): Promise<{ filename: string; count: number }> {
  const result = await realApi.exportAds({ format, scope });
  return { filename: result.filename, count: result.count };
}
