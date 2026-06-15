import { features } from '../../config/features';
import { realApi, type BackendNotificationsDashboardResponse } from '../../services/real-api';
import type {
  NotificationsDashboardSummary, NotificationSendPayload, NotificationTemplatePayload,
} from './notifications-types';

export const NOTIFICATIONS_WRITE_ENABLED = import.meta.env.VITE_NOTIFICATIONS_WRITE_ENABLED !== 'false';

let cached: NotificationsDashboardSummary | null = null;
let promise: Promise<NotificationsDashboardSummary> | null = null;
let cachedDays = 30;

export function invalidateNotificationsCache(): void { cached = null; promise = null; }

function mapItem(p: BackendNotificationsDashboardResponse['notifications'][0]) {
  return {
    id: p.id, title: p.title, messagePreview: p.message_preview,
    channel: p.channel as NotificationsDashboardSummary['notifications'][0]['channel'],
    channelLabel: p.channel_label, eventType: p.event_type, eventLabel: p.event_label,
    audience: p.audience, status: p.status as NotificationsDashboardSummary['notifications'][0]['status'],
    statusLabel: p.status_label, sentAt: p.sent_at, deliveryRate: p.delivery_rate,
    openRate: p.open_rate, clickRate: p.click_rate, zone: p.zone,
  };
}

function map(raw: BackendNotificationsDashboardResponse): NotificationsDashboardSummary {
  return {
    kpis: {
      totalSent: raw.kpis.total_sent, totalSentChange: raw.kpis.total_sent_change, totalSentSparkline: raw.kpis.total_sent_sparkline ?? [],
      deliveryRate: raw.kpis.delivery_rate, deliveryRateChange: raw.kpis.delivery_rate_change, deliveryRateSparkline: raw.kpis.delivery_rate_sparkline ?? [],
      emailOpenRate: raw.kpis.email_open_rate, emailOpenRateChange: raw.kpis.email_open_rate_change, emailOpenRateSparkline: raw.kpis.email_open_rate_sparkline ?? [],
      clickRate: raw.kpis.click_rate, clickRateChange: raw.kpis.click_rate_change, clickRateSparkline: raw.kpis.click_rate_sparkline ?? [],
      unsubscribes: raw.kpis.unsubscribes, unsubscribesChange: raw.kpis.unsubscribes_change, unsubscribesSparkline: raw.kpis.unsubscribes_sparkline ?? [],
      errors: raw.kpis.errors, errorsChange: raw.kpis.errors_change, errorsSparkline: raw.kpis.errors_sparkline ?? [],
    },
    notifications: raw.notifications.map(mapItem),
    channelDistribution: raw.channel_distribution.map((c) => ({ channel: c.channel, label: c.label, count: c.count, percent: c.percent, color: c.color, trend: c.trend })),
    deliveryStatus: raw.delivery_status.map((d) => ({ label: d.label, count: d.count, percent: d.percent, color: d.color })),
    topEvents: raw.top_events.map((e) => ({ eventType: e.event_type, label: e.label, sends: e.sends })),
    channelPerformance: raw.channel_performance.map((c) => ({ channel: c.channel, label: c.label, deliveryRate: c.delivery_rate, openRate: c.open_rate, clickRate: c.click_rate, failures: c.failures })),
    popularTemplates: raw.popular_templates.map((t) => ({ id: t.id, name: t.name, channel: t.channel, usageCount: t.usage_count, deliveryRate: t.delivery_rate, openRate: t.open_rate })),
    automations: raw.automations.map((a) => ({ id: a.id, name: a.name, triggerKey: a.trigger_key, triggerLabel: a.trigger_label, channel: a.channel, status: a.status, lastRunAt: a.last_run_at })),
    activities: raw.activities.map((a) => ({ id: a.id, activityType: a.activity_type, message: a.message, actorName: a.actor_name, createdAt: a.created_at })),
    providerHealth: raw.provider_health.map((h) => ({ channel: h.channel, label: h.label, provider: h.provider, deliveryRate: h.delivery_rate, latencyMs: h.latency_ms, errorCount: h.error_count, status: h.status, lastIncidentAt: h.last_incident_at })),
    errors: raw.errors.map((e) => ({ id: e.id, channel: e.channel, provider: e.provider, errorCode: e.error_code, message: e.message, occurrences: e.occurrences, lastOccurrenceAt: e.last_occurrence_at })),
    unsubscribes: raw.unsubscribes.map((u) => ({ id: u.id, channel: u.channel, userEmail: u.user_email, userPhone: u.user_phone, reason: u.reason, unsubscribedAt: u.unsubscribed_at })),
    segments: raw.segments.map((s) => ({ id: s.id, name: s.name, slug: s.slug, size: s.size, preferredChannel: s.preferred_channel, engagementRate: s.engagement_rate })),
    templates: raw.templates.map((t) => ({ id: t.id, name: t.name, channel: t.channel, eventType: t.event_type, language: t.language, status: t.status, usageCount: t.usage_count, deliveryRate: t.delivery_rate, openRate: t.open_rate, updatedAt: t.updated_at })),
    source: raw.source,
  };
}

export async function fetchNotificationsBundle(days = 30): Promise<NotificationsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour les notifications.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getNotificationsDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function sendNotification(data: NotificationSendPayload) {
  if (!NOTIFICATIONS_WRITE_ENABLED) throw new Error('Envoi désactivé.');
  const r = await realApi.sendNotification({ channel: data.channel, audience: data.audience, title: data.title, message: data.message, event_type: data.eventType });
  invalidateNotificationsCache();
  return r;
}

export async function retryNotification(id: string) {
  if (!NOTIFICATIONS_WRITE_ENABLED) throw new Error('Retry désactivé.');
  const r = await realApi.retryNotification(id);
  invalidateNotificationsCache();
  return r;
}

export async function createNotificationTemplate(data: NotificationTemplatePayload) {
  if (!NOTIFICATIONS_WRITE_ENABLED) throw new Error('Création template désactivée.');
  const r = await realApi.createNotificationTemplate({ name: data.name, channel: data.channel, event_type: data.eventType, language: data.language, subject: data.subject, body: data.body });
  invalidateNotificationsCache();
  return r;
}

export async function exportNotifications(format = 'csv') {
  return realApi.exportNotifications({ format });
}

export function trackNotificationEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'notifications', ...detail } }));
}
