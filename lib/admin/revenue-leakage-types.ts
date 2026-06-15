export type LeakageAlertSeverity = 'info' | 'warning' | 'critical';
export type LeakageRiskLevel = 'green' | 'yellow' | 'orange' | 'red';
export type LeakageTrendPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type LeakageCaseStatus = 'open' | 'investigating' | 'resolved' | 'ignored';
export type LeakageAssignee = 'Finance' | 'Support' | 'Ops' | 'Admin';

export interface LeakageKpis {
  revenueAtRisk: number;
  revenueAtRiskChange: number;
  openCases: number;
  openCasesChange: number;
  criticalCases: number;
  criticalCasesChange: number;
  resolvedThisMonth: number;
  resolvedChange: number;
  leakRate: number;
  leakRateChange: number;
  avgResolutionHours: number;
  avgResolutionChange: number;
}

export interface LeakageRiskScore {
  score: number;
  level: LeakageRiskLevel;
  label: string;
}

export interface OrphanPayment {
  id: string;
  amount: number;
  date: string;
  provider: string;
  reference: string;
  age: string;
}

export interface UnbilledCollection {
  orderId: string;
  partner: string;
  amount: number;
  collectionDate: string;
  age: string;
}

export interface MissingCommission {
  orderId: string;
  paymentId: string;
  partner: string;
  expected: number;
  found: number;
  difference: number;
}

export interface SuspiciousRefund {
  id: string;
  orderId: string;
  client: string;
  amount: number;
  reason: string;
  riskScore: number;
}

export interface UncollectedOrder {
  orderId: string;
  client: string;
  partner: string;
  expectedAmount: number;
  age: string;
}

export interface PayoutAnomaly {
  id: string;
  partner: string;
  amount: number;
  status: 'warning' | 'critical' | 'info';
  issue: string;
}

export interface LeakageTimelineEvent {
  id: string;
  stage: 'detection' | 'investigation' | 'assignment' | 'correction' | 'resolution';
  label: string;
  time: string;
  actor?: string;
}

export interface LeakageCorridorStep {
  name: string;
  count: number;
  amount: number;
}

export interface LeakagePartnerRank {
  partner: string;
  amountLost: number;
  openCases: number;
  riskScore: number;
}

export interface LeakageZoneStats {
  id: string;
  name: string;
  leakAmount: number;
  leakPercent: number;
  mapX: number;
  mapY: number;
  heatColor: string;
}

export interface LeakageTrendPoint {
  label: string;
  openCases: number;
  amountAtRisk: number;
  resolved: number;
}

export interface LeakageAlert {
  id: string;
  message: string;
  severity: LeakageAlertSeverity;
  time: string;
  caseId?: string;
}

export interface LeakageInvestigationDetail {
  caseId: string;
  orderId: string;
  paymentId?: string;
  commissionId?: string;
  invoiceId?: string;
  refundId?: string;
  status: LeakageCaseStatus;
  assignee?: LeakageAssignee;
  timeline: LeakageTimelineEvent[];
  logs: { time: string; message: string }[];
}

export interface LeakageCaseAssignment {
  caseId: string;
  title: string;
  assignee: LeakageAssignee;
  status: LeakageCaseStatus;
  amount: number;
}

export interface TruthCorridorHealth {
  name: string;
  percent: number;
  color: string;
}

export interface LeakageFinancialImpact {
  potentialLoss: number;
  confirmedLoss: number;
  recoveredThisMonth: number;
  underInvestigation: number;
}

export interface LeakageInsight {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'critical';
}

export interface LeakageFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  type: string;
  zone: string;
  partner: string;
  minAmount: string;
  maxAmount: string;
  orderId: string;
  paymentId: string;
}

export interface RevenueLeakageCenterBundle {
  kpis: LeakageKpis;
  riskScore: LeakageRiskScore;
  orphanPayments: OrphanPayment[];
  unbilledCollections: UnbilledCollection[];
  missingCommissions: MissingCommission[];
  suspiciousRefunds: SuspiciousRefund[];
  uncollectedOrders: UncollectedOrder[];
  payoutAnomalies: PayoutAnomaly[];
  timeline: LeakageTimelineEvent[];
  corridor: LeakageCorridorStep[];
  partners: LeakagePartnerRank[];
  zones: LeakageZoneStats[];
  trend: Record<LeakageTrendPeriod, LeakageTrendPoint[]>;
  alerts: LeakageAlert[];
  assignments: LeakageCaseAssignment[];
  truthHealth: TruthCorridorHealth[];
  financialImpact: LeakageFinancialImpact;
  insights: LeakageInsight[];
  investigationDetail: LeakageInvestigationDetail;
  degraded?: boolean;
}
