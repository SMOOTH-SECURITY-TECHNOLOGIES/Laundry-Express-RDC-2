export type CampaignStatus = 'active' | 'paused' | 'completed' | 'scheduled' | 'draft';
export type CampaignChannel = 'whatsapp' | 'sms' | 'email' | 'push';

export interface CampaignKpis {
  activeCampaigns: number;
  activeCampaignsChange: number;
  activeCampaignsSparkline: number[];
  messagesSent: number;
  messagesSentChange: number;
  messagesSentSparkline: number[];
  openRate: number;
  openRateChange: number;
  openRateSparkline: number[];
  clickRate: number;
  clickRateChange: number;
  clickRateSparkline: number[];
  conversions: number;
  conversionsChange: number;
  conversionsSparkline: number[];
  attributedRevenue: number;
  attributedRevenueChange: number;
  attributedRevenueSparkline: number[];
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel | string;
  audience: string | null;
  segment: string | null;
  status: CampaignStatus | string;
  messagesSent: number;
  opens: number;
  openRate: number;
  clicks: number;
  clickRate: number;
  conversions: number;
  conversionRate: number;
  roi: number;
  revenue: number;
  scheduledAt?: string | null;
}

export interface CampaignChannelPerformance {
  channel: string;
  percent: number;
  messages: number;
  conversions: number;
  revenue: number;
  color: string;
}

export interface CampaignFunnelStep {
  stage: string;
  count: number;
  rate: number;
}

export interface CampaignTrendPoint {
  date: string;
  messages: number;
  conversions: number;
  revenue: number;
}

export interface CampaignSegment {
  segment: string;
  segmentKey: string;
  audienceSize: number;
  conversionRate: number;
  revenue: number;
}

export interface CampaignAutomation {
  id: string;
  name: string;
  trigger: string;
  status: string;
  conversions: number;
  revenue: number;
}

export interface CampaignCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  channel: string;
  audience: string | null;
}

export interface CampaignROI {
  budgetSpent: number;
  revenueGenerated: number;
  globalRoi: number;
  costPerAcquisition: number;
  customerLifetimeValue: number;
  roas: number;
}

export interface CampaignWatchlistItem {
  id: string;
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | string;
}

export interface CampaignAnalytics {
  campaignId: string;
  name: string;
  messagesSent: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface CampaignDashboardSummary {
  kpis: CampaignKpis;
  campaigns: Campaign[];
  channels: CampaignChannelPerformance[];
  funnel: CampaignFunnelStep[];
  trends: CampaignTrendPoint[];
  topCampaigns: Campaign[];
  segments: CampaignSegment[];
  automations: CampaignAutomation[];
  calendar: CampaignCalendarEvent[];
  roi: CampaignROI;
  watchlist: CampaignWatchlistItem[];
  source: string;
}

export interface GrowthRfmSegment {
  segment: string;
  segmentKey: string;
  audienceSize: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  recommendedAction: string;
}

export interface GrowthAutomationRule {
  key: string;
  name: string;
  trigger: string;
  channels: string[];
  eligibleCustomers: number;
  status: string;
  nextAction: string;
}

export interface GrowthPromoFraudRisk {
  promoCode: string;
  riskScore: number;
  severity: string;
  signals: string[];
  recommendedAction: string;
}

export interface GrowthTrendingOffer {
  id: string;
  title: string;
  offerType: string;
  score: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  placements: string[];
}

export interface GrowthRoi {
  promoRevenue: number;
  loyaltyRevenue: number;
  referralRevenue: number;
  remarketingRevenue: number;
  reactivationRevenue: number;
  estimatedCac: number;
  estimatedLtv: number;
  estimatedRoi: number;
}

export interface GrowthDashboardSummary {
  acquisition: number;
  activation: number;
  conversion: number;
  retention: number;
  referral: number;
  revenue: number;
  rfmSegments: GrowthRfmSegment[];
  automations: GrowthAutomationRule[];
  promoFraudRisks: GrowthPromoFraudRisk[];
  trendingOffers: GrowthTrendingOffer[];
  roi: GrowthRoi;
  source: string;
}
