export type NotificationChannel = 'push' | 'whatsapp' | 'sms' | 'email';
export type NotificationStatus = 'delivered' | 'pending' | 'failed' | 'opened' | 'clicked' | 'unsubscribed';

export interface NotificationKpis {
  totalSent: number; totalSentChange: number; totalSentSparkline: number[];
  deliveryRate: number; deliveryRateChange: number; deliveryRateSparkline: number[];
  emailOpenRate: number; emailOpenRateChange: number; emailOpenRateSparkline: number[];
  clickRate: number; clickRateChange: number; clickRateSparkline: number[];
  unsubscribes: number; unsubscribesChange: number; unsubscribesSparkline: number[];
  errors: number; errorsChange: number; errorsSparkline: number[];
}

export interface NotificationItem {
  id: string; title: string; messagePreview: string;
  channel: NotificationChannel; channelLabel: string;
  eventType: string; eventLabel: string;
  audience: string; status: NotificationStatus; statusLabel: string;
  sentAt: string | null; deliveryRate: number;
  openRate?: number | null; clickRate?: number | null; zone?: string | null;
}

export interface ChannelDistribution { channel: string; label: string; count: number; percent: number; color: string; trend: number }
export interface DeliveryStatusBucket { label: string; count: number; percent: number; color: string }
export interface TopEvent { eventType: string; label: string; sends: number }
export interface ChannelPerformance { channel: string; label: string; deliveryRate: number; openRate: number; clickRate: number; failures: number }
export interface PopularTemplate { id: string; name: string; channel: string; usageCount: number; deliveryRate: number; openRate?: number | null }
export interface NotificationAutomation { id: string; name: string; triggerKey: string; triggerLabel: string; channel: string; status: string; lastRunAt: string | null }
export interface NotificationActivity { id: string; activityType: string; message: string; actorName: string | null; createdAt: string | null }
export interface ProviderHealth { channel: string; label: string; provider: string; deliveryRate: number; latencyMs: number; errorCount: number; status: string; lastIncidentAt: string | null }
export interface NotificationError { id: string; channel: string; provider: string; errorCode: string; message: string; occurrences: number; lastOccurrenceAt: string | null }
export interface NotificationUnsubscribe { id: string; channel: string; userEmail: string | null; userPhone: string | null; reason: string | null; unsubscribedAt: string | null }
export interface NotificationSegment { id: string; name: string; slug: string; size: number; preferredChannel: string | null; engagementRate: number }
export interface NotificationTemplate {
  id: string; name: string; channel: string; eventType: string; language: string;
  status: string; usageCount: number; deliveryRate: number; openRate?: number | null; updatedAt: string | null;
}

export interface NotificationsDashboardSummary {
  kpis: NotificationKpis;
  notifications: NotificationItem[];
  channelDistribution: ChannelDistribution[];
  deliveryStatus: DeliveryStatusBucket[];
  topEvents: TopEvent[];
  channelPerformance: ChannelPerformance[];
  popularTemplates: PopularTemplate[];
  automations: NotificationAutomation[];
  activities: NotificationActivity[];
  providerHealth: ProviderHealth[];
  errors: NotificationError[];
  unsubscribes: NotificationUnsubscribe[];
  segments: NotificationSegment[];
  templates: NotificationTemplate[];
  source: string;
}

export interface NotificationSendPayload {
  channel: NotificationChannel;
  audience: string;
  title: string;
  message: string;
  eventType?: string;
  scheduleAt?: string | null;
}

export interface NotificationTemplatePayload {
  name: string; channel: string; eventType: string; language?: string; subject?: string; body: string;
}
