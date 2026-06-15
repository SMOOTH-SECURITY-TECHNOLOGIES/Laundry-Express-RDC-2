export interface EmailKpis {
  sentToday: number; sentTodayChange: number; sentTodaySparkline: number[];
  deliveryRate: number; deliveryRateChange: number; deliveryRateSparkline: number[];
  openRate: number; openRateChange: number; openRateSparkline: number[];
  clickRate: number; clickRateChange: number; clickRateSparkline: number[];
  bounces: number; bouncesChange: number; bouncesSparkline: number[];
  unsubscribes: number; unsubscribesChange: number; unsubscribesSparkline: number[];
  activeTemplates: number; activeTemplatesChange: number; activeTemplatesSparkline: number[];
  attributedRevenue: number; attributedRevenueChange: number; attributedRevenueSparkline: number[];
}

export interface EmailMessage {
  id: string; reference: string; recipientEmail: string; recipientName?: string; subject: string;
  messageType: string; messageTypeLabel: string; templateName?: string; status: string; statusLabel: string;
  openRate?: number; clickRate?: number; sentAt?: string;
}

export interface EmailTemplate {
  id: string; name: string; templateType: string; typeLabel: string; language: string; subject: string;
  status: string; usageCount: number; openRate: number; clickRate: number; version: number;
}

export interface EmailCampaign {
  id: string; name: string; audience?: string; status: string; statusLabel: string;
  sentCount: number; openedCount: number; clickedCount: number; conversions: number; revenue: number; roi: number;
}

export interface EmailAutomation {
  id: string; name: string; triggerKey: string; triggerLabel: string; templateName?: string;
  status: string; lastRunAt?: string; volume30d: number; openRate: number; clickRate: number;
}

export interface TypeDistribution { label: string; count: number; percent: number; color: string; }
export interface DomainPerformance { domain: string; deliveryRate: number; openRate: number; clickRate: number; bounceRate: number; }
export interface EmailDeliverability { domain: string; healthStatus: string; healthLabel: string; spf: string; dkim: string; dmarc: string; bounceRate: number; spamComplaints: number; reputationScore: number; }
export interface EmailBounce { id: string; email: string; bounceType: string; bounceTypeLabel: string; reason?: string; providerCode?: string; occurredAt?: string; }
export interface UnsubscribeSummary { total: number; campaign: number; marketing: number; preferencesCount: number; }
export interface EmailUnsubscribe { id: string; email: string; unsubscribeType: string; typeLabel: string; reason?: string; }
export interface InvoiceSummary { sent: number; opened: number; downloaded: number; reminders: number; failures: number; }
export interface InvoiceLog { id: string; invoiceRef: string; recipientEmail: string; status: string; opened: boolean; downloaded: boolean; reminderCount: number; }
export interface EmailWebhook { id: string; endpoint: string; secretMasked?: string; lastCallAt?: string; successCount: number; errorCount: number; events: string[]; }
export interface EmailAlert { id: string; alertType: string; title: string; severity: string; count: number; }
export interface AnalyticsSeries { key: string; title: string; data: { label: string; value: number }[]; }
export interface EmailSegment { slug: string; name: string; size: number; }
export interface EmailSettings { provider: string; fromEmail: string; replyTo: string; marketingOptOutRequired: boolean; }

export interface EmailDashboardSummary {
  kpis: EmailKpis; messages: EmailMessage[]; templates: EmailTemplate[]; campaigns: EmailCampaign[];
  automations: EmailAutomation[]; typeDistribution: TypeDistribution[]; domainPerformance: DomainPerformance[];
  deliverability: EmailDeliverability[]; bounces: EmailBounce[]; unsubscribeSummary: UnsubscribeSummary;
  unsubscribes: EmailUnsubscribe[]; invoiceSummary: InvoiceSummary; invoices: InvoiceLog[];
  webhooks: EmailWebhook[]; alerts: EmailAlert[]; analytics: AnalyticsSeries[]; segments: EmailSegment[];
  settings: EmailSettings; source: string;
}
