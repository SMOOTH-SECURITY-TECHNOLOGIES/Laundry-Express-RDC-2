export interface InvestigateParams {
  orderId?: string;
  paymentId?: string;
  deliveryTaskId?: string;
  driverId?: string;
  customerPhone?: string;
  partnerId?: string;
}

export interface InvestigationEntity {
  type: 'order' | 'payment' | 'delivery' | 'partner' | 'client' | 'driver';
  id: string;
  label: string;
  status: string;
  corridor: string;
  icon: string;
}

export interface InvestigationSummary {
  entities: InvestigationEntity[];
  confidence: number;
  startDate: string;
  endDate: string;
  duration: string;
  sourcePrincipal: string;
  corridorsLies: number;
  evenementsTrouves: number;
}

export interface TruthEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  corridor: string;
  actor: string;
  proof: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  details?: string;
}

export interface RelationshipNode {
  id: string;
  label: string;
  type: string;
  icon: string;
  color: string;
  x: number;
  y: number;
}

export interface RelationshipEdge {
  from: string;
  to: string;
  label: string;
  type: 'confirmed' | 'weak' | 'indirect';
}

export interface Evidence {
  id: string;
  category: 'photo' | 'payment' | 'log' | 'document';
  title: string;
  description: string;
  timestamp: string;
  thumbnail?: string;
}

export interface Violation {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'medium' | 'low';
  impact: string;
  detectedAt: string;
  proof: string;
}

export interface FinancialImpact {
  clientPaid: number;
  partnerAmount: number;
  driverAmount: number;
  platformCommission: number;
  estimatedLoss: number;
}

export interface RootCauseAnalysis {
  mainCause: string;
  mainProbability: number;
  description: string;
  alternatives: Array<{
    cause: string;
    probability: number;
    color: string;
  }>;
}

export interface CorridorStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'critical';
  icon: string;
}
