export interface AdsFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  type: string;
  zone: string;
  partner: string;
  channel: string;
  campaign: string;
}

export interface AdsKpis {
  activeAds: number;
  activeAdsChange: number;
  activeAdsSparkline: number[];
  impressions: number;
  impressionsChange: number;
  impressionsSparkline: number[];
  clicks: number;
  clicksChange: number;
  clicksSparkline: number[];
  ctr: number;
  ctrChange: number;
  ctrSparkline: number[];
  conversions: number;
  conversionsChange: number;
  conversionsSparkline: number[];
  spend: number;
  spendChange: number;
  spendSparkline: number[];
  roi: number;
  roiChange: number;
  roiSparkline: number[];
}

export interface AdRow {
  id: string;
  title: string;
  campaign: string;
  channel: string;
  zone: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  roi: number;
  status: string;
}

export interface FunnelStep {
  stage: string;
  count: number;
  rate: number;
}

export interface ChannelPerformance {
  channel: string;
  percent: number;
  budget: number;
  conversions: number;
  roi: number;
  color: string;
}

export interface ZonePerformance {
  id: string;
  name: string;
  budget: number;
  conversions: number;
  roi: number;
  mapX: number;
  mapY: number;
  heatColor: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  spend: number;
  conversions: number;
  roi: number;
  status: string;
}

export interface AdSegment {
  segment: string;
  segmentKey: string;
  clients: number;
  percent: number;
}

export interface ReactivationStats {
  dormantClients: number;
  reactivated: number;
  revenueRecovered: number;
  reactivationRate: number;
}

export interface AbTest {
  id: string;
  variantA: string;
  variantB: string;
  winner: string | null;
  variantACtr: number;
  variantBCtr: number;
  variantAConversion: number;
  variantBConversion: number;
  variantARoi: number;
  variantBRoi: number;
}

export interface TopAd {
  title: string;
  roi: number;
  rank: number;
}

export interface AdInsight {
  id: string;
  text: string;
  type: string;
}

export interface TruthAnomaly {
  id: string;
  message: string;
  severity: string;
}

export interface AttributionMetrics {
  cpa: number;
  cac: number;
  roas: number;
  roi: number;
  attributedRevenue: number;
}

export interface AdCreatePayload {
  title: string;
  description?: string;
  creativeType?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  status?: string;
  campaignId?: string;
  budgetTotal?: number;
  channel?: string;
  zone?: string;
  partnerId?: string;
}

export interface AdsCenterBundle {
  kpis: AdsKpis;
  ads: AdRow[];
  funnel: FunnelStep[];
  channels: ChannelPerformance[];
  zones: ZonePerformance[];
  campaigns: AdCampaign[];
  segments: AdSegment[];
  reactivation: ReactivationStats;
  abTests: AbTest[];
  topAds: TopAd[];
  insights: AdInsight[];
  truthAnomalies: TruthAnomaly[];
  attribution: AttributionMetrics;
  source: string;
  degraded: boolean;
}
