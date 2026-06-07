export type AnomalySeverity = 'critical' | 'major' | 'medium' | 'low';
export type AnomalyCorridor = 'order' | 'payment' | 'logistics' | 'marketplace' | 'system';
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'ignored';
export type SystemHealthStatus = 'healthy' | 'warning' | 'down';

export interface AnomalyItem {
  id: string;
  title: string;
  description: string;
  severity: AnomalySeverity;
  corridor: AnomalyCorridor;
  reference: string;
  impactLabel: string;
  impactAmount?: number;
  currency?: 'USD' | 'CDF';
  detectedAt: string;
  partnerName?: string;
  clientName?: string;
  driverName?: string;
  zone?: string;
  source?: string;
  detectionConfidence?: number;
  status: AnomalyStatus;
}

export interface AnomalySummary {
  total: number;
  critical: number;
  major: number;
  medium: number;
  low: number;
  financialImpact: number;
  impactedOrders: number;
  averageResolutionMinutes: number;
  openInvestigations: number;
}

export interface SystemHealthItem {
  name: string;
  status: SystemHealthStatus;
  icon: string;
  lastChecked?: string;
}

export interface ImpactedCorridor {
  corridor: AnomalyCorridor;
  label: string;
  status: AnomalySeverity | 'healthy';
  icon: string;
  count: number;
}

export interface RevenueLeakageItem {
  label: string;
  amount: number;
  color: string;
}

export interface AnomalyActivityEvent {
  id: string;
  time: string;
  title: string;
  reference: string;
  partner?: string;
  severity: AnomalySeverity;
}

export interface AnomalyFilterState {
  severity: string;
  corridor: string;
  date: string;
  partner: string;
  driver: string;
  zone: string;
  status: string;
  search: string;
}

export interface ResolveAnomalyPayload {
  rootCause: string;
  correctiveAction: string;
  note: string;
}

export interface CreateInvestigationPayload {
  type: string;
  reference: string;
  severity: AnomalySeverity;
  assignTo: string;
  priority: string;
  note: string;
}
