import type {
  SlaKpis,
  SlaDistribution,
  SlaHeatmap,
  SlaTimelinePoint,
  SlaZonePerformance,
  SlaPartnerPerformance,
  SlaDriverPerformance,
  SlaAtRiskOrder,
  SlaBreachedOrder,
  SlaViolationCause,
  SlaFinancialImpact,
  SlaTruthAnomaly,
  SlaProblematicOrder,
  SlaDispatcherSnapshot,
  SlaAlert,
  SlaRule,
  SlaCenterBundle,
  SlaTimelinePeriod,
} from './sla-types';

export const slaKpis: SlaKpis = {
  globalSla: 94,
  globalSlaChange: 2,
  ordersInSla: 1180,
  ordersInSlaChange: 6,
  ordersAtRisk: 12,
  ordersAtRiskChange: 3,
  ordersBreached: 3,
  ordersBreachedChange: -1,
  avgDeliveryMinutes: 32,
  avgDeliveryChange: -2,
  avgEtaMinutes: 28,
  avgEtaChange: -3,
  slaIncidents: 7,
  slaIncidentsChange: 2,
  slaCostMonth: 1240,
  slaCostChange: -8,
};

export const slaDistribution: SlaDistribution = {
  inSlaPercent: 94,
  atRiskPercent: 5,
  breachedPercent: 1,
  inSlaCount: 1180,
  atRiskCount: 12,
  breachedCount: 3,
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];

export const slaHeatmap: SlaHeatmap = {
  days: DAYS,
  hours: HOURS,
  maxViolations: 12,
  cells: DAYS.flatMap((day, di) =>
    HOURS.map((hour, hi) => ({
      day,
      hour,
      violations: Math.round(1 + Math.sin((di + hi) * 0.7) * 4 + (hi >= 4 && hi <= 6 ? 6 : 0)),
    }))
  ),
};

function makeTimeline(len: number, labels: string[]): SlaTimelinePoint[] {
  return labels.map((label, i) => ({
    label,
    slaPercent: 90 + Math.sin(i * 0.5) * 4,
    etaMinutes: 30 - Math.sin(i * 0.3) * 4,
    delays: Math.round(2 + Math.sin(i * 0.8) * 3),
    incidents: Math.round(1 + Math.cos(i * 0.6) * 2),
  }));
}

export const slaTimeline: Record<SlaTimelinePeriod, SlaTimelinePoint[]> = {
  '24h': makeTimeline(24, ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']),
  '7d': makeTimeline(7, ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']),
  '30d': makeTimeline(30, Array.from({ length: 10 }, (_, i) => `J${i * 3 + 1}`)),
  '90d': makeTimeline(12, ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']),
};

export const slaZonePerformance: SlaZonePerformance[] = [
  { id: 'Z1', name: 'Gombe', slaPercent: 96, etaMinutes: 28, volume: 218, incidents: 1, trend: 'up', healthColor: '#22C55E', mapX: 170, mapY: 70 },
  { id: 'Z2', name: 'Limete', slaPercent: 94, etaMinutes: 32, volume: 162, incidents: 2, trend: 'flat', healthColor: '#F59E0B', mapX: 260, mapY: 90 },
  { id: 'Z3', name: 'Ngaliema', slaPercent: 95, etaMinutes: 35, volume: 134, incidents: 1, trend: 'up', healthColor: '#22C55E', mapX: 100, mapY: 130 },
  { id: 'Z4', name: 'Kalamu', slaPercent: 92, etaMinutes: 38, volume: 58, incidents: 2, trend: 'down', healthColor: '#F59E0B', mapX: 220, mapY: 200 },
  { id: 'Z5', name: 'Masina', slaPercent: 91, etaMinutes: 42, volume: 76, incidents: 3, trend: 'down', healthColor: '#F59E0B', mapX: 310, mapY: 120 },
  { id: 'Z6', name: 'Kintambo', slaPercent: 89, etaMinutes: 45, volume: 34, incidents: 4, trend: 'down', healthColor: '#EF4444', mapX: 130, mapY: 110 },
  { id: 'Z7', name: 'Bandalungwa', slaPercent: 93, etaMinutes: 36, volume: 126, incidents: 1, trend: 'flat', healthColor: '#F59E0B', mapX: 150, mapY: 170 },
];

export const slaPartnerPerformance: SlaPartnerPerformance[] = [
  { id: 'P1', name: 'Prestige Pressing', slaPercent: 98, etaLabel: '2h15', volume: 254, disputes: 1, rating: 4.9 },
  { id: 'P2', name: 'Clean Express', slaPercent: 96, etaLabel: '2h30', volume: 198, disputes: 0, rating: 4.8 },
  { id: 'P3', name: 'Laverie Smart', slaPercent: 94, etaLabel: '2h45', volume: 176, disputes: 2, rating: 4.6 },
  { id: 'P4', name: 'Pressing Bonanjo', slaPercent: 92, etaLabel: '3h00', volume: 142, disputes: 1, rating: 4.5 },
  { id: 'P5', name: 'Wash Pro', slaPercent: 90, etaLabel: '3h15', volume: 98, disputes: 3, rating: 4.2 },
];

export const slaDriverPerformance: SlaDriverPerformance[] = [
  { id: 'D1', name: 'Koffi A.', slaPercent: 98, etaMinutes: 24, missions: 124, delays: 0, rating: 4.9 },
  { id: 'D2', name: 'Grace B.', slaPercent: 96, etaMinutes: 26, missions: 118, delays: 1, rating: 4.8 },
  { id: 'D3', name: 'Paul M.', slaPercent: 95, etaMinutes: 28, missions: 110, delays: 1, rating: 4.7 },
  { id: 'D4', name: 'David M.', slaPercent: 88, etaMinutes: 38, missions: 95, delays: 5, rating: 4.1 },
  { id: 'D5', name: 'Jean K.', slaPercent: 85, etaMinutes: 42, missions: 82, delays: 7, rating: 3.9 },
];

export const slaAtRiskOrders: SlaAtRiskOrder[] = [
  { id: 'ORD-7845', client: 'Jean Tshibangu', zone: 'Gombe', partner: 'Prestige Pressing', eta: '32 min', slaRemainingMinutes: 4, slaRemainingLabel: '4 min avant SLA' },
  { id: 'ORD-7842', client: 'Marie Kambale', zone: 'Limete', partner: 'Clean Express', eta: '38 min', slaRemainingMinutes: 8, slaRemainingLabel: '8 min avant SLA' },
  { id: 'ORD-7839', client: 'David Mulumba', zone: 'Masina', partner: 'Laverie Smart', eta: '45 min', slaRemainingMinutes: 12, slaRemainingLabel: '12 min avant SLA' },
];

export const slaBreachedOrders: SlaBreachedOrder[] = [
  { id: 'ORD-7422', delayMinutes: 18, delayLabel: '+18 min', cause: 'Chauffeur indisponible', responsible: 'David M.', impactAmount: 15 },
  { id: 'ORD-7418', delayMinutes: 32, delayLabel: '+32 min', cause: 'Partenaire lent', responsible: 'Wash Pro', impactAmount: 28 },
  { id: 'ORD-7410', delayMinutes: 45, delayLabel: '+45 min', cause: 'Adresse invalide', responsible: 'Système', impactAmount: 42 },
];

export const slaViolationCauses: SlaViolationCause[] = [
  { label: 'Retard chauffeur', percent: 52, count: 18, color: '#EF4444' },
  { label: 'Partenaire lent', percent: 19, count: 7, color: '#F59E0B' },
  { label: 'Adresse invalide', percent: 11, count: 4, color: '#8B5CF6' },
  { label: 'Paiement bloqué', percent: 8, count: 3, color: '#3B82F6' },
  { label: 'Surcharge zone', percent: 6, count: 2, color: '#F97316' },
  { label: 'Problème client', percent: 4, count: 1, color: '#6B7280' },
];

export const slaFinancialImpact: SlaFinancialImpact = {
  compensations: 620,
  refunds: 380,
  lostCommissions: 140,
  lostClients: 100,
  totalMonth: 1240,
  totalWeek: 310,
  totalToday: 45,
};

export const slaTruthAnomalies: SlaTruthAnomaly[] = [
  { id: 'TA1', category: 'order', title: 'Anomalies commande', count: 5 },
  { id: 'TA2', category: 'payment', title: 'Anomalies paiement', count: 3 },
  { id: 'TA3', category: 'logistics', title: 'Anomalies logistique', count: 8 },
];

export const slaProblematicOrders: SlaProblematicOrder[] = [
  { id: 'ORD-7422', client: 'Robert Ilunga', issue: 'SLA dépassé +18 min', slaPercent: 72 },
  { id: 'ORD-7418', client: 'Claudine Mbuyi', issue: 'Partenaire lent', slaPercent: 78 },
  { id: 'ORD-7845', client: 'Jean Tshibangu', issue: 'À risque — 4 min restant', slaPercent: 85 },
];

export const slaDispatcherSnapshot: SlaDispatcherSnapshot = {
  openMissions: 24,
  availableDrivers: 18,
  saturatedDrivers: 4,
};

export const slaAlerts: SlaAlert[] = [
  { id: 'A1', time: '10:45', message: 'Gombe SLA tombe sous 90%', severity: 'critical' },
  { id: 'A2', time: '10:32', message: 'Chauffeur Koffi indisponible', severity: 'warning' },
  { id: 'A3', time: '10:18', message: '3 commandes à risque', severity: 'warning' },
  { id: 'A4', time: '09:55', message: 'Partenaire Prestige dépasse ETA', severity: 'info' },
  { id: 'A5', time: '09:40', message: 'Kintambo SLA 89% — seuil critique', severity: 'critical' },
  { id: 'A6', time: '09:22', message: 'Masina — 2 nouvelles violations', severity: 'warning' },
  { id: 'A7', time: '09:10', message: 'Coût SLA jour : 45 $', severity: 'info' },
];

export const slaRules: SlaRule[] = [
  { id: 'R1', type: 'pickup', label: 'SLA collecte', minutes: 45, scope: 'Global' },
  { id: 'R2', type: 'cleaning', label: 'SLA lavage', minutes: 240, scope: 'Global' },
  { id: 'R3', type: 'delivery', label: 'SLA livraison', minutes: 60, scope: 'Global' },
  { id: 'R4', type: 'express', label: 'SLA express', minutes: 30, scope: 'Gombe' },
  { id: 'R5', type: 'night', label: 'SLA nuit', minutes: 90, scope: 'Global' },
  { id: 'R6', type: 'enterprise', label: 'SLA entreprise', minutes: 120, scope: 'Partenaires B2B' },
];

export function slaFixtureBundle(): SlaCenterBundle {
  return {
    kpis: slaKpis,
    distribution: slaDistribution,
    heatmap: slaHeatmap,
    timeline: slaTimeline,
    zonePerformance: slaZonePerformance,
    partnerPerformance: slaPartnerPerformance,
    driverPerformance: slaDriverPerformance,
    atRiskOrders: slaAtRiskOrders,
    breachedOrders: slaBreachedOrders,
    violationCauses: slaViolationCauses,
    financialImpact: slaFinancialImpact,
    truthAnomalies: slaTruthAnomalies,
    problematicOrders: slaProblematicOrders,
    dispatcherSnapshot: slaDispatcherSnapshot,
    alerts: slaAlerts,
    rules: slaRules,
    degraded: true,
  };
}
