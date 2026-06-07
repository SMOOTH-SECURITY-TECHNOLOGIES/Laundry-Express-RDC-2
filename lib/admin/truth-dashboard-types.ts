export type TruthSeverity = 'critical' | 'major' | 'minor';
export type TruthStatus = 'healthy' | 'warning' | 'critical';
export type InvestigationStatus = 'open' | 'in_progress' | 'resolved';

export interface TruthScoreBreakdown {
  label: string;
  value: number;
}

export interface TruthDashboardSummary {
  truthScore: number;
  lastCheckedAt: string;
  ordersVerifiedRate: number;
  paymentsVerifiedRate: number;
  pickupsVerifiedRate: number;
  deliveriesVerifiedRate: number;
  proofsCompleteRate: number;
  openAnomalies: number;
  openInvestigations: number;
  potentialLeakageAmount: number;
  currency: 'USD' | 'CDF';
}

export interface TruthCorridorRow {
  label: string;
  value: string | number;
  severity?: 'success' | 'warning' | 'danger' | 'neutral';
}

export interface TruthCorridor {
  id: 'order' | 'payment' | 'logistics' | 'marketplace';
  title: string;
  icon: string;
  tone: string;
  primaryMetricLabel: string;
  primaryMetricValue: number | string;
  rows: TruthCorridorRow[];
  status: TruthStatus;
}

export interface TruthAnomaly {
  id: string;
  title: string;
  description: string;
  severity: TruthSeverity;
  cases: number;
}

export interface TruthViolation {
  id: string;
  severity: TruthSeverity;
  type: string;
  reference: string;
  impact: string;
  detectedAt: string;
  status: 'Nouveau' | 'En cours' | 'Résolu';
}

export interface TruthInvestigation {
  id: string;
  title: string;
  orderReference?: string;
  detail: string;
  assignedTo: string;
  openedAt: string;
  severity: TruthSeverity;
  status: InvestigationStatus;
}

export interface RevenueLeakageItem {
  label: string;
  amount: number;
  tone: string;
}

export interface SlaSummary {
  within: number;
  atRisk: number;
  breached: number;
}

export interface TruthActivityEvent {
  time: string;
  title: string;
  detail: string;
  reference: string;
  severity: 'critical' | 'info' | 'success';
}

export interface TruthDashboardData {
  summary: TruthDashboardSummary;
  corridors: TruthCorridor[];
  anomalies: TruthAnomaly[];
  violations: TruthViolation[];
  investigations: TruthInvestigation[];
  revenueLeakage: RevenueLeakageItem[];
  revenueTrend: number[];
  sla: SlaSummary;
  activityFeed: TruthActivityEvent[];
}
