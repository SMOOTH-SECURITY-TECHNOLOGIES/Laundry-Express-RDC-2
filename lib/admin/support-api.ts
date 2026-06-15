import { features } from '../../config/features';
import { realApi, type BackendSupportDashboardResponse } from '../../services/real-api';
import type { SupportDashboardSummary, TicketDetail } from './support-types';

export const SUPPORT_WRITE_ENABLED = import.meta.env.VITE_SUPPORT_WRITE_ENABLED !== 'false';

let cached: SupportDashboardSummary | null = null;
let promise: Promise<SupportDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateSupportCache(): void {
  cached = null;
  promise = null;
}

function map(raw: BackendSupportDashboardResponse): SupportDashboardSummary {
  return {
    kpis: {
      openTickets: raw.kpis.open_tickets, openTicketsChange: raw.kpis.open_tickets_change, openTicketsSparkline: raw.kpis.open_tickets_sparkline ?? [],
      newTickets: raw.kpis.new_tickets, newTicketsChange: raw.kpis.new_tickets_change, newTicketsSparkline: raw.kpis.new_tickets_sparkline ?? [],
      waitingClient: raw.kpis.waiting_client, waitingClientChange: raw.kpis.waiting_client_change, waitingClientSparkline: raw.kpis.waiting_client_sparkline ?? [],
      waitingSupport: raw.kpis.waiting_support, waitingSupportChange: raw.kpis.waiting_support_change, waitingSupportSparkline: raw.kpis.waiting_support_sparkline ?? [],
      slaCompliance: raw.kpis.sla_compliance, slaComplianceChange: raw.kpis.sla_compliance_change, slaComplianceSparkline: raw.kpis.sla_compliance_sparkline ?? [],
      criticalTickets: raw.kpis.critical_tickets, criticalTicketsChange: raw.kpis.critical_tickets_change, criticalTicketsSparkline: raw.kpis.critical_tickets_sparkline ?? [],
      satisfaction: raw.kpis.satisfaction, satisfactionChange: raw.kpis.satisfaction_change, satisfactionSparkline: raw.kpis.satisfaction_sparkline ?? [],
      avgResponseMinutes: raw.kpis.avg_response_minutes, avgResponseChange: raw.kpis.avg_response_change, avgResponseSparkline: raw.kpis.avg_response_sparkline ?? [],
    },
    tickets: raw.tickets.map((t) => ({
      id: t.id, ticketCode: t.ticket_code, title: t.title, aiSummary: t.ai_summary,
      clientName: t.client_name, clientId: t.client_id, category: t.category, categoryLabel: t.category_label,
      priority: t.priority, priorityLabel: t.priority_label, status: t.status, statusLabel: t.status_label,
      slaLabel: t.sla_label, slaStatus: t.sla_status, slaMinutesRemaining: t.sla_minutes_remaining,
      updatedAt: t.updated_at, agentName: t.agent_name, channel: t.channel,
      orderId: t.order_id, sentiment: t.sentiment,
    })),
    sla: {
      withinSla: raw.sla.within_sla, atRisk: raw.sla.at_risk, breached: raw.sla.breached,
      avgResolutionMinutes: raw.sla.avg_resolution_minutes, compliancePercent: raw.sla.compliance_percent,
    },
    queue: raw.queue.map((q) => ({ status: q.status, statusLabel: q.status_label, tickets: q.tickets.map((t) => ({
      id: t.id, ticketCode: t.ticket_code, title: t.title, aiSummary: t.ai_summary,
      clientName: t.client_name, clientId: t.client_id, category: t.category, categoryLabel: t.category_label,
      priority: t.priority, priorityLabel: t.priority_label, status: t.status, statusLabel: t.status_label,
      slaLabel: t.sla_label, slaStatus: t.sla_status, slaMinutesRemaining: t.sla_minutes_remaining,
      updatedAt: t.updated_at, agentName: t.agent_name, channel: t.channel,
    })) })),
    aiTriage: raw.ai_triage.map((a) => ({
      ticketId: a.ticket_id, ticketCode: a.ticket_code, clientName: a.client_name, subject: a.subject,
      sentiment: a.sentiment, predictedCategory: a.predicted_category, priority: a.priority,
      refundRisk: a.refund_risk, churnRisk: a.churn_risk, suggestedReply: a.suggested_reply,
    })),
    sentiment: raw.sentiment.map((s) => ({ sentiment: s.sentiment, count: s.count, percent: s.percent, color: s.color })),
    topIssues: raw.top_issues.map((i) => ({ issue: i.issue, tickets: i.tickets, variation: i.variation, impact: i.impact })),
    agents: raw.agents.map((a) => ({
      agentId: a.agent_id, agentName: a.agent_name, ticketsHandled: a.tickets_handled,
      avgResponseMinutes: a.avg_response_minutes, slaPercent: a.sla_percent, satisfaction: a.satisfaction,
    })),
    escalations: raw.escalations.map((e) => ({ id: e.id, label: e.label, count: e.count, severity: e.severity })),
    trends: raw.trends.map((t) => ({ date: t.date, newTickets: t.new_tickets, resolvedTickets: t.resolved_tickets, openTickets: t.open_tickets })),
    channels: raw.channels.map((c) => ({ channel: c.channel, count: c.count, percent: c.percent, color: c.color })),
    source: raw.source,
  };
}

export async function fetchSupportBundle(days = 7): Promise<SupportDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le centre support.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getSupportDashboard(days).then((raw) => {
    cached = map(raw);
    promise = null;
    return cached;
  });
  return promise;
}

export async function fetchTicketDetail(id: string): Promise<TicketDetail> {
  const raw = await realApi.getSupportTicketDetail(id);
  return {
    id: raw.id, ticketCode: raw.ticket_code, title: raw.title, aiSummary: raw.ai_summary,
    clientName: raw.client_name, clientId: raw.client_id, category: raw.category, categoryLabel: raw.category_label,
    priority: raw.priority, priorityLabel: raw.priority_label, status: raw.status, statusLabel: raw.status_label,
    slaLabel: raw.sla_label, slaStatus: raw.sla_status, slaMinutesRemaining: raw.sla_minutes_remaining,
    updatedAt: raw.updated_at, agentName: raw.agent_name, channel: raw.channel,
    description: raw.description, messages: (raw.messages ?? []).map((m) => ({
      id: m.id, content: m.content, isInternal: m.is_internal, createdAt: m.created_at,
    })),
    internalNotes: raw.internal_notes ?? [], aiRecommendations: raw.ai_recommendations ?? [],
    refundRisk: raw.refund_risk, churnRisk: raw.churn_risk,
    orderId: raw.order_id, paymentId: raw.payment_id, partnerName: raw.partner_name, driverName: raw.driver_name,
  };
}

export async function exportSupport(data: { format: string; scope: string }) {
  if (!SUPPORT_WRITE_ENABLED) throw new Error('Export désactivé (mode lecture seule).');
  return realApi.exportSupport(data);
}

export function trackSupportEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'support', ...detail } }));
}
