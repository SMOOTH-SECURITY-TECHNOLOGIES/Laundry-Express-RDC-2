export type PlanTier = 'essential' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'overdue' | 'suspended' | 'trial';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  interval: string;
  description: string;
  features: string[];
  disabledFeatures: string[];
  partnerCount: number;
  badge?: string;
}

export interface SubscriptionKpis {
  activePlans: number;
  subscribedPartners: number;
  mrr: number;
  arr: number;
  conversionRate: number;
  churnRate: number;
}

export interface PlanDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RecurringRevenuePoint {
  month: string;
  mrr: number;
}

export interface PlanFeature {
  name: string;
  icon: string;
  essential: boolean;
  professional: boolean;
  enterprise: boolean;
}

export interface SubscriptionActivity {
  id: string;
  time: string;
  user: string;
  action: string;
  detail: string;
  color: string;
  icon: string;
}

export interface SubscribedPartner {
  id: string;
  name: string;
  plan: string;
  startDate: string;
  renewalDate: string;
  mrr: number;
  status: SubscriptionStatus;
}

export interface InvoiceKpis {
  issued: number;
  paid: number;
  overdue: number;
  collected: number;
}

export interface ChurnMetrics {
  newSubscribers: number;
  cancellations: number;
  trialConversion: number;
  retention30: number;
  retention90: number;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: SubscriptionStatus;
}

export interface KpiCard {
  label: string;
  value: string;
  change: string;
  icon: 'logo' | 'wash' | 'iron' | 'shirt' | 'star' | 'check' | 'mapPin' | 'calendar' | 'clock' | 'user' | 'xmark' | 'search' | 'shoppingBag' | 'truck' | 'sparkles' | 'home' | 'bell' | 'pencil' | 'lifebuoy' | 'map' | 'list' | 'chatBubble' | 'bars3' | 'currencyDollar' | 'chartBar' | 'paper-plane' | 'exclamation-circle' | 'device-phone-mobile' | 'share' | 'sun' | 'moon' | 'camera' | 'magnifying-glass-plus' | 'calendar-days' | 'cloud-sun' | 'photo' | 'arrow-path' | 'arrow-down-tray' | 'users' | 'shield-check' | 'clock-history' | 'qrcode' | 'question-mark-circle' | 'code-bracket' | 'archive-box' | 'document-text' | 'document-arrow-down' | 'warning' | 'chevron-down' | 'chevron-up' | 'shield' | 'circle' | 'arrowLeft' | 'arrowRight' | 'cloud' | 'computer' | 'edit' | 'document' | 'play' | 'phone' | 'envelope' | 'gift' | 'building' | 'wallet' | 'settings' | 'badge-check' | 'hand-thumb-up' | 'heart' | 'plus' | 'minus' | 'trophy' | 'fire' | 'credit-card' | 'facebook' | 'instagram' | 'whatsapp';
  color: string;
  sparkline: number[];
}

export interface AuditItem {
  label: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: string;
}
