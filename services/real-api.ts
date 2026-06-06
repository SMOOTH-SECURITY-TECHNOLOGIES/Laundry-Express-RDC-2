const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18000/api/v1';

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
  service_count: number;
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
  created_at: string;
  updated_at: string;
}

export interface LogisticsDriver {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    return this.request<ApiCurrentUserResponse>('/auth/me');
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

  async getCatalogPartners(): Promise<CatalogPartnerSummary[]> {
    return this.request<CatalogPartnerSummary[]>('/catalog/partners');
  }

  async getCatalog(): Promise<CatalogResponse> {
    return this.request<CatalogResponse>('/catalog');
  }

  async getPartnerCatalogServices(partnerId: string): Promise<CatalogPartnerService[]> {
    return this.request<CatalogPartnerService[]>(`/catalog/partners/${partnerId}/services`);
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
    return this.request<PublicOrderSocialProof[]>(`/orders/social-proof?limit=${limit}`);
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

  async completeLogisticsTask(taskId: string, proofNote?: string): Promise<LogisticsTask> {
    return this.request<LogisticsTask>(`/logistics/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        proof_note: proofNote || 'Completed from driver dashboard',
      }),
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

  async getNotifications(userId: string): Promise<{ notifications: any[]; total: number }> {
    if (this.isMockToken()) {
      const allNotifs: any[] = DB.get('appNotifications');
      const userNotifs = allNotifs.filter((n: any) => n.recipientId === userId);
      return { notifications: userNotifs, total: userNotifs.length };
    }
    return this.request(`/notifications?user_id=${encodeURIComponent(userId)}`);
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
      body: JSON.stringify({ user_id: userId }),
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
