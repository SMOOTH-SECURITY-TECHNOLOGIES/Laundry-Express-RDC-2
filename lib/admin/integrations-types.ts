export interface IntegrationsKpis {
  apiCallsToday: number; apiCallsTodayChange: number; apiCallsTodaySparkline: number[];
  webhooksReceived: number; webhooksReceivedChange: number; webhooksReceivedSparkline: number[];
  webhooksSent: number; webhooksSentChange: number; webhooksSentSparkline: number[];
  successRate: number; successRateChange: number; successRateSparkline: number[];
  failedEvents: number; failedEventsChange: number; failedEventsSparkline: number[];
  activeIntegrations: number; activeIntegrationsChange: number; activeIntegrationsSparkline: number[];
  apiKeysCount: number; apiKeysChange: number; apiKeysSparkline: number[];
  avgResponseTimeMs: number; avgResponseTimeChange: number; avgResponseTimeSparkline: number[];
}

export interface ApiKey {
  id: string; name: string; keyType: string; typeLabel: string; scope: string;
  createdBy?: string; lastUsedAt?: string; status: string; statusLabel: string;
}

export interface Webhook {
  id: string; name: string; url: string; event: string; eventLabel: string;
  lastCallAt?: string; successCount: number; failureCount: number;
  status: string; statusLabel: string; signed: boolean;
}

export interface WebhookDelivery {
  id: string; webhookId: string; webhookName?: string; payload?: Record<string, unknown>;
  headers?: Record<string, string>; signature?: string; responseBody?: string;
  status: string; durationMs: number; attempts: number; createdAt?: string;
}

export interface TrackingProvider {
  provider: string; providerLabel: string; configValue?: string;
  enabled: boolean; healthStatus: string; healthLabel: string;
}

export interface ServerSideTracking {
  eventsRelayed24h: number; successRate: number; failedEvents: number; queueSize: number;
}

export interface IntegrationHealth {
  id: string; name: string; category: string; categoryLabel: string;
  status: string; statusLabel: string; lastSyncAt?: string;
  responseTimeMs: number; uptimePct: number;
}

export interface ApiLog {
  id: string; occurredAt?: string; source: string; endpoint: string; logType: string;
  userName?: string; integrationName?: string; status: string; statusLabel: string; responseTimeMs: number;
}

export interface AnalyticsSeries { key: string; title: string; data: { label: string; value: number }[]; }
export interface EventDistribution { label: string; count: number; percent: number; color: string; }
export interface TopEndpoint { method: string; path: string; calls: number; }

export interface SecurityMetrics {
  apiKeysTotal: number; apiKeysExpired: number; apiKeysRevoked: number;
  webhooksSigned: number; webhooksUnsigned: number;
  auditAccessCount: number; auditModifications: number; auditDeletions: number;
}

export interface IntegrationAlert { id: string; alertType: string; title: string; severity: string; count: number; }
export interface OpenApiSummary { version: string; title: string; endpointsCount: number; webhookEvents: string[]; }

export interface IntegrationsDashboardSummary {
  kpis: IntegrationsKpis; apiKeys: ApiKey[]; webhooks: Webhook[];
  webhookDeliveries: WebhookDelivery[]; tracking: TrackingProvider[];
  serverSideTracking: ServerSideTracking; integrations: IntegrationHealth[];
  logs: ApiLog[]; analytics: AnalyticsSeries[]; eventDistribution: EventDistribution[];
  topEndpoints: TopEndpoint[]; security: SecurityMetrics; alerts: IntegrationAlert[];
  openapi: OpenApiSummary; source: string;
}
