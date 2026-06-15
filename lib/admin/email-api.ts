import { features } from '../../config/features';
import { realApi, type BackendEmailDashboardResponse } from '../../services/real-api';
import type { EmailDashboardSummary } from './email-types';

export const EMAIL_WRITE_ENABLED = import.meta.env.VITE_EMAIL_WRITE_ENABLED !== 'false';

let cached: EmailDashboardSummary | null = null;
let promise: Promise<EmailDashboardSummary> | null = null;

export function invalidateEmailCache(): void { cached = null; promise = null; }

function map(raw: BackendEmailDashboardResponse): EmailDashboardSummary {
  return {
    kpis: {
      sentToday: raw.kpis.sent_today, sentTodayChange: raw.kpis.sent_today_change, sentTodaySparkline: raw.kpis.sent_today_sparkline ?? [],
      deliveryRate: raw.kpis.delivery_rate, deliveryRateChange: raw.kpis.delivery_rate_change, deliveryRateSparkline: raw.kpis.delivery_rate_sparkline ?? [],
      openRate: raw.kpis.open_rate, openRateChange: raw.kpis.open_rate_change, openRateSparkline: raw.kpis.open_rate_sparkline ?? [],
      clickRate: raw.kpis.click_rate, clickRateChange: raw.kpis.click_rate_change, clickRateSparkline: raw.kpis.click_rate_sparkline ?? [],
      bounces: raw.kpis.bounces, bouncesChange: raw.kpis.bounces_change, bouncesSparkline: raw.kpis.bounces_sparkline ?? [],
      unsubscribes: raw.kpis.unsubscribes, unsubscribesChange: raw.kpis.unsubscribes_change, unsubscribesSparkline: raw.kpis.unsubscribes_sparkline ?? [],
      activeTemplates: raw.kpis.active_templates, activeTemplatesChange: raw.kpis.active_templates_change, activeTemplatesSparkline: raw.kpis.active_templates_sparkline ?? [],
      attributedRevenue: raw.kpis.attributed_revenue, attributedRevenueChange: raw.kpis.attributed_revenue_change, attributedRevenueSparkline: raw.kpis.attributed_revenue_sparkline ?? [],
    },
    messages: raw.messages.map((m) => ({
      id: m.id, reference: m.reference, recipientEmail: m.recipient_email, recipientName: m.recipient_name,
      subject: m.subject, messageType: m.message_type, messageTypeLabel: m.message_type_label,
      templateName: m.template_name, status: m.status, statusLabel: m.status_label,
      openRate: m.open_rate ?? undefined, clickRate: m.click_rate ?? undefined, sentAt: m.sent_at ?? undefined,
    })),
    templates: raw.templates.map((t) => ({
      id: t.id, name: t.name, templateType: t.template_type, typeLabel: t.type_label, language: t.language,
      subject: t.subject, status: t.status, usageCount: t.usage_count, openRate: t.open_rate, clickRate: t.click_rate, version: t.version,
    })),
    campaigns: raw.campaigns.map((c) => ({
      id: c.id, name: c.name, audience: c.audience ?? undefined, status: c.status, statusLabel: c.status_label,
      sentCount: c.sent_count, openedCount: c.opened_count, clickedCount: c.clicked_count,
      conversions: c.conversions, revenue: c.revenue, roi: c.roi,
    })),
    automations: raw.automations.map((a) => ({
      id: a.id, name: a.name, triggerKey: a.trigger_key, triggerLabel: a.trigger_label,
      templateName: a.template_name ?? undefined, status: a.status, lastRunAt: a.last_run_at ?? undefined,
      volume30d: a.volume_30d, openRate: a.open_rate, clickRate: a.click_rate,
    })),
    typeDistribution: raw.type_distribution.map((t) => ({ label: t.label, count: t.count, percent: t.percent, color: t.color })),
    domainPerformance: raw.domain_performance.map((d) => ({ domain: d.domain, deliveryRate: d.delivery_rate, openRate: d.open_rate, clickRate: d.click_rate, bounceRate: d.bounce_rate })),
    deliverability: raw.deliverability.map((d) => ({
      domain: d.domain, healthStatus: d.health_status, healthLabel: d.health_label,
      spf: d.spf, dkim: d.dkim, dmarc: d.dmarc, bounceRate: d.bounce_rate, spamComplaints: d.spam_complaints, reputationScore: d.reputation_score,
    })),
    bounces: raw.bounces.map((b) => ({ id: b.id, email: b.email, bounceType: b.bounce_type, bounceTypeLabel: b.bounce_type_label, reason: b.reason ?? undefined, providerCode: b.provider_code ?? undefined, occurredAt: b.occurred_at ?? undefined })),
    unsubscribeSummary: { total: raw.unsubscribe_summary.total, campaign: raw.unsubscribe_summary.campaign, marketing: raw.unsubscribe_summary.marketing, preferencesCount: raw.unsubscribe_summary.preferences_count },
    unsubscribes: raw.unsubscribes.map((u) => ({ id: u.id, email: u.email, unsubscribeType: u.unsubscribe_type, typeLabel: u.type_label, reason: u.reason ?? undefined })),
    invoiceSummary: { sent: raw.invoice_summary.sent, opened: raw.invoice_summary.opened, downloaded: raw.invoice_summary.downloaded, reminders: raw.invoice_summary.reminders, failures: raw.invoice_summary.failures },
    invoices: raw.invoices.map((i) => ({ id: i.id, invoiceRef: i.invoice_ref, recipientEmail: i.recipient_email, status: i.status, opened: i.opened, downloaded: i.downloaded, reminderCount: i.reminder_count })),
    webhooks: raw.webhooks.map((w) => ({ id: w.id, endpoint: w.endpoint, secretMasked: w.secret_masked ?? undefined, lastCallAt: w.last_call_at ?? undefined, successCount: w.success_count, errorCount: w.error_count, events: w.events })),
    alerts: raw.alerts.map((a) => ({ id: a.id, alertType: a.alert_type, title: a.title, severity: a.severity, count: a.count })),
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    segments: raw.segments.map((s) => ({ slug: s.slug, name: s.name, size: s.size })),
    settings: { provider: raw.settings.provider, fromEmail: raw.settings.from_email, replyTo: raw.settings.reply_to, marketingOptOutRequired: raw.settings.marketing_opt_out_required },
    source: raw.source,
  };
}

export async function fetchEmailBundle(): Promise<EmailDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour Email.');
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getEmailDashboard().then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function exportEmail(format = 'csv') { return realApi.exportEmail({ format }); }
export function trackEmailEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'email', ...detail } }));
}
