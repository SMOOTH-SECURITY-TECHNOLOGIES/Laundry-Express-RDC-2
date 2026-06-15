export type ConversationStatus = 'new' | 'open' | 'ai' | 'waiting_client' | 'resolved' | 'escalated';

export interface WhatsappKpis {
  openConversations: number; openConversationsChange: number; openConversationsSparkline: number[];
  messagesToday: number; messagesTodayChange: number; messagesTodaySparkline: number[];
  responseRate: number; responseRateChange: number; responseRateSparkline: number[];
  avgResponseTime: string; avgResponseTimeChange: string; avgResponseTimeSparkline: number[];
  activeTemplates: number; activeTemplatesChange: number; activeTemplatesSparkline: number[];
  costToday: number; costTodayChange: number; costTodaySparkline: number[];
  aiConversationsPct: number; aiConversationsChange: number; aiConversationsSparkline: number[];
  satisfaction: number; satisfactionChange: number; satisfactionSparkline: number[];
}

export interface WhatsappConversation {
  id: string; clientName: string; phone: string; lastMessage?: string; channel: string;
  assignedTo?: string; status: ConversationStatus; statusLabel: string;
  waitTimeSec: number; waitTimeLabel: string; createdAt?: string;
}

export interface WhatsappConversationDetail extends WhatsappConversation {
  messages: { from: string; text: string; at?: string }[];
  linkedOrders: string[]; linkedTickets: string[]; internalNotes: string[]; aiSuggestions: string[];
}

export interface LiveMonitor {
  activeConversations: number; waitingConversations: number; slaBreached: number; escalations: number;
  availableAgents: string[]; aiActivePct: number; supportBacklog: number;
}

export interface WhatsappTemplate {
  id: string; name: string; category: string; categoryLabel: string; language: string;
  metaStatus: string; metaStatusLabel: string; usageCount: number; deliveryRate: number;
}

export interface WhatsappNotification {
  id: string; eventType: string; eventLabel: string; templateName?: string;
  recipient: string; status: string; statusLabel: string; createdAt?: string;
}

export interface WhatsappCampaign {
  id: string; name: string; campaignType: string; typeLabel: string; templateName?: string;
  audience?: string; status: string; sent: number; delivered: number; opened: number;
  replies: number; clicks: number; conversions: number;
}

export interface WhatsappAutomation {
  id: string; name: string; triggerType: string; triggerLabel: string;
  status: string; runsCount: number; successRate: number;
}

export interface WhatsappWebhook {
  id: string; endpoint: string; secretMasked?: string; lastCallAt?: string;
  successCount: number; errorCount: number; retryCount: number; events: string[];
}

export interface WhatsappQuality {
  qualityRating: string; qualityLabel: string; messagingLimit: string;
  phoneStatus: string; phoneStatusLabel: string; verificationStatus: string;
  verificationLabel: string; alerts: { type: string; severity: string; message: string }[];
}

export interface WhatsappAiMetrics {
  aiConversationsPct: number; humanEscalations: number; aiConfidence: number;
  resolutionRate: number; resolvedWithoutHuman: number; costSaved: number; satisfaction: number;
}

export interface WhatsappCost {
  totalToday: number; totalWeek: number; totalMonth: number;
  marketingCost: number; utilityCost: number; authCost: number;
  costPerConversation: number; trend: number; forecast: number;
  sparklineDay: number[]; sparklineWeek: number[]; sparklineMonth: number[];
}

export interface AnalyticsSeries {
  key: string; title: string; data: { label: string; value: number }[];
}

export interface WhatsappSegment {
  id: string; slug: string; name: string; size: number; engagement: number; conversion: number;
}

export interface WhatsappSla {
  firstResponseAvg: string; resolutionAvg: string; openConversations: number; slaBreached: number;
  firstResponseStatus: string; resolutionStatus: string; openStatus: string; breachedStatus: string;
}

export interface WhatsappDashboardSummary {
  kpis: WhatsappKpis;
  conversations: WhatsappConversation[];
  liveMonitor: LiveMonitor;
  templates: WhatsappTemplate[];
  notifications: WhatsappNotification[];
  campaigns: WhatsappCampaign[];
  automations: WhatsappAutomation[];
  webhooks: WhatsappWebhook[];
  quality: WhatsappQuality;
  aiMetrics: WhatsappAiMetrics;
  costs: WhatsappCost;
  analytics: AnalyticsSeries[];
  segments: WhatsappSegment[];
  sla: WhatsappSla;
  source: string;
}
