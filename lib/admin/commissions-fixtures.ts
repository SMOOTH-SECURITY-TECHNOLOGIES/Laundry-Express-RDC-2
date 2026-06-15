import type {
  CommissionKpis,
  CommissionHealth,
  CommissionRule,
  CommissionServiceRow,
  CommissionPartnerRow,
  CommissionTimelineStep,
  CommissionLeakageItem,
  CommissionTopPartner,
  CommissionMonthlyPoint,
  CommissionBreakdownItem,
  CommissionRevenueVsCommission,
  CommissionTruthCorridor,
  CommissionAlert,
  CommissionAutomation,
  CommissionsCenterBundle,
} from './commissions-types';

export const commissionKpis: CommissionKpis = {
  generated: 52450,
  generatedChange: 18,
  due: 5240,
  dueChange: 12,
  paid: 18900,
  paidChange: 16,
  disputed: 1250,
  disputedChange: 8,
  missing: 4,
  missingChange: -2,
  collectionRate: 94,
  collectionRateChange: 6,
};

export const commissionHealth: CommissionHealth = {
  healthyPercent: 77,
  warningPercent: 15,
  criticalPercent: 8,
  expectedPayments: 26340,
  receivedPayments: 18900,
  delays: 5240,
  exceptions: 1250,
};

export const commissionRules: CommissionRule[] = [
  { id: 'R1', label: 'Commission globale', rate: 20, scope: 'Global' },
  { id: 'R2', label: 'Commission Marketplace', rate: 15, scope: 'Marketplace' },
  { id: 'R3', label: 'Commission Logistique', rate: 10, scope: 'Logistique' },
  { id: 'R4', label: 'Commission Premium', rate: 25, scope: 'Premium' },
  { id: 'R5', label: 'Commission Enterprise', rate: 30, scope: 'Enterprise' },
];

export const commissionServices: CommissionServiceRow[] = [
  { id: 'S1', service: 'Pressing', rate: 20, revenue: 18500, generated: 3700, paid: 3200, due: 500 },
  { id: 'S2', service: 'Lavage', rate: 18, revenue: 14200, generated: 2556, paid: 2100, due: 456 },
  { id: 'S3', service: 'Livraison', rate: 10, revenue: 8200, generated: 820, paid: 720, due: 100 },
  { id: 'S4', service: 'Collecte', rate: 10, revenue: 5400, generated: 540, paid: 480, due: 60 },
  { id: 'S5', service: 'Express', rate: 25, revenue: 4200, generated: 1050, paid: 900, due: 150 },
  { id: 'S6', service: 'Abonnement', rate: 15, revenue: 1950, generated: 292, paid: 250, due: 42 },
];

export const commissionPartners: CommissionPartnerRow[] = [
  { id: 'P1', name: 'Prestige Pressing', type: 'Pressing', revenue: 18500, generated: 3700, paid: 3200, due: 500, delayDays: 0, status: 'healthy' },
  { id: 'P2', name: 'Eco Wash', type: 'Lavage', revenue: 12400, generated: 2232, paid: 1980, due: 252, delayDays: 3, status: 'pending' },
  { id: 'P3', name: 'Clean Express', type: 'Lavage', revenue: 9800, generated: 1764, paid: 1500, due: 264, delayDays: 7, status: 'delayed' },
  { id: 'P4', name: 'Laverie Smart', type: 'Pressing', revenue: 7200, generated: 1440, paid: 1200, due: 240, delayDays: 14, status: 'delayed' },
  { id: 'P5', name: 'Wash Pro', type: 'Marketplace', revenue: 4520, generated: 678, paid: 0, due: 678, delayDays: 21, status: 'blocked' },
  { id: 'P6', name: 'Pressing Bonanjo', type: 'Pressing', revenue: 3800, generated: 760, paid: 600, due: 160, delayDays: 5, status: 'disputed' },
];

export const commissionTimeline: CommissionTimelineStep[] = [
  { id: 'T1', label: 'Commande créée', timestamp: '08/06 09:12', status: 'done' },
  { id: 'T2', label: 'Paiement client', timestamp: '08/06 09:45', status: 'done' },
  { id: 'T3', label: 'Commission calculée', timestamp: '08/06 10:00', status: 'done' },
  { id: 'T4', label: 'Commission validée', timestamp: '08/06 10:15', status: 'done' },
  { id: 'T5', label: 'Commission facturée', timestamp: '08/06 11:00', status: 'pending' },
  { id: 'T6', label: 'Commission payée', timestamp: '—', status: 'pending' },
];

export const commissionLeakage: CommissionLeakageItem[] = [
  { id: 'L1', type: 'not_generated', label: 'Commission non générée', count: 4, description: 'Commandes sans commission calculée', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'L2', type: 'not_paid', label: 'Commission non payée', count: 7, description: 'Commissions validées non versées', color: '#F59E0B', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'L3', type: 'inconsistent', label: 'Calcul incohérent', count: 2, description: 'Écart entre règle et montant', color: '#EAB308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'L4', type: 'manual', label: 'Commission manuelle', count: 3, description: 'Ajustements manuels non audités', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-200' },
];

export const commissionTopPartners: CommissionTopPartner[] = [
  { id: 'P1', name: 'Prestige Pressing', revenue: 18500, commission: 3700, growth: 22, score: 4.9 },
  { id: 'P2', name: 'Eco Wash', revenue: 12400, commission: 2232, growth: 18, score: 4.7 },
  { id: 'P3', name: 'Clean Express', revenue: 9800, commission: 1764, growth: 12, score: 4.5 },
  { id: 'P4', name: 'Laverie Smart', revenue: 7200, commission: 1440, growth: 8, score: 4.3 },
  { id: 'P5', name: 'Wash Pro', revenue: 4520, commission: 678, growth: -5, score: 3.8 },
];

export const commissionMonthlyTrend: CommissionMonthlyPoint[] = [
  { label: 'Jan', generated: 38000, paid: 32000, due: 6000 },
  { label: 'Fév', generated: 41000, paid: 35000, due: 6000 },
  { label: 'Mar', generated: 43000, paid: 37000, due: 6000 },
  { label: 'Avr', generated: 46000, paid: 39000, due: 7000 },
  { label: 'Mai', generated: 49000, paid: 41000, due: 8000 },
  { label: 'Juin', generated: 52450, paid: 18900, due: 5240 },
];

export const commissionBreakdown: CommissionBreakdownItem[] = [
  { category: 'Marketplace', amount: 26225, percent: 50, color: '#2563EB' },
  { category: 'Logistique', amount: 13112, percent: 25, color: '#22C55E' },
  { category: 'Abonnements', amount: 7867, percent: 15, color: '#9333EA' },
  { category: 'Services', amount: 5246, percent: 10, color: '#F59E0B' },
];

export const commissionRevenueVsCommission: CommissionRevenueVsCommission[] = [
  { label: 'Jan', revenue: 190000, commission: 38000 },
  { label: 'Fév', revenue: 205000, commission: 41000 },
  { label: 'Mar', revenue: 215000, commission: 43000 },
  { label: 'Avr', revenue: 230000, commission: 46000 },
  { label: 'Mai', revenue: 245000, commission: 49000 },
  { label: 'Juin', revenue: 262250, commission: 52450 },
];

export const commissionTruthCorridors: CommissionTruthCorridor[] = [
  { id: 'TC1', name: 'Commande', status: 'healthy', issues: 0 },
  { id: 'TC2', name: 'Paiement', status: 'healthy', issues: 0 },
  { id: 'TC3', name: 'Commission', status: 'warning', issues: 4 },
  { id: 'TC4', name: 'Facturation', status: 'healthy', issues: 0 },
  { id: 'TC5', name: 'Payout', status: 'critical', issues: 7 },
];

export const commissionAlerts: CommissionAlert[] = [
  { id: 'CA1', severity: 'critical', message: 'Commission non calculée', timestamp: 'Il y a 8 min', amount: 85, investigateId: 'COM-8821' },
  { id: 'CA2', severity: 'warning', message: 'Commission bloquée', timestamp: 'Il y a 22 min', amount: 678, investigateId: 'COM-441' },
  { id: 'CA3', severity: 'warning', message: 'Commission en retard', timestamp: 'Il y a 45 min', amount: 264, investigateId: 'COM-992' },
  { id: 'CA4', severity: 'critical', message: 'Commission litigieuse', timestamp: 'Il y a 1h', amount: 160, investigateId: 'COM-338' },
  { id: 'CA5', severity: 'info', message: 'Montant incohérent', timestamp: 'Il y a 2h', amount: 42, investigateId: 'COM-552' },
];

export const commissionAutomation: CommissionAutomation = {
  autoCalculate: true,
  autoValidate: true,
  autoInvoice: false,
  autoPay: false,
  autoFollowUp: true,
};

export function commissionsFixtureBundle(): CommissionsCenterBundle {
  return {
    kpis: commissionKpis,
    health: commissionHealth,
    rules: commissionRules,
    services: commissionServices,
    partners: commissionPartners,
    timeline: commissionTimeline,
    leakage: commissionLeakage,
    topPartners: commissionTopPartners,
    monthlyTrend: commissionMonthlyTrend,
    breakdown: commissionBreakdown,
    revenueVsCommission: commissionRevenueVsCommission,
    truthCorridors: commissionTruthCorridors,
    alerts: commissionAlerts,
    automation: commissionAutomation,
    degraded: true,
  };
}
