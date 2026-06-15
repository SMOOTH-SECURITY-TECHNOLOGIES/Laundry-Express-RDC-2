export type CommissionTrendDirection = 'up' | 'down' | 'flat';
export type CommissionHealthStatus = 'healthy' | 'warning' | 'critical';
export type CommissionPartnerStatus = 'healthy' | 'pending' | 'delayed' | 'blocked' | 'disputed';
export type CommissionAlertSeverity = 'critical' | 'warning' | 'info';

export interface CommissionKpis {
  generated: number;
  generatedChange: number;
  due: number;
  dueChange: number;
  paid: number;
  paidChange: number;
  disputed: number;
  disputedChange: number;
  missing: number;
  missingChange: number;
  collectionRate: number;
  collectionRateChange: number;
}

export interface CommissionHealth {
  healthyPercent: number;
  warningPercent: number;
  criticalPercent: number;
  expectedPayments: number;
  receivedPayments: number;
  delays: number;
  exceptions: number;
}

export interface CommissionRule {
  id: string;
  label: string;
  rate: number;
  scope: string;
}

export interface CommissionServiceRow {
  id: string;
  service: string;
  rate: number;
  revenue: number;
  generated: number;
  paid: number;
  due: number;
}

export interface CommissionPartnerRow {
  id: string;
  name: string;
  type: string;
  revenue: number;
  generated: number;
  paid: number;
  due: number;
  delayDays: number;
  status: CommissionPartnerStatus;
}

export interface CommissionTimelineStep {
  id: string;
  label: string;
  timestamp: string;
  status: 'done' | 'pending' | 'blocked';
}

export interface CommissionLeakageItem {
  id: string;
  type: string;
  label: string;
  count: number;
  description: string;
  color: string;
  bg: string;
  border: string;
}

export interface CommissionTopPartner {
  id: string;
  name: string;
  revenue: number;
  commission: number;
  growth: number;
  score: number;
}

export interface CommissionMonthlyPoint {
  label: string;
  generated: number;
  paid: number;
  due: number;
}

export interface CommissionBreakdownItem {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

export interface CommissionRevenueVsCommission {
  label: string;
  revenue: number;
  commission: number;
}

export interface CommissionTruthCorridor {
  id: string;
  name: string;
  status: CommissionHealthStatus;
  issues: number;
}

export interface CommissionAlert {
  id: string;
  severity: CommissionAlertSeverity;
  message: string;
  timestamp: string;
  amount: number;
  investigateId?: string;
}

export interface CommissionAutomation {
  autoCalculate: boolean;
  autoValidate: boolean;
  autoInvoice: boolean;
  autoPay: boolean;
  autoFollowUp: boolean;
}

export interface CommissionFilters {
  dateStart: string;
  dateEnd: string;
  service: string;
  zone: string;
  partner: string;
}

export type CommissionWsChannel =
  | 'commission_generated'
  | 'commission_paid'
  | 'commission_due'
  | 'commission_blocked'
  | 'commission_disputed'
  | 'commission_leak_detected';

export interface CommissionWsEvent {
  channel: CommissionWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface CommissionsCenterBundle {
  kpis: CommissionKpis;
  health: CommissionHealth;
  rules: CommissionRule[];
  services: CommissionServiceRow[];
  partners: CommissionPartnerRow[];
  timeline: CommissionTimelineStep[];
  leakage: CommissionLeakageItem[];
  topPartners: CommissionTopPartner[];
  monthlyTrend: CommissionMonthlyPoint[];
  breakdown: CommissionBreakdownItem[];
  revenueVsCommission: CommissionRevenueVsCommission[];
  truthCorridors: CommissionTruthCorridor[];
  alerts: CommissionAlert[];
  automation: CommissionAutomation;
  degraded: boolean;
}

export interface UpdateCommissionRulePayload {
  id: string;
  rate: number;
}

export interface CreateCommissionRulePayload {
  label: string;
  rate: number;
  scope: string;
}
