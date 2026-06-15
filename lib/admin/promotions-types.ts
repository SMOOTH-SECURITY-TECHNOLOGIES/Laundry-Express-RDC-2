export type PromoType = 'percentage' | 'fixed' | 'delivery' | 'cashback' | 'credit' | 'referral';
export type PromoStatus = 'active' | 'paused' | 'expired' | 'draft';
export type PromoChannel = 'whatsapp' | 'sms' | 'email' | 'push' | 'web';
export type PromoSegment = 'new' | 'active' | 'vip' | 'dormant' | 'high_basket' | 'low_basket' | 'enterprise';
export type PromoRiskLevel = 'low' | 'medium' | 'high';

export interface PromoKpis {
  activePromotions: number;
  activeChange: number;
  usages: number;
  usagesChange: number;
  revenueGenerated: number;
  revenueChange: number;
  avgRoi: number;
  roiChange: number;
  reactivatedClients: number;
  reactivatedChange: number;
  conversionRate: number;
  conversionChange: number;
}

export interface GrowthScore {
  score: number;
  label: string;
  acquisition: number;
  conversion: number;
  retention: number;
  reactivation: number;
}

export interface ActivePromotion {
  id: string;
  code: string;
  type: PromoType;
  reduction: string;
  usages: number;
  revenue: number;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  roi: number;
}

export interface PromoCampaign {
  id: string;
  name: string;
  objective: string;
  audience: string;
  budget: number;
  conversions: number;
  roi: number;
  status: 'active' | 'completed' | 'draft';
}

export interface PromoSegmentStats {
  segment: string;
  segmentKey: PromoSegment;
  clients: number;
  revenue: number;
  conversionRate: number;
}

export interface ReactivationStats {
  dormant30: number;
  dormant60: number;
  dormant90: number;
  reactivated: number;
  reactivationRate: number;
  bestOffer: string;
  topActions: { action: string; count: number }[];
}

export interface LoyaltyWidget {
  pointsDistributed: number;
  pointsUsed: number;
  rewardsRedeemed: number;
  topClients: { name: string; points: number; revenue: number }[];
}

export interface ReferralWidget {
  invitationsSent: number;
  accountsCreated: number;
  ordersGenerated: number;
  rewardsDistributed: number;
}

export interface PromoZoneStats {
  id: string;
  name: string;
  promotionsUsed: number;
  revenue: number;
  conversionRate: number;
  mapX: number;
  mapY: number;
  heatColor: string;
}

export interface PromoFunnelStep {
  stage: string;
  count: number;
  percent: number;
}

export interface AttributionChannel {
  channel: string;
  channelKey: PromoChannel;
  percent: number;
  conversions: number;
  revenue: number;
  roi: number;
  color: string;
}

export interface AbTestVariant {
  id: string;
  name: string;
  conversionRate: number;
  roi: number;
  avgBasket: number;
  isWinner?: boolean;
}

export interface TopPromotion {
  code: string;
  revenue: number;
  roi: number;
  usages: number;
  rank: number;
}

export interface RiskPromotion {
  id: string;
  code: string;
  issue: string;
  level: PromoRiskLevel;
  impact: string;
}

export interface PromoInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success';
}

export interface PromoFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  type: string;
  zone: string;
  segment: string;
  channel: string;
}

export interface PromoCreatePayload {
  name: string;
  code: string;
  description: string;
  type: PromoType;
  value: string;
  maxUsage: number;
  maxPerClient: number;
  maxBudget: number;
  startDate: string;
  endDate: string;
  segments: PromoSegment[];
  channels: PromoChannel[];
}

export interface PromotionsCenterBundle {
  kpis: PromoKpis;
  growthScore: GrowthScore;
  activePromotions: ActivePromotion[];
  campaigns: PromoCampaign[];
  segments: PromoSegmentStats[];
  reactivation: ReactivationStats;
  loyalty: LoyaltyWidget;
  referral: ReferralWidget;
  zones: PromoZoneStats[];
  funnel: PromoFunnelStep[];
  attribution: AttributionChannel[];
  abTests: AbTestVariant[];
  topPromotions: TopPromotion[];
  riskPromotions: RiskPromotion[];
  insights: PromoInsight[];
  degraded?: boolean;
}
