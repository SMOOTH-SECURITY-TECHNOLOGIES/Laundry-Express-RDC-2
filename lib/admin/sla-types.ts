export type SlaTrendDirection = 'up' | 'down' | 'flat';

export interface SlaKpis {
  globalSla: number;
  globalSlaChange: number;
  ordersInSla: number;
  ordersInSlaChange: number;
  ordersAtRisk: number;
  ordersAtRiskChange: number;
  ordersBreached: number;
  ordersBreachedChange: number;
  avgDeliveryMinutes: number;
  avgDeliveryChange: number;
  avgEtaMinutes: number;
  avgEtaChange: number;
  slaIncidents: number;
  slaIncidentsChange: number;
  slaCostMonth: number;
  slaCostChange: number;
}

export interface SlaDistribution {
  inSlaPercent: number;
  atRiskPercent: number;
  breachedPercent: number;
  inSlaCount: number;
  atRiskCount: number;
  breachedCount: number;
}

export interface SlaHeatmapCell {
  day: string;
  hour: string;
  violations: number;
}

export interface SlaHeatmap {
  days: string[];
  hours: string[];
  cells: SlaHeatmapCell[];
  maxViolations: number;
}

export type SlaTimelinePeriod = '24h' | '7d' | '30d' | '90d';

export interface SlaTimelinePoint {
  label: string;
  slaPercent: number;
  etaMinutes: number;
  delays: number;
  incidents: number;
}

export interface SlaZonePerformance {
  id: string;
  name: string;
  slaPercent: number;
  etaMinutes: number;
  volume: number;
  incidents: number;
  trend: SlaTrendDirection;
  healthColor: string;
  mapX: number;
  mapY: number;
}

export interface SlaPartnerPerformance {
  id: string;
  name: string;
  slaPercent: number;
  etaLabel: string;
  volume: number;
  disputes: number;
  rating: number;
}

export interface SlaDriverPerformance {
  id: string;
  name: string;
  slaPercent: number;
  etaMinutes: number;
  missions: number;
  delays: number;
  rating: number;
}

export interface SlaAtRiskOrder {
  id: string;
  client: string;
  zone: string;
  partner: string;
  eta: string;
  slaRemainingMinutes: number;
  slaRemainingLabel: string;
}

export interface SlaBreachedOrder {
  id: string;
  delayMinutes: number;
  delayLabel: string;
  cause: string;
  responsible: string;
  impactAmount: number;
}

export interface SlaViolationCause {
  label: string;
  percent: number;
  count: number;
  color: string;
}

export interface SlaFinancialImpact {
  compensations: number;
  refunds: number;
  lostCommissions: number;
  lostClients: number;
  totalMonth: number;
  totalWeek: number;
  totalToday: number;
}

export interface SlaTruthAnomaly {
  id: string;
  category: string;
  title: string;
  count: number;
}

export interface SlaProblematicOrder {
  id: string;
  client: string;
  issue: string;
  slaPercent: number;
}

export interface SlaDispatcherSnapshot {
  openMissions: number;
  availableDrivers: number;
  saturatedDrivers: number;
}

export interface SlaAlert {
  id: string;
  time: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface SlaRule {
  id: string;
  type: string;
  label: string;
  minutes: number;
  scope: string;
}

export interface SlaCenterBundle {
  kpis: SlaKpis;
  distribution: SlaDistribution;
  heatmap: SlaHeatmap;
  timeline: Record<SlaTimelinePeriod, SlaTimelinePoint[]>;
  zonePerformance: SlaZonePerformance[];
  partnerPerformance: SlaPartnerPerformance[];
  driverPerformance: SlaDriverPerformance[];
  atRiskOrders: SlaAtRiskOrder[];
  breachedOrders: SlaBreachedOrder[];
  violationCauses: SlaViolationCause[];
  financialImpact: SlaFinancialImpact;
  truthAnomalies: SlaTruthAnomaly[];
  problematicOrders: SlaProblematicOrder[];
  dispatcherSnapshot: SlaDispatcherSnapshot;
  alerts: SlaAlert[];
  rules: SlaRule[];
  degraded: boolean;
}

export interface CreateSlaRulePayload {
  type: string;
  label: string;
  minutes: number;
  scope: string;
}
