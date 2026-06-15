import type { RevenueLeakageCenterBundle, LeakageKpis } from './revenue-leakage-types';

export const leakageKpis: LeakageKpis = {
  revenueAtRisk: 18450,
  revenueAtRiskChange: 12,
  openCases: 10,
  openCasesChange: -20,
  criticalCases: 3,
  criticalCasesChange: 50,
  resolvedThisMonth: 24,
  resolvedChange: 33,
  leakRate: 1.8,
  leakRateChange: -0.2,
  avgResolutionHours: 4.2,
  avgResolutionChange: -12,
};

const trend7d = [
  { label: 'Lun', openCases: 8, amountAtRisk: 15200, resolved: 2 },
  { label: 'Mar', openCases: 9, amountAtRisk: 16100, resolved: 3 },
  { label: 'Mer', openCases: 11, amountAtRisk: 17200, resolved: 2 },
  { label: 'Jeu', openCases: 10, amountAtRisk: 16800, resolved: 4 },
  { label: 'Ven', openCases: 12, amountAtRisk: 17900, resolved: 3 },
  { label: 'Sam', openCases: 9, amountAtRisk: 16500, resolved: 5 },
  { label: 'Dim', openCases: 10, amountAtRisk: 18450, resolved: 5 },
];

export function revenueLeakageFixtureBundle(): RevenueLeakageCenterBundle {
  return {
    kpis: leakageKpis,
    riskScore: { score: 73, level: 'red', label: 'Risque élevé' },
    orphanPayments: [
      { id: 'PAY-89451', amount: 620, date: '07/06 14:22', provider: 'Airtel Money', reference: 'AM-7721', age: '2 j' },
      { id: 'PAY-89388', amount: 340, date: '06/06 09:15', provider: 'Orange Money', reference: 'OM-4412', age: '3 j' },
    ],
    unbilledCollections: [
      { orderId: 'ORD-8120', partner: 'Prestige Pressing', amount: 1200, collectionDate: '05/06', age: '4 j' },
      { orderId: 'ORD-8098', partner: 'Clean Express', amount: 450, collectionDate: '06/06', age: '2 j' },
      { orderId: 'ORD-8071', partner: 'Lavage Plus', amount: 280, collectionDate: '04/06', age: '5 j' },
    ],
    missingCommissions: [
      { orderId: 'ORD-7845', paymentId: 'PAY-9901', partner: 'Prestige Pressing', expected: 600, found: 0, difference: 600 },
      { orderId: 'ORD-7722', paymentId: 'PAY-9888', partner: 'Clean Express', expected: 320, found: 80, difference: 240 },
      { orderId: 'ORD-7690', paymentId: 'PAY-9875', partner: 'Lavage Plus', expected: 180, found: 0, difference: 180 },
      { orderId: 'ORD-7654', paymentId: 'PAY-9860', partner: 'Prestige Pressing', expected: 420, found: 120, difference: 300 },
    ],
    suspiciousRefunds: [
      { id: 'REF-4521', orderId: 'ORD-7843', client: 'Jean M.', amount: 890, reason: 'Remboursement > paiement', riskScore: 92 },
    ],
    uncollectedOrders: [
      { orderId: 'ORD-7910', client: 'Marie K.', partner: 'Prestige Pressing', expectedAmount: 900, age: '3 j' },
      { orderId: 'ORD-7888', client: 'Paul T.', partner: 'Clean Express', expectedAmount: 520, age: '2 j' },
    ],
    payoutAnomalies: [
      { id: 'Payout-332', partner: 'Prestige Pressing', amount: 4200, status: 'warning', issue: 'Payout > solde commission' },
    ],
    timeline: [
      { id: 't1', stage: 'detection', label: 'Commission manquante détectée', time: '08/06 09:12', actor: 'Système' },
      { id: 't2', stage: 'investigation', label: 'Analyse corridor ORD-7845', time: '08/06 10:30', actor: 'Finance' },
      { id: 't3', stage: 'assignment', label: 'Cas assigné à Finance', time: '08/06 11:00', actor: 'Admin' },
      { id: 't4', stage: 'correction', label: 'Commission recalculée', time: '08/06 14:15', actor: 'Ops' },
      { id: 't5', stage: 'resolution', label: 'Cas résolu — 600 $ récupérés', time: '08/06 16:45', actor: 'Finance' },
    ],
    corridor: [
      { name: 'Commande', count: 2, amount: 2450 },
      { name: 'Paiement', count: 5, amount: 5860 },
      { name: 'Commission', count: 4, amount: 4320 },
      { name: 'Facturation', count: 3, amount: 3100 },
      { name: 'Payout', count: 1, amount: 980 },
    ],
    partners: [
      { partner: 'Prestige Pressing', amountLost: 3200, openCases: 4, riskScore: 85 },
      { partner: 'Clean Express', amountLost: 1850, openCases: 2, riskScore: 62 },
      { partner: 'Lavage Plus', amountLost: 1200, openCases: 2, riskScore: 55 },
      { partner: 'Pressing Royal', amountLost: 890, openCases: 1, riskScore: 48 },
      { partner: 'Net Wash', amountLost: 650, openCases: 1, riskScore: 40 },
    ],
    zones: [
      { id: 'gombe', name: 'Gombe', leakAmount: 3850, leakPercent: 2.1, mapX: 52, mapY: 38, heatColor: '#EF4444' },
      { id: 'limete', name: 'Limete', leakAmount: 2420, leakPercent: 1.6, mapX: 58, mapY: 45, heatColor: '#F59E0B' },
      { id: 'ngaliema', name: 'Ngaliema', leakAmount: 1980, leakPercent: 1.3, mapX: 42, mapY: 42, heatColor: '#F59E0B' },
      { id: 'masina', name: 'Masina', leakAmount: 1540, leakPercent: 1.1, mapX: 65, mapY: 55, heatColor: '#FBBF24' },
      { id: 'kintambo', name: 'Kintambo', leakAmount: 1120, leakPercent: 0.9, mapX: 48, mapY: 50, heatColor: '#FBBF24' },
      { id: 'bandalungwa', name: 'Bandalungwa', leakAmount: 890, leakPercent: 0.7, mapX: 45, mapY: 58, heatColor: '#22C55E' },
    ],
    trend: {
      day: trend7d,
      week: trend7d,
      month: trend7d.map((p, i) => ({ ...p, label: `S${i + 1}`, amountAtRisk: p.amountAtRisk * 4 })),
      quarter: trend7d.map((p, i) => ({ ...p, label: `M${i + 1}`, amountAtRisk: p.amountAtRisk * 12 })),
      year: trend7d.map((p, i) => ({ ...p, label: `T${i + 1}`, amountAtRisk: p.amountAtRisk * 36 })),
    },
    alerts: [
      { id: 'a1', message: 'Commission manquante détectée — Prestige Pressing', severity: 'critical', time: 'il y a 5 min', caseId: 'CASE-101' },
      { id: 'a2', message: 'Paiement orphelin PAY-89451', severity: 'warning', time: 'il y a 12 min', caseId: 'CASE-102' },
      { id: 'a3', message: 'Facture absente — ORD-8120', severity: 'warning', time: 'il y a 25 min', caseId: 'CASE-103' },
      { id: 'a4', message: 'Remboursement suspect REF-4521', severity: 'critical', time: 'il y a 40 min', caseId: 'CASE-104' },
      { id: 'a5', message: 'Paiement non réconcilié', severity: 'info', time: 'il y a 1 h', caseId: 'CASE-105' },
      { id: 'a6', message: 'Payout anomalie — Prestige Pressing', severity: 'warning', time: 'il y a 2 h', caseId: 'CASE-106' },
    ],
    assignments: [
      { caseId: 'CASE-101', title: 'Commission manquante ORD-7845', assignee: 'Finance', status: 'investigating', amount: 600 },
      { caseId: 'CASE-102', title: 'Paiement orphelin PAY-89451', assignee: 'Ops', status: 'open', amount: 620 },
      { caseId: 'CASE-103', title: 'Collecte non facturée ORD-8120', assignee: 'Finance', status: 'open', amount: 1200 },
      { caseId: 'CASE-104', title: 'Remboursement suspect REF-4521', assignee: 'Admin', status: 'investigating', amount: 890 },
    ],
    truthHealth: [
      { name: 'Order Truth', percent: 88, color: '#22C55E' },
      { name: 'Payment Truth', percent: 78, color: '#F59E0B' },
      { name: 'Commission Truth', percent: 62, color: '#EF4444' },
      { name: 'Payout Truth', percent: 90, color: '#22C55E' },
    ],
    financialImpact: {
      potentialLoss: 18450,
      confirmedLoss: 7250,
      recoveredThisMonth: 4860,
      underInvestigation: 6340,
    },
    insights: [
      { id: 'i1', text: '80% des commissions manquantes proviennent de 2 partenaires.', type: 'warning' },
      { id: 'i2', text: 'Les remboursements suspects ont augmenté de 25%.', type: 'critical' },
      { id: 'i3', text: 'Les paiements orphelins proviennent principalement du provider Airtel Money.', type: 'info' },
      { id: 'i4', text: 'Le ticket moyen des fuites est plus élevé dans Gombe (+18%).', type: 'info' },
    ],
    investigationDetail: {
      caseId: 'CASE-101',
      orderId: 'ORD-7845',
      paymentId: 'PAY-9901',
      commissionId: undefined,
      invoiceId: 'INV-4421',
      refundId: undefined,
      status: 'investigating',
      assignee: 'Finance',
      timeline: [
        { id: 'd1', stage: 'detection', label: 'Commission absente détectée', time: '08/06 09:12' },
        { id: 'd2', stage: 'investigation', label: 'Corridor analysé', time: '08/06 10:30' },
        { id: 'd3', stage: 'assignment', label: 'Assigné à Finance', time: '08/06 11:00' },
      ],
      logs: [
        { time: '08/06 09:12', message: 'Règle commission_missing déclenchée' },
        { time: '08/06 10:30', message: 'Payment Truth: healthy, Commission Truth: broken' },
        { time: '08/06 11:00', message: 'Cas CASE-101 assigné à Finance' },
      ],
    },
  };
}
