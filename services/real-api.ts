const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

import { DB } from '../constants';

export interface ApiUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: string;
  status: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_2fa_enabled: boolean;
  loyalty_points: number;
  referral_code?: string | null;
  referred_by_user_id?: string | null;
  delivery_company_id?: string | null;
  last_login_at: string | null;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiUserProfile {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_language: string;
  theme_preference: string;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAddress {
  id: string;
  user_id: string;
  label: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  commune: string;
  zone?: string | null;
  reference_point?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instructions?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiCurrentUserResponse {
  user: ApiUser;
  profile?: ApiUserProfile | null;
  addresses: ApiAddress[];
  partner_ids?: string[];
  primary_partner_id?: string | null;
}

export interface AdminUserSummary extends ApiUser {
  partner_ids?: string[];
  primary_partner_id?: string | null;
}

export interface CatalogPartnerSummary {
  id: string;
  name: string;
  business_name: string;
  partner_type: string;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  is_accepting_orders: boolean;
  rating: number;
  total_reviews: number;
  city?: string | null;
  commune?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  available_service_count: number;
}

export interface CatalogPartnerService {
  id: string;
  partner_id: string;
  service_category_id: string;
  service_type_id: string;
  service_category_name?: string | null;
  service_type_name?: string | null;
  base_price: number | string;
  pricing_mode: string;
  estimated_turnaround_hours: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderAddOnItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  price: number | string;
  sort_order: number;
  is_active: boolean;
}

export interface OrderAddOnListResponse {
  add_ons: OrderAddOnItem[];
  total: number;
}

export interface CatalogServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogServiceType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogResponse {
  service_categories: CatalogServiceCategory[];
  service_types: CatalogServiceType[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  name: string;
  password: string;
  referral_code?: string;
}

export interface CreateAddressRequest {
  user_id: string;
  label: string;
  contact_name?: string;
  contact_phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  commune: string;
  zone?: string;
  reference_point?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  is_default: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  partner_id: string;
  partner_name?: string | null;
  total_amount: number | string;
  amount_paid: number | string;
  discount_amount?: number | string;
  payment_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  calculation_breakdown?: Record<string, unknown> | null;
  pickup_contact_name?: string | null;
  pickup_contact_phone?: string | null;
  pickup_commune?: string | null;
  items?: Array<{
    id: string;
    service_id: string;
    item_name: string;
    quantity: number | string;
    unit_price: number | string;
    line_total: number | string;
    notes?: string | null;
  }>;
  status_history?: Array<{
    id: string;
    old_status?: string | null;
    new_status: string;
    created_at: string;
  }>;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
}

export interface PublicOrderSocialProof {
  order_id: string;
  order_number: string;
  customer_first_name: string;
  commune: string;
  created_at: string;
}

export interface OrderCreateRequest {
  partner_id: string;
  pickup_address_id?: string;
  delivery_address_id?: string;
  items: Array<{
    service_id: string;
    item_name: string;
    quantity: number | string;
    unit_price: number | string;
    notes?: string;
    detected_by_ai?: boolean;
  }>;
  currency?: string;
  special_instructions?: string;
  pickup_date?: string | null;
  pickup_time_slot?: string | null;
  delivery_date?: string | null;
  delivery_time_slot?: string | null;
  express?: boolean;
  pickup_requested?: boolean;
  delivery_requested?: boolean;
  promo_code?: string;
  loyalty_points_to_redeem?: number;
  idempotency_key?: string;
}

export interface OrderEstimateResponse {
  subtotal_amount: number | string;
  discount_amount: number | string;
  pickup_fee: number | string;
  delivery_fee: number | string;
  total_amount: number | string;
  currency: string;
  calculation_breakdown?: Record<string, unknown> | null;
}

export interface PartnerPricingSummary {
  services_count: number;
  rules_count: number;
  average_price: number;
  min_price: number;
  max_price: number;
  has_express: boolean;
  has_pickup_fee: boolean;
  has_delivery_fee: boolean;
  has_bulk_discount: boolean;
}

export interface PartnerDashboardOnboardingSummary {
  has_working_hours: boolean;
  has_services: boolean;
  has_video: boolean;
  has_promotion: boolean;
  completed_steps: number;
  total_steps: number;
}

export interface PartnerDashboardPartnerSummary {
  id: string;
  name: string;
  is_featured: boolean;
  currency: string;
  onboarding: PartnerDashboardOnboardingSummary;
}

export interface PartnerDashboardOrdersSummary {
  pending_new_orders: number;
  active_orders: number;
  completed_orders_this_month: number;
  revenue_this_month: number | string;
  average_order_value: number | string;
}

export interface PartnerDashboardOperationalState {
  order_intake_status: 'live' | 'featured' | 'paused' | 'unavailable';
  accepting_orders: boolean;
  has_data_gaps: boolean;
}

export interface PartnerDashboardMeta {
  generated_at: string;
  timezone: string;
  source_version: string;
}

export interface PartnerDashboardSummaryResponse {
  partner: PartnerDashboardPartnerSummary;
  orders: PartnerDashboardOrdersSummary;
  pricing: PartnerPricingSummary;
  operational_state: PartnerDashboardOperationalState;
  meta: PartnerDashboardMeta;
}

export interface PartnerOrdersListItem {
  id: string;
  order_number: string;
  status: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at: string;
  completed_at?: string | null;
  total_amount: number | string;
  amount_paid: number | string;
  payment_status: string;
  service_labels: string[];
}

export interface PartnerOrdersListSummary {
  total_orders: number;
  status_counts: Record<string, number>;
}

export interface PartnerOrdersListResponse {
  items: PartnerOrdersListItem[];
  total: number;
  page: number;
  page_size: number;
  summary: PartnerOrdersListSummary;
}

export interface PartnerFinancialTotals {
  revenue_total: number | string;
  revenue_last_30_days: number | string;
  completed_orders: number;
  average_order_value: number | string;
}

export interface PartnerDailyRevenuePoint {
  date: string;
  amount: number | string;
}

export interface PartnerFinancialTransaction {
  order_id: string;
  order_number: string;
  completed_at?: string | null;
  service_label: string;
  amount: number | string;
  payment_status: string;
  payout_status: string;
}

export interface PartnerFinancialSummaryResponse {
  totals: PartnerFinancialTotals;
  daily_revenue: PartnerDailyRevenuePoint[];
  transactions: PartnerFinancialTransaction[];
}

export interface PartnerInvoiceEligibleOrder {
  order_id: string;
  order_number: string;
  completed_at?: string | null;
  customer_name?: string | null;
  amount: number | string;
  currency: string;
  proforma_generated_at?: string | null;
  invoice_generated_at?: string | null;
  can_generate_proforma: boolean;
  can_generate_invoice: boolean;
}

export interface PartnerInvoiceEligibleOrdersResponse {
  items: PartnerInvoiceEligibleOrder[];
}

export interface PartnerInvoiceDocumentLineItem {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
}

export interface PartnerInvoiceDocumentPayload {
  order_id: string;
  order_number: string;
  currency: string;
  partner_name: string;
  partner_address: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_address: string;
  completed_at?: string | null;
  generated_at: string;
  document_reference: string;
  line_items: PartnerInvoiceDocumentLineItem[];
  subtotal_amount: number | string;
  discount_amount: number | string;
  total_amount: number | string;
}

export interface PartnerGeneratedDocument {
  document_type: 'proforma' | 'invoice';
  generated_at: string;
  payload: PartnerInvoiceDocumentPayload;
}

export interface PartnerOrderDocumentsResponse {
  proforma?: PartnerGeneratedDocument | null;
  invoice?: PartnerGeneratedDocument | null;
}

export interface PartnerProfileDayHours {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface PartnerProfileWorkingHours {
  monday: PartnerProfileDayHours;
  tuesday: PartnerProfileDayHours;
  wednesday: PartnerProfileDayHours;
  thursday: PartnerProfileDayHours;
  friday: PartnerProfileDayHours;
  saturday: PartnerProfileDayHours;
  sunday: PartnerProfileDayHours;
}

export interface PartnerProfileDetailResponse {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  status: string;
  is_featured: boolean;
  is_accepting_orders: boolean;
  address: string;
  city?: string | null;
  commune?: string | null;
  video_url?: string | null;
  image_urls?: string[];
  media_gallery?: Record<string, string[]>;
  service_count: number;
  working_hours: PartnerProfileWorkingHours;
}

export interface PartnerPublicProfileResponse {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  commune?: string | null;
  rating: number;
  total_reviews: number;
  video_url?: string | null;
  image_urls: string[];
  media_gallery: Record<string, string[]>;
  working_hours: PartnerProfileWorkingHours;
}

export interface PartnerProfileUpdateRequest {
  name: string;
  address: string;
  city?: string | null;
  commune?: string | null;
}

export interface PartnerProfileWorkingHoursUpdateRequest {
  working_hours: PartnerProfileWorkingHours;
}

export interface PartnerAnalyticsOverview {
  total_revenue: number | string;
  average_order_value: number | string;
  orders_in_range: number;
}

export interface PartnerAnalyticsRevenuePoint {
  label: string;
  value: number | string;
}

export interface PartnerAnalyticsServicePoint {
  name: string;
  count: number;
}

export interface PartnerAnalyticsCustomerInsights {
  new_customers: number;
  returning_customers: number;
}

export interface PartnerAnalyticsTopClient {
  name: string;
  orders: number;
}

export interface PartnerAnalyticsPromoUsagePoint {
  code: string;
  usage_count: number;
}

export interface PartnerAnalyticsPromoRevenuePoint {
  code: string;
  revenue: number | string;
}

export interface PartnerAnalyticsPromoPerformance {
  top_by_usage: PartnerAnalyticsPromoUsagePoint[];
  top_by_revenue: PartnerAnalyticsPromoRevenuePoint[];
}

export interface PartnerAnalyticsSummaryResponse {
  range: 'week' | 'month' | 'year';
  overview: PartnerAnalyticsOverview;
  revenue_series: PartnerAnalyticsRevenuePoint[];
  popular_services: PartnerAnalyticsServicePoint[];
  customer_insights: PartnerAnalyticsCustomerInsights;
  top_clients: PartnerAnalyticsTopClient[];
  promo_performance: PartnerAnalyticsPromoPerformance;
}

export interface PartnerSecurityActivityLog {
  id: string;
  user_id?: string | null;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerSecurityActivityLogListResponse {
  logs: PartnerSecurityActivityLog[];
  total: number;
  limit: number;
}

export interface TwoFactorToggleResponse {
  success: boolean;
  message: string;
}

export interface AdminOverview {
  total_partners: number;
  total_users: number;
  total_orders: number;
  total_drivers: number;
  orders_last_30_days: number;
  revenue_last_30_days: number | string;
  open_disputes: number;
  open_tickets: number;
  pending_refunds: number;
}

export interface BackendAdsDashboardResponse {
  kpis: {
    active_ads: number;
    active_ads_change: number;
    active_ads_sparkline?: number[];
    impressions: number;
    impressions_change: number;
    impressions_sparkline?: number[];
    clicks: number;
    clicks_change: number;
    clicks_sparkline?: number[];
    ctr: number;
    ctr_change: number;
    ctr_sparkline?: number[];
    conversions: number;
    conversions_change: number;
    conversions_sparkline?: number[];
    spend: number;
    spend_change: number;
    spend_sparkline?: number[];
    roi: number;
    roi_change: number;
    roi_sparkline?: number[];
  };
  ads: Array<{
    id: string;
    title: string;
    campaign: string;
    channel: string;
    zone: string;
    budget: number;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    roi: number;
    status: string;
  }>;
  funnel: Array<{ stage: string; count: number; rate: number }>;
  channels: Array<{ channel: string; percent: number; budget: number; conversions: number; roi: number; color: string }>;
  zones: Array<{ id: string; name: string; budget: number; conversions: number; roi: number; map_x: number; map_y: number; heat_color: string }>;
  campaigns: Array<{ id: string; name: string; objective: string; budget: number; spend: number; conversions: number; roi: number; status: string }>;
  segments: Array<{ segment: string; segment_key: string; clients: number; percent: number }>;
  reactivation: { dormant_clients: number; reactivated: number; revenue_recovered: number; reactivation_rate: number };
  ab_tests: Array<Record<string, unknown>>;
  top_ads: Array<{ title: string; roi: number; rank: number }>;
  insights: Array<{ id: string; text: string; type: string }>;
  truth_anomalies: Array<{ id: string; message: string; severity: string }>;
  attribution: { cpa: number; cac: number; roas: number; roi: number; attributed_revenue: number };
  source: string;
}

export interface AdminActivityLog {
  id: string;
  user_id?: string | null;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLogListResponse {
  logs: AdminActivityLog[];
  total: number;
  limit: number;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number | null;
  is_for_new_users_only: boolean;
  is_active: boolean;
  partner_id?: string | null;
  created_by_user_id?: string | null;
  usage_count: number;
  max_usage?: number | null;
  usage_limit_per_customer?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  applicable_services?: string[] | null;
  description?: string | null;
  geographic_restrictions?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPromoCodeListResponse {
  promo_codes: AdminPromoCode[];
  total: number;
}

export interface AdminPromoCodeUpsertRequest {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number | null;
  is_for_new_users_only?: boolean;
  is_active?: boolean;
  partner_id?: string | null;
  max_usage?: number | null;
  usage_limit_per_customer?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  applicable_services?: string[];
  description?: string | null;
  geographic_restrictions?: string[];
}

export interface PartnerPromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number | null;
  is_for_new_users_only: boolean;
  is_active: boolean;
  partner_id?: string | null;
  created_by_user_id?: string | null;
  usage_count: number;
  max_usage?: number | null;
  usage_limit_per_customer?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  applicable_services?: string[] | null;
  description?: string | null;
  geographic_restrictions?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerPromoCodeListResponse {
  promo_codes: PartnerPromoCode[];
  total: number;
}

export interface ContentHowItWorksStep {
  id: string;
  title: string;
  description: string;
  icon: 'shoppingBag' | 'truck' | 'sparkles' | 'home';
}

export interface ContentFAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteContentData {
  hero: {
    title: string;
    subtitle: string;
  };
  howItWorksSteps: ContentHowItWorksStep[];
  faq: ContentFAQItem[];
}

export interface SiteContentResponse {
  id?: string | null;
  key: string;
  content_data: SiteContentData;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BackendSubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  is_most_popular: boolean;
  features: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface BackendSubscriptionPlanListResponse {
  plans: BackendSubscriptionPlan[];
  total: number;
}

export interface BackendSubscriptionPlanCreateRequest {
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  is_most_popular?: boolean;
  features: Record<string, boolean>;
}

export interface BackendSubscriptionPlanUpdateRequest {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  is_most_popular?: boolean;
  features?: Record<string, boolean>;
}

export interface BackendTrackingSettingsResponse {
  id?: string | null;
  key: string;
  gtmContainerId: string;
  metaPixelId: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BackendAdvertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAdvertisementListResponse {
  advertisements: BackendAdvertisement[];
  total: number;
}

export interface BackendLoyaltySettingsResponse {
  id?: string | null;
  key: string;
  isEnabled: boolean;
  pointsPerDollar: number;
  pointsToDollar: number;
  pointsExpiryDays?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LoyaltyAdminLedgerEntry {
  id: string;
  user_id: string;
  user_name?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  entry_type: string;
  points_delta: number;
  balance_after: number;
  description: string;
  expires_at?: string | null;
  expired_at?: string | null;
  created_at?: string | null;
}

export interface LoyaltyTopUser {
  user_id: string;
  user_name: string;
  user_email: string;
  loyalty_points: number;
}

export interface LoyaltyTopRedeemer {
  user_id: string;
  user_name: string;
  user_email: string;
  total_points_redeemed: number;
}

export interface LoyaltyPolicyMetrics {
  is_enabled: boolean;
  points_per_dollar: number;
  points_to_dollar: number;
  points_expiry_days?: number | null;
  reward_value_per_point: number;
  reward_value_per_100_spent: number;
}

export interface BackendLoyaltyDashboardResponse {
  kpis: {
    members: number;
    members_change: number;
    members_sparkline?: number[];
    points_circulation: number;
    points_circulation_change: number;
    points_circulation_sparkline?: number[];
    points_earned: number;
    points_earned_change: number;
    points_earned_sparkline?: number[];
    points_redeemed: number;
    points_redeemed_change: number;
    points_redeemed_sparkline?: number[];
    points_value: number;
    points_value_change: number;
    points_value_sparkline?: number[];
    redemption_rate: number;
    redemption_rate_change: number;
    redemption_rate_sparkline?: number[];
    influenced_revenue: number;
    influenced_revenue_change: number;
    influenced_revenue_sparkline?: number[];
    retention_rate: number;
    retention_rate_change: number;
    retention_rate_sparkline?: number[];
  };
  health: {
    score: number;
    status: string;
    redemption_rate: number;
    points_liability: number;
    retention_uplift: number;
    fraud_risk: number;
    unused_points: number;
  };
  settings: {
    is_enabled: boolean;
    points_per_dollar: number;
    points_to_dollar: number;
    points_expiry_days: number | null;
    redemption_cap: number | null;
    first_order_bonus: number;
  };
  rewards: Array<{ id: string; name: string; points_required: number; value_dollars: number; uses_count: number; status: string }>;
  earning_rules: Array<{ id: string; name: string; condition: string; points: string; status: string; performance: number }>;
  activity: Array<{
    id: string; client_name: string; client_email: string; entry_type: string;
    order_number: string | null; points_delta: number; balance_after: number;
    created_at: string | null; source: string;
  }>;
  top_users: Array<{
    user_id: string; name: string; email: string; points: number;
    estimated_value: number; orders_count: number; last_activity: string | null;
  }>;
  top_redeemers: Array<{
    user_id: string; name: string; points_used: number;
    amount_saved: number; linked_orders: number;
  }>;
  retention: Array<{ period: string; members: number; non_members: number }>;
  revenue_impact: {
    influenced_revenue: number; influenced_revenue_change: number;
    avg_basket_members: number; avg_basket_non_members: number;
    order_frequency_members: number; points_cost: number; loyalty_roi: number;
  };
  cohorts: Array<{ month: string; m0: number; m1: number; m2: number; m3: number; m4: number }>;
  risks: Array<{ id: string; message: string; count: number; severity: string }>;
  segments: Array<{ segment: string; segment_key: string; count: number; percent: number }>;
  integrations: Array<{ module: string; status: string; connected: boolean }>;
  source: string;
}

export interface LoyaltyAdminOverview {
  total_users_with_points: number;
  total_points_balance: number;
  average_points_balance: number;
  ledger_entries_total: number;
  total_points_earned: number;
  total_points_redeemed: number;
  total_points_expired: number;
  total_referral_bonus_points: number;
  total_adjustment_points_net: number;
  users_with_expiring_points: number;
  expiring_points_total: number;
  policy_metrics: LoyaltyPolicyMetrics;
  top_users: LoyaltyTopUser[];
  top_redeemers: LoyaltyTopRedeemer[];
  recent_entries: LoyaltyAdminLedgerEntry[];
}

export interface BackendReferralSettingsResponse {
  id?: string | null;
  key: string;
  isEnabled: boolean;
  referrerBonusPoints: number;
  refereeDiscountAmount: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReferralTopReferrer {
  user_id: string;
  user_name: string;
  user_email: string;
  referral_code?: string | null;
  successful_referrals: number;
  total_bonus_points_awarded: number;
}

export interface BackendReferralDashboardResponse {
  kpis: {
    users_with_code: number;
    users_with_code_change: number;
    users_with_code_sparkline?: number[];
    referred_users: number;
    referred_users_change: number;
    referred_users_sparkline?: number[];
    discounts_used: number;
    discounts_used_change: number;
    discounts_used_sparkline?: number[];
    bonus_points: number;
    bonus_points_change: number;
    bonus_points_sparkline?: number[];
    completed_conversions: number;
    completed_conversions_change: number;
    completed_conversions_sparkline?: number[];
    revenue_generated: number;
    revenue_generated_change: number;
    revenue_generated_sparkline?: number[];
  };
  settings: {
    is_enabled: boolean;
    referrer_bonus_points: number;
    referee_discount_amount: number;
    referrer_conversion_bonus: number;
    referee_conversion_bonus: number;
    points_expiry_days: number | null;
    bonus_cap_per_referrer: number | null;
    allowed_channels: string[];
  };
  channels: Array<{ channel: string; percent: number; conversions: number; roi: number; color: string }>;
  top_referrers: Array<{
    rank: number; user_id: string; name: string; email: string; referral_code: string | null;
    referees: number; conversions: number; bonus_points: number; revenue_generated: number;
  }>;
  recent_conversions: Array<{
    id: string; referee_name: string; referee_email: string; order_id: string | null;
    date: string | null; discount_used: number; status: string;
  }>;
  watchlist: Array<{ id: string; message: string; count: number; severity: string }>;
  trends: Array<{ date: string; conversions: number; revenue: number }>;
  impact: Array<{ indicator: string; referred: number; non_referred: number; difference: number }>;
  popular_codes: Array<{ code: string; uses: number; conversions: number; roi: number }>;
  total_revenue: number;
  source: string;
}

export interface BackendReviewsDashboardResponse {
  kpis: {
    avg_rating: number; avg_rating_change: number; avg_rating_sparkline?: number[];
    total_reviews: number; total_reviews_change: number; total_reviews_sparkline?: number[];
    five_star: number; five_star_change: number; five_star_sparkline?: number[];
    low_star: number; low_star_change: number; low_star_sparkline?: number[];
    response_rate: number; response_rate_change: number; response_rate_sparkline?: number[];
    pending_reviews: number; pending_reviews_change: number; pending_reviews_sparkline?: number[];
    positive_sentiment: number; positive_sentiment_change: number; positive_sentiment_sparkline?: number[];
    churn_risk: number; churn_risk_change: number; churn_risk_sparkline?: number[];
  };
  reviews: Array<{
    id: string; client_name: string; client_id: string; review_type: string; review_type_label: string;
    rating: number; comment: string; source: string; date: string | null;
    status: string; status_label: string; partner_name?: string | null; order_id?: string | null;
  }>;
  rating_distribution: Array<{ stars: number; count: number; percent: number; change: number; color: string }>;
  channels: Array<{ channel: string; count: number; percent: number; color: string }>;
  review_types: Array<{ review_type: string; count: number; avg_rating: number; percent: number }>;
  top_partners: Array<{ partner_id: string; partner_name: string; avg_rating: number; review_count: number }>;
  top_drivers: Array<{ driver_id: string; driver_name: string; avg_rating: number; review_count: number }>;
  negative_queue: Array<{ id: string; author: string; problem: string; date: string | null; priority: string }>;
  sentiment: Array<{ sentiment: string; count: number; percent: number; color: string }>;
  issues: Array<{ issue: string; tickets: number; variation: number; impact: string }>;
  agents: Array<{ agent_id: string; agent_name: string; reviews_handled: number; avg_response_minutes: number; satisfaction: number }>;
  insights: Array<{ id: string; text: string; category: string }>;
  word_cloud: Array<{ word: string; weight: number; color: string }>;
  trends: Array<{ date: string; avg_rating: number; volume: number }>;
  source: string;
}

export interface BackendClaimsDashboardResponse {
  kpis: {
    open_claims: number; open_claims_change: number; open_claims_sparkline?: number[];
    critical_claims: number; critical_claims_change: number; critical_claims_sparkline?: number[];
    active_disputes: number; active_disputes_change: number; active_disputes_sparkline?: number[];
    refund_exposure: number; refund_exposure_change: number; refund_exposure_sparkline?: number[];
    sla_compliance: number; sla_compliance_change: number; sla_compliance_sparkline?: number[];
    avg_resolution_hours: number; avg_resolution_change: number; avg_resolution_sparkline?: number[];
    resolved_this_month: number; resolved_change: number; resolved_sparkline?: number[];
    amount_at_risk: number; amount_at_risk_change: number; amount_at_risk_sparkline?: number[];
  };
  claims: Array<{
    id: string; claim_number: string; title: string; ai_summary: string;
    client_name: string; category: string; category_label: string;
    priority: string; priority_label: string; status: string; status_label: string;
    financial_impact: number; sla_label: string; sla_state: string;
    sla_minutes_remaining: number | null; updated_at: string | null; partner_name?: string | null;
  }>;
  distribution: Array<{ category: string; count: number; percent: number; color: string }>;
  sla: { in_sla: number; at_risk: number; breached: number; compliance_percent: number; by_category: Array<Record<string, unknown>> };
  workflow: Array<{ stage: string; stage_label: string; claims: BackendClaimsDashboardResponse['claims'] }>;
  root_causes: Array<{ cause: string; occurrences: number; trend: number; impact: string }>;
  heatmap: Array<{ zone: string; claims: number; density: number }>;
  partner_risks: Array<{ partner_id: string; partner_name: string; claim_count: number; avg_rating: number; refund_amount: number; risk_score: number }>;
  driver_risks: Array<{ driver_id: string; driver_name: string; incident_count: number; complaints: number; avg_rating: number; risk_score: number }>;
  refunds: {
    pending_count: number; pending_amount: number; approved_count: number; approved_amount: number;
    paid_count: number; paid_amount: number; rejected_count: number; rejected_amount: number; total_exposure: number;
  };
  escalations: Array<{ reason: string; severity: string; claim_id?: string; count?: number }>;
  source: string;
}

export interface BackendCmsDashboardResponse {
  kpis: {
    published_pages: number; published_change: number; published_sparkline?: number[];
    drafts: number; drafts_change: number; drafts_sparkline?: number[];
    scheduled_pages: number; scheduled_change: number; scheduled_sparkline?: number[];
    blog_posts: number; blog_change: number; blog_sparkline?: number[];
    visitors_7d: number; visitors_change: number; visitors_sparkline?: number[];
    conversions_7d: number; conversions_change: number; conversions_sparkline?: number[];
    avg_seo_score: number; seo_change: number; seo_sparkline?: number[];
    revenue_generated: number; revenue_change: number; revenue_sparkline?: number[];
  };
  pages: Array<{
    id: string; slug: string; title: string; page_type: string; page_type_label: string;
    status: string; status_label: string; language: string; updated_at: string | null;
    views_7d: number; seo_score: number; thumbnail_url?: string | null;
  }>;
  site_tree: Array<{ id: string; label: string; slug: string; children?: Array<{ id: string; label: string; slug: string }> }>;
  publication_status: Array<{ status: string; label: string; count: number; percent: number; color: string }>;
  seo_score: number;
  seo_checklist: Array<Record<string, unknown>>;
  top_pages: Array<{ page_id: string; title: string; slug: string; views: number; percent: number }>;
  recent_revisions: Array<{ id: string; page_title: string; action: string; user_name: string; created_at: string | null }>;
  languages: Array<{ language: string; label: string; page_count: number }>;
  templates: Array<{ key: string; label: string; description: string; preview_url?: string | null }>;
  ai_suggestions: Array<{ id: string; text: string; category: string }>;
  recent_media: Array<{ id: string; filename: string; file_url: string; mime_type?: string | null; size?: number | null; thumbnail_url?: string | null }>;
  source: string;
}

export interface BackendBlogDashboardResponse {
  kpis: {
    published_posts: number; published_change: number; published_sparkline?: number[];
    drafts: number; drafts_change: number; drafts_sparkline?: number[];
    scheduled_posts: number; scheduled_change: number; scheduled_sparkline?: number[];
    monthly_views: number; monthly_views_change: number; monthly_views_sparkline?: number[];
    leads_generated: number; leads_change: number; leads_sparkline?: number[];
    conversions: number; conversions_change: number; conversions_sparkline?: number[];
    avg_seo_score: number; seo_change: number; seo_sparkline?: number[];
  };
  posts: Array<{
    id: string; slug: string; title: string; excerpt: string;
    author_name: string; author_avatar?: string | null;
    category: string; category_color: string;
    status: string; status_label: string;
    seo_score: number; views_count: number; comments_count: number;
    published_at: string | null; featured_image?: string | null;
  }>;
  categories: Array<{ id: string; name: string; slug: string; post_count: number; color: string }>;
  tags: Array<{ id: string; name: string; slug: string; post_count: number }>;
  seo_distribution: Array<{ label: string; count: number; percent: number; color: string }>;
  top_posts: Array<{ post_id: string; title: string; views: number; ctr: number; leads: number; seo_score: number }>;
  trends: Array<{ date: string; views: number; leads: number }>;
  ai_suggestions: Array<{ id: string; text: string; category: string }>;
  calendar: Array<{ date: string; post_count: number }>;
  source: string;
}

export interface BackendPaymentGatewaysDashboardResponse {
  kpis: {
    revenue_trend: number; revenue_trend_sparkline?: number[];
    revenue_today: number; revenue_today_change: number; revenue_today_tx: number;
    revenue_week: number; revenue_week_change: number; revenue_week_tx: number;
    revenue_month: number; revenue_month_change: number; revenue_month_tx: number;
    commissions_due: number; commissions_due_ops: number;
    commissions_paid: number; commissions_paid_ops: number;
    cash_in_transit: number; cash_in_transit_ops: number;
  };
  gateways: Array<{ id: string; slug: string; name: string; channel: string; logo_key: string | null; status: string; status_label: string; volume: number; revenue: number; commission: number; success_rate: number; last_incident_at: string | null }>;
  revenue_distribution: Array<{ label: string; amount: number; percent: number; color: string; trend: number }>;
  channel_performance: Array<{ channel: string; delivery_rate: number; success_rate: number; failure_rate: number; avg_time_ms: number; latency_ms: number }>;
  transactions: Array<{ id: string; reference: string; client_name: string; gateway_slug: string; gateway_name: string; amount: number; currency: string; status: string; status_label: string; created_at: string | null }>;
  cash_flow: { cash_received: number; cash_withdrawn: number; cash_in_transit: number; cash_net: number; sparkline_7d?: number[]; sparkline_30d?: number[]; sparkline_90d?: number[] };
  commissions: { generated: number; paid: number; pending: number; cancelled: number; distribution: Array<{ label: string; amount: number; percent: number; color: string }> };
  incidents: Array<{ id: string; incident_type: string; title: string; severity: string; gateway_slug: string | null; impact: string | null; occurred_at: string | null }>;
  success_rate_trend: Array<{ label: string; rate: number }>;
  top_partners: Array<{ name: string; revenue: number; transactions: number; avg_basket: number }>;
  settlements: Array<{ id: string; gateway_slug: string; gateway_name: string; scheduled_at: string | null; amount: number; status: string; status_label: string }>;
  webhooks: Array<{ id: string; gateway_slug: string; endpoint: string; last_call_at: string | null; success_count: number; error_count: number; retry_count: number; events: string[] }>;
  reconciliations: Array<{ id: string; reference: string; provider_amount: number | null; internal_amount: number | null; status: string; status_label: string; gateway_slug: string | null }>;
  provider_health: Array<{ gateway_slug: string; name: string; uptime: number; latency_ms: number; error_rate: number; success_rate: number; status: string }>;
  refunds: Array<{ id: string; client_name: string; amount: number; reason: string | null; status: string; gateway_slug: string | null }>;
  fraud: { score: number; repeated_payments: number; suspicious_amounts: number; abusive_refunds: number; multiple_attempts: number };
  source: string;
}

export interface BackendSmsDashboardResponse {
  kpis: {
    sent_today: number; sent_today_change: number; sent_today_sparkline?: number[];
    delivery_rate: number; delivery_rate_change: number; delivery_rate_sparkline?: number[];
    failure_rate: number; failure_rate_change: number; failure_rate_sparkline?: number[];
    cost_today: number; cost_today_change: number; cost_today_sparkline?: number[];
    credits_available: number; credits_change: number; credits_sparkline?: number[];
    active_campaigns: number; active_campaigns_change: number;
    otp_success_rate: number; otp_success_change: number; otp_success_sparkline?: number[];
    monthly_volume: number; monthly_volume_change: number; monthly_volume_sparkline?: number[];
  };
  operator_distribution: Array<{ slug: string; name: string; volume: number; percent: number; cost: number; delivery_rate: number; color: string }>;
  messages: Array<{ id: string; reference: string; recipient_name: string | null; phone_number: string; sender_name: string | null; message_type: string; message_type_label: string; status: string; status_label: string; operator_slug: string | null; operator_name: string | null; cost: number; sent_at: string | null }>;
  operator_performance: Array<{ slug: string; name: string; delivery_rate: number; failure_rate: number; avg_delivery_ms: number; cost: number; volume: number }>;
  delivery_status: Array<{ label: string; count: number; percent: number; color: string }>;
  campaigns: Array<{ id: string; name: string; campaign_type: string; type_label: string; status: string; status_label: string; audience: string | null; sent_count: number; delivered_count: number; reply_count: number; scheduled_at: string | null }>;
  templates: Array<{ id: string; name: string; category: string; category_label: string; content: string; active: boolean; usage_count: number; delivery_rate: number }>;
  senders: Array<{ id: string; name: string; sender_id: string; approved: boolean; active: boolean; approval_status: string; approval_label: string; volume: number; delivery_rate: number }>;
  credits: { current_credits: number; monthly_consumption: number; avg_cost_per_sms: number; auto_recharge: boolean; alert_threshold: number };
  credit_ledger: Array<{ id: string; movement_type: string; movement_label: string; amount: number; balance_after: number; note: string | null; created_at: string | null }>;
  otp_kpis: { sent: number; validated: number; success_rate: number; avg_validation_sec: number };
  otp_records: Array<{ id: string; phone_number: string; code_masked: string; status: string; status_label: string; created_at: string | null; expires_at: string | null }>;
  alerts: Array<{ id: string; alert_type: string; title: string; severity: string; count: number }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  activities: Array<{ id: string; message: string; activity_type: string; created_at: string | null }>;
  webhooks: Array<{ id: string; endpoint: string; secret_masked: string | null; last_call_at: string | null; success_count: number; error_count: number; consecutive_errors: number }>;
  settings: { auto_recharge: boolean; alert_threshold: number; default_sender: string; providers: string[] };
  logs: Array<{ id: string; reference: string | null; phone_number: string | null; event_type: string; status: string | null; provider_id: string | null; created_at: string | null }>;
  source: string;
}

export interface BackendAdminMgmtDashboardResponse {
  kpis: {
    total_admins: number; total_admins_change: number; total_admins_sparkline?: number[];
    super_admins: number; super_admins_change: number;
    active_admins: number; active_admins_change: number;
    roles_count: number; roles_change: number;
    active_sessions: number; active_sessions_change: number;
    pending_invitations: number; pending_invitations_change: number;
  };
  admins: Array<{ id: string; name: string; email: string; phone: string | null; role_slug: string; role_label: string; status: string; status_label: string; two_fa_enabled: boolean; last_login_at: string | null; avatar_url: string | null }>;
  roles: Array<{ id: string; slug: string; name: string; description: string | null; user_count: number; permissions_count: number; created_at_label: string | null }>;
  rbac_matrix: Array<{ role_slug: string; resource: string; can_view: boolean; can_create: boolean; can_update: boolean; can_delete: boolean; can_export: boolean }>;
  rbac_resources: string[];
  invitations: Array<{ id: string; email: string; role_slug: string; role_label: string; invited_by: string | null; status: string; expires_at: string | null; created_at: string | null }>;
  sessions: Array<{ id: string; user_name: string; user_email: string; ip_address: string | null; city: string | null; device: string | null; browser: string | null; is_active: boolean; last_seen_at: string | null }>;
  security: { active_sessions: number; logins_24h: number; login_failures: number; two_fa_pct: number };
  activity_logs: Array<{ id: string; occurred_at: string | null; actor_name: string; action: string; action_label: string; target: string | null; ip_address: string | null; result: string; result_label: string }>;
  audit_logs: Array<{ id: string; occurred_at: string | null; actor_name: string; resource_type: string; resource_id: string | null; old_state: Record<string, unknown> | null; new_state: Record<string, unknown> | null }>;
  security_alerts: Array<{ id: string; alert_type: string; title: string; severity: string; count: number }>;
  role_distribution: Array<{ role_slug: string; role_label: string; count: number; percent: number; color: string }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  read_only: boolean;
  source: string;
}

export interface BackendRbacDashboardResponse {
  kpis: {
    roles_count: number; roles_change: number; roles_sparkline?: number[];
    permissions_count: number; permissions_change: number; permissions_sparkline?: number[];
    affected_users: number; affected_users_change: number; affected_users_sparkline?: number[];
    super_admins: number; super_admins_change: number;
    changes_30d: number; changes_30d_change: number; changes_30d_sparkline?: number[];
    security_alerts: number; security_alerts_change: number; security_alerts_sparkline?: number[];
  };
  roles: Array<{ id: string; slug: string; name: string; description: string | null; user_count: number; permissions_count: number; created_at_label: string | null; is_system: boolean; status: string }>;
  permissions: Array<{ id: string; slug: string; module: string; action: string; label: string; description: string | null; risk_level: string; risk_label: string }>;
  matrix: Array<{ role_slug: string; module: string; can_view: boolean; can_create: boolean; can_update: boolean; can_delete: boolean; can_export: boolean; can_validate: boolean; can_approve: boolean; access_level: string }>;
  matrix_modules: string[];
  matrix_actions: string[];
  user_assignments: Array<{ id: string; name: string; email: string; role_slug: string; role_label: string; custom_permissions: string[]; last_login_at: string | null; two_fa_enabled: boolean; status: string; status_label: string }>;
  user_overrides: Array<{ id: string; user_email: string; user_name: string; role_slug: string; permission_slug: string; grant_type: string; grant_type_label: string; access_level: string }>;
  temporary_permissions: Array<{ id: string; user_email: string; user_name: string; permission_slug: string; permission_label: string; granted_by: string | null; expires_at: string | null }>;
  audit_logs: Array<{ id: string; actor_name: string; actor_email: string | null; permission_slug: string; action: string; old_value: string | null; new_value: string | null; ip_address: string | null; occurred_at: string | null }>;
  history: Array<{ id: string; event_type: string; event_label: string; actor_name: string; target: string | null; occurred_at: string | null }>;
  risk_alerts: Array<{ id: string; alert_type: string; title: string; severity: string; severity_label: string; user_email: string | null }>;
  security_policies: Array<{ policy_key: string; policy_label: string; policy_value: string | null; enabled: boolean }>;
  tenants: Array<{ id: string; slug: string; name: string; user_count: number; role_count: number; status: string }>;
  role_distribution: Array<{ role_slug: string; role_label: string; count: number; percent: number; color: string }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  read_only: boolean;
  source: string;
}

export interface BackendActivityLogDashboardResponse {
  kpis: {
    total_activities: number; total_change: number; total_sparkline?: number[];
    admin_activities: number; admin_change: number;
    partner_activities: number; partner_change: number;
    driver_activities: number; driver_change: number;
    system_activities: number; system_change: number;
    anomalies: number; anomalies_change: number;
  };
  events: Array<{
    id: string; event_id: string; occurred_at: string | null;
    actor_id: string | null; actor_type: string; actor_type_label: string;
    actor_name: string; actor_role: string | null;
    action: string; action_label: string | null; description: string | null;
    resource_type: string; resource_id: string | null; reference: string | null;
    corridor: string; corridor_label: string;
    severity: string; severity_label: string;
    status: string; status_label: string; impact: string | null;
    ip_address: string | null; user_agent: string | null;
    device: string | null; browser: string | null; os_name: string | null;
    before_state: Record<string, unknown> | null; after_state: Record<string, unknown> | null;
    corridors_impacted: string[]; is_anomaly: boolean;
  }>;
  live_events: BackendActivityLogDashboardResponse['events'];
  anomalies: BackendActivityLogDashboardResponse['events'];
  heatmap: Array<{ day: number; hour: number; count: number }>;
  top_activities: Array<{ label: string; count: number; percent: number; color: string }>;
  corridor_health: Array<{ corridor: string; corridor_label: string; events: number; anomalies: number; coherence: string; coherence_label: string; latency_ms: number | null }>;
  actor_distribution: Array<{ actor_type: string; actor_label: string; count: number; percent: number }>;
  severity_distribution: Array<{ severity: string; severity_label: string; count: number }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  total: number;
  sensitive_access: boolean;
  read_only: boolean;
  source: string;
}

export interface BackendIntegrationsDashboardResponse {
  kpis: {
    api_calls_today: number; api_calls_today_change: number; api_calls_today_sparkline?: number[];
    webhooks_received: number; webhooks_received_change: number; webhooks_received_sparkline?: number[];
    webhooks_sent: number; webhooks_sent_change: number; webhooks_sent_sparkline?: number[];
    success_rate: number; success_rate_change: number; success_rate_sparkline?: number[];
    failed_events: number; failed_events_change: number; failed_events_sparkline?: number[];
    active_integrations: number; active_integrations_change: number; active_integrations_sparkline?: number[];
    api_keys_count: number; api_keys_change: number; api_keys_sparkline?: number[];
    avg_response_time_ms: number; avg_response_time_change: number; avg_response_time_sparkline?: number[];
  };
  api_keys: Array<{ id: string; name: string; key_type: string; type_label: string; scope: string; created_by: string | null; last_used_at: string | null; status: string; status_label: string }>;
  webhooks: Array<{ id: string; name: string; url: string; event: string; event_label: string; last_call_at: string | null; success_count: number; failure_count: number; status: string; status_label: string; signed: boolean }>;
  webhook_deliveries: Array<{ id: string; webhook_id: string; webhook_name: string | null; payload: Record<string, unknown> | null; headers: Record<string, string> | null; signature: string | null; response_body: string | null; status: string; duration_ms: number; attempts: number; created_at: string | null }>;
  tracking: Array<{ provider: string; provider_label: string; config_value: string | null; enabled: boolean; health_status: string; health_label: string }>;
  server_side_tracking: { events_relayed_24h: number; success_rate: number; failed_events: number; queue_size: number };
  integrations: Array<{ id: string; name: string; category: string; category_label: string; status: string; status_label: string; last_sync_at: string | null; response_time_ms: number; uptime_pct: number }>;
  logs: Array<{ id: string; occurred_at: string | null; source: string; endpoint: string; log_type: string; user_name: string | null; integration_name: string | null; status: string; status_label: string; response_time_ms: number }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  event_distribution: Array<{ label: string; count: number; percent: number; color: string }>;
  top_endpoints: Array<{ method: string; path: string; calls: number }>;
  security: { api_keys_total: number; api_keys_expired: number; api_keys_revoked: number; webhooks_signed: number; webhooks_unsigned: number; audit_access_count: number; audit_modifications: number; audit_deletions: number };
  alerts: Array<{ id: string; alert_type: string; title: string; severity: string; count: number }>;
  openapi: { version: string; title: string; endpoints_count: number; webhook_events: string[] };
  source: string;
}

export interface BackendEmailDashboardResponse {
  kpis: {
    sent_today: number; sent_today_change: number; sent_today_sparkline?: number[];
    delivery_rate: number; delivery_rate_change: number; delivery_rate_sparkline?: number[];
    open_rate: number; open_rate_change: number; open_rate_sparkline?: number[];
    click_rate: number; click_rate_change: number; click_rate_sparkline?: number[];
    bounces: number; bounces_change: number; bounces_sparkline?: number[];
    unsubscribes: number; unsubscribes_change: number; unsubscribes_sparkline?: number[];
    active_templates: number; active_templates_change: number; active_templates_sparkline?: number[];
    attributed_revenue: number; attributed_revenue_change: number; attributed_revenue_sparkline?: number[];
  };
  messages: Array<{ id: string; reference: string; recipient_email: string; recipient_name: string | null; subject: string; message_type: string; message_type_label: string; template_name: string | null; status: string; status_label: string; open_rate: number | null; click_rate: number | null; sent_at: string | null }>;
  templates: Array<{ id: string; name: string; template_type: string; type_label: string; language: string; subject: string; status: string; usage_count: number; open_rate: number; click_rate: number; version: number }>;
  campaigns: Array<{ id: string; name: string; audience: string | null; status: string; status_label: string; sent_count: number; opened_count: number; clicked_count: number; conversions: number; revenue: number; roi: number }>;
  automations: Array<{ id: string; name: string; trigger_key: string; trigger_label: string; template_name: string | null; status: string; last_run_at: string | null; volume_30d: number; open_rate: number; click_rate: number }>;
  type_distribution: Array<{ label: string; count: number; percent: number; color: string }>;
  domain_performance: Array<{ domain: string; delivery_rate: number; open_rate: number; click_rate: number; bounce_rate: number }>;
  deliverability: Array<{ domain: string; health_status: string; health_label: string; spf: string; dkim: string; dmarc: string; bounce_rate: number; spam_complaints: number; reputation_score: number }>;
  bounces: Array<{ id: string; email: string; bounce_type: string; bounce_type_label: string; reason: string | null; provider_code: string | null; occurred_at: string | null }>;
  unsubscribe_summary: { total: number; campaign: number; marketing: number; preferences_count: number };
  unsubscribes: Array<{ id: string; email: string; unsubscribe_type: string; type_label: string; reason: string | null }>;
  invoice_summary: { sent: number; opened: number; downloaded: number; reminders: number; failures: number };
  invoices: Array<{ id: string; invoice_ref: string; recipient_email: string; status: string; opened: boolean; downloaded: boolean; reminder_count: number }>;
  webhooks: Array<{ id: string; endpoint: string; secret_masked: string | null; last_call_at: string | null; success_count: number; error_count: number; events: string[] }>;
  alerts: Array<{ id: string; alert_type: string; title: string; severity: string; count: number }>;
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  segments: Array<{ slug: string; name: string; size: number }>;
  settings: { provider: string; from_email: string; reply_to: string; marketing_opt_out_required: boolean };
  source: string;
}

export interface BackendWhatsappDashboardResponse {
  kpis: {
    open_conversations: number; open_conversations_change: number; open_conversations_sparkline?: number[];
    messages_today: number; messages_today_change: number; messages_today_sparkline?: number[];
    response_rate: number; response_rate_change: number; response_rate_sparkline?: number[];
    avg_response_time: string; avg_response_time_change: string; avg_response_time_sparkline?: number[];
    active_templates: number; active_templates_change: number; active_templates_sparkline?: number[];
    cost_today: number; cost_today_change: number; cost_today_sparkline?: number[];
    ai_conversations_pct: number; ai_conversations_change: number; ai_conversations_sparkline?: number[];
    satisfaction: number; satisfaction_change: number; satisfaction_sparkline?: number[];
  };
  conversations: Array<{ id: string; client_name: string; phone: string; last_message: string | null; channel: string; assigned_to: string | null; status: string; status_label: string; wait_time_sec: number; wait_time_label: string; created_at: string | null }>;
  live_monitor: { active_conversations: number; waiting_conversations: number; sla_breached: number; escalations: number; available_agents: string[]; ai_active_pct: number; support_backlog: number };
  templates: Array<{ id: string; name: string; category: string; category_label: string; language: string; meta_status: string; meta_status_label: string; usage_count: number; delivery_rate: number }>;
  notifications: Array<{ id: string; event_type: string; event_label: string; template_name: string | null; recipient: string; status: string; status_label: string; created_at: string | null }>;
  campaigns: Array<{ id: string; name: string; campaign_type: string; type_label: string; template_name: string | null; audience: string | null; status: string; sent: number; delivered: number; opened: number; replies: number; clicks: number; conversions: number }>;
  automations: Array<{ id: string; name: string; trigger_type: string; trigger_label: string; status: string; runs_count: number; success_rate: number }>;
  webhooks: Array<{ id: string; endpoint: string; secret_masked: string | null; last_call_at: string | null; success_count: number; error_count: number; retry_count: number; events: string[] }>;
  quality: { quality_rating: string; quality_label: string; messaging_limit: string; phone_status: string; phone_status_label: string; verification_status: string; verification_label: string; alerts: Array<{ type: string; severity: string; message: string }> };
  ai_metrics: { ai_conversations_pct: number; human_escalations: number; ai_confidence: number; resolution_rate: number; resolved_without_human: number; cost_saved: number; satisfaction: number };
  costs: { total_today: number; total_week: number; total_month: number; marketing_cost: number; utility_cost: number; auth_cost: number; cost_per_conversation: number; trend: number; forecast: number; sparkline_day?: number[]; sparkline_week?: number[]; sparkline_month?: number[] };
  analytics: Array<{ key: string; title: string; data: Array<{ label: string; value: number }> }>;
  segments: Array<{ id: string; slug: string; name: string; size: number; engagement: number; conversion: number }>;
  sla: { first_response_avg: string; resolution_avg: string; open_conversations: number; sla_breached: number; first_response_status: string; resolution_status: string; open_status: string; breached_status: string };
  source: string;
}

export interface BackendNotificationsDashboardResponse {
  kpis: {
    total_sent: number; total_sent_change: number; total_sent_sparkline?: number[];
    delivery_rate: number; delivery_rate_change: number; delivery_rate_sparkline?: number[];
    email_open_rate: number; email_open_rate_change: number; email_open_rate_sparkline?: number[];
    click_rate: number; click_rate_change: number; click_rate_sparkline?: number[];
    unsubscribes: number; unsubscribes_change: number; unsubscribes_sparkline?: number[];
    errors: number; errors_change: number; errors_sparkline?: number[];
  };
  notifications: Array<{
    id: string; title: string; message_preview: string; channel: string; channel_label: string;
    event_type: string; event_label: string; audience: string; status: string; status_label: string;
    sent_at: string | null; delivery_rate: number; open_rate?: number | null; click_rate?: number | null; zone?: string | null;
  }>;
  channel_distribution: Array<{ channel: string; label: string; count: number; percent: number; color: string; trend: number }>;
  delivery_status: Array<{ label: string; count: number; percent: number; color: string }>;
  top_events: Array<{ event_type: string; label: string; sends: number }>;
  channel_performance: Array<{ channel: string; label: string; delivery_rate: number; open_rate: number; click_rate: number; failures: number }>;
  popular_templates: Array<{ id: string; name: string; channel: string; usage_count: number; delivery_rate: number; open_rate?: number | null }>;
  automations: Array<{ id: string; name: string; trigger_key: string; trigger_label: string; channel: string; status: string; last_run_at: string | null }>;
  activities: Array<{ id: string; activity_type: string; message: string; actor_name: string | null; created_at: string | null }>;
  provider_health: Array<{ channel: string; label: string; provider: string; delivery_rate: number; latency_ms: number; error_count: number; status: string; last_incident_at: string | null }>;
  errors: Array<{ id: string; channel: string; provider: string; error_code: string; message: string; occurrences: number; last_occurrence_at: string | null }>;
  unsubscribes: Array<{ id: string; channel: string; user_email: string | null; user_phone: string | null; reason: string | null; unsubscribed_at: string | null }>;
  segments: Array<{ id: string; name: string; slug: string; size: number; preferred_channel: string | null; engagement_rate: number }>;
  templates: Array<{ id: string; name: string; channel: string; event_type: string; language: string; status: string; usage_count: number; delivery_rate: number; open_rate?: number | null; updated_at: string | null }>;
  source: string;
}

export interface BackendPublicBlogListResponse {
  posts: Array<{
    id: string; slug: string; title: string; excerpt: string;
    author_name: string; author_avatar?: string | null;
    category: string; category_color: string;
    reading_time: number; views_count: number;
    published_at: string | null; featured_image?: string | null;
  }>;
  categories: Array<{ id: string; name: string; slug: string; post_count: number; color: string }>;
  source: string;
}

export interface BackendPublicBlogPostResponse {
  id: string; slug: string; title: string; excerpt: string;
  author_name: string; author_avatar?: string | null;
  category: string; category_color: string;
  reading_time: number; views_count: number;
  published_at: string | null; featured_image?: string | null;
  content: string;
  tags: string[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface BackendSupportDashboardResponse {
  kpis: {
    open_tickets: number; open_tickets_change: number; open_tickets_sparkline?: number[];
    new_tickets: number; new_tickets_change: number; new_tickets_sparkline?: number[];
    waiting_client: number; waiting_client_change: number; waiting_client_sparkline?: number[];
    waiting_support: number; waiting_support_change: number; waiting_support_sparkline?: number[];
    sla_compliance: number; sla_compliance_change: number; sla_compliance_sparkline?: number[];
    critical_tickets: number; critical_tickets_change: number; critical_tickets_sparkline?: number[];
    satisfaction: number; satisfaction_change: number; satisfaction_sparkline?: number[];
    avg_response_minutes: number; avg_response_change: number; avg_response_sparkline?: number[];
  };
  tickets: Array<{
    id: string; ticket_code: string; title: string; ai_summary: string;
    client_name: string; client_id: string; category: string; category_label: string;
    priority: string; priority_label: string; status: string; status_label: string;
    sla_label: string; sla_status: string; sla_minutes_remaining: number | null;
    updated_at: string | null; agent_name: string | null; channel: string;
    order_id?: string | null; sentiment?: string | null;
  }>;
  sla: { within_sla: number; at_risk: number; breached: number; avg_resolution_minutes: number; compliance_percent: number };
  queue: Array<{ status: string; status_label: string; tickets: BackendSupportDashboardResponse['tickets'] }>;
  ai_triage: Array<{
    ticket_id: string; ticket_code: string; client_name: string; subject: string;
    sentiment: string; predicted_category: string; priority: string;
    refund_risk: string; churn_risk: string; suggested_reply: string;
  }>;
  sentiment: Array<{ sentiment: string; count: number; percent: number; color: string }>;
  top_issues: Array<{ issue: string; tickets: number; variation: number; impact: string }>;
  agents: Array<{ agent_id: string; agent_name: string; tickets_handled: number; avg_response_minutes: number; sla_percent: number; satisfaction: number }>;
  escalations: Array<{ id: string; label: string; count: number; severity: string }>;
  trends: Array<{ date: string; new_tickets: number; resolved_tickets: number; open_tickets: number }>;
  channels: Array<{ channel: string; count: number; percent: number; color: string }>;
  source: string;
}

export interface BackendUsersDashboardResponse {
  kpis: {
    total_users: number; total_users_change: number; total_users_sparkline?: number[];
    new_signups: number; new_signups_change: number; new_signups_sparkline?: number[];
    active_users: number; active_users_change: number; active_users_sparkline?: number[];
    inactive_users: number; inactive_users_change: number; inactive_users_sparkline?: number[];
    partners: number; partners_change: number; partners_sparkline?: number[];
    drivers: number; drivers_change: number; drivers_sparkline?: number[];
  };
  users: Array<{
    id: string; name: string; email: string; phone: string;
    role: string; role_label: string; status: string; status_label: string;
    loyalty_points: number; referral_code: string | null;
    created_at: string | null; last_login_at: string | null;
  }>;
  role_distribution: Array<{ role: string; count: number; percent: number; color: string }>;
  status_breakdown: Array<{ status: string; count: number; percent: number }>;
  growth: Array<{ date: string; new_signups: number; active_users: number }>;
  acquisition_sources: Array<{ source: string; count: number; percent: number; color: string }>;
  top_zones: Array<{ zone: string; users: number; percent: number }>;
  recent_activity: Array<{ id: string; user_name: string; action: string; detail: string; device: string; date: string | null }>;
  devices: Array<{ device: string; count: number; percent: number; color: string }>;
  loyalty: {
    users_with_points: number; users_with_points_percent: number;
    total_points: number; average_balance: number;
    top_holders: Array<{ name: string; points: number }>;
  };
  security: {
    two_fa_enabled_percent: number; verified_accounts_percent: number;
    unverified_accounts_percent: number; suspicious_logins: number;
  };
  watchlist: Array<{ id: string; message: string; count: number; severity: string }>;
  top_users: Array<{ user_id: string; name: string; orders: number; revenue: number; loyalty_points: number; last_activity: string | null }>;
  segments: Array<{ segment: string; segment_key: string; count: number; percent: number }>;
  value_users: Array<{ user_id: string; name: string; clv: number; avg_basket: number; frequency: number; last_order: string | null }>;
  source: string;
}

export interface BackendCampaignDashboardResponse {
  kpis: {
    active_campaigns: number; active_campaigns_change: number; active_campaigns_sparkline?: number[];
    messages_sent: number; messages_sent_change: number; messages_sent_sparkline?: number[];
    open_rate: number; open_rate_change: number; open_rate_sparkline?: number[];
    click_rate: number; click_rate_change: number; click_rate_sparkline?: number[];
    conversions: number; conversions_change: number; conversions_sparkline?: number[];
    attributed_revenue: number; attributed_revenue_change: number; attributed_revenue_sparkline?: number[];
  };
  campaigns: Array<{
    id: string; name: string; channel: string; audience: string | null; segment: string | null;
    status: string; messages_sent: number; opens: number; open_rate: number; clicks: number;
    click_rate: number; conversions: number; conversion_rate: number; roi: number; revenue: number; scheduled_at?: string | null;
  }>;
  channels: Array<{ channel: string; percent: number; messages: number; conversions: number; revenue: number; color: string }>;
  funnel: Array<{ stage: string; count: number; rate: number }>;
  trends: Array<{ date: string; messages: number; conversions: number; revenue: number }>;
  top_campaigns: Array<{ id: string; name: string; channel: string; roi: number; conversions: number; revenue: number }>;
  segments: Array<{ segment: string; segment_key: string; audience_size: number; conversion_rate: number; revenue: number }>;
  automations: Array<{ id: string; name: string; trigger: string; status: string; conversions: number; revenue: number }>;
  calendar: Array<{ id: string; title: string; date: string; time: string; channel: string; audience: string | null }>;
  roi: { budget_spent: number; revenue_generated: number; global_roi: number; cost_per_acquisition: number; customer_lifetime_value: number; roas: number };
  watchlist: Array<{ id: string; message: string; count: number; severity: string }>;
  source: string;
}

export interface BackendGrowthDashboardResponse {
  acquisition: number;
  activation: number;
  conversion: number;
  retention: number;
  referral: number;
  revenue: number;
  rfm_segments: Array<{
    segment: string; segment_key: string; audience_size: number;
    recency_score: number; frequency_score: number; monetary_score: number;
    recommended_action: string;
  }>;
  automations: Array<{
    key: string; name: string; trigger: string; channels: string[];
    eligible_customers: number; status: string; next_action: string;
  }>;
  promo_fraud_risks: Array<{
    promo_code: string; risk_score: number; severity: string;
    signals: string[]; recommended_action: string;
  }>;
  trending_offers: Array<{
    id: string; title: string; offer_type: string; score: number; ctr: number;
    conversion_rate: number; revenue: number; placements: string[];
  }>;
  roi: {
    promo_revenue: number; loyalty_revenue: number; referral_revenue: number;
    remarketing_revenue: number; reactivation_revenue: number;
    estimated_cac: number; estimated_ltv: number; estimated_roi: number;
  };
  source: string;
}

export interface ReferralAdminOverview {
  total_users_with_referral_codes: number;
  total_referred_users: number;
  total_referred_signed_up_only: number;
  total_referred_pending_bonus: number;
  total_completed_referral_conversions: number;
  total_referral_discounts_used: number;
  total_referral_bonuses_awarded: number;
  total_referrer_bonus_points_awarded: number;
  top_referrers: ReferralTopReferrer[];
  watchlist: Array<{
    referrer_user_id: string;
    referrer_user_name: string;
    referrer_user_email: string;
    referral_code?: string | null;
    total_referred_users: number;
    signed_up_only_count: number;
    pending_bonus_count: number;
    completed_conversion_count: number;
    attention_reason: string;
    review_status?: string | null;
    review_note?: string | null;
    reviewed_by_user_id?: string | null;
    reviewed_at?: string | null;
  }>;
  recent_conversions: Array<{
    referred_user_id: string;
    referred_user_name: string;
    referred_user_email: string;
    referrer_user_id: string;
    referrer_user_name: string;
    referrer_user_email: string;
    referral_code?: string | null;
    referral_discount_used_at?: string | null;
    referral_bonus_awarded_at?: string | null;
  }>;
}

export interface AdminRefundRequest {
  id: string;
  order_id: string;
  order_number?: string | null;
  payment_intent_id: string;
  customer_id: string;
  customer_name?: string | null;
  dispute_id?: string | null;
  reason_code: string;
  reason_text?: string | null;
  requested_amount: number;
  approved_amount?: number | null;
  status: string;
  reviewed_by_user_id?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  attachments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerSupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface CustomerSupportAttachment {
  id: string;
  ticket_id: string;
  uploaded_by: string;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  size?: number | null;
  created_at: string;
}

export interface CustomerSupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string | null;
  order_id?: string | null;
  partner_id?: string | null;
  order_number?: string | null;
  payment_status?: string | null;
  created_at: string;
  updated_at: string;
  messages: CustomerSupportMessage[];
  attachments: CustomerSupportAttachment[];
}

export interface CustomerClaim {
  id: string;
  claim_number: string;
  customer_id: string;
  order_id?: string | null;
  partner_id?: string | null;
  order_number?: string | null;
  payment_status?: string | null;
  type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PublicReview {
  id: string;
  order_id: string;
  user_id: string;
  partner_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  partner_name?: string | null;
  customer_first_name?: string | null;
}

export interface SubmitReviewRequest {
  order_id: string;
  rating: number;
  comment?: string;
  title?: string;
}

export interface SubmitReviewResponse extends PublicReview {}

export interface AdminSupportTicket {
  id: string;
  user_id: string;
  user_name?: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string | null;
  subcategory?: string | null;
  assigned_to?: string | null;
  response_time_minutes?: number | null;
  resolution_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
  messages: AdminSupportMessage[];
}

export interface PaymentIntent {
  id: string;
  order_id: string;
  customer_id: string;
  payment_method: string;
  currency: string;
  amount_expected: number;
  amount_paid: number;
  status: string;
  provider_name?: string | null;
  provider_reference?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  payment_metadata?: Record<string, unknown> | null;
}

export interface PaymentIntentCreateRequest {
  order_id: string;
  payment_method: string;
  amount_expected: number;
  currency?: string;
  provider_name?: string | null;
  expires_at?: string | null;
  payment_metadata?: Record<string, unknown> | null;
}

export interface OrderStatusUpdateRequest {
  new_status: string;
  change_reason?: string;
}

export interface LogisticsTask {
  id: string;
  order_id: string;
  order_number?: string | null;
  driver_id?: string | null;
  task_type: 'pickup' | 'delivery';
  status:
    | 'pending'
    | 'open_market'
    | 'claimed'
    | 'driver_assigned'
    | 'accepted'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired';
  pickup_location_type?: string | null;
  dropoff_location_type?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_contact_name?: string | null;
  pickup_contact_phone?: string | null;
  pickup_address_label?: string | null;
  pickup_address_line?: string | null;
  pickup_commune?: string | null;
  delivery_address_label?: string | null;
  delivery_address_line?: string | null;
  delivery_commune?: string | null;
  partner_name?: string | null;
  scheduled_at?: string | null;
  assigned_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  proof_photo_url?: string | null;
  proof_note?: string | null;
  claimed_by_company_id?: string | null;
  market_visible?: boolean;
  market_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsDriver {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string | null;
  license_number?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_available: boolean;
  rating_avg: number | string;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface LogisticsTaskListResponse {
  tasks: LogisticsTask[];
  total: number;
  page: number;
  page_size: number;
}

export interface LogisticsDriverListResponse {
  drivers: LogisticsDriver[];
  total: number;
  page: number;
  page_size: number;
}

export interface LogisticsDriverCreateRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type?: string | null;
  license_number?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  is_available?: boolean;
}

export interface LogisticsVehicle {
  id: string;
  plate: string;
  type: 'moto' | 'car' | 'van';
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'delayed' | 'failed' | 'cancelled';
  driverId?: string;
  assignedDriverName?: string;
  zone: string;
  location: string;
  lastKnownLocation?: string;
  mileageKm: number;
  insuranceExpiresAt: string;
  maintenance: {
    status: 'ok' | 'scheduled' | 'in_progress' | 'overdue';
    nextServiceAtKm: number;
    notes?: string;
  };
}

export interface LogisticsVehicleUpsertRequest {
  plate?: string;
  type?: LogisticsVehicle['type'];
  status?: LogisticsVehicle['status'];
  driver_id?: string | null;
  assigned_driver_name?: string | null;
  zone?: string;
  location?: string;
  last_known_location?: string | null;
  mileage_km?: number;
  insurance_expires_at?: string | null;
  maintenance_status?: LogisticsVehicle['maintenance']['status'];
  maintenance_next_service_km?: number;
  maintenance_notes?: string | null;
}

export interface LogisticsVehicleListResponse {
  vehicles: LogisticsVehicle[];
}

export interface LogisticsTrip {
  id: string;
  taskId: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'delayed' | 'failed' | 'cancelled';
  origin: string;
  destination: string;
  customerName?: string;
  driverName?: string;
  vehiclePlate?: string;
  estimatedDurationMinutes?: number;
  etaMinutes?: number;
  distanceKm?: number;
}

export interface LogisticsTripListResponse {
  trips: LogisticsTrip[];
}

export interface LogisticsTrackingPoint {
  id: string;
  tripId: string;
  kind: 'vehicle' | 'driver' | 'pickup' | 'delivery';
  label: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'delayed' | 'failed' | 'cancelled';
  driverName?: string;
  vehiclePlate?: string;
}

export interface LogisticsTrackingPointListResponse {
  tracking_points: LogisticsTrackingPoint[];
}

export interface LogisticsMaintenanceEvent {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  title: string;
  type: 'insurance' | 'repair' | 'preventive' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'done' | 'overdue';
  dueDate: string;
  cost: number;
  nextControlAt: string;
  alert?: 'insurance_expired' | 'vehicle_broken' | 'maintenance_overdue';
  vehicleAvailable: boolean;
  costEstimate?: number;
}

export interface LogisticsMaintenanceEventListResponse {
  maintenance_events: LogisticsMaintenanceEvent[];
}

export interface MarketplaceCompany {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  is_active: boolean;
  supports_pickup: boolean;
  supports_delivery: boolean;
  rating_avg: number | string;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCompanyListResponse {
  companies: MarketplaceCompany[];
  total: number;
  page: number;
  page_size: number;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private currentUserInFlight: Promise<ApiCurrentUserResponse> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('auth_refresh_token');
    }
  }

  private isMockToken(): boolean {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return !!token?.startsWith('TOKEN-');
  }

  /** True when a real or mock API token is present in storage. */
  hasAuthSession(): boolean {
    this.syncTokensFromStorage();
    return this.isMockToken() || !!this.accessToken;
  }

  private notifySessionCleared() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ler:auth-cleared'));
    }
  }

  private syncTokensFromStorage() {
    if (typeof window === 'undefined') {
      return;
    }

    const storedAccessToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('auth_refresh_token');

    if (storedAccessToken !== this.accessToken) {
      this.accessToken = storedAccessToken;
    }

    if (storedRefreshToken !== this.refreshToken) {
      this.refreshToken = storedRefreshToken;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    this.syncTokensFromStorage();
    if (!this.refreshToken) return false;
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
        if (!response.ok) return false;
        const data = (await response.json()) as LoginResponse;
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
    this.syncTokensFromStorage();

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const isAuthEndpoint = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/refresh') || endpoint.startsWith('/auth/register');
      if (response.status === 401 && !retried && !isAuthEndpoint) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) return this.request<T>(endpoint, options, true);
        this.clearToken();
        this.notifySessionCleared();
      }

      const errorData = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));

      // Extract a human-readable message from FastAPI-style error responses
      let message: string;
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // FastAPI validation error: [{ loc: [...], msg: "...", type: "..." }]
        message = errorData.detail.map((err: any) => err.msg).join('; ');
      } else if (errorData.detail && typeof errorData.detail === 'object') {
        message = JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        message = errorData.message;
      } else {
        message = `HTTP ${response.status}: ${response.statusText}`;
      }

      const err = new Error(message || 'API request failed') as any;
      err.status = response.status;
      err.body = errorData;
      throw err;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('auth_refresh_token', refreshToken);
      }
    }
  }

  clearToken() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
    }
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });
    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async register(data: RegisterRequest): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    const refreshToken = this.refreshToken;
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    this.clearToken();
    return response;
  }

  async getCurrentUser(): Promise<ApiCurrentUserResponse> {
    if (!this.hasAuthSession()) {
      const err = new Error('Not authenticated') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    if (!this.currentUserInFlight) {
      this.currentUserInFlight = this.request<ApiCurrentUserResponse>('/auth/me').finally(() => {
        this.currentUserInFlight = null;
      });
    }
    return this.currentUserInFlight;
  }

  async updateThemePreference(themePreference: 'light' | 'dark' | 'system'): Promise<void> {
    const current = await this.getCurrentUser();
    const profile = current.profile;
    await this.request<ApiCurrentUserResponse>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify({
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        preferred_language: profile?.preferred_language ?? 'fr',
        theme_preference: themePreference,
      }),
    });
  }

  async createAddress(data: CreateAddressRequest): Promise<ApiAddress> {
    return this.request<ApiAddress>('/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminUsers(limit = 200): Promise<AdminUserSummary[]> {
    return this.request<AdminUserSummary[]>(`/users?limit=${limit}`);
  }

  async getRefundRequests(status?: string): Promise<AdminRefundRequest[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<AdminRefundRequest[]>(`/refunds/requests${query}`);
  }

  async approveRefundRequest(requestId: string, approvedAmount: number, notes?: string): Promise<AdminRefundRequest> {
    return this.request<AdminRefundRequest>(`/refunds/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        approved_amount: approvedAmount,
        notes: notes || null,
      }),
    });
  }

  async rejectRefundRequest(requestId: string, reason: string, notes?: string): Promise<AdminRefundRequest> {
    return this.request<AdminRefundRequest>(`/refunds/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        notes: notes || null,
      }),
    });
  }

  async getSupportTickets(): Promise<AdminSupportTicket[]> {
    return this.request<AdminSupportTicket[]>('/support/tickets');
  }

  async createCustomerSupportTicket(data: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
    order_id?: string;
  }): Promise<CustomerSupportTicket> {
    return this.request<CustomerSupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomerSupportTickets(): Promise<CustomerSupportTicket[]> {
    return this.request<CustomerSupportTicket[]>('/support/tickets');
  }

  async getCustomerSupportTicket(ticketId: string): Promise<CustomerSupportTicket> {
    return this.request<CustomerSupportTicket>(`/support/tickets/${ticketId}`);
  }

  async replyCustomerSupportTicket(ticketId: string, content: string): Promise<CustomerSupportTicket> {
    return this.request<CustomerSupportTicket>(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async attachCustomerSupportProof(
    ticketId: string,
    data: { file_url: string; file_name?: string; mime_type?: string; size?: number }
  ): Promise<CustomerSupportAttachment> {
    return this.request<CustomerSupportAttachment>(`/support/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCustomerClaim(data: {
    title: string;
    description: string;
    type?: string;
    order_id?: string;
  }): Promise<CustomerClaim> {
    return this.request<CustomerClaim>('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomerClaims(): Promise<CustomerClaim[]> {
    return this.request<CustomerClaim[]>('/claims');
  }

  async getCustomerClaim(claimId: string): Promise<CustomerClaim> {
    return this.request<CustomerClaim>(`/claims/${claimId}`);
  }

  async submitReview(data: SubmitReviewRequest): Promise<SubmitReviewResponse> {
    return this.request<SubmitReviewResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPublicReviews(params?: { partner_id?: string; limit?: number }): Promise<PublicReview[]> {
    const query = new URLSearchParams();
    if (params?.partner_id) query.set('partner_id', params.partner_id);
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.request<PublicReview[]>(`/reviews/public${suffix}`);
  }

  async getMyReviews(): Promise<PublicReview[]> {
    return this.request<PublicReview[]>('/reviews/me');
  }

  async getCatalogPartners(): Promise<CatalogPartnerSummary[]> {
    return this.request<CatalogPartnerSummary[]>('/catalog/partners');
  }

  async getCatalog(): Promise<CatalogResponse> {
    return this.request<CatalogResponse>('/catalog');
  }

  async getPartnerCatalogServices(
    partnerId: string,
    opts?: { availableOnly?: boolean; activeOnly?: boolean },
  ): Promise<CatalogPartnerService[]> {
    const params = new URLSearchParams();
    if (opts?.availableOnly === false) params.set('available_only', 'false');
    if (opts?.activeOnly === false) params.set('active_only', 'false');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request<CatalogPartnerService[]>(`/catalog/partners/${partnerId}/services${suffix}`);
  }

  async getOrderAddOns(): Promise<OrderAddOnListResponse> {
    return this.request<OrderAddOnListResponse>('/catalog/order-add-ons');
  }

  async getAdminOrderAddOns(): Promise<OrderAddOnListResponse> {
    return this.request<OrderAddOnListResponse>('/admin/order-add-ons');
  }

  async createAdminOrderAddOn(data: {
    slug: string;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<OrderAddOnItem> {
    return this.request<OrderAddOnItem>('/admin/order-add-ons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminOrderAddOn(
    addOnId: string,
    data: Partial<{
      slug: string;
      name: string;
      description: string;
      image_url: string;
      price: number;
      sort_order: number;
      is_active: boolean;
    }>,
  ): Promise<OrderAddOnItem> {
    return this.request<OrderAddOnItem>(`/admin/order-add-ons/${addOnId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deactivateAdminOrderAddOn(addOnId: string): Promise<void> {
    await this.request<void>(`/admin/order-add-ons/${addOnId}`, { method: 'DELETE' });
  }

  async createPartnerCatalogService(
    partnerId: string,
    data: {
      service_category_id: string;
      service_type_id: string;
      base_price: number;
      pricing_mode: string;
      estimated_turnaround_hours: number;
      is_available: boolean;
    },
  ): Promise<CatalogPartnerService> {
    return this.request<CatalogPartnerService>(`/catalog/partners/${partnerId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartnerCatalogService(
    partnerId: string,
    serviceId: string,
    data: Partial<{
      service_category_id: string;
      service_type_id: string;
      base_price: number;
      pricing_mode: string;
      estimated_turnaround_hours: number;
      is_available: boolean;
    }>,
  ): Promise<CatalogPartnerService> {
    return this.request<CatalogPartnerService>(`/catalog/partners/${partnerId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPartnerPricingSummary(partnerId: string): Promise<PartnerPricingSummary> {
    return this.request<PartnerPricingSummary>(`/pricing/partners/${partnerId}/summary`);
  }

  async getPartnerDashboardSummary(partnerId: string): Promise<PartnerDashboardSummaryResponse> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      const partners: any[] = DB.get('partners');
      const p = partners.find((par: any) => par.id === partnerId);
      const partnerOrders = allOrders.filter((o: any) => o.partner?.id === partnerId);
      const pending = partnerOrders.filter((o: any) => o.status === 'AWAITING_CONFIRMATION').length;
      const active = partnerOrders.filter((o: any) => ['CONFIRMED', 'READY_FOR_PICKUP', 'PICKUP', 'PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERY'].includes(o.status)).length;
      const completed = partnerOrders.filter((o: any) => o.status === 'COMPLETED');
      const revenue = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      const avgValue = completed.length > 0 ? revenue / completed.length : 0;
      return {
        orders: {
          pending_new_orders: pending,
          active_orders: active,
          completed_orders_this_month: completed.length,
          revenue_this_month: revenue,
          average_order_value: avgValue,
        },
        pricing: { services_count: 0, rules_count: 0, average_price: 0, min_price: 0, max_price: 0, has_express: false, has_pickup_fee: false, has_delivery_fee: false, has_bulk_discount: false },
        operational_state: { order_intake_status: 'live', accepting_orders: true, has_data_gaps: false },
        partner: { id: partnerId, name: p?.name || '', is_featured: p?.isFeatured || false, currency: p?.currency || 'USD', onboarding: { has_working_hours: !!p?.workingHours, has_services: false, has_video: false, has_promotion: false, completed_steps: 0, total_steps: 5 } },
        meta: { generated_at: new Date().toISOString(), timezone: 'Africa/Kinshasa', source_version: 'mock' },
      };
    }
    return this.request<PartnerDashboardSummaryResponse>(`/partners/${partnerId}/dashboard-summary`);
  }

  async getPartnerOrders(
    partnerId: string,
    params?: {
      status?: string;
      page?: number;
      page_size?: number;
      date_from?: string;
      date_to?: string;
      search?: string;
    }
  ): Promise<PartnerOrdersListResponse> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      let filtered = allOrders.filter((o: any) => o.partner?.id === partnerId);
      if (params?.status) {
        filtered = filtered.filter((o: any) => o.status === params.status);
      }
      const page = params?.page || 1;
      const pageSize = params?.page_size || 100;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);
      return {
        items: paginated,
        total: filtered.length,
        page,
        page_size: pageSize,
        summary: {
          total_orders: filtered.length,
          status_counts: filtered.reduce((acc: Record<string, number>, o: any) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {}),
        },
      };
    }

    const query = params
      ? new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    const endpoint = query
      ? `/partners/${partnerId}/orders?${query}`
      : `/partners/${partnerId}/orders`;
    return this.request<PartnerOrdersListResponse>(endpoint);
  }

  async getPartnerFinancialSummary(partnerId: string): Promise<PartnerFinancialSummaryResponse> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      const partnerOrders = allOrders.filter((o: any) => o.partner?.id === partnerId);
      const completed = partnerOrders.filter((o: any) => o.status === 'COMPLETED');
      const revenue = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      return {
        totals: {
          revenue_total: revenue,
          revenue_last_30_days: revenue,
          completed_orders: completed.length,
          average_order_value: completed.length > 0 ? revenue / completed.length : 0,
        },
        daily_revenue: [],
        transactions: [],
      };
    }
    return this.request<PartnerFinancialSummaryResponse>(`/partners/${partnerId}/financial-summary`);
  }

  async getPartnerInvoiceEligibleOrders(partnerId: string): Promise<PartnerInvoiceEligibleOrdersResponse> {
    if (this.isMockToken()) {
      return { items: [] };
    }
    return this.request<PartnerInvoiceEligibleOrdersResponse>(`/partners/${partnerId}/invoice-eligible-orders`);
  }

  async generatePartnerOrderProforma(orderId: string): Promise<PartnerGeneratedDocument> {
    if (this.isMockToken()) {
      return { document_type: 'proforma', generated_at: new Date().toISOString(), payload: { order_id: orderId, order_number: orderId, currency: 'USD', partner_name: '', partner_address: '', customer_name: '', customer_address: '', generated_at: new Date().toISOString(), document_reference: `PF-${orderId}`, line_items: [], subtotal_amount: 0, discount_amount: 0, total_amount: 0 } };
    }
    return this.request<PartnerGeneratedDocument>(`/partners/orders/${orderId}/proforma`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async generatePartnerOrderInvoice(orderId: string): Promise<PartnerGeneratedDocument> {
    if (this.isMockToken()) {
      return { document_type: 'invoice', generated_at: new Date().toISOString(), payload: { order_id: orderId, order_number: orderId, currency: 'USD', partner_name: '', partner_address: '', customer_name: '', customer_address: '', generated_at: new Date().toISOString(), document_reference: `INV-${orderId}`, line_items: [], subtotal_amount: 0, discount_amount: 0, total_amount: 0 } };
    }
    return this.request<PartnerGeneratedDocument>(`/partners/orders/${orderId}/invoice`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getPartnerOrderDocuments(orderId: string): Promise<PartnerOrderDocumentsResponse> {
    if (this.isMockToken()) {
      return { proforma: null, invoice: null };
    }
    return this.request<PartnerOrderDocumentsResponse>(`/partners/orders/${orderId}/documents`);
  }

  async getPartnerProfileDetail(partnerId: string): Promise<PartnerProfileDetailResponse> {
    if (this.isMockToken()) {
      const partners: any[] = DB.get('partners');
      const p = partners.find((par: any) => par.id === partnerId);
      if (!p) throw new Error('Partner not found');
      return {
        id: p.id,
        name: p.name,
        business_name: p.name,
        email: '',
        phone: '',
        status: 'active',
        is_featured: p.isFeatured,
        is_accepting_orders: true,
        address: p.address,
        city: 'Kinshasa',
        commune: p.address?.split(',')[1]?.trim() || '',
        video_url: null,
        service_count: 0,
        working_hours: p.workingHours || {},
      };
    }
    return this.request<PartnerProfileDetailResponse>(`/partners/${partnerId}/profile-detail`);
  }

  async updatePartnerProfileDetail(
    partnerId: string,
    data: PartnerProfileUpdateRequest
  ): Promise<PartnerProfileDetailResponse> {
    if (this.isMockToken()) {
      return this.getPartnerProfileDetail(partnerId);
    }
    return this.request<PartnerProfileDetailResponse>(`/partners/${partnerId}/profile-detail`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePartnerWorkingHours(
    partnerId: string,
    data: PartnerProfileWorkingHoursUpdateRequest
  ): Promise<PartnerProfileDetailResponse> {
    if (this.isMockToken()) {
      return this.getPartnerProfileDetail(partnerId);
    }
    return this.request<PartnerProfileDetailResponse>(`/partners/${partnerId}/profile-detail/working-hours`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePartnerProfileMedia(
    partnerId: string,
    data: {
      media_gallery: Record<string, string[]>;
      image_urls: string[];
      video_url?: string | null;
    },
  ): Promise<PartnerProfileDetailResponse> {
    if (this.isMockToken()) {
      return this.getPartnerProfileDetail(partnerId);
    }
    return this.request<PartnerProfileDetailResponse>(`/partners/${partnerId}/profile-detail/media`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPartnerPublicProfile(partnerId: string): Promise<PartnerPublicProfileResponse> {
    if (this.isMockToken()) {
      const detail = await this.getPartnerProfileDetail(partnerId);
      return {
        id: detail.id,
        name: detail.name,
        address: detail.address,
        city: detail.city,
        commune: detail.commune,
        rating: 0,
        total_reviews: 0,
        video_url: detail.video_url,
        image_urls: detail.image_urls || [],
        media_gallery: detail.media_gallery || {},
        working_hours: detail.working_hours,
      };
    }
    return this.request<PartnerPublicProfileResponse>(`/catalog/partners/${partnerId}/public-profile`);
  }

  async getPartnerAnalyticsSummary(
    partnerId: string,
    range: 'week' | 'month' | 'year' = 'month'
  ): Promise<PartnerAnalyticsSummaryResponse> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      const partnerOrders = allOrders.filter((o: any) => o.partner?.id === partnerId);
      const completed = partnerOrders.filter((o: any) => o.status === 'COMPLETED');
      const revenue = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      return {
        range,
        overview: {
          total_revenue: revenue,
          average_order_value: completed.length > 0 ? revenue / completed.length : 0,
          orders_in_range: completed.length,
        },
        revenue_series: [],
        popular_services: [],
        customer_insights: { new_customers: 0, returning_customers: 0 },
        top_clients: [],
        promo_performance: { top_by_usage: [], top_by_revenue: [] },
      };
    }
    return this.request<PartnerAnalyticsSummaryResponse>(
        `/partners/${partnerId}/analytics-summary?range=${encodeURIComponent(range)}`
    );
  }

  async getPartnerSecurityActivityLogs(
    partnerId: string,
    userId?: string
  ): Promise<PartnerSecurityActivityLogListResponse> {
    if (this.isMockToken()) {
      return { logs: [], total: 0, limit: 50 };
    }
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return this.request<PartnerSecurityActivityLogListResponse>(
      `/partners/${partnerId}/security/activity-logs${query}`
    );
  }

  async enableCurrentUser2FA(code: string): Promise<TwoFactorToggleResponse> {
    return this.request<TwoFactorToggleResponse>('/auth/me/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disableCurrentUser2FA(): Promise<TwoFactorToggleResponse> {
    return this.request<TwoFactorToggleResponse>('/auth/me/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getAdminOverview(): Promise<AdminOverview> {
    return this.request<AdminOverview>('/admin/overview');
  }

  async getAdsDashboard(days = 7): Promise<BackendAdsDashboardResponse> {
    return this.request<BackendAdsDashboardResponse>(`/admin/ads/dashboard?days=${days}`);
  }

  async pauseAd(adId: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/ads/${adId}/pause`, { method: 'POST' });
  }

  async deleteAd(adId: string): Promise<void> {
    return this.request<void>(`/admin/ads/${adId}`, { method: 'DELETE' });
  }

  async duplicateAd(adId: string): Promise<{ id: string }> {
    return this.request(`/admin/ads/${adId}/duplicate`, { method: 'POST' });
  }

  async createAd(data: {
    title: string;
    description?: string;
    creative_type?: string;
    image_url?: string;
    video_url?: string;
    cta_text?: string;
    cta_url?: string;
    status?: string;
    campaign_id?: string;
    budget_total?: number;
    channel?: string;
    zone?: string;
    partner_id?: string;
  }): Promise<{ id: string }> {
    return this.request('/admin/ads', { method: 'POST', body: JSON.stringify(data) });
  }

  async createAdCampaign(data: {
    name: string;
    objective?: string;
    budget?: number;
    target_audience?: string;
  }): Promise<{ id: string }> {
    return this.request('/admin/ads/campaign', { method: 'POST', body: JSON.stringify(data) });
  }

  async exportAds(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/ads/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getAdminActivityLogs(limit = 200): Promise<AdminActivityLogListResponse> {
    return this.request<AdminActivityLogListResponse>(`/admin/activity-logs?limit=${limit}`);
  }

  async getPromoCodes(): Promise<AdminPromoCodeListResponse> {
    return this.request<AdminPromoCodeListResponse>('/promotions');
  }

  async createPromoCode(data: AdminPromoCodeUpsertRequest): Promise<AdminPromoCode> {
    return this.request<AdminPromoCode>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePromoCode(
    promoId: string,
    data: Partial<AdminPromoCodeUpsertRequest>
  ): Promise<AdminPromoCode> {
    return this.request<AdminPromoCode>(`/promotions/${promoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePromoCode(promoId: string): Promise<void> {
    return this.request<void>(`/promotions/${promoId}`, {
      method: 'DELETE',
    });
  }

  async getPartnerPromoCodes(partnerId: string): Promise<PartnerPromoCodeListResponse> {
    if (this.isMockToken()) {
      const promoCodes: any[] = DB.get('promoCodes');
      return { promo_codes: promoCodes.filter((p: any) => p.partnerId === partnerId), total: 0 };
    }
    return this.request<PartnerPromoCodeListResponse>(`/promotions/partners/${partnerId}`);
  }

  async createPartnerPromoCode(
    partnerId: string,
    data: AdminPromoCodeUpsertRequest
  ): Promise<PartnerPromoCode> {
    if (this.isMockToken()) {
      return { id: `PROMO-${Date.now()}`, ...data, partner_id: partnerId, created_at: new Date().toISOString() } as any;
    }
    return this.request<PartnerPromoCode>(`/promotions/partners/${partnerId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartnerPromoCode(
    partnerId: string,
    promoId: string,
    data: Partial<AdminPromoCodeUpsertRequest>
  ): Promise<PartnerPromoCode> {
    if (this.isMockToken()) {
      return { id: promoId, ...data, partner_id: partnerId } as any;
    }
    return this.request<PartnerPromoCode>(`/promotions/partners/${partnerId}/${promoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePartnerPromoCode(partnerId: string, promoId: string): Promise<void> {
    if (this.isMockToken()) {
      return;
    }
    return this.request<void>(`/promotions/partners/${partnerId}/${promoId}`, {
      method: 'DELETE',
    });
  }

  async getSiteContent(): Promise<SiteContentResponse> {
    return this.request<SiteContentResponse>('/content/site');
  }

  async updateSiteContent(contentData: SiteContentData): Promise<SiteContentResponse> {
    return this.request<SiteContentResponse>('/content/site', {
      method: 'PUT',
      body: JSON.stringify(contentData),
    });
  }

  async getSubscriptionPlans(): Promise<BackendSubscriptionPlanListResponse> {
    return this.request<BackendSubscriptionPlanListResponse>('/subscriptions/plans');
  }

  async createSubscriptionPlan(
    data: BackendSubscriptionPlanCreateRequest
  ): Promise<BackendSubscriptionPlan> {
    return this.request<BackendSubscriptionPlan>('/subscriptions/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubscriptionPlan(
    planId: string,
    data: BackendSubscriptionPlanUpdateRequest
  ): Promise<BackendSubscriptionPlan> {
    return this.request<BackendSubscriptionPlan>(`/subscriptions/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    return this.request<void>(`/subscriptions/plans/${planId}`, {
      method: 'DELETE',
    });
  }

  async getTrackingSettings(): Promise<BackendTrackingSettingsResponse> {
    return this.request<BackendTrackingSettingsResponse>('/tracking/settings');
  }

  async updateTrackingSettings(data: {
    gtmContainerId: string;
    metaPixelId: string;
  }): Promise<BackendTrackingSettingsResponse> {
    return this.request<BackendTrackingSettingsResponse>('/tracking/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAdvertisements(): Promise<BackendAdvertisementListResponse> {
    return this.request<BackendAdvertisementListResponse>('/advertisements');
  }

  async createAdvertisement(data: {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    isActive: boolean;
  }): Promise<BackendAdvertisement> {
    return this.request<BackendAdvertisement>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdvertisement(
    advertisementId: string,
    data: Partial<{
      title: string;
      description: string;
      imageUrl: string;
      linkUrl: string;
      isActive: boolean;
    }>
  ): Promise<BackendAdvertisement> {
    return this.request<BackendAdvertisement>(`/advertisements/${advertisementId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdvertisement(advertisementId: string): Promise<void> {
    return this.request<void>(`/advertisements/${advertisementId}`, {
      method: 'DELETE',
    });
  }

  async getLoyaltySettings(): Promise<BackendLoyaltySettingsResponse> {
    return this.request<BackendLoyaltySettingsResponse>('/loyalty/settings');
  }

  async updateLoyaltySettings(data: {
    isEnabled: boolean;
    pointsPerDollar: number;
    pointsToDollar: number;
    pointsExpiryDays?: number | null;
  }): Promise<BackendLoyaltySettingsResponse> {
    return this.request<BackendLoyaltySettingsResponse>('/loyalty/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getLoyaltyDashboard(days = 7): Promise<BackendLoyaltyDashboardResponse> {
    return this.request<BackendLoyaltyDashboardResponse>(`/admin/loyalty/dashboard?days=${days}`);
  }

  async updateLoyaltyAdminSettings(data: {
    is_enabled?: boolean;
    points_per_dollar?: number;
    points_to_dollar?: number;
    points_expiry_days?: number | null;
    redemption_cap?: number | null;
    first_order_bonus?: number;
  }): Promise<BackendLoyaltyDashboardResponse['settings']> {
    return this.request('/admin/loyalty/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  async runLoyaltyAdminExpiration(): Promise<{ users_processed: number; expired_points: number }> {
    return this.request('/admin/loyalty/expire', { method: 'POST' });
  }

  async createLoyaltyReward(data: { name: string; points_required: number; value_dollars: number }): Promise<{ id: string }> {
    return this.request('/admin/loyalty/rewards', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLoyaltyReward(id: string, data: { is_active?: boolean; name?: string }): Promise<{ id: string }> {
    return this.request(`/admin/loyalty/rewards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async exportLoyalty(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/loyalty/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getLoyaltyAdminOverview(): Promise<LoyaltyAdminOverview> {
    return this.request<LoyaltyAdminOverview>('/loyalty/admin/overview');
  }

  async runLoyaltyExpiration(data?: {
    user_id?: string;
    as_of?: string | null;
  }): Promise<{
    users_processed: number;
    expired_points: number;
    expired_entries: number;
  }> {
    return this.request('/loyalty/admin/run-expiration', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async getMyLoyaltyHistory(limit = 50): Promise<{
    entries: Array<{
      id: string;
      entry_type: string;
      points_delta: number;
      balance_after: number;
      order_id?: string | null;
      description: string;
      created_at?: string | null;
    }>;
    total: number;
  }> {
    return this.request(`/loyalty/me/history?limit=${limit}`);
  }

  async getMyReferralStats(): Promise<{
    referral_code: string | null;
    referred_users_count: number;
    completed_conversions: number;
    total_bonus_points: number;
  }> {
    return this.request('/referral/me');
  }

  async getReferralSettings(): Promise<BackendReferralSettingsResponse> {
    return this.request<BackendReferralSettingsResponse>('/referral/settings');
  }

  async updateReferralSettings(data: {
    isEnabled: boolean;
    referrerBonusPoints: number;
    refereeDiscountAmount: number;
  }): Promise<BackendReferralSettingsResponse> {
    return this.request<BackendReferralSettingsResponse>('/referral/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getReferralAdminOverview(): Promise<ReferralAdminOverview> {
    return this.request<ReferralAdminOverview>('/referral/admin/overview');
  }

  async getReferralDashboard(days = 7): Promise<BackendReferralDashboardResponse> {
    return this.request<BackendReferralDashboardResponse>(`/admin/referrals/dashboard?days=${days}`);
  }

  async updateReferralAdminSettings(data: {
    is_enabled?: boolean;
    referrer_bonus_points?: number;
    referee_discount_amount?: number;
    referee_bonus_points?: number;
    points_expiry_days?: number | null;
    bonus_cap_per_referrer?: number | null;
    allowed_channels?: string[];
  }): Promise<BackendReferralDashboardResponse['settings']> {
    return this.request('/admin/referrals/settings', { method: 'PUT', body: JSON.stringify(data) });
  }

  async createReferralCampaign(data: {
    name: string; audience?: string; budget: number; start_date?: string; end_date?: string;
  }): Promise<{ id: string; name: string }> {
    return this.request('/admin/referrals/campaigns', { method: 'POST', body: JSON.stringify(data) });
  }

  async sendReferralManualBonus(data: { user_id: string; points: number; reason: string }): Promise<{ user_id: string; new_balance: number }> {
    return this.request('/admin/referrals/manual-bonus', { method: 'POST', body: JSON.stringify(data) });
  }

  async auditReferrals(): Promise<{ watchlist_items: number; conversions_audited: number; status: string }> {
    return this.request('/admin/referrals/audit', { method: 'POST' });
  }

  async exportReferrals(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/referrals/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getReviewsDashboard(days = 7): Promise<BackendReviewsDashboardResponse> {
    return this.request<BackendReviewsDashboardResponse>(`/admin/reviews/dashboard?days=${days}`);
  }

  async getReviewDetail(id: string): Promise<{
    id: string; client_name: string; client_id: string; review_type: string; review_type_label: string;
    rating: number; comment: string; source: string; date: string | null; status: string; status_label: string;
    partner_name?: string | null; order_id?: string | null; title?: string | null; driver_name?: string | null;
    ai_summary: string; sentiment: string; churn_risk: string; priority: string; recommendation: string;
    previous_replies?: string[];
  }> {
    return this.request(`/admin/reviews/${id}`);
  }

  async replyReview(id: string, content: string): Promise<{ review_id: string; status: string }> {
    return this.request(`/admin/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async escalateReview(id: string): Promise<{ review_id: string; status: string }> {
    return this.request(`/admin/reviews/${id}/escalate`, { method: 'POST' });
  }

  async reportReview(id: string): Promise<{ review_id: string; status: string }> {
    return this.request(`/admin/reviews/${id}/report`, { method: 'POST' });
  }

  async exportReviews(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/reviews/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getClaimsDashboard(days = 7): Promise<BackendClaimsDashboardResponse> {
    return this.request<BackendClaimsDashboardResponse>(`/admin/claims/dashboard?days=${days}`);
  }

  async getClaimDetail(id: string): Promise<{
    id: string; claim_number: string; title: string; ai_summary: string;
    client_name: string; category: string; category_label: string;
    priority: string; priority_label: string; status: string; status_label: string;
    financial_impact: number; sla_label: string; sla_state: string;
    sla_minutes_remaining: number | null; updated_at: string | null; partner_name?: string | null;
    description: string; order_id?: string | null; driver_name?: string | null;
    risk_score: number; recommendation: string;
    timeline?: Array<{ event: string; date: string | null; detail: string }>;
    notes?: Array<{ content: string; author_id: string }>;
    attachments?: Array<{ url: string; mime: string | null }>;
    refunds?: Array<{ amount: number; status: string }>;
    escalations?: Array<{ reason: string; severity: string }>;
  }> {
    return this.request(`/admin/claims/${id}`);
  }

  async createClaim(data: { title: string; description: string; type?: string; priority?: string }): Promise<{ id: string; claim_number: string }> {
    return this.request('/admin/claims', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateClaimStatus(id: string, status: string, note?: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/claims/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note }) });
  }

  async assignClaim(id: string, assigneeId: string): Promise<{ id: string; assigned_to: string }> {
    return this.request(`/admin/claims/${id}/assign`, { method: 'POST', body: JSON.stringify({ assignee_id: assigneeId }) });
  }

  async addClaimNote(id: string, content: string): Promise<{ id: string }> {
    return this.request(`/admin/claims/${id}/notes`, { method: 'POST', body: JSON.stringify({ content, is_internal: true }) });
  }

  async escalateClaim(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/claims/${id}/escalate`, { method: 'POST' });
  }

  async processClaimRefund(id: string, action: string, amount?: number): Promise<{ id: string; status: string }> {
    return this.request(`/admin/claims/${id}/refund`, { method: 'POST', body: JSON.stringify({ action, amount }) });
  }

  async getCmsDashboard(days = 7): Promise<BackendCmsDashboardResponse> {
    return this.request<BackendCmsDashboardResponse>(`/admin/cms/dashboard?days=${days}`);
  }

  async getCmsPageDetail(id: string): Promise<{
    id: string; slug: string; title: string; page_type: string; page_type_label: string;
    status: string; status_label: string; language: string; updated_at: string | null;
    views_7d: number; seo_score: number; thumbnail_url?: string | null;
    description?: string | null; seo_title?: string | null; seo_description?: string | null;
    blocks?: Array<Record<string, unknown>>; sections?: Array<Record<string, unknown>>;
    faqs?: Array<{ id: string; question: string; answer: string; position: number }>;
    revisions?: Array<{ id: string; note: string; created_at: string | null }>;
  }> {
    return this.request(`/admin/cms/pages/${id}`);
  }

  async createCmsPage(data: { title: string; slug: string; page_type?: string }): Promise<{ id: string; slug: string; title: string }> {
    return this.request('/admin/cms/pages', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCmsPage(id: string, data: Record<string, unknown>): Promise<{ id: string; status: string }> {
    return this.request(`/admin/cms/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async publishCmsPage(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/cms/pages/${id}/publish`, { method: 'POST' });
  }

  async getBlogDashboard(days = 30): Promise<BackendBlogDashboardResponse> {
    return this.request<BackendBlogDashboardResponse>(`/admin/blog/dashboard?days=${days}`);
  }

  async getBlogPostDetail(id: string): Promise<{
    id: string; slug: string; title: string; excerpt: string;
    author_name: string; author_avatar?: string | null;
    category: string; category_color: string;
    status: string; status_label: string;
    seo_score: number; views_count: number; comments_count: number;
    published_at: string | null; featured_image?: string | null;
    content: string; reading_time: number;
    content_blocks?: Array<Record<string, unknown>>;
    tags?: string[]; seo?: Record<string, unknown>;
    revisions?: Array<{ id: string; note: string }>;
  }> {
    return this.request(`/admin/blog/posts/${id}`);
  }

  async createBlogPost(data: { title: string; slug: string }): Promise<{ id: string; slug: string; title: string }> {
    return this.request('/admin/blog/posts', { method: 'POST', body: JSON.stringify(data) });
  }

  async publishBlogPost(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/blog/posts/${id}/publish`, { method: 'POST' });
  }

  async generateBlogAI(topic: string): Promise<{ title: string; outline: string[]; content: string; faq: Array<Record<string, unknown>>; seo: Record<string, unknown>; cta: Record<string, unknown> }> {
    return this.request('/admin/blog/ai/generate', { method: 'POST', body: JSON.stringify({ topic }) });
  }

  async auditBlogSEO(postId: string): Promise<{ post_id: string; score: number; checklist: Array<Record<string, unknown>>; recommendations: string[] }> {
    return this.request('/admin/blog/seo/audit', { method: 'POST', body: JSON.stringify({ post_id: postId }) });
  }

  async getPaymentGatewaysDashboard(days = 30): Promise<BackendPaymentGatewaysDashboardResponse> {
    return this.request<BackendPaymentGatewaysDashboardResponse>(`/admin/payment-gateways/dashboard?days=${days}`);
  }

  async exportPaymentGateways(data: { format: string }): Promise<{ format: string; rows: number; revenue_month: number }> {
    return this.request('/admin/payment-gateways/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async runPaymentReconciliation(): Promise<{ status: string; message: string }> {
    return this.request('/admin/payment-gateways/reconciliation/run', { method: 'POST' });
  }

  async testPaymentWebhook(gatewaySlug: string): Promise<{ gateway_slug: string; status: string; response_ms: number }> {
    return this.request(`/admin/payment-gateways/webhooks/test?gateway_slug=${encodeURIComponent(gatewaySlug)}`, { method: 'POST' });
  }

  async getSmsDashboard(): Promise<BackendSmsDashboardResponse> {
    return this.request<BackendSmsDashboardResponse>('/admin/sms/dashboard');
  }

  async exportSms(data: { format: string }): Promise<{ format: string; rows: number; sent_today: number }> {
    return this.request('/admin/sms/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async sendSms(data: { phone_number: string; message: string; message_type?: string }): Promise<{ status: string; phone_number: string }> {
    return this.request('/admin/sms/send', { method: 'POST', body: JSON.stringify(data) });
  }

  async getAdminMgmtDashboard(): Promise<BackendAdminMgmtDashboardResponse> {
    return this.request<BackendAdminMgmtDashboardResponse>('/admin/management/dashboard');
  }

  async getRbacDashboard(): Promise<BackendRbacDashboardResponse> {
    return this.request<BackendRbacDashboardResponse>('/admin/rbac/dashboard');
  }

  async getActivityLogDashboard(limit = 200): Promise<BackendActivityLogDashboardResponse> {
    return this.request<BackendActivityLogDashboardResponse>(`/admin/activity-log?limit=${limit}`);
  }

  async getIntegrationsDashboard(): Promise<BackendIntegrationsDashboardResponse> {
    return this.request<BackendIntegrationsDashboardResponse>('/admin/integrations/dashboard');
  }

  async getEmailDashboard(): Promise<BackendEmailDashboardResponse> {
    return this.request<BackendEmailDashboardResponse>('/admin/email/dashboard');
  }

  async exportEmail(data: { format: string }): Promise<{ format: string; rows: number; sent_today: number }> {
    return this.request('/admin/email/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getWhatsappDashboard(): Promise<BackendWhatsappDashboardResponse> {
    return this.request<BackendWhatsappDashboardResponse>('/admin/whatsapp/dashboard');
  }

  async exportWhatsapp(data: { format: string }): Promise<{ format: string; rows: number; messages_today: number }> {
    return this.request('/admin/whatsapp/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async testWhatsappWebhook(): Promise<{ status: string; response_ms: number }> {
    return this.request('/admin/whatsapp/webhooks/test', { method: 'POST' });
  }

  async sendWhatsappMessage(data: { phone: string; message: string }): Promise<{ status: string; phone: string }> {
    return this.request('/admin/whatsapp/send', { method: 'POST', body: JSON.stringify(data) });
  }

  async getNotificationsDashboard(days = 30): Promise<BackendNotificationsDashboardResponse> {
    return this.request<BackendNotificationsDashboardResponse>(`/admin/notifications/dashboard?days=${days}`);
  }

  async sendNotification(data: { channel: string; audience: string; title: string; message: string; event_type?: string }): Promise<{ id: string; status: string }> {
    return this.request('/admin/notifications/send', { method: 'POST', body: JSON.stringify(data) });
  }

  async retryNotification(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/notifications/retry?notification_id=${encodeURIComponent(id)}`, { method: 'POST' });
  }

  async createNotificationTemplate(data: { name: string; channel: string; event_type: string; language?: string; subject?: string; body: string }): Promise<{ id: string; name: string }> {
    return this.request('/admin/notifications/templates', { method: 'POST', body: JSON.stringify(data) });
  }

  async exportNotifications(data: { format: string }): Promise<{ format: string; rows: number; exported_at: number }> {
    return this.request('/admin/notifications/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getPublicBlogPosts(category?: string): Promise<BackendPublicBlogListResponse> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<BackendPublicBlogListResponse>(`/blog/posts${query}`);
  }

  async getPublicBlogPost(slug: string): Promise<BackendPublicBlogPostResponse> {
    return this.request<BackendPublicBlogPostResponse>(`/blog/posts/${encodeURIComponent(slug)}`);
  }

  async getSupportDashboard(days = 7): Promise<BackendSupportDashboardResponse> {
    return this.request<BackendSupportDashboardResponse>(`/admin/support/dashboard?days=${days}`);
  }

  async getSupportTicketDetail(id: string): Promise<{
    id: string; ticket_code: string; title: string; ai_summary: string; description: string;
    client_name: string; client_id: string; category: string; category_label: string;
    priority: string; priority_label: string; status: string; status_label: string;
    sla_label: string; sla_status: string; sla_minutes_remaining: number | null;
    updated_at: string | null; agent_name: string | null; channel: string;
    order_id?: string | null; payment_id?: string | null; partner_name?: string | null; driver_name?: string | null;
    messages?: Array<{ id: string; content: string; is_internal: boolean; created_at: string | null }>;
    internal_notes?: string[]; ai_recommendations?: string[]; refund_risk: string; churn_risk: string;
  }> {
    return this.request(`/admin/support/tickets/${id}`);
  }

  async createSupportTicket(data: { title: string; description: string; category?: string; priority?: string }): Promise<{ id: string; title: string }> {
    return this.request('/admin/support/tickets', { method: 'POST', body: JSON.stringify(data) });
  }

  async replySupportTicket(id: string, content: string): Promise<{ ticket_id: string; message_id: string }> {
    return this.request(`/admin/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async assignSupportTicket(id: string, agentId: string): Promise<{ ticket_id: string; assigned_to: string }> {
    return this.request(`/admin/support/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) });
  }

  async escalateSupportTicket(id: string): Promise<{ ticket_id: string; status: string }> {
    return this.request(`/admin/support/tickets/${id}/escalate`, { method: 'POST' });
  }

  async resolveSupportTicket(id: string): Promise<{ ticket_id: string; status: string }> {
    return this.request(`/admin/support/tickets/${id}/resolve`, { method: 'POST' });
  }

  async exportSupport(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/support/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async getUsersDashboard(days = 7): Promise<BackendUsersDashboardResponse> {
    return this.request<BackendUsersDashboardResponse>(`/admin/users/dashboard?days=${days}`);
  }

  async getUserDetail(id: string): Promise<{
    id: string; name: string; email: string; phone: string; role: string; status: string;
    loyalty_points: number; referral_code: string | null; is_email_verified: boolean;
    is_phone_verified: boolean; is_2fa_enabled: boolean; created_at: string | null;
    last_login_at: string | null; orders_count: number; total_spent: number; referrals_count: number;
  }> {
    return this.request(`/admin/users/${id}`);
  }

  async getUserSecurity(id: string): Promise<{
    user_id: string; two_fa_enabled: boolean; suspicious_logins: number;
    recent_logins: Array<{ ip: string; date: string | null }>; active_sessions: number;
  }> {
    return this.request(`/admin/users/${id}/security`);
  }

  async exportUsers(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/users/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async suspendUser(userId: string): Promise<{ user_id: string; status: string }> {
    return this.request('/admin/users/suspend', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
  }

  async reactivateUser(userId: string): Promise<{ user_id: string; status: string }> {
    return this.request('/admin/users/reactivate', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
  }

  async getCampaignDashboard(days = 7): Promise<BackendCampaignDashboardResponse> {
    return this.request<BackendCampaignDashboardResponse>(`/admin/campaigns/dashboard?days=${days}`);
  }

  async getGrowthDashboard(): Promise<BackendGrowthDashboardResponse> {
    return this.request<BackendGrowthDashboardResponse>('/admin/campaigns/growth/dashboard');
  }

  async reviewGrowthPromoRisk(promoCode: string, note?: string): Promise<{ status: string; action: string; resource_id: string | null; message: string }> {
    return this.request(`/admin/campaigns/growth/promo-fraud/${encodeURIComponent(promoCode)}/review`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async suspendGrowthPromo(promoCode: string, note?: string): Promise<{ status: string; action: string; resource_id: string | null; message: string }> {
    return this.request(`/admin/campaigns/growth/promo-fraud/${encodeURIComponent(promoCode)}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async prepareGrowthAutomation(automationKey: string, note?: string): Promise<{ status: string; action: string; resource_id: string | null; message: string }> {
    return this.request(`/admin/campaigns/growth/automations/${encodeURIComponent(automationKey)}/prepare`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async createCampaign(data: { name: string; channel: string; audience: string; content: string; budget: number; scheduledAt?: string }): Promise<{ id: string; name: string }> {
    return this.request('/admin/campaigns', { method: 'POST', body: JSON.stringify({
      name: data.name, channel: data.channel, audience: data.audience,
      content: data.content, budget: data.budget, scheduled_at: data.scheduledAt,
    }) });
  }

  async updateCampaign(id: string, data: Record<string, unknown>): Promise<{ id: string; name: string }> {
    return this.request(`/admin/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCampaign(id: string): Promise<void> {
    return this.request(`/admin/campaigns/${id}`, { method: 'DELETE' });
  }

  async pauseCampaign(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/campaigns/${id}/pause`, { method: 'POST' });
  }

  async resumeCampaign(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/admin/campaigns/${id}/resume`, { method: 'POST' });
  }

  async duplicateCampaign(id: string): Promise<{ id: string; name: string }> {
    return this.request(`/admin/campaigns/${id}/duplicate`, { method: 'POST' });
  }

  async getCampaignAnalytics(id: string): Promise<{
    campaign_id: string; name: string; messages_sent: number; opens: number; clicks: number;
    conversions: number; revenue: number; roi: number; open_rate: number; click_rate: number; conversion_rate: number;
  }> {
    return this.request(`/admin/campaigns/${id}/analytics`);
  }

  async exportCampaigns(data: { format: string; scope: string }): Promise<{ filename: string; count: number; format: string }> {
    return this.request('/admin/campaigns/export', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateReferralReviewStatus(
    referrerUserId: string,
    data: { review_status: string; review_note?: string | null }
  ): Promise<{
    referrer_user_id: string;
    review_status: string;
    review_note?: string | null;
    reviewed_by_user_id: string;
    reviewed_at?: string | null;
  }> {
    return this.request(`/referral/admin/reviews/${referrerUserId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createOrder(data: OrderCreateRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    partner_id?: string;
  }): Promise<OrderListResponse> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      let filtered = allOrders;
      if (params?.partner_id) {
        filtered = filtered.filter((o: any) => o.partner?.id === params.partner_id);
      }
      if (params?.status) {
        filtered = filtered.filter((o: any) => o.status === params.status);
      }
      const page = params?.page || 1;
      const pageSize = params?.page_size || 100;
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);
      return {
        orders: paginated,
        total: filtered.length,
        page,
        page_size: pageSize,
      };
    }

    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const endpoint = query ? `/orders?${query}` : '/orders';
    return this.request<OrderListResponse>(endpoint);
  }

  async getPublicOrderSocialProof(limit = 10): Promise<PublicOrderSocialProof[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);
    return this.request<PublicOrderSocialProof[]>(`/orders/social-proof?limit=${safeLimit}`);
  }

  async getOrder(id: string): Promise<Order> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      const order = allOrders.find((o: any) => o.id === id);
      if (!order) throw new Error('Order not found');
      return order;
    }
    return this.request<Order>(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, data: OrderStatusUpdateRequest): Promise<Order> {
    if (this.isMockToken()) {
      const allOrders: any[] = DB.get('orderHistory');
      const orderIndex = allOrders.findIndex((o: any) => o.id === id);
      if (orderIndex === -1) throw new Error('Order not found');
      allOrders[orderIndex].status = data.new_status || allOrders[orderIndex].status;
      allOrders[orderIndex].trackingHistory = allOrders[orderIndex].trackingHistory || [];
      allOrders[orderIndex].trackingHistory.push({
        status: data.new_status || allOrders[orderIndex].status,
        time: new Date().toISOString(),
      });
      DB.set('orderHistory', allOrders);
      return allOrders[orderIndex];
    }
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLogisticsTasks(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<LogisticsTaskListResponse> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const endpoint = query ? `/logistics/tasks?${query}` : '/logistics/tasks';
    return this.request<LogisticsTaskListResponse>(endpoint);
  }

  async getLogisticsDrivers(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    is_available?: boolean;
  }): Promise<LogisticsDriverListResponse> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const endpoint = query ? `/logistics/drivers?${query}` : '/logistics/drivers';
    return this.request<LogisticsDriverListResponse>(endpoint);
  }

  async createLogisticsDriver(data: LogisticsDriverCreateRequest): Promise<LogisticsDriver> {
    return this.request<LogisticsDriver>('/logistics/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVehicles(): Promise<LogisticsVehicleListResponse> {
    return this.request<LogisticsVehicleListResponse>('/logistics/vehicles');
  }

  async createVehicle(data: LogisticsVehicleUpsertRequest & { plate: string; type: LogisticsVehicle['type'] }): Promise<LogisticsVehicle> {
    return this.request<LogisticsVehicle>('/logistics/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehicle(vehicleId: string, data: LogisticsVehicleUpsertRequest): Promise<LogisticsVehicle> {
    return this.request<LogisticsVehicle>(`/logistics/vehicles/${vehicleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    return this.request<void>(`/logistics/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  }

  async getTrips(): Promise<LogisticsTripListResponse> {
    return this.request<LogisticsTripListResponse>('/logistics/trips');
  }

  async getTrackingPoints(): Promise<LogisticsTrackingPointListResponse> {
    return this.request<LogisticsTrackingPointListResponse>('/logistics/tracking-points');
  }

  async getMaintenanceEvents(): Promise<LogisticsMaintenanceEventListResponse> {
    return this.request<LogisticsMaintenanceEventListResponse>('/logistics/maintenance-events');
  }

  async updateDriverAvailability(available: boolean): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>('/driver/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    });
  }

  async getMyDriverProfile(): Promise<LogisticsDriver> {
    return this.request<LogisticsDriver>('/logistics/drivers/me');
  }

  async updateMyDriverAvailability(available: boolean): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>('/logistics/drivers/me/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    });
  }

  async getMarketplaceCompanies(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    is_active?: boolean;
    supports_pickup?: boolean;
    supports_delivery?: boolean;
  }): Promise<MarketplaceCompanyListResponse> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const endpoint = query ? `/marketplace/companies?${query}` : '/marketplace/companies';
    return this.request<MarketplaceCompanyListResponse>(endpoint);
  }

  async assignLogisticsTask(taskId: string, driverId: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ driver_id: driverId }),
    });
  }

  async claimLogisticsTask(taskId: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/claim`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async autoAssignLogisticsTask(taskId: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/auto-assign`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async acceptLogisticsTask(taskId: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async startLogisticsTask(taskId: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async completeLogisticsTask(
    taskId: string,
    proofNote?: string,
    proofPhotoUrl?: string | null,
  ): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        proof_note: proofNote || 'Completed from driver dashboard',
        proof_photo_url: proofPhotoUrl || undefined,
      }),
    });
  }

  async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number,
  ): Promise<{ latitude: number; longitude: number; recorded_at?: string }> {
    return this.request(`/logistics/drivers/${driverId}/location`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async failLogisticsTask(taskId: string, reason: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelLogisticsTask(taskId: string, reason?: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async estimateOrderPrice(data: OrderCreateRequest): Promise<OrderEstimateResponse> {
    return this.request<OrderEstimateResponse>('/pricing/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPaymentIntent(data: PaymentIntentCreateRequest): Promise<PaymentIntent> {
    return this.request<PaymentIntent>('/payments/intents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initiatePayment(intentId: string): Promise<{
    id: string;
    payment_intent_id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    return this.request(`/payments/intents/${intentId}/initiate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getOrderPaymentSummary(orderId: string): Promise<{
    order_id: string;
    total_amount: number;
    amount_paid: number;
    amount_due: number;
    payment_status: string;
  }> {
    return this.request(`/payments/orders/${orderId}/summary`);
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/payments/intents/${id}`);
  }

  async confirmCashPayment(
    intentId: string,
    data: { confirmed_by_user_id: string; amount_paid: number; notes?: string }
  ): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/payments/intents/${intentId}/confirm-cash`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async getOrderTruthTimeline(orderId: string): Promise<{
    order_id: string;
    order_number: string;
    customer_id: string;
    partner_id: string;
    current_status: string;
    version: number;
    events: Array<{
      id: string;
      order_id: string;
      task_id?: string | null;
      event_type: string;
      event_subtype?: string | null;
      from_status?: string | null;
      to_status?: string | null;
      payload: Record<string, unknown>;
      occurred_at: string;
      source: string;
      correlation_id?: string | null;
      created_at: string;
    }>;
    proofs: Array<{
      id: string;
      order_id: string;
      task_id?: string | null;
      proof_type: string;
      proof_data: Record<string, unknown>;
      actor_type: string;
      actor_id: string;
      actor_name: string;
      recorded_at: string;
      verified_at?: string | null;
      location_lat?: string | null;
      location_lng?: string | null;
      location_accuracy?: string | null;
      verification_status: string;
      verification_method?: string | null;
      verification_notes?: string | null;
      created_at: string;
    }>;
  }> {
    return this.request(`/ops/orders/${orderId}/truth-timeline`);
  }

  async getOrderProofs(orderId: string): Promise<Array<{
    id: string;
    order_id: string;
    task_id?: string | null;
    proof_type: string;
    proof_data: Record<string, unknown>;
    actor_type: string;
    actor_id: string;
    actor_name: string;
    recorded_at: string;
    verified_at?: string | null;
    location_lat?: string | null;
    location_lng?: string | null;
    location_accuracy?: string | null;
    verification_status: string;
    verification_method?: string | null;
    verification_notes?: string | null;
    created_at: string;
  }>> {
    return this.request(`/ops/orders/${orderId}/proofs`);
  }

  async getCorridorsHealth(): Promise<{
    corridors: Array<{
      corridor: string;
      status: string;
      open_anomalies: number;
      last_event_at?: string | null;
      risk_level: string;
    }>;
    checked_at: string;
  }> {
    return this.request('/ops/corridors/health');
  }

  async getAnomalies(params?: {
    corridor?: string;
    severity?: string;
    resolved?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{
    anomalies: Array<{
      id: string;
      anomaly_type: string;
      corridor: string;
      order_id?: string | null;
      payment_intent_id?: string | null;
      task_id?: string | null;
      description: string;
      severity: string;
      detected_at: string;
      resolved_at?: string | null;
      payload: Record<string, unknown>;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    const endpoint = query ? `/ops/anomalies?${query}` : '/ops/anomalies';
    return this.request(endpoint);
  }

  async investigate(params: {
    order_id?: string;
    payment_intent_id?: string;
    delivery_task_id?: string;
  }): Promise<{
    order?: Record<string, unknown> | null;
    payment_intent?: Record<string, unknown> | null;
    delivery_tasks: Array<Record<string, unknown>>;
    timelines: Array<Record<string, unknown>>;
    proofs: Array<Record<string, unknown>>;
    status_history: Array<Record<string, unknown>>;
    anomalies: Array<Record<string, unknown>>;
    summary: Record<string, unknown>;
  }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/ops/investigate?${query}`);
  }

  // ─── Notification Methods ────────────────────────────────────────────

  async getNotifications(userId?: string): Promise<{ notifications: any[]; total: number; unread_count?: number }> {
    if (this.isMockToken()) {
      const allNotifs: any[] = DB.get('appNotifications');
      const userNotifs = allNotifs.filter((n: any) => n.recipientId === userId);
      return {
        notifications: userNotifs,
        total: userNotifs.length,
        unread_count: userNotifs.filter((n: any) => !n.isRead).length,
      };
    }
    if (!this.hasAuthSession()) {
      const err = new Error('Not authenticated') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    return this.request('/notifications/me');
  }

  async createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    notification_type: string;
    notification_metadata?: Record<string, unknown>;
  }): Promise<any> {
    if (this.isMockToken()) {
      const notification = {
        recipientId: data.user_id,
        message: data.message,
        notificationType: data.notification_type,
        link: data.notification_metadata,
      };
      DB.addItem('appNotifications', {
        ...notification,
        id: `N-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
      return notification;
    }
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (this.isMockToken()) {
      const allNotifs: any[] = DB.get('appNotifications');
      const idx = allNotifs.findIndex((n: any) => n.id === notificationId);
      if (idx !== -1) {
        allNotifs[idx].isRead = true;
        DB.set('appNotifications', allNotifs);
      }
      return;
    }
    return this.request(`/notifications/${notificationId}/read`, { method: 'POST' });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (this.isMockToken()) {
      const allNotifs: any[] = DB.get('appNotifications');
      const updated = allNotifs.map((n: any) =>
        n.recipientId === userId ? { ...n, isRead: true } : n
      );
      DB.set('appNotifications', updated);
      return;
    }
    return this.request('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify(userId ? { user_id: userId } : {}),
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (this.isMockToken()) {
      const allNotifs: any[] = DB.get('appNotifications');
      DB.set('appNotifications', allNotifs.filter((n: any) => n.id !== notificationId));
      return;
    }
    return this.request(`/notifications/${notificationId}`, { method: 'DELETE' });
  }

  // ─── Partner Application endpoints ─────────────────────────────────────

  async submitPartnerApplication(data: {
    company_name: string;
    partner_type: string;
    contact_name: string;
    phone: string;
    email: string;
    address?: string;
    message?: string;
    capacity?: string;
  }): Promise<{ id: string; status: string }> {
    return this.request<{ id: string; status: string }>('/partner-applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPartnerApplications(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ applications: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    return this.request<{ applications: any[]; total: number }>(`/partner-applications?${query.toString()}`);
  }

  async approvePartnerApplication(id: string): Promise<{ partner: any; user: any }> {
    return this.request<{ partner: any; user: any }>(`/partner-applications/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectPartnerApplication(id: string, reason: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/partner-applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const realApi = new ApiClient(API_BASE_URL);

export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    return response.ok;
  } catch (error) {
    console.warn('Backend not available:', error);
    return false;
  }
}
