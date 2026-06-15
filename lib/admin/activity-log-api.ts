import { features } from '../../config/features';
import { realApi, type BackendActivityLogDashboardResponse } from '../../services/real-api';
import type { ActivityLogDashboardSummary } from './activity-log-types';

export const ACTIVITY_LOG_WRITE_ENABLED = import.meta.env.VITE_ACTIVITY_LOG_WRITE_ENABLED !== 'false';

let cached: ActivityLogDashboardSummary | null = null;
let promise: Promise<ActivityLogDashboardSummary> | null = null;

export function invalidateActivityLogCache(): void { cached = null; promise = null; }

function mapEvent(e: BackendActivityLogDashboardResponse['events'][0]) {
  return {
    id: e.id, eventId: e.event_id, occurredAt: e.occurred_at ?? undefined,
    actorId: e.actor_id ?? undefined, actorType: e.actor_type, actorTypeLabel: e.actor_type_label,
    actorName: e.actor_name, actorRole: e.actor_role ?? undefined,
    action: e.action, actionLabel: e.action_label ?? undefined, description: e.description ?? undefined,
    resourceType: e.resource_type, resourceId: e.resource_id ?? undefined, reference: e.reference ?? undefined,
    corridor: e.corridor, corridorLabel: e.corridor_label,
    severity: e.severity, severityLabel: e.severity_label,
    status: e.status, statusLabel: e.status_label, impact: e.impact ?? undefined,
    ipAddress: e.ip_address ?? undefined, userAgent: e.user_agent ?? undefined,
    device: e.device ?? undefined, browser: e.browser ?? undefined, osName: e.os_name ?? undefined,
    beforeState: e.before_state ?? undefined, afterState: e.after_state ?? undefined,
    corridorsImpacted: e.corridors_impacted ?? [], isAnomaly: e.is_anomaly,
  };
}

function map(raw: BackendActivityLogDashboardResponse): ActivityLogDashboardSummary {
  return {
    kpis: {
      totalActivities: raw.kpis.total_activities, totalChange: raw.kpis.total_change, totalSparkline: raw.kpis.total_sparkline ?? [],
      adminActivities: raw.kpis.admin_activities, adminChange: raw.kpis.admin_change,
      partnerActivities: raw.kpis.partner_activities, partnerChange: raw.kpis.partner_change,
      driverActivities: raw.kpis.driver_activities, driverChange: raw.kpis.driver_change,
      systemActivities: raw.kpis.system_activities, systemChange: raw.kpis.system_change,
      anomalies: raw.kpis.anomalies, anomaliesChange: raw.kpis.anomalies_change,
    },
    events: raw.events.map(mapEvent),
    liveEvents: raw.live_events.map(mapEvent),
    anomalies: raw.anomalies.map(mapEvent),
    heatmap: raw.heatmap.map((c) => ({ day: c.day, hour: c.hour, count: c.count })),
    topActivities: raw.top_activities.map((t) => ({ label: t.label, count: t.count, percent: t.percent, color: t.color })),
    corridorHealth: raw.corridor_health.map((c) => ({
      corridor: c.corridor, corridorLabel: c.corridor_label, events: c.events, anomalies: c.anomalies,
      coherence: c.coherence, coherenceLabel: c.coherence_label, latencyMs: c.latency_ms ?? undefined,
    })),
    actorDistribution: raw.actor_distribution.map((a) => ({
      actorType: a.actor_type, actorLabel: a.actor_label, count: a.count, percent: a.percent,
    })),
    severityDistribution: raw.severity_distribution.map((s) => ({
      severity: s.severity, severityLabel: s.severity_label, count: s.count,
    })),
    total: raw.total,
    sensitiveAccess: raw.sensitive_access,
    readOnly: raw.read_only,
    source: raw.source,
  };
}

export async function fetchActivityLogBundle(limit = 200): Promise<ActivityLogDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour Activity Log.');
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token?.startsWith('TOKEN-')) {
    throw Object.assign(new Error('Session mock incompatible.'), { status: 401 });
  }
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getActivityLogDashboard(limit)
    .then((raw) => { cached = map(raw); promise = null; return cached; })
    .catch((err) => {
      promise = null;
      if (err instanceof TypeError && String(err.message).includes('fetch')) {
        throw Object.assign(new Error('API inaccessible. Vérifiez que le backend est démarré et la migration appliquée.'), { status: 0 });
      }
      throw err;
    });
  return promise;
}

export function getActivityLogWsUrl(): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:18000/api/v1';
  const wsBase = base.replace(/^http/, 'ws');
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
  return `${wsBase}/admin/activity-log/live?token=${encodeURIComponent(token || '')}`;
}

export function trackActivityLogEvent(event: string): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event, source: 'activity_log_center' });
  }
}
