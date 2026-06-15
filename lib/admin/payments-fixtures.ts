import type {
  PaymentKpis,
  PaymentTrendPoint,
  PaymentMethodBreakdown,
  PaymentZoneStats,
  PaymentTransaction,
  FailedTransaction,
  PaymentHealth,
  PaymentAlert,
  PaymentTruthCorridor,
  ReconciliationGap,
  FraudSignal,
  CommissionWidget,
  RefundWidget,
  PaymentInsight,
  PaymentTransactionDetail,
  PaymentsCenterBundle,
  PaymentTrendPeriod,
} from './payments-types';

export const paymentKpis: PaymentKpis = {
  receivedAmount: 28450,
  receivedChange: 18,
  transactions: 842,
  transactionsChange: 15,
  successful: 798,
  successRate: 94.8,
  successChange: 12,
  pending: 32,
  pendingRate: 3.8,
  pendingChange: -5,
  failed: 12,
  failedRate: 1.4,
  failedChange: -20,
  avgTicket: 33.79,
  avgTicketChange: 9,
};

function makeTrend(len: number, labels: string[]): PaymentTrendPoint[] {
  return labels.map((label, i) => ({
    label,
    amount: Math.round(3500 + Math.sin(i * 0.5) * 800 + i * 200),
    transactions: Math.round(100 + Math.sin(i * 0.4) * 30 + i * 5),
    successRate: 92 + Math.sin(i * 0.3) * 3,
  }));
}

export const paymentTrend: Record<PaymentTrendPeriod, PaymentTrendPoint[]> = {
  '24h': makeTrend(12, ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']),
  '7d': makeTrend(7, ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']),
  '30d': makeTrend(10, Array.from({ length: 10 }, (_, i) => `J${i * 3 + 1}`)),
  '90d': makeTrend(12, ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']),
  '1y': makeTrend(12, ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']),
};

export const paymentMethods: PaymentMethodBreakdown[] = [
  { method: 'Mobile Money', percent: 58, amount: 16501, count: 488, color: '#2563EB' },
  { method: 'Carte bancaire', percent: 22, amount: 6259, count: 185, color: '#22C55E' },
  { method: 'Paiement chauffeur', percent: 10, amount: 2845, count: 84, color: '#F59E0B' },
  { method: 'Espèces', percent: 6, amount: 1707, count: 51, color: '#9333EA' },
  { method: 'Autres', percent: 4, amount: 1138, count: 34, color: '#64748B' },
];

export const paymentZones: PaymentZoneStats[] = [
  { id: 'Z1', name: 'Gombe', revenue: 7850, transactions: 218, avgTicket: 36.0, healthColor: '#22C55E', mapX: 170, mapY: 70 },
  { id: 'Z2', name: 'Limete', revenue: 5240, transactions: 162, avgTicket: 32.3, healthColor: '#22C55E', mapX: 260, mapY: 90 },
  { id: 'Z3', name: 'Ngaliema', revenue: 4680, transactions: 134, avgTicket: 34.9, healthColor: '#F59E0B', mapX: 100, mapY: 130 },
  { id: 'Z4', name: 'Kintambo', revenue: 3120, transactions: 98, avgTicket: 31.8, healthColor: '#F59E0B', mapX: 130, mapY: 110 },
  { id: 'Z5', name: 'Bandalungwa', revenue: 2840, transactions: 86, avgTicket: 33.0, healthColor: '#F59E0B', mapX: 150, mapY: 170 },
  { id: 'Z6', name: 'Masina', revenue: 2420, transactions: 72, avgTicket: 33.6, healthColor: '#EF4444', mapX: 310, mapY: 120 },
  { id: 'Z7', name: 'Kalamu', revenue: 1300, transactions: 42, avgTicket: 31.0, healthColor: '#EF4444', mapX: 220, mapY: 200 },
];

export const paymentTransactions: PaymentTransaction[] = [
  { id: 'PAY-9901', orderId: 'ORD-7845', client: 'Marie K.', partner: 'Prestige Pressing', amount: 45.50, method: 'Mobile Money', status: 'success', date: '08/06 10:32', reference: 'MM-8821' },
  { id: 'PAY-9900', orderId: 'ORD-7842', client: 'Jean T.', partner: 'Eco Wash', amount: 32.00, method: 'Carte bancaire', status: 'pending', date: '08/06 10:28', reference: 'CB-4412' },
  { id: 'PAY-9898', orderId: 'ORD-7839', client: 'David M.', partner: 'Clean Express', amount: 78.00, method: 'Mobile Money', status: 'success', date: '08/06 10:15', reference: 'MM-8820' },
  { id: 'PAY-9895', orderId: 'ORD-7422', client: 'Robert I.', partner: 'Wash Pro', amount: 28.50, method: 'Carte bancaire', status: 'failed', date: '08/06 09:55', reference: 'CB-4408' },
  { id: 'PAY-9892', orderId: 'ORD-7418', client: 'Claudine M.', partner: 'Laverie Smart', amount: 55.00, method: 'Espèces', status: 'refunded', date: '08/06 09:40', reference: 'CASH-12' },
  { id: 'PAY-9890', orderId: 'ORD-7410', client: 'Patrick K.', partner: 'Pressing Bonanjo', amount: 42.00, method: 'Paiement chauffeur', status: 'success', date: '08/06 09:22', reference: 'DRV-88' },
];

export const failedTransactions: FailedTransaction[] = [
  { id: 'PAY-9895', orderId: 'ORD-7422', amount: 28.50, error: 'Carte expirée', time: 'il y a 10 min' },
  { id: 'PAY-9888', orderId: 'ORD-7405', amount: 65.00, error: 'Timeout API', time: 'il y a 25 min' },
  { id: 'PAY-9885', orderId: 'ORD-7398', amount: 38.00, error: 'Fonds insuffisants', time: 'il y a 42 min' },
  { id: 'PAY-9882', orderId: 'ORD-7390', amount: 52.00, error: 'Webhook manquant', time: 'il y a 1h' },
  { id: 'PAY-9880', orderId: 'ORD-7385', amount: 22.00, error: 'Double tentative', time: 'il y a 1h 15' },
];

export const paymentHealth: PaymentHealth = {
  healthyPercent: 94,
  warningPercent: 4,
  criticalPercent: 2,
  successRate: 94.8,
  failedRate: 1.4,
  pendingRate: 3.8,
  reconciliationGap: 0.6,
  avgProcessingSeconds: 18,
  linkedDisputes: 5,
};

export const paymentAlerts: PaymentAlert[] = [
  { id: 'PA1', severity: 'warning', message: 'Paiement bloqué >30 min', timestamp: 'Il y a 8 min', amount: 32, investigateId: 'PAY-9900' },
  { id: 'PA2', severity: 'critical', message: 'Double paiement détecté', timestamp: 'Il y a 15 min', amount: 65, investigateId: 'PAY-9880' },
  { id: 'PA3', severity: 'warning', message: 'Webhook absent', timestamp: 'Il y a 28 min', amount: 52, investigateId: 'PAY-9882' },
  { id: 'PA4', severity: 'critical', message: 'Montant incohérent', timestamp: 'Il y a 45 min', amount: 78, investigateId: 'PAY-9898' },
  { id: 'PA5', severity: 'info', message: 'Provider timeout Airtel', timestamp: 'Il y a 1h', investigateId: 'PAY-9888' },
];

export const paymentTruthCorridors: PaymentTruthCorridor[] = [
  { id: 'TC1', name: 'Commande', status: 'healthy', issues: 0 },
  { id: 'TC2', name: 'Paiement', status: 'healthy', issues: 0 },
  { id: 'TC3', name: 'Commission', status: 'warning', issues: 2 },
  { id: 'TC4', name: 'Remboursement', status: 'healthy', issues: 0 },
  { id: 'TC5', name: 'Payout', status: 'healthy', issues: 0 },
];

export const paymentReconciliation: ReconciliationGap[] = [
  { id: 'R1', type: 'orphan_payment', label: 'Paiements sans commande', count: 3, amount: 185, impact: 'Revenu non attribué' },
  { id: 'R2', type: 'missing_payment', label: 'Commandes sans paiement', count: 2, amount: 95, impact: 'CA non encaissé' },
  { id: 'R3', type: 'orphan_refund', label: 'Remboursements sans paiement', count: 1, amount: 55, impact: 'Fuite financière' },
];

export const paymentFraudSignals: FraudSignal[] = [
  { id: 'F1', type: 'repeated_amount', label: 'Montants répétés', count: 2, score: 72, risk: 'high' },
  { id: 'F2', type: 'multiple_cards', label: 'Multiples cartes', count: 1, score: 45, risk: 'medium' },
  { id: 'F3', type: 'suspicious_ip', label: 'IP suspecte', count: 1, score: 38, risk: 'medium' },
  { id: 'F4', type: 'night_payments', label: 'Paiements nocturnes', count: 3, score: 25, risk: 'low' },
  { id: 'F5', type: 'chargebacks', label: 'Chargebacks', count: 0, score: 10, risk: 'low' },
];

export const paymentCommissionWidget: CommissionWidget = {
  generated: 5240, paid: 3890, pending: 1120, blocked: 230,
};

export const paymentRefundWidget: RefundWidget = {
  requests: 24, accepted: 145, rejected: 12, pending: 8,
};

export const paymentInsights: PaymentInsight[] = [
  { id: 'I1', message: 'Les paiements Mobile Money ont augmenté de 18%.', type: 'positive' },
  { id: 'I2', message: 'Le taux d\'échec Airtel Money est 2× supérieur à Orange Money.', type: 'negative' },
  { id: 'I3', message: 'Le ticket moyen augmente dans Gombe (+9%).', type: 'positive' },
  { id: 'I4', message: '3 écarts de réconciliation détectés ce mois.', type: 'negative' },
];

export const paymentTransactionDetail: PaymentTransactionDetail = {
  id: 'PAY-9901',
  orderId: 'ORD-7845',
  provider: 'Orange Money',
  commission: 9.10,
  refundAmount: 0,
  history: [
    { label: 'Transaction initiée', timestamp: '08/06 10:30' },
    { label: 'Paiement confirmé', timestamp: '08/06 10:32' },
    { label: 'Commission calculée', timestamp: '08/06 10:33' },
    { label: 'Webhook reçu', timestamp: '08/06 10:33' },
  ],
};

export function paymentsFixtureBundle(): PaymentsCenterBundle {
  return {
    kpis: paymentKpis,
    trend: paymentTrend,
    methods: paymentMethods,
    zones: paymentZones,
    transactions: paymentTransactions,
    failed: failedTransactions,
    health: paymentHealth,
    alerts: paymentAlerts,
    truthCorridors: paymentTruthCorridors,
    reconciliation: paymentReconciliation,
    fraudSignals: paymentFraudSignals,
    commissionWidget: paymentCommissionWidget,
    refundWidget: paymentRefundWidget,
    insights: paymentInsights,
    transactionDetail: paymentTransactionDetail,
    degraded: true,
  };
}
