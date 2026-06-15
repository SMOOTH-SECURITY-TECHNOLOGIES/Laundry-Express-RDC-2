export interface LoyaltyKpis {
  members: number;
  membersChange: number;
  membersSparkline: number[];
  pointsCirculation: number;
  pointsCirculationChange: number;
  pointsCirculationSparkline: number[];
  pointsEarned: number;
  pointsEarnedChange: number;
  pointsEarnedSparkline: number[];
  pointsRedeemed: number;
  pointsRedeemedChange: number;
  pointsRedeemedSparkline: number[];
  pointsValue: number;
  pointsValueChange: number;
  pointsValueSparkline: number[];
  redemptionRate: number;
  redemptionRateChange: number;
  redemptionRateSparkline: number[];
  influencedRevenue: number;
  influencedRevenueChange: number;
  influencedRevenueSparkline: number[];
  retentionRate: number;
  retentionRateChange: number;
  retentionRateSparkline: number[];
}

export interface LoyaltyHealth {
  score: number;
  status: string;
  redemptionRate: number;
  pointsLiability: number;
  retentionUplift: number;
  fraudRisk: number;
  unusedPoints: number;
}

export interface LoyaltySettingsCard {
  isEnabled: boolean;
  pointsPerDollar: number;
  pointsToDollar: number;
  pointsExpiryDays: number | null;
  redemptionCap: number | null;
  firstOrderBonus: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsRequired: number;
  valueDollars: number;
  usesCount: number;
  status: string;
}

export interface EarningRule {
  id: string;
  name: string;
  condition: string;
  points: string;
  status: string;
  performance: number;
}

export interface LoyaltyActivity {
  id: string;
  clientName: string;
  clientEmail: string;
  entryType: string;
  orderNumber: string | null;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string | null;
  source: string;
}

export interface TopLoyaltyUser {
  userId: string;
  name: string;
  email: string;
  points: number;
  estimatedValue: number;
  ordersCount: number;
  lastActivity: string | null;
}

export interface TopRedeemer {
  userId: string;
  name: string;
  pointsUsed: number;
  amountSaved: number;
  linkedOrders: number;
}

export interface RetentionPoint {
  period: string;
  members: number;
  nonMembers: number;
}

export interface RevenueImpact {
  influencedRevenue: number;
  influencedRevenueChange: number;
  avgBasketMembers: number;
  avgBasketNonMembers: number;
  orderFrequencyMembers: number;
  pointsCost: number;
  loyaltyRoi: number;
}

export interface CohortRow {
  month: string;
  m0: number;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
}

export interface LoyaltyRisk {
  id: string;
  message: string;
  count: number;
  severity: string;
}

export interface LoyaltySegment {
  segment: string;
  segmentKey: string;
  count: number;
  percent: number;
}

export interface LoyaltyIntegration {
  module: string;
  status: string;
  connected: boolean;
}

export interface LoyaltyCenterBundle {
  kpis: LoyaltyKpis;
  health: LoyaltyHealth;
  settings: LoyaltySettingsCard;
  rewards: LoyaltyReward[];
  earningRules: EarningRule[];
  activity: LoyaltyActivity[];
  topUsers: TopLoyaltyUser[];
  topRedeemers: TopRedeemer[];
  retention: RetentionPoint[];
  revenueImpact: RevenueImpact;
  cohorts: CohortRow[];
  risks: LoyaltyRisk[];
  segments: LoyaltySegment[];
  integrations: LoyaltyIntegration[];
  source: string;
}
