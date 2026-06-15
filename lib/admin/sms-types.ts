export interface SmsKpis {
  sentToday: number; sentTodayChange: number; sentTodaySparkline: number[];
  deliveryRate: number; deliveryRateChange: number; deliveryRateSparkline: number[];
  failureRate: number; failureRateChange: number; failureRateSparkline: number[];
  costToday: number; costTodayChange: number; costTodaySparkline: number[];
  creditsAvailable: number; creditsChange: number; creditsSparkline: number[];
  activeCampaigns: number; activeCampaignsChange: number;
  otpSuccessRate: number; otpSuccessChange: number; otpSuccessSparkline: number[];
  monthlyVolume: number; monthlyVolumeChange: number; monthlyVolumeSparkline: number[];
}

export interface OperatorDistribution { slug: string; name: string; volume: number; percent: number; cost: number; deliveryRate: number; color: string; }
export interface SmsMessage {
  id: string; reference: string; recipientName?: string; phoneNumber: string; senderName?: string;
  messageType: string; messageTypeLabel: string; status: string; statusLabel: string;
  operatorSlug?: string; operatorName?: string; cost: number; sentAt?: string;
}
export interface OperatorPerformance { slug: string; name: string; deliveryRate: number; failureRate: number; avgDeliveryMs: number; cost: number; volume: number; }
export interface DeliveryStatus { label: string; count: number; percent: number; color: string; }
export interface SmsCampaign {
  id: string; name: string; campaignType: string; typeLabel: string; status: string; statusLabel: string;
  audience?: string; sentCount: number; deliveredCount: number; replyCount: number; scheduledAt?: string;
}
export interface SmsTemplate { id: string; name: string; category: string; categoryLabel: string; content: string; active: boolean; usageCount: number; deliveryRate: number; }
export interface SmsSender { id: string; name: string; senderId: string; approved: boolean; active: boolean; approvalStatus: string; approvalLabel: string; volume: number; deliveryRate: number; }
export interface SmsCredits { currentCredits: number; monthlyConsumption: number; avgCostPerSms: number; autoRecharge: boolean; alertThreshold: number; }
export interface CreditLedgerItem { id: string; movementType: string; movementLabel: string; amount: number; balanceAfter: number; note?: string; createdAt?: string; }
export interface OtpKpis { sent: number; validated: number; successRate: number; avgValidationSec: number; }
export interface OtpRecord { id: string; phoneNumber: string; codeMasked: string; status: string; statusLabel: string; createdAt?: string; expiresAt?: string; }
export interface SmsAlert { id: string; alertType: string; title: string; severity: string; count: number; }
export interface AnalyticsSeries { key: string; title: string; data: { label: string; value: number }[]; }
export interface SmsActivity { id: string; message: string; activityType: string; createdAt?: string; }
export interface SmsWebhook { id: string; endpoint: string; secretMasked?: string; lastCallAt?: string; successCount: number; errorCount: number; consecutiveErrors: number; }
export interface SmsSettings { autoRecharge: boolean; alertThreshold: number; defaultSender: string; providers: string[]; }
export interface SmsLog { id: string; reference?: string; phoneNumber?: string; eventType: string; status?: string; providerId?: string; createdAt?: string; }

export interface SmsDashboardSummary {
  kpis: SmsKpis; operatorDistribution: OperatorDistribution[]; messages: SmsMessage[];
  operatorPerformance: OperatorPerformance[]; deliveryStatus: DeliveryStatus[];
  campaigns: SmsCampaign[]; templates: SmsTemplate[]; senders: SmsSender[];
  credits: SmsCredits; creditLedger: CreditLedgerItem[]; otpKpis: OtpKpis; otpRecords: OtpRecord[];
  alerts: SmsAlert[]; analytics: AnalyticsSeries[]; activities: SmsActivity[];
  webhooks: SmsWebhook[]; settings: SmsSettings; logs: SmsLog[]; source: string;
}
