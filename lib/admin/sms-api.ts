import { features } from '../../config/features';
import { realApi, type BackendSmsDashboardResponse } from '../../services/real-api';
import type { SmsDashboardSummary } from './sms-types';

export const SMS_WRITE_ENABLED = import.meta.env.VITE_SMS_WRITE_ENABLED !== 'false';

let cached: SmsDashboardSummary | null = null;
let promise: Promise<SmsDashboardSummary> | null = null;

export function invalidateSmsCache(): void { cached = null; promise = null; }

function map(raw: BackendSmsDashboardResponse): SmsDashboardSummary {
  return {
    kpis: {
      sentToday: raw.kpis.sent_today, sentTodayChange: raw.kpis.sent_today_change, sentTodaySparkline: raw.kpis.sent_today_sparkline ?? [],
      deliveryRate: raw.kpis.delivery_rate, deliveryRateChange: raw.kpis.delivery_rate_change, deliveryRateSparkline: raw.kpis.delivery_rate_sparkline ?? [],
      failureRate: raw.kpis.failure_rate, failureRateChange: raw.kpis.failure_rate_change, failureRateSparkline: raw.kpis.failure_rate_sparkline ?? [],
      costToday: raw.kpis.cost_today, costTodayChange: raw.kpis.cost_today_change, costTodaySparkline: raw.kpis.cost_today_sparkline ?? [],
      creditsAvailable: raw.kpis.credits_available, creditsChange: raw.kpis.credits_change, creditsSparkline: raw.kpis.credits_sparkline ?? [],
      activeCampaigns: raw.kpis.active_campaigns, activeCampaignsChange: raw.kpis.active_campaigns_change,
      otpSuccessRate: raw.kpis.otp_success_rate, otpSuccessChange: raw.kpis.otp_success_change, otpSuccessSparkline: raw.kpis.otp_success_sparkline ?? [],
      monthlyVolume: raw.kpis.monthly_volume, monthlyVolumeChange: raw.kpis.monthly_volume_change, monthlyVolumeSparkline: raw.kpis.monthly_volume_sparkline ?? [],
    },
    operatorDistribution: raw.operator_distribution.map((o) => ({ slug: o.slug, name: o.name, volume: o.volume, percent: o.percent, cost: o.cost, deliveryRate: o.delivery_rate, color: o.color })),
    messages: raw.messages.map((m) => ({
      id: m.id, reference: m.reference, recipientName: m.recipient_name, phoneNumber: m.phone_number, senderName: m.sender_name,
      messageType: m.message_type, messageTypeLabel: m.message_type_label, status: m.status, statusLabel: m.status_label,
      operatorSlug: m.operator_slug, operatorName: m.operator_name, cost: m.cost, sentAt: m.sent_at,
    })),
    operatorPerformance: raw.operator_performance.map((o) => ({ slug: o.slug, name: o.name, deliveryRate: o.delivery_rate, failureRate: o.failure_rate, avgDeliveryMs: o.avg_delivery_ms, cost: o.cost, volume: o.volume })),
    deliveryStatus: raw.delivery_status.map((d) => ({ label: d.label, count: d.count, percent: d.percent, color: d.color })),
    campaigns: raw.campaigns.map((c) => ({
      id: c.id, name: c.name, campaignType: c.campaign_type, typeLabel: c.type_label, status: c.status, statusLabel: c.status_label,
      audience: c.audience, sentCount: c.sent_count, deliveredCount: c.delivered_count, replyCount: c.reply_count, scheduledAt: c.scheduled_at,
    })),
    templates: raw.templates.map((t) => ({ id: t.id, name: t.name, category: t.category, categoryLabel: t.category_label, content: t.content, active: t.active, usageCount: t.usage_count, deliveryRate: t.delivery_rate })),
    senders: raw.senders.map((s) => ({ id: s.id, name: s.name, senderId: s.sender_id, approved: s.approved, active: s.active, approvalStatus: s.approval_status, approvalLabel: s.approval_label, volume: s.volume, deliveryRate: s.delivery_rate })),
    credits: { currentCredits: raw.credits.current_credits, monthlyConsumption: raw.credits.monthly_consumption, avgCostPerSms: raw.credits.avg_cost_per_sms, autoRecharge: raw.credits.auto_recharge, alertThreshold: raw.credits.alert_threshold },
    creditLedger: raw.credit_ledger.map((l) => ({ id: l.id, movementType: l.movement_type, movementLabel: l.movement_label, amount: l.amount, balanceAfter: l.balance_after, note: l.note, createdAt: l.created_at })),
    otpKpis: { sent: raw.otp_kpis.sent, validated: raw.otp_kpis.validated, successRate: raw.otp_kpis.success_rate, avgValidationSec: raw.otp_kpis.avg_validation_sec },
    otpRecords: raw.otp_records.map((o) => ({ id: o.id, phoneNumber: o.phone_number, codeMasked: o.code_masked, status: o.status, statusLabel: o.status_label, createdAt: o.created_at, expiresAt: o.expires_at })),
    alerts: raw.alerts.map((a) => ({ id: a.id, alertType: a.alert_type, title: a.title, severity: a.severity, count: a.count })),
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    activities: raw.activities.map((a) => ({ id: a.id, message: a.message, activityType: a.activity_type, createdAt: a.created_at })),
    webhooks: raw.webhooks.map((w) => ({ id: w.id, endpoint: w.endpoint, secretMasked: w.secret_masked, lastCallAt: w.last_call_at, successCount: w.success_count, errorCount: w.error_count, consecutiveErrors: w.consecutive_errors })),
    settings: { autoRecharge: raw.settings.auto_recharge, alertThreshold: raw.settings.alert_threshold, defaultSender: raw.settings.default_sender, providers: raw.settings.providers },
    logs: raw.logs.map((l) => ({ id: l.id, reference: l.reference, phoneNumber: l.phone_number, eventType: l.event_type, status: l.status, providerId: l.provider_id, createdAt: l.created_at })),
    source: raw.source,
  };
}

export async function fetchSmsBundle(): Promise<SmsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour SMS.');
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getSmsDashboard().then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function exportSms(format = 'csv') { return realApi.exportSms({ format }); }
export async function sendSms(phone: string, message: string) {
  if (!SMS_WRITE_ENABLED) throw new Error('Envoi SMS désactivé.');
  return realApi.sendSms({ phone_number: phone, message });
}
export function trackSmsEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'sms', ...detail } }));
}
