export interface SupportKpis {
  openTickets: number; openTicketsChange: number; openTicketsSparkline: number[];
  newTickets: number; newTicketsChange: number; newTicketsSparkline: number[];
  waitingClient: number; waitingClientChange: number; waitingClientSparkline: number[];
  waitingSupport: number; waitingSupportChange: number; waitingSupportSparkline: number[];
  slaCompliance: number; slaComplianceChange: number; slaComplianceSparkline: number[];
  criticalTickets: number; criticalTicketsChange: number; criticalTicketsSparkline: number[];
  satisfaction: number; satisfactionChange: number; satisfactionSparkline: number[];
  avgResponseMinutes: number; avgResponseChange: number; avgResponseSparkline: number[];
}

export interface SupportTicket {
  id: string; ticketCode: string; title: string; aiSummary: string;
  clientName: string; clientId: string; category: string; categoryLabel: string;
  priority: string; priorityLabel: string; status: string; statusLabel: string;
  slaLabel: string; slaStatus: string; slaMinutesRemaining: number | null;
  updatedAt: string | null; agentName: string | null; channel: string;
  orderId?: string | null; sentiment?: string | null;
}

export interface TicketMessage { id: string; content: string; isInternal: boolean; createdAt: string | null }

export interface TicketDetail extends SupportTicket {
  description: string; messages: TicketMessage[];
  paymentId?: string | null; partnerName?: string | null; driverName?: string | null;
  internalNotes: string[]; aiRecommendations: string[];
  refundRisk: string; churnRisk: string;
}

export interface SlaBreakdown {
  withinSla: number; atRisk: number; breached: number;
  avgResolutionMinutes: number; compliancePercent: number;
}

export interface QueueColumn { status: string; statusLabel: string; tickets: SupportTicket[] }

export interface AiTriageItem {
  ticketId: string; ticketCode: string; clientName: string; subject: string;
  sentiment: string; predictedCategory: string; priority: string;
  refundRisk: string; churnRisk: string; suggestedReply: string;
}

export interface SentimentBreakdown { sentiment: string; count: number; percent: number; color: string }
export interface TopIssue { issue: string; tickets: number; variation: number; impact: string }
export interface AgentPerformance {
  agentId: string; agentName: string; ticketsHandled: number;
  avgResponseMinutes: number; slaPercent: number; satisfaction: number;
}
export interface EscalationItem { id: string; label: string; count: number; severity: string }
export interface TrendPoint { date: string; newTickets: number; resolvedTickets: number; openTickets: number }
export interface ChannelBreakdown { channel: string; count: number; percent: number; color: string }

export interface SupportDashboardSummary {
  kpis: SupportKpis;
  tickets: SupportTicket[];
  sla: SlaBreakdown;
  queue: QueueColumn[];
  aiTriage: AiTriageItem[];
  sentiment: SentimentBreakdown[];
  topIssues: TopIssue[];
  agents: AgentPerformance[];
  escalations: EscalationItem[];
  trends: TrendPoint[];
  channels: ChannelBreakdown[];
  source: string;
}
