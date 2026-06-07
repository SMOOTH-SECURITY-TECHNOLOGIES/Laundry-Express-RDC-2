export type OrderTruthStatus = 'success' | 'warning' | 'error' | 'pending' | 'missing';

export type OrderTruthSearchType =
  | 'order_id'
  | 'uuid'
  | 'client'
  | 'phone'
  | 'partner'
  | 'driver'
  | 'transaction';

export type OrderTruthPeriod = 'today' | '7d' | '30d' | 'all';

export interface OrderTruthStats {
  totalOrders: string;
  tracedOrders: string;
  anomaliesDetected: string;
  openInvestigations: string;
  averageResolutionTime: string;
}

export interface OrderTruthEvent {
  id: string;
  eventType: string;
  technicalName: string;
  title: string;
  description: string;
  occurredAt: string;
  actorName?: string;
  actorType?: 'customer' | 'partner' | 'driver' | 'system' | 'admin';
  source: string;
  reference: string;
  status: OrderTruthStatus;
  evidenceIds?: string[];
  thumbnailUrl?: string;
  metadata?: Record<string, string>;
}

export interface OrderProof {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  source: string;
  thumbnailUrl: string;
  hash?: string;
  metadata: Record<string, string>;
}

export interface OrderAnomaly {
  id: string;
  title: string;
  level: 'Critique' | 'Majeur' | 'Mineur';
  description: string;
  source: string;
  recommendation: string;
}

export interface OrderInfo {
  orderId: string;
  uuid: string;
  date: string;
  client: string;
  phone: string;
  email: string;
  address: string;
  partner: string;
  driver: string;
  amount: string;
  transaction: string;
  finalStatus: string;
}

export interface OrderInvestigation {
  id: string;
  author?: string;
  note?: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  visibility?: string;
}

export interface OrderRelationNode {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
  status: OrderTruthStatus;
}

export interface OrderTechnicalLog {
  time: string;
  name: string;
  reference: string;
}

export interface OrderTruthSummary {
  order: OrderInfo;
  statusLabel: string;
  truthScore?: number;
  stats: OrderTruthStats;
  events: OrderTruthEvent[];
  proofs: OrderProof[];
  anomalies: OrderAnomaly[];
  investigations: OrderInvestigation[];
  relationNodes: OrderRelationNode[];
  technicalLogs: OrderTechnicalLog[];
}
