export type RefundStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'paid' | 'disputed';
export type RefundPriority = 'low' | 'medium' | 'high' | 'critical';
export type RefundHealthStatus = 'healthy' | 'warning' | 'critical';
export type RefundAlertSeverity = 'critical' | 'warning' | 'info';
export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RefundKpis {
  openRequests: number;
  openChange: number;
  pending: number;
  pendingChange: number;
  approved: number;
  approvedChange: number;
  rejected: number;
  rejectedChange: number;
  refundedAmount: number;
  refundedChange: number;
  fraudSuspicion: number;
  fraudChange: number;
}

export interface RefundHealth {
  healthyPercent: number;
  warningPercent: number;
  criticalPercent: number;
  openRequests: number;
  avgProcessingHours: number;
  totalAmount: number;
  linkedDisputes: number;
  fraudDetected: number;
}

export interface RefundPipelineStage {
  id: string;
  label: string;
  count: number;
  avgHours: number;
  slaPercent: number;
}

export interface RefundPipelineSummary {
  stages: RefundPipelineStage[];
  totalAvgHours: number;
  slaRespected: number;
  overdue: number;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  client: string;
  partner: string;
  amount: number;
  reason: string;
  reasonCode: string;
  date: string;
  priority: RefundPriority;
  status: RefundStatus;
}

export interface RefundTimelineStep {
  id: string;
  label: string;
  timestamp: string;
  status: 'done' | 'pending' | 'blocked';
}

export interface RefundReasonBreakdown {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface RefundPartnerStats {
  id: string;
  name: string;
  requests: number;
  amount: number;
  refundRate: number;
  slaPercent: number;
  score: number;
}

export interface RefundMonthlyPoint {
  label: string;
  count: number;
  refunded: number;
  refused: number;
}

export interface RefundLeakageItem {
  id: string;
  type: string;
  label: string;
  count: number;
  description: string;
  color: string;
  bg: string;
  border: string;
}

export interface RefundTruthCorridor {
  id: string;
  name: string;
  status: RefundHealthStatus;
  issues: number;
}

export interface RefundAlert {
  id: string;
  severity: RefundAlertSeverity;
  message: string;
  timestamp: string;
  amount: number;
  investigateId?: string;
}

export interface FraudDetectionItem {
  id: string;
  type: string;
  label: string;
  count: number;
  riskLevel: FraudRiskLevel;
}

export interface RefundAutomation {
  autoValidate: boolean;
  autoRefund: boolean;
  autoCommissionAdjust: boolean;
  notifyClient: boolean;
  notifyPartner: boolean;
  fraudEscalation: boolean;
}

export interface RefundFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  reason: string;
  zone: string;
  partner: string;
}

export type RefundWsChannel =
  | 'refund_created'
  | 'refund_approved'
  | 'refund_rejected'
  | 'refund_paid'
  | 'refund_fraud_detected'
  | 'refund_leakage_detected';

export interface RefundWsEvent {
  channel: RefundWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface RefundsCenterBundle {
  kpis: RefundKpis;
  health: RefundHealth;
  pipeline: RefundPipelineSummary;
  requests: RefundRequest[];
  timeline: RefundTimelineStep[];
  reasonBreakdown: RefundReasonBreakdown[];
  partnerStats: RefundPartnerStats[];
  monthlyTrend: RefundMonthlyPoint[];
  leakage: RefundLeakageItem[];
  truthCorridors: RefundTruthCorridor[];
  alerts: RefundAlert[];
  fraudItems: FraudDetectionItem[];
  automation: RefundAutomation;
  degraded: boolean;
}

export interface CreateRefundPolicyPayload {
  label: string;
  maxAmount: number;
  autoApproveBelow: number;
  scope: string;
}
