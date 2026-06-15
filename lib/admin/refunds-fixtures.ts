import type {
  RefundKpis,
  RefundHealth,
  RefundPipelineSummary,
  RefundRequest,
  RefundTimelineStep,
  RefundReasonBreakdown,
  RefundPartnerStats,
  RefundMonthlyPoint,
  RefundLeakageItem,
  RefundTruthCorridor,
  RefundAlert,
  FraudDetectionItem,
  RefundAutomation,
  RefundsCenterBundle,
} from './refunds-types';

export const refundKpis: RefundKpis = {
  openRequests: 24,
  openChange: 14,
  pending: 8,
  pendingChange: 33,
  approved: 145,
  approvedChange: 16,
  rejected: 12,
  rejectedChange: -8,
  refundedAmount: 18250,
  refundedChange: 22,
  fraudSuspicion: 3,
  fraudChange: 50,
};

export const refundHealth: RefundHealth = {
  healthyPercent: 72,
  warningPercent: 18,
  criticalPercent: 10,
  openRequests: 24,
  avgProcessingHours: 52,
  totalAmount: 18250,
  linkedDisputes: 6,
  fraudDetected: 3,
};

export const refundPipeline: RefundPipelineSummary = {
  stages: [
    { id: 'S1', label: 'Demande créée', count: 24, avgHours: 2, slaPercent: 98 },
    { id: 'S2', label: 'Vérification', count: 14, avgHours: 8, slaPercent: 94 },
    { id: 'S3', label: 'Investigation', count: 6, avgHours: 18, slaPercent: 88 },
    { id: 'S4', label: 'Validation', count: 8, avgHours: 12, slaPercent: 91 },
    { id: 'S5', label: 'Paiement', count: 5, avgHours: 6, slaPercent: 96 },
    { id: 'S6', label: 'Clôturé', count: 145, avgHours: 4, slaPercent: 99 },
  ],
  totalAvgHours: 66,
  slaRespected: 91,
  overdue: 5,
};

export const refundRequests: RefundRequest[] = [
  { id: 'REF-8821', orderId: 'ORD-7845', client: 'Jean Tshibangu', partner: 'Prestige Pressing', amount: 85, reason: 'Retard livraison', reasonCode: 'delivery_delay', date: '08/06 09:12', priority: 'high', status: 'review' },
  { id: 'REF-8818', orderId: 'ORD-7842', client: 'Marie Kambale', partner: 'Eco Wash', amount: 42, reason: 'Erreur commande', reasonCode: 'order_error', date: '08/06 08:45', priority: 'medium', status: 'pending' },
  { id: 'REF-8815', orderId: 'ORD-7839', client: 'David Mulumba', partner: 'Clean Express', amount: 120, reason: 'Article endommagé', reasonCode: 'damaged_item', date: '07/06 18:30', priority: 'high', status: 'approved' },
  { id: 'REF-8810', orderId: 'ORD-7422', client: 'Robert Ilunga', partner: 'Wash Pro', amount: 65, reason: 'Annulation client', reasonCode: 'client_cancel', date: '07/06 14:20', priority: 'low', status: 'paid' },
  { id: 'REF-8805', orderId: 'ORD-7418', client: 'Claudine Mbuyi', partner: 'Laverie Smart', amount: 95, reason: 'Fraude', reasonCode: 'fraud', date: '07/06 11:00', priority: 'critical', status: 'disputed' },
  { id: 'REF-8800', orderId: 'ORD-7410', client: 'Patrick Kabongo', partner: 'Pressing Bonanjo', amount: 38, reason: 'Double paiement', reasonCode: 'double_payment', date: '06/06 16:45', priority: 'medium', status: 'rejected' },
];

export const refundTimeline: RefundTimelineStep[] = [
  { id: 'T1', label: 'Commande créée', timestamp: '08/06 09:00', status: 'done' },
  { id: 'T2', label: 'Paiement reçu', timestamp: '08/06 09:15', status: 'done' },
  { id: 'T3', label: 'Réclamation client', timestamp: '08/06 10:30', status: 'done' },
  { id: 'T4', label: 'Preuves ajoutées', timestamp: '08/06 11:00', status: 'done' },
  { id: 'T5', label: 'Investigation', timestamp: '08/06 14:00', status: 'pending' },
  { id: 'T6', label: 'Décision', timestamp: '—', status: 'pending' },
  { id: 'T7', label: 'Paiement remboursement', timestamp: '—', status: 'pending' },
];

export const refundReasonBreakdown: RefundReasonBreakdown[] = [
  { label: 'Retard livraison', count: 66, percent: 36, color: '#F59E0B' },
  { label: 'Annulation client', count: 40, percent: 22, color: '#2563EB' },
  { label: 'Erreur commande', count: 29, percent: 16, color: '#EF4444' },
  { label: 'Article endommagé', count: 22, percent: 12, color: '#9333EA' },
  { label: 'Fraude', count: 11, percent: 6, color: '#DC2626' },
  { label: 'Autre', count: 15, percent: 8, color: '#64748B' },
];

export const refundPartnerStats: RefundPartnerStats[] = [
  { id: 'P1', name: 'Prestige Pressing', requests: 28, amount: 2840, refundRate: 2.1, slaPercent: 96, score: 4.8 },
  { id: 'P2', name: 'Eco Wash', requests: 22, amount: 1980, refundRate: 2.8, slaPercent: 94, score: 4.6 },
  { id: 'P3', name: 'Clean Express', requests: 18, amount: 1620, refundRate: 3.2, slaPercent: 91, score: 4.4 },
  { id: 'P4', name: 'Wash Pro', requests: 15, amount: 1420, refundRate: 4.5, slaPercent: 85, score: 3.9 },
  { id: 'P5', name: 'Laverie Smart', requests: 12, amount: 980, refundRate: 2.5, slaPercent: 93, score: 4.5 },
];

export const refundMonthlyTrend: RefundMonthlyPoint[] = [
  { label: 'Jan', count: 22, refunded: 2800, refused: 420 },
  { label: 'Fév', count: 25, refunded: 3100, refused: 380 },
  { label: 'Mar', count: 28, refunded: 3400, refused: 450 },
  { label: 'Avr', count: 30, refunded: 3600, refused: 400 },
  { label: 'Mai', count: 32, refunded: 3900, refused: 350 },
  { label: 'Juin', count: 35, refunded: 4250, refused: 320 },
];

export const refundLeakage: RefundLeakageItem[] = [
  { id: 'L1', type: 'unjustified', label: 'Remboursés sans justification', count: 2, description: 'Paiements remboursés sans motif valide', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
  { id: 'L2', type: 'duplicate', label: 'Remboursements en doublon', count: 1, description: 'Double remboursement sur même commande', color: '#F59E0B', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'L3', type: 'suspicious', label: 'Remboursements suspects', count: 3, description: 'Patterns anormaux détectés', color: '#EAB308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'L4', type: 'commission', label: 'Commissions non ajustées', count: 4, description: 'Commission non recalculée après remboursement', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-200' },
];

export const refundTruthCorridors: RefundTruthCorridor[] = [
  { id: 'TC1', name: 'Commande', status: 'healthy', issues: 0 },
  { id: 'TC2', name: 'Paiement', status: 'healthy', issues: 0 },
  { id: 'TC3', name: 'Livraison', status: 'warning', issues: 2 },
  { id: 'TC4', name: 'Commission', status: 'healthy', issues: 0 },
  { id: 'TC5', name: 'Remboursement', status: 'critical', issues: 3 },
];

export const refundAlerts: RefundAlert[] = [
  { id: 'RA1', severity: 'info', message: 'Remboursement approuvé', timestamp: 'Il y a 5 min', amount: 85, investigateId: 'REF-8821' },
  { id: 'RA2', severity: 'critical', message: 'Fraude détectée', timestamp: 'Il y a 18 min', amount: 120, investigateId: 'REF-8805' },
  { id: 'RA3', severity: 'warning', message: 'Double remboursement', timestamp: 'Il y a 32 min', amount: 65, investigateId: 'REF-8810' },
  { id: 'RA4', severity: 'warning', message: 'Montant inhabituel', timestamp: 'Il y a 1h', amount: 350, investigateId: 'REF-8815' },
  { id: 'RA5', severity: 'critical', message: 'SLA dépassé', timestamp: 'Il y a 1h 20', amount: 42, investigateId: 'REF-8818' },
  { id: 'RA6', severity: 'info', message: 'Commission impactée', timestamp: 'Il y a 2h', amount: 18, investigateId: 'COM-992' },
];

export const refundFraudItems: FraudDetectionItem[] = [
  { id: 'F1', type: 'multiple', label: 'Multiples remboursements', count: 2, riskLevel: 'high' },
  { id: 'F2', type: 'duplicate', label: 'Double remboursement', count: 1, riskLevel: 'critical' },
  { id: 'F3', type: 'abusive_client', label: 'Client abusif', count: 1, riskLevel: 'high' },
  { id: 'F4', type: 'abusive_partner', label: 'Partenaire abusif', count: 0, riskLevel: 'low' },
  { id: 'F5', type: 'abnormal_amount', label: 'Montants anormaux', count: 2, riskLevel: 'medium' },
  { id: 'F6', type: 'unusual_volume', label: 'Volume inhabituel', count: 1, riskLevel: 'medium' },
];

export const refundAutomation: RefundAutomation = {
  autoValidate: false,
  autoRefund: false,
  autoCommissionAdjust: true,
  notifyClient: true,
  notifyPartner: true,
  fraudEscalation: true,
};

export function refundsFixtureBundle(): RefundsCenterBundle {
  return {
    kpis: refundKpis,
    health: refundHealth,
    pipeline: refundPipeline,
    requests: refundRequests,
    timeline: refundTimeline,
    reasonBreakdown: refundReasonBreakdown,
    partnerStats: refundPartnerStats,
    monthlyTrend: refundMonthlyTrend,
    leakage: refundLeakage,
    truthCorridors: refundTruthCorridors,
    alerts: refundAlerts,
    fraudItems: refundFraudItems,
    automation: refundAutomation,
    degraded: true,
  };
}
