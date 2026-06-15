import { features } from '../../config/features';
import { realApi, type BackendWhatsappDashboardResponse } from '../../services/real-api';
import type { WhatsappDashboardSummary } from './whatsapp-types';

export const WHATSAPP_WRITE_ENABLED = import.meta.env.VITE_WHATSAPP_WRITE_ENABLED !== 'false';

let cached: WhatsappDashboardSummary | null = null;
let promise: Promise<WhatsappDashboardSummary> | null = null;

export function invalidateWhatsappCache(): void { cached = null; promise = null; }

function map(raw: BackendWhatsappDashboardResponse): WhatsappDashboardSummary {
  return {
    kpis: {
      openConversations: raw.kpis.open_conversations, openConversationsChange: raw.kpis.open_conversations_change,
      openConversationsSparkline: raw.kpis.open_conversations_sparkline ?? [],
      messagesToday: raw.kpis.messages_today, messagesTodayChange: raw.kpis.messages_today_change,
      messagesTodaySparkline: raw.kpis.messages_today_sparkline ?? [],
      responseRate: raw.kpis.response_rate, responseRateChange: raw.kpis.response_rate_change,
      responseRateSparkline: raw.kpis.response_rate_sparkline ?? [],
      avgResponseTime: raw.kpis.avg_response_time, avgResponseTimeChange: raw.kpis.avg_response_time_change,
      avgResponseTimeSparkline: raw.kpis.avg_response_time_sparkline ?? [],
      activeTemplates: raw.kpis.active_templates, activeTemplatesChange: raw.kpis.active_templates_change,
      activeTemplatesSparkline: raw.kpis.active_templates_sparkline ?? [],
      costToday: raw.kpis.cost_today, costTodayChange: raw.kpis.cost_today_change,
      costTodaySparkline: raw.kpis.cost_today_sparkline ?? [],
      aiConversationsPct: raw.kpis.ai_conversations_pct, aiConversationsChange: raw.kpis.ai_conversations_change,
      aiConversationsSparkline: raw.kpis.ai_conversations_sparkline ?? [],
      satisfaction: raw.kpis.satisfaction, satisfactionChange: raw.kpis.satisfaction_change,
      satisfactionSparkline: raw.kpis.satisfaction_sparkline ?? [],
    },
    conversations: raw.conversations.map((c) => ({
      id: c.id, clientName: c.client_name, phone: c.phone, lastMessage: c.last_message,
      channel: c.channel, assignedTo: c.assigned_to, status: c.status as WhatsappDashboardSummary['conversations'][0]['status'],
      statusLabel: c.status_label, waitTimeSec: c.wait_time_sec, waitTimeLabel: c.wait_time_label, createdAt: c.created_at,
    })),
    liveMonitor: {
      activeConversations: raw.live_monitor.active_conversations, waitingConversations: raw.live_monitor.waiting_conversations,
      slaBreached: raw.live_monitor.sla_breached, escalations: raw.live_monitor.escalations,
      availableAgents: raw.live_monitor.available_agents, aiActivePct: raw.live_monitor.ai_active_pct,
      supportBacklog: raw.live_monitor.support_backlog,
    },
    templates: raw.templates.map((t) => ({
      id: t.id, name: t.name, category: t.category, categoryLabel: t.category_label,
      language: t.language, metaStatus: t.meta_status, metaStatusLabel: t.meta_status_label,
      usageCount: t.usage_count, deliveryRate: t.delivery_rate,
    })),
    notifications: raw.notifications.map((n) => ({
      id: n.id, eventType: n.event_type, eventLabel: n.event_label, templateName: n.template_name,
      recipient: n.recipient, status: n.status, statusLabel: n.status_label, createdAt: n.created_at,
    })),
    campaigns: raw.campaigns.map((c) => ({
      id: c.id, name: c.name, campaignType: c.campaign_type, typeLabel: c.type_label,
      templateName: c.template_name, audience: c.audience, status: c.status,
      sent: c.sent, delivered: c.delivered, opened: c.opened, replies: c.replies, clicks: c.clicks, conversions: c.conversions,
    })),
    automations: raw.automations.map((a) => ({
      id: a.id, name: a.name, triggerType: a.trigger_type, triggerLabel: a.trigger_label,
      status: a.status, runsCount: a.runs_count, successRate: a.success_rate,
    })),
    webhooks: raw.webhooks.map((w) => ({
      id: w.id, endpoint: w.endpoint, secretMasked: w.secret_masked, lastCallAt: w.last_call_at,
      successCount: w.success_count, errorCount: w.error_count, retryCount: w.retry_count, events: w.events,
    })),
    quality: {
      qualityRating: raw.quality.quality_rating, qualityLabel: raw.quality.quality_label,
      messagingLimit: raw.quality.messaging_limit, phoneStatus: raw.quality.phone_status,
      phoneStatusLabel: raw.quality.phone_status_label, verificationStatus: raw.quality.verification_status,
      verificationLabel: raw.quality.verification_label, alerts: raw.quality.alerts,
    },
    aiMetrics: {
      aiConversationsPct: raw.ai_metrics.ai_conversations_pct, humanEscalations: raw.ai_metrics.human_escalations,
      aiConfidence: raw.ai_metrics.ai_confidence, resolutionRate: raw.ai_metrics.resolution_rate,
      resolvedWithoutHuman: raw.ai_metrics.resolved_without_human, costSaved: raw.ai_metrics.cost_saved,
      satisfaction: raw.ai_metrics.satisfaction,
    },
    costs: {
      totalToday: raw.costs.total_today, totalWeek: raw.costs.total_week, totalMonth: raw.costs.total_month,
      marketingCost: raw.costs.marketing_cost, utilityCost: raw.costs.utility_cost, authCost: raw.costs.auth_cost,
      costPerConversation: raw.costs.cost_per_conversation, trend: raw.costs.trend, forecast: raw.costs.forecast,
      sparklineDay: raw.costs.sparkline_day ?? [], sparklineWeek: raw.costs.sparkline_week ?? [], sparklineMonth: raw.costs.sparkline_month ?? [],
    },
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    segments: raw.segments.map((s) => ({ id: s.id, slug: s.slug, name: s.name, size: s.size, engagement: s.engagement, conversion: s.conversion })),
    sla: {
      firstResponseAvg: raw.sla.first_response_avg, resolutionAvg: raw.sla.resolution_avg,
      openConversations: raw.sla.open_conversations, slaBreached: raw.sla.sla_breached,
      firstResponseStatus: raw.sla.first_response_status, resolutionStatus: raw.sla.resolution_status,
      openStatus: raw.sla.open_status, breachedStatus: raw.sla.breached_status,
    },
    source: raw.source,
  };
}

export async function fetchWhatsappBundle(): Promise<WhatsappDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour WhatsApp.');
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getWhatsappDashboard().then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function exportWhatsapp(format = 'csv') {
  return realApi.exportWhatsapp({ format });
}

export async function testWhatsappWebhook() {
  if (!WHATSAPP_WRITE_ENABLED) throw new Error('Test webhook désactivé.');
  return realApi.testWhatsappWebhook();
}

export async function sendWhatsappMessage(phone: string, message: string) {
  if (!WHATSAPP_WRITE_ENABLED) throw new Error('Envoi désactivé.');
  return realApi.sendWhatsappMessage({ phone, message });
}

export function trackWhatsappEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'whatsapp', ...detail } }));
}
