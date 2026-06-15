import { features } from '../../config/features';
import { realApi, type BackendPaymentGatewaysDashboardResponse } from '../../services/real-api';
import type { PaymentGatewaysDashboardSummary } from './payment-gateways-types';

export const PAYMENT_GATEWAYS_WRITE_ENABLED = import.meta.env.VITE_PAYMENT_GATEWAYS_WRITE_ENABLED !== 'false';

let cached: PaymentGatewaysDashboardSummary | null = null;
let promise: Promise<PaymentGatewaysDashboardSummary> | null = null;

export function invalidatePaymentGatewaysCache(): void { cached = null; promise = null; }

function map(raw: BackendPaymentGatewaysDashboardResponse): PaymentGatewaysDashboardSummary {
  return {
    kpis: {
      revenueTrend: raw.kpis.revenue_trend, revenueTrendSparkline: raw.kpis.revenue_trend_sparkline ?? [],
      revenueToday: raw.kpis.revenue_today, revenueTodayChange: raw.kpis.revenue_today_change, revenueTodayTx: raw.kpis.revenue_today_tx,
      revenueWeek: raw.kpis.revenue_week, revenueWeekChange: raw.kpis.revenue_week_change, revenueWeekTx: raw.kpis.revenue_week_tx,
      revenueMonth: raw.kpis.revenue_month, revenueMonthChange: raw.kpis.revenue_month_change, revenueMonthTx: raw.kpis.revenue_month_tx,
      commissionsDue: raw.kpis.commissions_due, commissionsDueOps: raw.kpis.commissions_due_ops,
      commissionsPaid: raw.kpis.commissions_paid, commissionsPaidOps: raw.kpis.commissions_paid_ops,
      cashInTransit: raw.kpis.cash_in_transit, cashInTransitOps: raw.kpis.cash_in_transit_ops,
    },
    gateways: raw.gateways.map((g) => ({
      id: g.id, slug: g.slug, name: g.name, channel: g.channel, logoKey: g.logo_key,
      status: g.status, statusLabel: g.status_label, volume: g.volume, revenue: g.revenue,
      commission: g.commission, successRate: g.success_rate, lastIncidentAt: g.last_incident_at,
    })),
    revenueDistribution: raw.revenue_distribution.map((r) => ({ label: r.label, amount: r.amount, percent: r.percent, color: r.color, trend: r.trend })),
    channelPerformance: raw.channel_performance.map((c) => ({ channel: c.channel, deliveryRate: c.delivery_rate, successRate: c.success_rate, failureRate: c.failure_rate, avgTimeMs: c.avg_time_ms, latencyMs: c.latency_ms })),
    transactions: raw.transactions.map((t) => ({
      id: t.id, reference: t.reference, clientName: t.client_name, gatewaySlug: t.gateway_slug, gatewayName: t.gateway_name,
      amount: t.amount, currency: t.currency, status: t.status, statusLabel: t.status_label, createdAt: t.created_at,
    })),
    cashFlow: {
      cashReceived: raw.cash_flow.cash_received, cashWithdrawn: raw.cash_flow.cash_withdrawn,
      cashInTransit: raw.cash_flow.cash_in_transit, cashNet: raw.cash_flow.cash_net,
      sparkline7d: raw.cash_flow.sparkline_7d ?? [], sparkline30d: raw.cash_flow.sparkline_30d ?? [], sparkline90d: raw.cash_flow.sparkline_90d ?? [],
    },
    commissions: {
      generated: raw.commissions.generated, paid: raw.commissions.paid, pending: raw.commissions.pending, cancelled: raw.commissions.cancelled,
      distribution: raw.commissions.distribution.map((d) => ({ label: d.label, amount: d.amount, percent: d.percent, color: d.color })),
    },
    incidents: raw.incidents.map((i) => ({ id: i.id, incidentType: i.incident_type, title: i.title, severity: i.severity, gatewaySlug: i.gateway_slug, impact: i.impact, occurredAt: i.occurred_at })),
    successRateTrend: raw.success_rate_trend.map((s) => ({ label: s.label, rate: s.rate })),
    topPartners: raw.top_partners.map((p) => ({ name: p.name, revenue: p.revenue, transactions: p.transactions, avgBasket: p.avg_basket })),
    settlements: raw.settlements.map((s) => ({ id: s.id, gatewaySlug: s.gateway_slug, gatewayName: s.gateway_name, scheduledAt: s.scheduled_at, amount: s.amount, status: s.status, statusLabel: s.status_label })),
    webhooks: raw.webhooks.map((w) => ({ id: w.id, gatewaySlug: w.gateway_slug, endpoint: w.endpoint, lastCallAt: w.last_call_at, successCount: w.success_count, errorCount: w.error_count, retryCount: w.retry_count, events: w.events })),
    reconciliations: raw.reconciliations.map((r) => ({ id: r.id, reference: r.reference, providerAmount: r.provider_amount, internalAmount: r.internal_amount, status: r.status, statusLabel: r.status_label, gatewaySlug: r.gateway_slug })),
    providerHealth: raw.provider_health.map((h) => ({ gatewaySlug: h.gateway_slug, name: h.name, uptime: h.uptime, latencyMs: h.latency_ms, errorRate: h.error_rate, successRate: h.success_rate, status: h.status })),
    refunds: raw.refunds.map((r) => ({ id: r.id, clientName: r.client_name, amount: r.amount, reason: r.reason, status: r.status, gatewaySlug: r.gateway_slug })),
    fraud: { score: raw.fraud.score, repeatedPayments: raw.fraud.repeated_payments, suspiciousAmounts: raw.fraud.suspicious_amounts, abusiveRefunds: raw.fraud.abusive_refunds, multipleAttempts: raw.fraud.multiple_attempts },
    source: raw.source,
  };
}

export async function fetchPaymentGatewaysBundle(days = 30): Promise<PaymentGatewaysDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour les passerelles paiement.');
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getPaymentGatewaysDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function exportPaymentGateways(format = 'csv') {
  return realApi.exportPaymentGateways({ format });
}

export async function runReconciliation() {
  if (!PAYMENT_GATEWAYS_WRITE_ENABLED) throw new Error('Réconciliation désactivée.');
  return realApi.runPaymentReconciliation();
}

export async function testWebhook(gatewaySlug: string) {
  if (!PAYMENT_GATEWAYS_WRITE_ENABLED) throw new Error('Test webhook désactivé.');
  return realApi.testPaymentWebhook(gatewaySlug);
}

export function trackPaymentGatewayEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'payment-gateways', ...detail } }));
}
