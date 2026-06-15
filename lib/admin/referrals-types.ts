export type ReferralStatus = 'converted' | 'pending' | 'signed_up' | 'suspect' | 'rejected';
export type ReferralRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ReferralKpis {
  usersWithCode: number;
  usersWithCodeChange: number;
  usersWithCodeSparkline: number[];
  referredUsers: number;
  referredUsersChange: number;
  referredUsersSparkline: number[];
  discountsUsed: number;
  discountsUsedChange: number;
  discountsUsedSparkline: number[];
  bonusPoints: number;
  bonusPointsChange: number;
  bonusPointsSparkline: number[];
  completedConversions: number;
  completedConversionsChange: number;
  completedConversionsSparkline: number[];
  revenueGenerated: number;
  revenueGeneratedChange: number;
  revenueGeneratedSparkline: number[];
}

export interface ReferralSettings {
  isEnabled: boolean;
  referrerBonusPoints: number;
  refereeDiscountAmount: number;
  referrerConversionBonus: number;
  refereeConversionBonus: number;
  pointsExpiryDays: number | null;
  bonusCapPerReferrer: number | null;
  allowedChannels: string[];
}

export interface TopReferrer {
  rank: number;
  userId: string;
  name: string;
  email: string;
  referralCode: string | null;
  referees: number;
  conversions: number;
  bonusPoints: number;
  revenueGenerated: number;
}

export interface ReferralConversion {
  id: string;
  refereeName: string;
  refereeEmail: string;
  orderId: string | null;
  date: string | null;
  discountUsed: number;
  status: ReferralStatus | string;
}

export interface ReferralWatchlistItem {
  id: string;
  message: string;
  count: number;
  severity: ReferralRiskLevel | string;
}

export interface ReferralChannelPerformance {
  channel: string;
  percent: number;
  conversions: number;
  roi: number;
  color: string;
}

export interface ReferralTrendPoint {
  date: string;
  conversions: number;
  revenue: number;
}

export interface ReferralImpactMetric {
  indicator: string;
  referred: number;
  nonReferred: number;
  difference: number;
}

export interface PopularReferralCode {
  code: string;
  uses: number;
  conversions: number;
  roi: number;
}

export interface ReferralDashboardSummary {
  kpis: ReferralKpis;
  settings: ReferralSettings;
  channels: ReferralChannelPerformance[];
  topReferrers: TopReferrer[];
  recentConversions: ReferralConversion[];
  watchlist: ReferralWatchlistItem[];
  trends: ReferralTrendPoint[];
  impact: ReferralImpactMetric[];
  popularCodes: PopularReferralCode[];
  totalRevenue: number;
  source: string;
}
