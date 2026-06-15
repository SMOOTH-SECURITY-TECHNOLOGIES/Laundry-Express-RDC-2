export interface ActivityLogKpis {
  totalActivities: number; totalChange: number; totalSparkline: number[];
  adminActivities: number; adminChange: number;
  partnerActivities: number; partnerChange: number;
  driverActivities: number; driverChange: number;
  systemActivities: number; systemChange: number;
  anomalies: number; anomaliesChange: number;
}

export interface ActivityLogEvent {
  id: string; eventId: string; occurredAt?: string;
  actorId?: string; actorType: string; actorTypeLabel: string;
  actorName: string; actorRole?: string;
  action: string; actionLabel?: string; description?: string;
  resourceType: string; resourceId?: string; reference?: string;
  corridor: string; corridorLabel: string;
  severity: string; severityLabel: string;
  status: string; statusLabel: string; impact?: string;
  ipAddress?: string; userAgent?: string; device?: string;
  browser?: string; osName?: string;
  beforeState?: Record<string, unknown>; afterState?: Record<string, unknown>;
  corridorsImpacted: string[]; isAnomaly: boolean;
}

export interface HeatmapCell { day: number; hour: number; count: number; }
export interface TopActivity { label: string; count: number; percent: number; color: string; }
export interface CorridorHealth {
  corridor: string; corridorLabel: string; events: number; anomalies: number;
  coherence: string; coherenceLabel: string; latencyMs?: number;
}
export interface ActorDistribution { actorType: string; actorLabel: string; count: number; percent: number; }
export interface SeverityDistribution { severity: string; severityLabel: string; count: number; }

export interface ActivityLogDashboardSummary {
  kpis: ActivityLogKpis;
  events: ActivityLogEvent[];
  liveEvents: ActivityLogEvent[];
  anomalies: ActivityLogEvent[];
  heatmap: HeatmapCell[];
  topActivities: TopActivity[];
  corridorHealth: CorridorHealth[];
  actorDistribution: ActorDistribution[];
  severityDistribution: SeverityDistribution[];
  total: number;
  sensitiveAccess: boolean;
  readOnly: boolean;
  source: string;
}
