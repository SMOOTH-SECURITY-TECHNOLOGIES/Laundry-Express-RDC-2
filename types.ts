
import { ReactNode } from 'react';

// ====================================================================================
// FRONTEND / CLIENT-SAFE UTILITY TYPES
// ====================================================================================
export type ID = string;
export type Timestamp = string; // ISO 8601 string
export type Coordinates = { lat: number; lng: number; };
export type Page = 'home' | 'order' | 'tracking' | 'profile' | 'become-partner' | 'login' | 'register' | 'admin' | 'partner-dashboard' | 'faq' | 'support' | 'logistics-partnership' | 'logistics-dashboard' | 'driver-dashboard' | 'partner-detail' | 'notifications' | 'landing';
export type AdminSection = 'dashboard' | 'partners' | 'partner-applications' | 'services' | 'order-add-ons' | 'users' | 'orders' | 'drivers' | 'promotions' | 'advertisements' | 'loyalty' | 'referral' | 'content' | 'support' | 'analytics' | 'adminManagement' | 'tracking' | 'subscriptions' | 'refunds' | 'activity' | 'ops_dashboard' | 'ops_truth' | 'ops_anomalies' | 'ops_investigate';
export type Currency = 'USD' | 'CDF';
export type PartnerSection = 'dashboard' | 'orders' | 'profile' | 'promotions' | 'financials' | 'support' | 'analytics' | 'team' | 'security' | 'api-integrations' | 'automation' | 'invoicing' | 'inventory' | 'delivery' | 'subscription';
export type TeamMemberRole = 'partner-owner' | 'partner-manager' | 'partner-staff';

// Enums
export enum PartnerType {
    PRESSING = 'PRESSING',
    LAVANDIER = 'LAVANDIER',
    LOGISTICS = 'LOGISTICS',
}

export enum ServiceType {
    PRESSING = 'PRESSING',
    BLANCHISSERIE = 'BLANCHISSERIE',
    CORDONNERIE = 'CORDONNERIE',
}

export enum OrderStatus {
    AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
    REJECTED = 'REJECTED',
    CONFIRMED = 'CONFIRMED', // Internal status
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',
    PICKUP = 'PICKUP',
    PROCESSING = 'PROCESSING',
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY',
    DELIVERY = 'DELIVERY',
    COMPLETED = 'COMPLETED',
    DELAYED = 'DELAYED',
}

export enum ApplicationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    CLOSED = 'CLOSED',
}

export enum NotificationType {
    NEW_ORDER = 'newOrder',
    ORDER_STATUS_CHANGE = 'orderStatusChange',
    NEW_CHAT_MESSAGE = 'newChatMessage',
    PROMOTIONS = 'promotions',
    GENERAL = 'general',
}

export type UserRole = 'customer' | 'partner-owner' | 'partner-manager' | 'partner-staff' | 'driver' | 'logistics-manager' | 'admin' | 'superadmin';

export enum WebhookEvent {
    ORDER_CREATED = 'order.created',
    ORDER_STATUS_UPDATED = 'order.status.updated',
    ORDER_COMPLETED = 'order.completed',
}

export enum RefundReason {
    ITEM_DAMAGED = 'ITEM_DAMAGED',
    ITEM_MISSING = 'ITEM_MISSING',
    POOR_QUALITY = 'POOR_QUALITY',
    LATE_DELIVERY = 'LATE_DELIVERY',
    OTHER = 'OTHER',
}

export enum RefundStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum DiscountType {
    PROMO = 'promo',
    LOYALTY = 'loyalty',
    REFERRAL = 'referral',
}

export type ActivityLogAction = 
  | 'USER_LOGIN' | 'USER_LOGIN_FAILURE' | 'USER_2FA_ENABLED' | 'USER_2FA_DISABLED'
  | 'PARTNER_PROFILE_UPDATE' | 'PARTNER_SERVICE_ADD' | 'PARTNER_SERVICE_UPDATE' | 'PARTNER_SERVICE_DELETE'
  | 'PROMO_CODE_CREATE' | 'PROMO_CODE_UPDATE' | 'TEAM_MEMBER_INVITE' | 'TEAM_MEMBER_ROLE_CHANGE' | 'TEAM_MEMBER_REMOVE'
  | 'ADMIN_SETTINGS_UPDATE' | 'COMMISSION_SETTINGS_UPDATE' | 'APPLICATION_SETTINGS_UPDATE' | 'PARTNER_APPLICATION_APPROVED' 
  | 'PARTNER_APPLICATION_REJECTED' | 'REFUND_REQUEST_APPROVED' | 'REFUND_REQUEST_REJECTED' | 'ADMIN_LOGIN' | 'ADMIN_CREATED' 
  | 'ADMIN_PERMISSIONS_UPDATED' | 'BULK_NOTIFICATION_SENT';


export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export type BulkNotificationTarget = 'allUsers' | 'partners';

export interface NotificationAnalytic {
  notificationId: ID;
  event: 'read' | 'click';
  timestamp: Timestamp;
}

export interface AdminPermissions {
  dashboard: boolean;
  analytics: boolean;
  partners: boolean;
  services: boolean;
  users: boolean;
  orders: boolean;
  drivers: boolean;
  promotions: boolean;
  advertisements: boolean;
  loyalty: boolean;
  referral: boolean;
  content: boolean;
  support: boolean;
  adminManagement: boolean;
  tracking: boolean;
  subscriptions: boolean;
  refunds: boolean;
  activity: boolean;
  ops_dashboard: boolean;
  ops_truth: boolean;
  ops_anomalies: boolean;
  ops_investigate: boolean;
}

export interface StatCard {
  title: string;
  value: string | number;
  iconName: 'logo' | 'wash' | 'shirt' | 'user' | 'users' | 'check' | 'truck' | 'currencyDollar' | 'sparkles' | 'lifebuoy' | 'pencil' | 'calendar' | 'bell';
}

// ====================================================================================
// DRC-Specific Types
// ====================================================================================
export interface MobileMoneyPayment {
  transactionId: string;
  phoneNumber: string;
  amount: number;
  provider: 'M-Pesa' | 'Airtel Money' | 'Orange Money';
  receiptNumber?: string;
  checkoutRequestId?: string;
}

export interface DrcAddress {
  commune: string;
  quartier?: string;
  avenue: string;
  numero: string;
  reference?: string;
}

export const formatAddress = (address: DrcAddress | string): string => {
  if (typeof address === 'string') return address;
  if (!address) return '';
  const { numero, avenue, quartier, commune, reference } = address;
  const parts = [numero, avenue, quartier, commune, reference ? `(${reference})` : ''];
  return parts.filter(Boolean).join(', ');
};

// ====================================================================================
// API RESPONSE (CLIENT-SAFE)
// ====================================================================================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ====================================================================================
// Data model interfaces
// ====================================================================================

export interface NotificationPreferences {
  newOrder: boolean;
  orderStatusChange: boolean;
  newChatMessage: boolean;
  promotions: boolean;
  general: boolean;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: UserRole | TeamMemberRole;
  pickupAddress: DrcAddress;
  backendAddressId?: ID;
  loyaltyPoints: number;
  referralCode: string;
  referredByCode?: string;
  createdAt: Timestamp;
  is2FAEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  isEmailValid: boolean;
  emailInvalidReason?: string;
  partnerId?: ID;
  logisticsPartnerId?: ID;
  vehicleInfo?: string;
  driverStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_MISSION';
  permissions?: AdminSection[];
  lastRecommendationAt?: Timestamp;
  isPushEnabled?: boolean;
  pushSubscription?: PushSubscription;
}

export interface BackendUser extends User {
    passwordHash: string;
    passwordSalt?: string;
}

export interface ClientDetails {
  name: string;
  phone: string;
  pickupAddress: DrcAddress;
  coordinates?: Coordinates;
}

export interface Article {
  id: ID;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export interface ArticleCategory {
  name: string;
  items: Article[];
}

export interface Service {
  id: ID;
  type: ServiceType;
  title: string;
  description: string;
  iconName: string;
  imageUrl: string;
  priceModel: 'per_item' | 'per_kg';
  price?: number;
  articleCategories?: ArticleCategory[];
  turnaroundHours?: number;
}

export interface OrderItem {
  article: Article;
  quantity: number;
}

export interface ServiceItem {
  service: Service;
  items?: OrderItem[];
  weight?: number;
}

export interface TrackingHistory {
  status: OrderStatus;
  time: Timestamp;
}

export interface PartnerFeatures {
  promotions: boolean;
  financials: boolean;
  analytics: boolean;
  customDomain: boolean;
  customSubdomain: boolean;
  teamManagement: boolean;
  apiAccess: boolean;
  advancedAutomation: boolean;
  aiReviewAssistant: boolean;
  invoiceGenerator?: boolean;
}

export interface DayWorkingHours {
  open: string;
  close: string;
  isClosed: boolean;
  enabled?: boolean;
}

export interface WorkingHours {
  monday: DayWorkingHours;
  tuesday: DayWorkingHours;
  wednesday: DayWorkingHours;
  thursday: DayWorkingHours;
  friday: DayWorkingHours;
  saturday: DayWorkingHours;
  sunday: DayWorkingHours;
}

export interface UnavailabilityPeriod {
    id: ID;
    startDate: Timestamp;
    endDate: Timestamp;
    reason: string;
}

export interface PartnerMediaGallery {
  couverture?: string[];
  boutique?: string[];
  machines?: string[];
  equipe?: string[];
  livraison?: string[];
  'avant-apres'?: string[];
}

export interface Partner {
  id: ID;
  name: string;
  slug: string;
  type: PartnerType;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  videoUrl?: string;
  mediaGallery?: PartnerMediaGallery;
  address: string;
  coordinates: Coordinates;
  serviceIds?: string[];
  isFeatured?: boolean;
  createdAt?: Timestamp;
  customDomain?: string;
  enabledFeatures: PartnerFeatures;
  currency: Currency;
  workingHours?: WorkingHours;
  unavailability?: UnavailabilityPeriod[];
  commissionRate?: number;
  inventory?: InventoryItem[];
  deliverySettings?: DeliverySettings;
  deliveryOps?: PartnerDeliveryOps;
  automationSettings?: AutomationSettings;
}

export interface BackendPartner extends Partner {
    apiKey?: string;
    webhookUrl?: string;
    webhookSecret?: string;
    subscribedWebhookEvents?: WebhookEvent[];
    bankAccountDetails?: any;
    taxId?: string;
    internalNotes?: string;
    automationSettings?: AutomationSettings;
}

export interface Order {
  id: ID;
  userId: ID;
  partner: Partner | null;
  serviceItems: ServiceItem[];
  clientDetails: ClientDetails;
  pickupTime: string;
  status: OrderStatus;
  trackingHistory: TrackingHistory[];
  totalPrice: number;
  createdAt: Timestamp;
  isReviewed?: boolean;
  rejectionReason?: string;
  estimatedCompletionTime?: string;
  driverId?: ID;
  appliedPromoCode?: string;
  discountAmount?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  referralDiscount?: number;
  paymentStatus?: string;
  amountPaid?: number;
  backendOrderNumber?: string;
  logisticsPartnerId?: ID;
  proformaGeneratedAt?: Timestamp;
  invoiceGeneratedAt?: Timestamp;
  refundRequestId?: ID;
}

export interface BackendOrder extends Order {
    internalNotes?: string;
    platformFee?: number;
}

export interface Review {
  id: ID;
  orderId: ID;
  userId: ID;
  partnerId: ID;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  reply?: string;
}

export interface PartnerDocumentRef {
  type: string;
  name: string;
  size: number;
  dataUrl?: string;
}

export interface PartnerApplication {
  id: ID;
  companyName: string;
  partnerType: PartnerType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  message?: string;
  capacity?: string;
  documents?: PartnerDocumentRef[];
  logoUrl?: string;
  status: ApplicationStatus;
  submittedAt: Timestamp;
  rejectionReason?: string;
}

export enum TicketCategory {
    BILLING = 'BILLING',
    DAMAGED_ITEM = 'DAMAGED_ITEM',
    DELIVERY_ISSUE = 'DELIVERY_ISSUE',
    SERVICE_QUALITY = 'SERVICE_QUALITY',
    ACCOUNT_HELP = 'ACCOUNT_HELP',
    OTHER = 'OTHER'
}

export interface TicketMessage {
  id: ID;
  authorId: ID;
  authorName: string;
  message: string;
  createdAt: Timestamp;
}

export interface SupportTicket {
  id: ID;
  userId: ID;
  userName: string;
  orderId?: ID;
  subject: string;
  messages: TicketMessage[];
  status: TicketStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedAdminId?: ID;
  category?: TicketCategory;
  aiSummary?: string;
}

export interface ChatMessage {
  id: ID;
  authorId: ID;
  authorName: string;
  message: string;
  createdAt: Timestamp;
}

export interface Chat {
  id: ID;
  orderId: ID;
  participants: ID[];
  messages: ChatMessage[];
  mutedUntil?: Timestamp;
}

export interface PromoCode {
  id: ID;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  promoType?: 'percentage' | 'fixed' | 'delivery' | 'cashback';
  name?: string;
  minOrderValue?: number;
  isForNewUsersOnly?: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  partnerId?: ID;
  usageCount?: number;
  maxUsage?: number | null;
  maxBudget?: number | null;
  budgetUsed?: number;
  usageLimitPerCustomer?: number;
  startDate?: string;
  endDate?: string | null;
  targetSegments?: string[];
  channels?: string[];
  applicableServices?: string[];
  description?: string;
  geographicRestrictions?: any[];
}

export interface HowItWorksStep {
  id: ID;
  title: string;
  description: string;
  icon: 'shoppingBag' | 'truck' | 'sparkles' | 'home';
}

export interface FAQItem {
  id: ID;
  question: string;
  answer: string;
}

export interface SiteContent {
  hero: { title: string; subtitle: string };
  howItWorksSteps: HowItWorksStep[];
  faq: FAQItem[];
}

export interface LogisticsPartner {
  id: ID;
  name: string;
}

export interface LoyaltySettings {
  isEnabled: boolean;
  pointsPerDollar: number;
  pointsToDollar: number;
  pointsExpiryDays?: number | null;
}

export interface ReferralSettings {
  isEnabled: boolean;
  referrerBonusPoints: number;
  refereeDiscountAmount: number;
}

export interface AppNotificationAction {
  label: string;
  actionType: 'ACCEPT_ORDER' | 'REJECT_ORDER' | 'REASSIGN_ORDER';
  payload: { [key: string]: any };
}

export interface AppNotification {
  id: ID;
  recipientId: ID | 'admin';
  message: string;
  notificationType: NotificationType;
  link?: { page: Page; params?: { [key: string]: any } };
  createdAt: Timestamp;
  isRead: boolean;
  actions?: AppNotificationAction[];
}

export interface Advertisement {
  id: ID;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export type ApplicationSettings = {
  [key in PartnerType]: boolean;
};

export interface RouteMission {
    orderId: ID;
    type: 'PICKUP' | 'DELIVERY';
    clientOrPartnerName: string;
    address: string;
}

export interface OptimizedRoute {
    driverId: ID;
    driverName: string;
    missions: RouteMission[];
    estimatedTime: string; // e.g., "45 minutes"
}

export interface TrackingSettings {
  gtmContainerId: string;
  metaPixelId: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  isMostPopular?: boolean;
  features: Partial<PartnerFeatures>;
}

export interface Invoice {
    id: ID;
    partnerId: ID;
    planName: string;
    amount: number;
    date: Timestamp;
    status: 'paid' | 'pending' | 'overdue';
    billingCycle: 'monthly' | 'yearly';
}

export interface CommissionSettings {
  globalRate: number;
  byServiceType: { [key in ServiceType]?: number };
}

export interface RefundRequest {
    id: ID;
    orderId: ID;
    userId: ID;
    userName: string;
    reason: RefundReason;
    customerComments: string;
    requestedAmount: number;
    status: RefundStatus;
    createdAt: Timestamp;
    resolutionNotes?: string;
    resolvedAt?: Timestamp;
    resolvedBy?: ID; // Admin ID
}

export interface SecurityAlert {
    log: ActivityLog;
    reason: string;
    severity: 'high' | 'medium' | 'low';
}

export interface ActivityLog {
  id: ID;
  userId: ID;
  userName: string;
  partnerId?: ID;
  action: ActivityLogAction;
  details?: string;
  createdAt: Timestamp;
}

export interface InventoryItem {
    id: ID;
    name: string;
    unit: 'pcs' | 'liters' | 'kg' | 'units';
    currentStock: number;
    lowStockThreshold: number;
    imageUrl?: string;
    category?: string;
    cost?: number;
}

export interface DeliveryZone {
    commune: string;
    fee: number;
}

export interface DeliverySettings {
    model: 'platform' | 'self';
    zones: DeliveryZone[];
    ownDrivers: any[]; // Placeholder for future driver objects
}

export type PartnerDeliveryUrgentAction = 'contact' | 'reassign' | 'escalate';

export interface PartnerDeliveryRow {
    id: string;
    orderNumber: string;
    client: string;
    commune: string;
    driver: string;
    amount: number;
    status: string;
    time: string;
    date: string;
    urgentIssue?: string;
    urgentAction?: PartnerDeliveryUrgentAction;
    urgentResolved?: boolean;
}

export interface PartnerDeliveryActivityEntry {
    time: string;
    icon: string;
    color: string;
    title: string;
    detail: string;
}

export interface PartnerDeliveryDriver {
    id: string;
    name: string;
    phone: string;
    state: 'Actif' | 'Inactif' | 'En tournee';
    zones: string[];
    total: number;
    avgTime: string;
    rating: number;
    success: number;
    remaining: string;
}

export interface PartnerDeliveryOps {
    deliveries: PartnerDeliveryRow[];
    activityLog: PartnerDeliveryActivityEntry[];
    drivers?: PartnerDeliveryDriver[];
}

export interface DataContextType {
    isLoading: boolean;
    partners: Partner[];
    services: Service[];
    logisticsPartners: LogisticsPartner[];
    reviews: Review[];
    users: User[];
    orderHistory: Order[];
    partnerApplications: PartnerApplication[];
    supportTickets: SupportTicket[];
    chats: Chat[];
    promoCodes: PromoCode[];
    loyaltySettings: LoyaltySettings;
    referralSettings: ReferralSettings;
    advertisements: Advertisement[];
    applicationSettings: ApplicationSettings;
    trackingSettings: TrackingSettings;
    commissionSettings: CommissionSettings;
    siteContent: SiteContent;
    subscriptionPlans: SubscriptionPlan[];
    invoices: Invoice[];
    refundRequests: RefundRequest[];
    selectedCurrency: Currency;
    setSelectedCurrency: (currency: Currency) => void;
    formatPrice: (priceUSD: number, targetCurrency?: Currency) => string;
    getReviewsForPartner: (partnerId: string) => Review[];
    getPartnerById: (partnerId: string) => Partner | undefined;
    getUserById: (userId: string) => User | undefined;
    getLogisticsPartnerById: (partnerId: string) => LogisticsPartner | undefined;
    getAllUsers: () => User[];
    getAllTickets: () => SupportTicket[];
    updatePartner: (updatedPartner: Partner) => Promise<void>;
    togglePartnerFeaturedStatus: (partnerId: string) => Promise<void>;
    updateSiteContent: (newContent: SiteContent) => Promise<void>;
    submitPartnerApplication: (application: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>) => Promise<PartnerApplication>;
    approvePartnerApplication: (applicationId: string) => Promise<void>;
    rejectPartnerApplication: (applicationId: string, reason: string) => Promise<void>;
    deletePartner: (partnerId: string) => Promise<void>;
    linkUserToPartner: (userId: string, partnerId: string) => Promise<User>;
    linkUserToLogisticsPartner: (userId: string, logisticsPartnerId: string) => Promise<User>;
    savePartnerService: (partnerId: ID, serviceData: Service) => Promise<void>;
    deletePartnerService: (partnerId: ID, serviceId: ID) => Promise<void>;
    createSupportTicket: (ticketData: any) => Promise<void>;
    addMessageToTicket: (ticketId: string, messageData: any) => Promise<void>;
    updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
    addMessageToChat: (orderId: string, messageData: any) => Promise<void>;
    addDriver: (driverData: any) => Promise<void>;
    updateLoyaltySettings: (settings: LoyaltySettings) => Promise<void>;
    updateReferralSettings: (settings: ReferralSettings) => Promise<void>;
    updateTrackingSettings: (settings: TrackingSettings) => Promise<void>;
    updateCommissionSettings: (settings: CommissionSettings) => Promise<void>;
    assignDriverToOrder: (orderId: string, driverId: string) => Promise<void>;
    assignDriverForDelivery: (orderId: string, driverId: string) => Promise<void>;
    reassignPartner: (orderId: string, newPartnerId: string) => Promise<void>;
    muteChat: (chatId: string, duration: number) => Promise<void>;
    logNotificationEvent: (notif: AppNotification, event: 'read' | 'click') => Promise<void>;
    sendBulkNotifications: (target: BulkNotificationTarget, message: string) => Promise<void>;
    addAdvertisement: (adData: any) => Promise<void>;
    updateAdvertisement: (ad: Advertisement) => Promise<void>;
    deleteAdvertisement: (adId: string) => Promise<void>;
    addPromoCode: (promo: Omit<PromoCode, 'id' | 'createdAt'>) => Promise<PromoCode>;
    recordPromoUsage: (code: string, discountAmount: number) => Promise<void>;
    updatePromoCode: (promo: PromoCode) => Promise<void>;
    deletePromoCode: (promoId: string) => Promise<void>;
    reassignDriver: (orderId: string, oldDriverId: string, newDriverId: string) => Promise<void>;
    addLogisticsPartner: (name: string) => Promise<void>;
    updateLogisticsPartner: (partner: LogisticsPartner) => Promise<void>;
    deleteLogisticsPartner: (partnerId: string) => Promise<void>;
    updateApplicationSettings: (settings: ApplicationSettings) => Promise<void>;
    submitRefundRequest: (request: any) => Promise<void>;
    approveRefundRequest: (requestId: string, notes: string) => Promise<void>;
    rejectRefundRequest: (requestId: string, notes: string) => Promise<void>;
    getChatbotResponse: (message: string) => Promise<string>;
    generatePersonalizedRecommendation: () => Promise<void>;
    analyzeLaundryImage: (imageData: string, articles: Article[]) => Promise<any>;
    analyzeStainImage: (imageData: string) => Promise<any>;
    analyzePartnerHealth: (partnerId: string) => Promise<any>;
    analyzePartnerReviews: (reviews: Review[]) => Promise<any>;
    generateReviewResponse: (review: Review, authorName: string) => Promise<string>;
    submitReviewReply: (reviewId: string, replyText: string) => Promise<void>;
    generateMarketingPromo: (prompt: string) => Promise<any>;
    regeneratePromoImage: (code: string, val: number, type: string, concept: string) => Promise<{ bannerImageUrl: string }>;
    generateDemandForecast: (orders: Order[]) => Promise<any>;
    suggestReassignment: (order: Order, partners: Partner[], services: Service[]) => Promise<any>;
    optimizeRoutes: (logisticsPartnerId: string) => Promise<OptimizedRoute[]>;
    confirmOptimizedRoutes: (routes: OptimizedRoute[]) => Promise<void>;
    addAdmin: (adminData: any) => Promise<void>;
    apiUpdateUserPermissions: (userId: string, permissions: AdminPermissions) => Promise<void>;
    addService: (service: Omit<Service, 'id'>) => Promise<void>;
    updateService: (service: Service) => Promise<void>;
    deleteService: (serviceId: string) => Promise<void>;
    getChatForOrder: (orderId: string) => Chat | undefined;
    getDriversForLogisticsPartner: (logisticsPartnerId: string) => User[];
    apiFetchPartnerIntegrations: (partnerId: ID) => Promise<any>;
    apiRegeneratePartnerApiKey: (partnerId: ID) => Promise<{ apiKey: string }>;
    apiUpdatePartnerWebhooks: (partnerId: ID, url: string, events: WebhookEvent[]) => Promise<void>;
    enable2FA: (userId: ID, code: string) => Promise<{ success: boolean; user: User }>;
    disable2FA: (userId: ID) => Promise<User>;
    fetchActivityLogs: (partnerId: ID) => Promise<ActivityLog[]>;
    fetchAllActivityLogs: () => Promise<ActivityLog[]>;
    analyzeActivityLogsForAnomalies: (logs: ActivityLog[]) => Promise<any>;
    addTeamMember: (partnerId: ID, memberData: any) => Promise<User>;
    apiUpdateTeamMemberRole: (userId: ID, role: TeamMemberRole) => Promise<void>;
    apiRemoveTeamMember: (userId: ID) => Promise<void>;
    apiUpdatePartnerAutomationSettings: (partnerId: ID, settings: AutomationSettings) => Promise<void>;
    apiSubscribePartner: (partnerId: ID, planId: ID) => Promise<void>;
    apiUpdatePartnerInventory: (partnerId: ID, inventory: InventoryItem[]) => Promise<void>;
    apiUpdatePartnerDeliverySettings: (partnerId: ID, settings: DeliverySettings) => Promise<void>;
    apiUpdatePartnerDeliveryOps: (partnerId: ID, ops: PartnerDeliveryOps) => Promise<void>;
    apiUpdatePartnerMedia: (
      partnerId: ID,
      media: { imageUrls: string[]; videoUrl?: string | null; mediaGallery?: PartnerMediaGallery },
      seed?: Partial<Partner>,
    ) => Promise<void>;
    apiGenerateProforma: (orderId: ID) => Promise<Order>;
    apiGenerateInvoice: (orderId: ID) => Promise<Order>;
    addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'>) => Promise<void>;
    updateSubscriptionPlan: (plan: SubscriptionPlan) => Promise<void>;
}
// ====================================================================================
// AUTHENTICATION TYPES (CLIENT-SAFE)
// ====================================================================================
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  pickupAddress: DrcAddress;
  referralCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface TwoFactorRequest {
  code: string;
  temporaryToken: string;
}

// ====================================================================================
// ORDER & SERVICE TYPES (CLIENT-SAFE)
// ====================================================================================
export interface CreateOrderRequest {
  partner: Partner | null;
  serviceItems: ServiceItem[];
  clientDetails: ClientDetails;
  pickupTime: string;
  appliedPromoCode?: string;
  useLoyaltyPoints?: number;
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  mobileMoneyDetails?: MobileMoneyPayment;
  discountAmount?: number;
  pointsDiscount?: number;
  referralDiscount?: number;
  totalPrice?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  rejectionReason?: string;
  estimatedCompletionTime?: string;
}

export interface OrderFilters {
  status?: OrderStatus[];
  partnerId?: ID;
  dateFrom?: string;
  dateTo?: string;
  serviceType?: ServiceType;
}

// ====================================================================================
// PARTNER TYPES (CLIENT-SAFE)
// ====================================================================================
export interface PartnerSearchFilters {
  serviceType?: ServiceType;
  coordinates?: Coordinates;
  radius?: number; // in kilometers
  rating?: number;
  isAvailableNow?: boolean;
}

export interface BusinessDayHours {
    enabled: boolean;
    open: string;
    close: string;
}

export interface BusinessHours {
    enabled: boolean;
    timezone: string;
    monday: BusinessDayHours;
    tuesday: BusinessDayHours;
    wednesday: BusinessDayHours;
    thursday: BusinessDayHours;
    friday: BusinessDayHours;
    saturday: BusinessDayHours;
    sunday: BusinessDayHours;
}

export interface AutomationSettings {
  autoAccept: boolean;
  autoAcceptMaxPrice: number;
  autoMessages: boolean;
  messages: { [key: string]: string };
  businessHours?: BusinessHours;
  serviceTypeFilters?: string[];
  customerTypeFilters?: ('new' | 'returning' | 'vip')[];
  escalationRules?: {
      notifyOnFailure: boolean;
      fallbackAction: 'hold_for_review' | 'notify_manager' | 'auto_decline' | 'assign_to_staff';
      maxRetries: number;
      escalationEmail: string;
      notificationPreferences?: {
          email: boolean;
          sms: boolean;
          push: boolean;
      };
      autoDeclineEnabled: boolean;
      autoDeclineMaxPrice: number;
      autoDeclineComplexServices: string[];
      autoDeclineMaxDistance: number;
      priorityHandling: boolean;
      priorityVipCustomers: boolean;
      priorityMinOrderValue: number;
      priorityUrgentServices: string[];
  };
  advancedMessaging?: {
      enableEmojis: boolean;
      characterLimit: number;
      enableDeliveryReports: boolean;
      enableAppointmentReminders: boolean;
      enablePromotionalMessages: boolean;
  };
  analytics?: {
      timeSaved: number;
      ordersProcessed: number;
      messagesSent: number;
      errorCount: number;
  };
}
