export type DisputeStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'under_review' | 'escalated' | 'closed' | 'resolved';

export type DisputeType =
  | 'quality'
  | 'delay'
  | 'cancellation'
  | 'missing_item'
  | 'payment'
  | 'damaged_item'
  | 'duplicate_payment'
  | 'other';

export type DisputeSeverity = 'critical' | 'major' | 'medium' | 'low';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'wallet';

export interface DisputeRequest {
  id: string;
  orderId: string;
  clientName: string;
  clientPhone?: string;
  partnerName: string;
  partnerId?: string;
  driverName?: string;
  amount: number;
  currency: 'USD' | 'CDF';
  type: DisputeType;
  status: DisputeStatus;
  severity: DisputeSeverity;
  reason: string;
  description?: string;
  requestedAt: string;
  resolvedAt?: string;
  evidenceCount: number;
  truthScore: number;
  assignedTo?: string;
  anomalies?: string[];
  notes?: DisputeNote[];
  timeline?: DisputeTimelineEvent[];
}

export interface DisputeNote {
  id: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface DisputeTimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'evidence_added' | 'note_added' | 'assigned' | 'resolved' | 'escalated';
  label: string;
  detail: string;
  timestamp: string;
  actor: string;
}

export interface DisputeSummary {
  totalRequests: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  totalRequestedAmount: number;
  totalRefundedAmount: number;
  acceptanceRate: number;
  currency: 'USD' | 'CDF';
}

export interface DisputeFilterState {
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  partner: string;
  paymentMethod: string;
  amountRange: string;
  search: string;
  severity: string;
}

export interface CreateDisputePayload {
  orderId: string;
  clientName: string;
  type: DisputeType;
  amount: number;
  reason: string;
  priority: DisputeSeverity;
  assignedTo?: string;
}

export interface ApproveRefundPayload {
  approvedAmount: number;
  method: PaymentMethod;
  note: string;
}

export interface RejectRefundPayload {
  reason: string;
  internalNote: string;
  clientMessage: string;
}

export interface AuditDisputesPayload {
  auditPayments: boolean;
  auditQuality: boolean;
  auditSla: boolean;
  auditRefunds: boolean;
  auditFull: boolean;
}

export interface DisputeBreakdownItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DisputeStatusAmount {
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RefundTrendPoint {
  date: string;
  amount: number;
}

export interface PartnerRefundRanking {
  name: string;
  requests: number;
  amount: number;
  acceptanceRate: number;
}

export interface RootCauseItem {
  name: string;
  percentage: number;
  icon: string;
  color: string;
}

export interface DisputeSlaSummary {
  inTime: number;
  inTimePercent: number;
  atRisk: number;
  atRiskPercent: number;
  outOfSla: number;
  outOfSlaPercent: number;
}

export interface DisputeFinancialImpact {
  requested: number;
  refunded: number;
  saved: number;
  netCostPercent: number;
}

export interface DisputeAnomaly {
  name: string;
  count: number;
}

export interface PlatformProtectionSummary {
  fraudDetection: boolean;
  protectionRules: number;
  limitsConfigured: number;
  autoValidation: boolean;
}

export interface DisputeActivityEvent {
  id: string;
  time: string;
  action: string;
  detail: string;
  icon: string;
  color: string;
}
