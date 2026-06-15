import type {
  FinanceDashboard,
  DailyRevenueSummary,
  RevenueBreakdownItem,
  PartnerRevenueRow,
  LeakageItem,
  FinancialAlert,
  ZoneRevenue,
  FinancialTruthCorridor,
  FinanceCenterBundle,
} from './finance-types';

export const financeDashboard: FinanceDashboard = {
  todayRevenue: 1850,
  todayChange: 9,
  weekRevenue: 11000,
  weekChange: 12,
  monthRevenue: 42750,
  monthChange: 18,
  commissionDue: 5240,
  commissionPaid: 18900,
  cashInTransit: 2460,
  grossMargin: 58.7,
  trendPercent: 18.4,
  trendSparkline: [18, 28, 24, 38, 44, 39, 52, 48, 61, 57, 68, 72],
};

const last30Days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    amount: Math.round(600 + Math.sin(i * 0.4) * 200 + i * 15),
  };
});

export const financeDailyRevenue: DailyRevenueSummary = {
  points: last30Days,
  totalRevenue: 22540,
  totalOrders: 842,
  avgBasket: 26.75,
  growthPercent: 18.4,
};

export const financeBreakdown: RevenueBreakdownItem[] = [
  { category: 'Services de lavage', amount: 23085, percent: 54, color: '#2563EB' },
  { category: 'Collectes & Livraisons', amount: 10260, percent: 24, color: '#22C55E' },
  { category: 'Abonnements', amount: 4275, percent: 10, color: '#9333EA' },
  { category: 'Marketplace', amount: 3420, percent: 8, color: '#F59E0B' },
  { category: 'Autres', amount: 1710, percent: 4, color: '#64748B' },
];

export const financePartners: PartnerRevenueRow[] = [
  { id: 'P1', name: 'Prestige Pressing', revenue: 9850, orders: 254, commission: 1970, trend: 'up' },
  { id: 'P2', name: 'Eco Wash', revenue: 7420, orders: 198, commission: 1484, trend: 'up' },
  { id: 'P3', name: 'Clean Express', revenue: 6180, orders: 176, commission: 1236, trend: 'flat' },
  { id: 'P4', name: 'Laverie Smart', revenue: 5240, orders: 142, commission: 1048, trend: 'down' },
  { id: 'P5', name: 'Wash Pro', revenue: 4120, orders: 98, commission: 824, trend: 'down' },
];

export const financeLeakage: LeakageItem[] = [
  { id: 'L1', type: 'orphan_payment', label: 'Paiements orphelins', count: 2, description: 'Paiements sans commande associée', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'L2', type: 'unbilled_pickup', label: 'Collectes non facturées', count: 3, description: 'Collectes sans facture émise', color: '#F59E0B', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'L3', type: 'suspicious_refund', label: 'Remboursements suspects', count: 1, description: 'Remboursements anormaux détectés', color: '#EAB308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'L4', type: 'missing_commission', label: 'Commissions manquantes', count: 4, description: 'Commissions non calculées', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-200' },
];

export const financeAlerts: FinancialAlert[] = [
  { id: 'FA1', severity: 'critical', message: 'Paiement orphelin détecté', timestamp: 'Il y a 12 min', amount: 85, investigateId: 'PAY-8821' },
  { id: 'FA2', severity: 'warning', message: 'Collecte non facturée', timestamp: 'Il y a 28 min', amount: 42, investigateId: 'ORD-7842' },
  { id: 'FA3', severity: 'warning', message: 'Remboursement suspect', timestamp: 'Il y a 45 min', amount: 120, investigateId: 'REF-441' },
  { id: 'FA4', severity: 'info', message: 'Commission manquante', timestamp: 'Il y a 1h', amount: 18, investigateId: 'COM-992' },
  { id: 'FA5', severity: 'critical', message: 'Cash en transit dépassé', timestamp: 'Il y a 1h 15', amount: 2460, investigateId: 'CASH-12' },
  { id: 'FA6', severity: 'warning', message: 'Écart facture / paiement', timestamp: 'Il y a 2h', amount: 35, investigateId: 'INV-338' },
  { id: 'FA7', severity: 'info', message: 'Nouveau payout partenaire', timestamp: 'Il y a 3h', amount: 1240, investigateId: 'PAY-OUT-88' },
];

export const financeZones: ZoneRevenue[] = [
  { id: 'Z1', name: 'Gombe', revenue: 9850, orders: 218, avgBasket: 45.2, healthColor: '#22C55E', mapX: 170, mapY: 70 },
  { id: 'Z2', name: 'Ngaliema', revenue: 6240, orders: 134, avgBasket: 46.6, healthColor: '#22C55E', mapX: 100, mapY: 130 },
  { id: 'Z3', name: 'Limete', revenue: 5180, orders: 162, avgBasket: 32.0, healthColor: '#F59E0B', mapX: 260, mapY: 90 },
  { id: 'Z4', name: 'Masina', revenue: 3840, orders: 76, avgBasket: 50.5, healthColor: '#F59E0B', mapX: 310, mapY: 120 },
  { id: 'Z5', name: 'Kalamu', revenue: 2120, orders: 58, avgBasket: 36.6, healthColor: '#EF4444', mapX: 220, mapY: 200 },
  { id: 'Z6', name: 'Bandalungwa', revenue: 4680, orders: 126, avgBasket: 37.1, healthColor: '#F59E0B', mapX: 150, mapY: 170 },
  { id: 'Z7', name: 'Kintambo', revenue: 1840, orders: 34, avgBasket: 54.1, healthColor: '#EF4444', mapX: 130, mapY: 110 },
];

export const financeTruthCorridors: FinancialTruthCorridor[] = [
  { id: 'TC1', name: 'Commande', status: 'healthy', issues: 0 },
  { id: 'TC2', name: 'Paiement', status: 'warning', issues: 2 },
  { id: 'TC3', name: 'Commission', status: 'warning', issues: 4 },
  { id: 'TC4', name: 'Remboursement', status: 'critical', issues: 1 },
  { id: 'TC5', name: 'Payout', status: 'healthy', issues: 0 },
];

export function financeFixtureBundle(): FinanceCenterBundle {
  return {
    dashboard: financeDashboard,
    dailyRevenue: financeDailyRevenue,
    breakdown: financeBreakdown,
    partners: financePartners,
    leakage: financeLeakage,
    alerts: financeAlerts,
    zones: financeZones,
    truthCorridors: financeTruthCorridors,
    degraded: true,
  };
}
