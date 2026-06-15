import { features } from '../../config/features';
import { realApi, type BackendIntegrationsDashboardResponse } from '../../services/real-api';
import type { IntegrationsDashboardSummary } from './integrations-types';

export const INTEGRATIONS_WRITE_ENABLED = import.meta.env.VITE_INTEGRATIONS_WRITE_ENABLED !== 'false';

let cached: IntegrationsDashboardSummary | null = null;
let promise: Promise<IntegrationsDashboardSummary> | null = null;

export function invalidateIntegrationsCache(): void { cached = null; promise = null; }

function map(raw: BackendIntegrationsDashboardResponse): IntegrationsDashboardSummary {
  return {
    kpis: {
      apiCallsToday: raw.kpis.api_calls_today, apiCallsTodayChange: raw.kpis.api_calls_today_change, apiCallsTodaySparkline: raw.kpis.api_calls_today_sparkline ?? [],
      webhooksReceived: raw.kpis.webhooks_received, webhooksReceivedChange: raw.kpis.webhooks_received_change, webhooksReceivedSparkline: raw.kpis.webhooks_received_sparkline ?? [],
      webhooksSent: raw.kpis.webhooks_sent, webhooksSentChange: raw.kpis.webhooks_sent_change, webhooksSentSparkline: raw.kpis.webhooks_sent_sparkline ?? [],
      successRate: raw.kpis.success_rate, successRateChange: raw.kpis.success_rate_change, successRateSparkline: raw.kpis.success_rate_sparkline ?? [],
      failedEvents: raw.kpis.failed_events, failedEventsChange: raw.kpis.failed_events_change, failedEventsSparkline: raw.kpis.failed_events_sparkline ?? [],
      activeIntegrations: raw.kpis.active_integrations, activeIntegrationsChange: raw.kpis.active_integrations_change, activeIntegrationsSparkline: raw.kpis.active_integrations_sparkline ?? [],
      apiKeysCount: raw.kpis.api_keys_count, apiKeysChange: raw.kpis.api_keys_change, apiKeysSparkline: raw.kpis.api_keys_sparkline ?? [],
      avgResponseTimeMs: raw.kpis.avg_response_time_ms, avgResponseTimeChange: raw.kpis.avg_response_time_change, avgResponseTimeSparkline: raw.kpis.avg_response_time_sparkline ?? [],
    },
    apiKeys: raw.api_keys.map((k) => ({
      id: k.id, name: k.name, keyType: k.key_type, typeLabel: k.type_label, scope: k.scope,
      createdBy: k.created_by ?? undefined, lastUsedAt: k.last_used_at ?? undefined, status: k.status, statusLabel: k.status_label,
    })),
    webhooks: raw.webhooks.map((w) => ({
      id: w.id, name: w.name, url: w.url, event: w.event, eventLabel: w.event_label,
      lastCallAt: w.last_call_at ?? undefined, successCount: w.success_count, failureCount: w.failure_count,
      status: w.status, statusLabel: w.status_label, signed: w.signed,
    })),
    webhookDeliveries: raw.webhook_deliveries.map((d) => ({
      id: d.id, webhookId: d.webhook_id, webhookName: d.webhook_name ?? undefined,
      payload: d.payload ?? undefined, headers: d.headers ?? undefined, signature: d.signature ?? undefined,
      responseBody: d.response_body ?? undefined, status: d.status, durationMs: d.duration_ms,
      attempts: d.attempts, createdAt: d.created_at ?? undefined,
    })),
    tracking: raw.tracking.map((t) => ({
      provider: t.provider, providerLabel: t.provider_label, configValue: t.config_value ?? undefined,
      enabled: t.enabled, healthStatus: t.health_status, healthLabel: t.health_label,
    })),
    serverSideTracking: {
      eventsRelayed24h: raw.server_side_tracking.events_relayed_24h,
      successRate: raw.server_side_tracking.success_rate,
      failedEvents: raw.server_side_tracking.failed_events,
      queueSize: raw.server_side_tracking.queue_size,
    },
    integrations: raw.integrations.map((i) => ({
      id: i.id, name: i.name, category: i.category, categoryLabel: i.category_label,
      status: i.status, statusLabel: i.status_label, lastSyncAt: i.last_sync_at ?? undefined,
      responseTimeMs: i.response_time_ms, uptimePct: i.uptime_pct,
    })),
    logs: raw.logs.map((l) => ({
      id: l.id, occurredAt: l.occurred_at ?? undefined, source: l.source, endpoint: l.endpoint,
      logType: l.log_type, userName: l.user_name ?? undefined, integrationName: l.integration_name ?? undefined,
      status: l.status, statusLabel: l.status_label, responseTimeMs: l.response_time_ms,
    })),
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    eventDistribution: raw.event_distribution.map((e) => ({ label: e.label, count: e.count, percent: e.percent, color: e.color })),
    topEndpoints: raw.top_endpoints.map((e) => ({ method: e.method, path: e.path, calls: e.calls })),
    security: {
      apiKeysTotal: raw.security.api_keys_total, apiKeysExpired: raw.security.api_keys_expired, apiKeysRevoked: raw.security.api_keys_revoked,
      webhooksSigned: raw.security.webhooks_signed, webhooksUnsigned: raw.security.webhooks_unsigned,
      auditAccessCount: raw.security.audit_access_count, auditModifications: raw.security.audit_modifications, auditDeletions: raw.security.audit_deletions,
    },
    alerts: raw.alerts.map((a) => ({ id: a.id, alertType: a.alert_type, title: a.title, severity: a.severity, count: a.count })),
    openapi: { version: raw.openapi.version, title: raw.openapi.title, endpointsCount: raw.openapi.endpoints_count, webhookEvents: raw.openapi.webhook_events },
    source: raw.source,
  };
}

export async function fetchIntegrationsBundle(): Promise<IntegrationsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour Integrations.');
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getIntegrationsDashboard().then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export function trackIntegrationsEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'integrations', ...detail } }));
}
