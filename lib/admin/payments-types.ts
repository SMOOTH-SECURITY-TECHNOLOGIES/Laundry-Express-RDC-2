export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded' | 'disputed';
export type PaymentHealthStatus = 'healthy' | 'warning' | 'critical' | 'broken';
export type PaymentAlertSeverity = 'info' | 'warning' | 'critical';
export type PaymentTrendPeriod = '24h' | '7d' | '30d' | '90d' | '1y';
export type FraudRiskBadge = 'low' | 'medium' | 'high';

export interface PaymentKpis {
  receivedAmount: number;
  receivedChange: number;
  transactions: number;
  transactionsChange: number;
  successful: number;
  successRate: number;
  successChange: number;
  pending: number;
  pendingRate: number;
  pendingChange: number;
  failed: number;
  failedRate: number;
  failedChange: number;
  avgTicket: number;
  avgTicketChange: number;
}

export interface PaymentTrendPoint {
  label: string;
  amount: number;
  transactions: number;
  successRate: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  percent: number;
  amount: number;
  count: number;
  color: string;
}

export interface PaymentZoneStats {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  avgTicket: number;
  healthColor: string;
  mapX: number;
  mapY: number;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  client: string;
  partner: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
  reference: string;
}

export interface FailedTransaction {
  id: string;
  orderId: string;
  amount: number;
  error: string;
  time: string;
}

export interface PaymentHealth {
  healthyPercent: number;
  warningPercent: number;
  criticalPercent: number;
  successRate: number;
  failedRate: number;
  pendingRate: number;
  reconciliationGap: number;
  avgProcessingSeconds: number;
  linkedDisputes: number;
}

export interface PaymentAlert {
  id: string;
  severity: PaymentAlertSeverity;
  message: string;
  timestamp: string;
  amount?: number;
  investigateId?: string;
}

export interface PaymentTruthCorridor {
  id: string;
  name: string;
  status: PaymentHealthStatus;
  issues: number;
}

export interface ReconciliationGap {
  id: string;
  type: string;
  label: string;
  count: number;
  amount: number;
  impact: string;
}

export interface FraudSignal {
  id: string;
  type: string;
  label: string;
  count: number;
  score: number;
  risk: FraudRiskBadge;
}

export interface CommissionWidget {
  generated: number;
  paid: number;
  pending: number;
  blocked: number;
}

export interface RefundWidget {
  requests: number;
  accepted: number;
  rejected: number;
  pending: number;
}

export interface PaymentInsight {
  id: string;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface PaymentTransactionDetail {
  id: string;
  orderId: string;
  provider: string;
  commission: number;
  refundAmount: number;
  history: { label: string; timestamp: string }[];
}

export interface PaymentFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  method: string;
  zone: string;
  partner: string;
  minAmount: string;
  maxAmount: string;
  reference: string;
  orderId: string;
  client: string;
}

export type PaymentWsChannel =
  | 'payment_received'
  | 'payment_failed'
  | 'payment_pending'
  | 'payment_refunded'
  | 'payment_fraud_detected'
  | 'reconciliation_gap';

export interface PaymentWsEvent {
  channel: PaymentWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface PaymentsCenterBundle {
  kpis: PaymentKpis;
  trend: Record<PaymentTrendPeriod, PaymentTrendPoint[]>;
  methods: PaymentMethodBreakdown[];
  zones: PaymentZoneStats[];
  transactions: PaymentTransaction[];
  failed: FailedTransaction[];
  health: PaymentHealth;
  alerts: PaymentAlert[];
  truthCorridors: PaymentTruthCorridor[];
  reconciliation: ReconciliationGap[];
  fraudSignals: FraudSignal[];
  commissionWidget: CommissionWidget;
  refundWidget: RefundWidget;
  insights: PaymentInsight[];
  transactionDetail: PaymentTransactionDetail | null;
  degraded: boolean;
}
