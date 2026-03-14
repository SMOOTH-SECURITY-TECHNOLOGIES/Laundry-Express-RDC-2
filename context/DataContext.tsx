
import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
// FIX: Add missing ID type import
import { Partner, LogisticsPartner, SiteContent, Review, User, PartnerApplication, SupportTicket, Chat, Service, PromoCode, ApplicationStatus, TicketStatus, TicketMessage, ChatMessage, LoyaltySettings, ReferralSettings, Order, AppNotification, Advertisement, ApplicationSettings, PartnerType, Article, OptimizedRoute, AdminSection, AdminPermissions, NotificationAnalytic, BulkNotificationTarget, WebhookEvent, ActivityLog, ActivityLogAction, DataContextType, TeamMemberRole, AutomationSettings, TrackingSettings, SubscriptionPlan, Invoice, CommissionSettings, RefundRequest, ID, Currency, InventoryItem, DeliverySettings, SecurityAlert, NotificationType } from '../types';
import * as api from '../constants';
import { useLanguageContext } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { appEvents } from '../utils/events.ts';
import { ResponseSanitizer } from '../backend/utils/sanitize';
import { useLocalStorage } from '../hooks/useLocalStorage';

const emptySiteContent: SiteContent = {
  hero: { title: '', subtitle: '' },
  howItWorksSteps: [],
  faq: [],
};


const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguageContext();
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [logisticsPartners, setLogisticsPartners] = useState<LogisticsPartner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [partnerApplications, setPartnerApplications] = useState<PartnerApplication[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [rawSiteContent, setRawSiteContent] = useState<SiteContent>(emptySiteContent);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({ isEnabled: true, pointsPerDollar: 10, pointsToDollar: 100 });
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({ isEnabled: true, referrerBonusPoints: 500, refereeDiscountAmount: 5 });
  const [notificationAnalytics, setNotificationAnalytics] = useState<NotificationAnalytic[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [applicationSettings, setApplicationSettings] = useState<ApplicationSettings>({
      [PartnerType.PRESSING]: true,
      [PartnerType.LAVANDIER]: true,
      [PartnerType.LOGISTICS]: true,
  });
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({ gtmContainerId: '', metaPixelId: '' });
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({ globalRate: 0, byServiceType: {} });
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useLocalStorage<Currency>('selectedCurrency', 'USD');
  
  const formatPrice = useCallback((priceUSD: number, targetCurrency?: Currency) => {
    const currency = targetCurrency || selectedCurrency;
    if (currency === 'CDF') {
        const priceCDF = priceUSD * api.EXCHANGE_RATES.CDF;
        return `${priceCDF.toLocaleString('fr-FR')} FC`;
    }
    return `$${priceUSD.toFixed(2)}`;
  }, [selectedCurrency]);
  
  const fetchData = useCallback(async () => {
    try {
        const data = await api.fetchAllData();
        setPartners(data.partners);
        setServices(data.services);
        setLogisticsPartners(data.logisticsPartners);
        setReviews(data.reviews);
        setUsers(data.users);
        setOrderHistory(data.orderHistory);
        setPartnerApplications(data.partnerApplications.filter(app => app.status === ApplicationStatus.PENDING));
        setSupportTickets(data.supportTickets);
        setChats(data.chats);
        setPromoCodes(data.promoCodes);
        setLoyaltySettings(data.loyaltySettings);
        setReferralSettings(data.referralSettings);
        setAdvertisements(data.advertisements);
        setNotificationAnalytics(data.notificationAnalytics);
        setApplicationSettings(data.applicationSettings);
        setTrackingSettings(data.trackingSettings);
        setCommissionSettings(data.commissionSettings);
        setRawSiteContent(data.siteContent);
        setSubscriptionPlans(data.subscriptionPlans);
        setInvoices(data.invoices);
        setRefundRequests(data.refundRequests);
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
  }, []);

  useEffect(() => {
    const initialFetch = async () => {
        await fetchData();
        setIsLoading(false);
    };
    
    initialFetch(); // Initial fetch
    
    // Listen for data changes from anywhere in the app
    const unsubscribe = appEvents.on('data_changed', fetchData);
    return () => unsubscribe();
  }, [fetchData]);
  
  const siteContent = useMemo(() => {
    if (!rawSiteContent?.hero?.title) {
        return emptySiteContent;
    }
    return {
        hero: {
            title: t(rawSiteContent.hero.title, { default: rawSiteContent.hero.title }),
            subtitle: t(rawSiteContent.hero.subtitle, { default: rawSiteContent.hero.subtitle })
        },
        howItWorksSteps: rawSiteContent.howItWorksSteps.map(step => ({
            ...step,
            title: t(step.title, { default: step.title }),
            description: t(step.description, { default: step.description })
        })),
        faq: rawSiteContent.faq.map(item => ({
            ...item,
            question: t(item.question, { default: item.question }),
            answer: t(item.answer, { default: item.answer })
        }))
    };
  }, [rawSiteContent, t]);

  const getReviewsForPartner = useCallback((partnerId: string) => reviews.filter(r => r.partnerId === partnerId), [reviews]);
  const getPartnerById = useCallback((partnerId: string) => partners.find(p => p.id === partnerId), [partners]);
  const getUserById = useCallback((userId: string) => users.find(u => u.id === userId), [users]);
  const getLogisticsPartnerById = useCallback((partnerId: string) => logisticsPartners.find(p => p.id === partnerId), [logisticsPartners]);
  const getAllUsers = useCallback(() => users, [users]);
  const getAllTickets = useCallback(() => supportTickets, [supportTickets]);

  const updatePartner = useCallback(async (updatedPartner: Partner) => {
    await api.apiUpdatePartner(updatedPartner);
  }, []);
  
  const togglePartnerFeaturedStatus = useCallback(async (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    const updatedPartner = { ...partner, isFeatured: !partner.isFeatured };
    await api.apiUpdatePartner(updatedPartner);
  }, [partners]);


  const updateSiteContent = useCallback(async (newContent: SiteContent) => {
    await api.apiUpdateSiteContent(newContent);
    addNotification(t('notifications.siteContentUpdated'), 'success');
  }, [addNotification, t]);

  const submitPartnerApplication = useCallback(async (application: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>) => {
      const newApp = await api.apiSubmitPartnerApplication(application);
      return newApp;
  }, []);

  const approvePartnerApplication = useCallback(async (applicationId: string) => {
      const result = await api.apiApprovePartnerApplication(applicationId, t);
      // FIX: Correctly access newLogisticsPartner or newPartner based on the return from apiApprovePartnerApplication.
      const companyName = (result as any).newPartner?.name || (result as any).newLogisticsPartner?.name || 'Unknown';
      addNotification(t('notifications.partnerApproved', { companyName }), 'success');
  }, [addNotification, t]);

  const rejectPartnerApplication = useCallback(async (applicationId: string, reason: string) => {
      const rejectedApp = await api.apiRejectPartnerApplication(applicationId, reason);
      addNotification(t('notifications.partnerRejected', { companyName: rejectedApp.companyName, default: `Partnership request for "${rejectedApp.companyName}" rejected.` }), 'info');
  }, [addNotification, t]);

  const deletePartner = useCallback(async (partnerId: string) => {
      await api.apiDeletePartner(partnerId);
      addNotification(t('notifications.partnerDeleted'), 'success');
  }, [addNotification, t]);

  // --- START OF RECONSTRUCTED CODE ---
  
  const linkUserToPartner = useCallback(async (userId: string, partnerId: string) => {
      const updatedUser = await api.apiLinkUserToPartner(userId, partnerId);
      addNotification(t('notifications.userLinkedToPartner', { name: updatedUser.name }), 'success');
      return updatedUser;
  }, [addNotification, t]);

  const linkUserToLogisticsPartner = useCallback(async (userId: string, logisticsPartnerId: string) => {
      const updatedUser = await api.apiLinkUserToLogisticsPartner(userId, logisticsPartnerId);
      addNotification(t('notifications.userLinkedToLogisticsPartner', { default: `User ${updatedUser.name} is now linked to the logistics partner.` }), 'success');
      return updatedUser;
  }, [addNotification, t]);
  
  const savePartnerService = useCallback(async (partnerId: ID, serviceData: Service) => {
    let service = { ...serviceData };
    if (service.id && service.id.startsWith('new-')) { // It's a new service
      const { id, ...newServiceData } = service;
      service = await api.apiAddService(newServiceData);
    } else { // It's an existing service
      await api.apiUpdateService(service);
    }
    
    // Ensure service is linked to partner
    const partner = partners.find(p => p.id === partnerId);
    if(partner && !partner.serviceIds?.includes(service.id)) {
        const newServiceIds = [...(partner.serviceIds || []), service.id];
        await api.apiUpdatePartnerServiceIds(partnerId, newServiceIds);
    }
    addNotification(t('notifications.serviceSaved'), 'success');
  }, [partners, addNotification, t]);
  
  const deletePartnerService = useCallback(async (partnerId: ID, serviceId: ID) => {
      const partner = partners.find(p => p.id === partnerId);
      if (partner?.serviceIds?.includes(serviceId)) {
          const newServiceIds = partner.serviceIds.filter(id => id !== serviceId);
          await api.apiUpdatePartnerServiceIds(partnerId, newServiceIds);
          addNotification(t('notifications.serviceUnlinked'), 'info');
      }
  }, [partners, addNotification, t]);
  
  const createSupportTicket = useCallback(async (ticketData: any) => {
      // FIX: Resolved reference error by ensuring apiCreateSupportTicket exists in constants.
      await api.apiCreateSupportTicket(ticketData);
      addNotification(t('notifications.ticketCreated'), 'success');
  }, [addNotification, t]);
  
  const addMessageToTicket = useCallback(async (ticketId: string, messageData: any) => {
      // FIX: Resolved reference error by ensuring apiAddMessageToTicket exists in constants.
      await api.apiAddMessageToTicket(ticketId, messageData);
  }, []);
  
  const updateTicketStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
      // FIX: Resolved reference error by ensuring apiUpdateTicketStatus exists in constants.
      await api.apiUpdateTicketStatus(ticketId, status);
      addNotification(t('notifications.ticketStatusUpdated', { id: ticketId.slice(-4) }), 'info');
  }, [addNotification, t]);
  
  const addMessageToChat = useCallback(async (orderId: string, messageData: any) => {
      // FIX: Resolved reference error by ensuring apiAddMessageToChat exists in constants.
      await api.apiAddMessageToChat(orderId, messageData);
  }, []);
  
  const addDriver = useCallback(async (driverData: any) => {
      const newDriver = await api.apiAddDriver(driverData, user!.logisticsPartnerId!);
      addNotification(t('notifications.driverAdded', { name: newDriver.name }), 'success');
  }, [user, addNotification, t]);
  
  const updateLoyaltySettings = useCallback(async (settings: LoyaltySettings) => {
    await api.apiUpdateLoyaltySettings(settings);
    addNotification(t('loyaltyManagement.settingsSaved'), 'success');
  }, [addNotification, t]);
  
  const updateReferralSettings = useCallback(async (settings: ReferralSettings) => {
    await api.apiUpdateReferralSettings(settings);
    addNotification(t('referralManagement.settingsSaved'), 'success');
  }, [addNotification, t]);

  const updateTrackingSettings = useCallback(async (settings: TrackingSettings) => {
      await api.apiUpdateTrackingSettings(settings);
      addNotification(t('trackingManagement.settingsSaved'), 'success');
  }, [addNotification, t]);

  const updateCommissionSettings = useCallback(async (settings: CommissionSettings) => {
      await api.apiUpdateCommissionSettings(settings);
  }, []);

  const assignDriverToOrder = useCallback(async (orderId: string, driverId: string) => {
      // FIX: Corrected argument count for apiAssignDriverToOrder call.
      await api.apiAssignDriverToOrder(orderId, driverId, t);
      addNotification(t('notifications.pickupMissionAssigned'), 'success');
  }, [addNotification, t]);

  const assignDriverForDelivery = useCallback(async (orderId: string, driverId: string) => {
      // FIX: Corrected argument count for apiAssignDriverForDelivery call.
      await api.apiAssignDriverForDelivery(orderId, driverId, t);
      addNotification(t('notifications.deliveryMissionAssigned'), 'success');
  }, [addNotification, t]);

  const reassignPartner = useCallback(async (orderId: string, newPartnerId: string) => {
    // FIX: Corrected argument count for apiReassignPartner call.
    await api.apiReassignPartner(orderId, newPartnerId, t);
  }, [t]);

  const muteChat = useCallback(async (chatId: string, duration: number) => {
    // FIX: Resolved reference error by ensuring apiMuteChat exists in constants.
    await api.apiMuteChat(chatId, duration);
  }, []);
  
  const logNotificationEvent = useCallback(async (notif: AppNotification, event: 'read' | 'click') => {
      // FIX: Resolved reference error by ensuring apiLogNotificationEvent exists in constants.
      await api.apiLogNotificationEvent(notif, event);
  }, []);

  const sendBulkNotifications = useCallback(async (target: BulkNotificationTarget, message: string) => {
      // FIX: Resolved reference error by ensuring apiSendBulkNotifications exists in constants.
      const count = await api.apiSendBulkNotifications(target, message);
      addNotification(t('adminDashboard.bulkNotifications.successMessage', { count }), 'success');
  }, [addNotification, t]);

  const addAdvertisement = useCallback(async (adData: any) => { await api.apiAddAdvertisement(adData); }, []);
  const updateAdvertisement = useCallback(async (ad: Advertisement) => { await api.apiUpdateAdvertisement(ad); }, []);
  const deleteAdvertisement = useCallback(async (adId: string) => { await api.apiDeleteAdvertisement(adId); }, []);

  const addPromoCode = useCallback(async (promo: Omit<PromoCode, 'id' | 'createdAt'>) => {
      await api.apiAddPromoCode(promo);
      addNotification(t('notifications.promoAdded'), 'success');
  }, [addNotification, t]);
  const updatePromoCode = useCallback(async (promo: PromoCode) => {
      await api.apiUpdatePromoCode(promo);
      addNotification(t('notifications.promoUpdated'), 'success');
  }, [addNotification, t]);
  const deletePromoCode = useCallback(async (promoId: string) => {
      await api.apiDeletePromoCode(promoId);
      addNotification(t('notifications.promoDeleted'), 'success');
  }, [addNotification, t]);

  const reassignDriver = useCallback(async (orderId: string, oldDriverId: string, newDriverId: string) => {
      // FIX: Resolved reference error by ensuring apiReassignDriver exists in constants.
      await api.apiReassignDriver(orderId, oldDriverId, newDriverId, t);
  }, [t]);

  const addLogisticsPartner = useCallback(async (name: string) => {
    // FIX: Resolved reference error by ensuring apiAddLogisticsPartner exists in constants.
    await api.apiAddLogisticsPartner(name); 
  }, []);
  const updateLogisticsPartner = useCallback(async (partner: LogisticsPartner) => { 
    // FIX: Resolved reference error by ensuring apiUpdateLogisticsPartner exists in constants.
    await api.apiUpdateLogisticsPartner(partner); 
  }, []);
  const deleteLogisticsPartner = useCallback(async (partnerId: string) => { 
    // FIX: Resolved reference error by ensuring apiDeleteLogisticsPartner exists in constants.
    await api.apiDeleteLogisticsPartner(partnerId); 
  }, []);
  const updateApplicationSettings = useCallback(async (settings: ApplicationSettings) => { 
      await api.apiUpdateApplicationSettings(settings); 
      addNotification(t('notifications.applicationSettingsUpdated'), 'success');
  }, [addNotification, t]);

  const submitRefundRequest = useCallback(async (request: any) => { 
    if(!user || !request.orderId) throw new Error("User or orderId missing");
    const order = orderHistory.find(o => o.id === request.orderId);
    if (!order) throw new Error("Order not found");
    await api.apiSubmitRefundRequest(request, user, order);
  }, [user, orderHistory]);

  const approveRefundRequest = useCallback(async (requestId: string, notes: string) => {
    await api.apiApproveRefundRequest(requestId, notes);
    addNotification(t('notifications.refundApproved'), 'success');
  }, [addNotification, t]);

  const rejectRefundRequest = useCallback(async (requestId: string, notes: string) => {
    await api.apiRejectRefundRequest(requestId, notes);
    addNotification(t('notifications.refundRejected'), 'info');
  }, [addNotification, t]);

  const getChatbotResponse = useCallback(async (message: string) => {
    return api.apiGetChatbotResponse(message);
  }, []);
  
  const generatePersonalizedRecommendation = useCallback(async () => {
    if (!user || user.lastRecommendationAt) return;
    const userOrders = orderHistory.filter(o => o.userId === user.id);
    if (userOrders.length < 3) return;
    const recommendation = await api.apiAnalyzeUserHistoryForRecommendations(userOrders);
    if (recommendation) {
        // Here you would create a notification for the user with the recommendation
    }
    updateUser({...user, lastRecommendationAt: new Date().toISOString()});
  }, [user, orderHistory, updateUser]);

  // Pass-through functions for Gemini features
  const analyzeLaundryImage = useCallback((imageData: string, articles: Article[]) => api.apiAnalyzeLaundryImage(imageData, articles.map(a => a.name)), []);
  const analyzeStainImage = useCallback((imageData: string) => api.apiAnalyzeStainImage(imageData), []);
  const analyzePartnerHealth = useCallback((partnerId: string) => api.apiAnalyzePartnerHealth(partnerId), []);
  const analyzePartnerReviews = useCallback((reviews: Review[]) => api.apiAnalyzePartnerReviews(reviews), []);
  const generateReviewResponse = useCallback((review: Review, authorName: string) => api.apiGenerateReviewResponse(review, authorName), []);
  const submitReviewReply = useCallback(async (reviewId: string, replyText: string) => { await api.apiSubmitReviewReply(reviewId, replyText); }, []);
  const generateMarketingPromo = useCallback((prompt: string) => api.apiGenerateMarketingPromo(prompt), []);
  const regeneratePromoImage = useCallback((code: string, val: number, type: string, concept: string) => api.apiRegeneratePromoImage(code, val, type, concept), []);
  const generateDemandForecast = useCallback((orders: Order[]) => api.apiGenerateDemandForecast(orders), []);
  const suggestReassignment = useCallback((order: Order, partners: Partner[], services: Service[]) => api.apiSuggestReassignment(order, partners, services), []);
  const optimizeRoutes = useCallback((logisticsPartnerId: string) => api.apiOptimizeRoutes(logisticsPartnerId), []);
  const confirmOptimizedRoutes = useCallback((routes: OptimizedRoute[]) => api.apiConfirmOptimizedRoutes(routes), []);
  
  const addAdmin = useCallback(async (adminData: any) => { 
      try {
        await api.apiAddAdmin(adminData);
        addNotification(t('notifications.adminCreated', { name: adminData.name }), 'success');
      } catch (e: any) {
        addNotification(t('notifications.adminCreationError', { error: e.message }), 'error');
        throw e;
      }
  }, [addNotification, t]);

  const apiUpdateUserPermissions = useCallback(async (userId: string, permissions: AdminPermissions) => {
      await api.apiUpdateUserPermissions(userId, permissions);
      addNotification(t('notifications.permissionsUpdated'), 'success');
  }, [addNotification, t]);

  const addService = useCallback(async (service: Omit<Service, 'id'>) => {
    await api.apiAddService(service);
    addNotification(t('notifications.serviceSaved'), 'success');
  }, [addNotification, t]);

  const updateService = useCallback(async (service: Service) => {
    await api.apiUpdateService(service);
    addNotification(t('notifications.serviceSaved'), 'success');
  }, [addNotification, t]);

  const deleteService = useCallback(async (serviceId: string) => {
    await api.apiDeleteService(serviceId);
    addNotification(t('notifications.serviceDeleted'), 'success');
  }, [addNotification, t]);

  const getChatForOrder = useCallback((orderId: string) => {
      return chats.find(c => c.orderId === orderId);
  }, [chats]);
  
  const getDriversForLogisticsPartner = useCallback((logisticsPartnerId: string) => {
    return users.filter(u => u.logisticsPartnerId === logisticsPartnerId && u.role === 'driver');
  }, [users]);
  
  const value = useMemo(() => ({
    isLoading,
    partners,
    services,
    logisticsPartners,
    reviews,
    users,
    orderHistory,
    partnerApplications,
    supportTickets,
    chats,
    promoCodes,
    loyaltySettings,
    referralSettings,
    appNotifications: [], // Handled by NotificationContext
    advertisements,
    applicationSettings,
    trackingSettings,
    commissionSettings,
    siteContent,
    subscriptionPlans,
    invoices,
    refundRequests,
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
    getReviewsForPartner,
    getPartnerById,
    getUserById,
    getLogisticsPartnerById,
    getAllUsers,
    getAllTickets,
    updatePartner,
    togglePartnerFeaturedStatus,
    updateSiteContent,
    submitPartnerApplication,
    approvePartnerApplication,
    rejectPartnerApplication,
    deletePartner,
    linkUserToPartner,
    linkUserToLogisticsPartner,
    savePartnerService,
    deletePartnerService,
    createSupportTicket,
    addMessageToTicket,
    updateTicketStatus,
    addMessageToChat,
    addDriver,
    updateLoyaltySettings,
    updateReferralSettings,
    updateTrackingSettings,
    updateCommissionSettings,
    assignDriverToOrder,
    assignDriverForDelivery,
    reassignPartner,
    muteChat,
    logNotificationEvent,
    sendBulkNotifications,
    addAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    reassignDriver,
    addLogisticsPartner,
    updateLogisticsPartner,
    deleteLogisticsPartner,
    updateApplicationSettings,
    submitRefundRequest,
    approveRefundRequest,
    rejectRefundRequest,
    getChatbotResponse,
    generatePersonalizedRecommendation,
    analyzeLaundryImage,
    analyzeStainImage,
    analyzePartnerHealth,
    analyzePartnerReviews,
    generateReviewResponse,
    submitReviewReply,
    generateMarketingPromo,
    regeneratePromoImage,
    generateDemandForecast,
    suggestReassignment,
    optimizeRoutes,
    confirmOptimizedRoutes,
    addAdmin,
    apiUpdateUserPermissions,
    addService,
    updateService,
    deleteService,
    getChatForOrder,
    getDriversForLogisticsPartner,
    apiFetchPartnerIntegrations: api.apiFetchPartnerIntegrations,
    apiRegeneratePartnerApiKey: api.apiRegeneratePartnerApiKey,
    apiUpdatePartnerWebhooks: api.apiUpdatePartnerWebhooks,
    enable2FA: api.apiEnable2FA,
    disable2FA: api.apiDisable2FA,
    fetchActivityLogs: api.apiFetchActivityLogs,
    fetchAllActivityLogs: api.apiFetchAllActivityLogs,
    analyzeActivityLogsForAnomalies: api.apiAnalyzeActivityLogsForAnomalies,
    addTeamMember: api.apiAddTeamMember,
    apiUpdateTeamMemberRole: api.apiUpdateTeamMemberRole,
    apiRemoveTeamMember: api.apiRemoveTeamMember,
    apiUpdatePartnerAutomationSettings: api.apiUpdatePartnerAutomationSettings,
    apiSubscribePartner: api.apiSubscribePartner,
    apiUpdatePartnerInventory: api.apiUpdatePartnerInventory,
    apiUpdatePartnerDeliverySettings: api.apiUpdatePartnerDeliverySettings,
    apiGenerateProforma: api.apiGenerateProforma,
    apiGenerateInvoice: api.apiGenerateInvoice,
    addSubscriptionPlan: api.apiAddSubscriptionPlan,
    updateSubscriptionPlan: api.apiUpdateSubscriptionPlan
  }), [
    isLoading, partners, services, logisticsPartners, reviews, users, orderHistory,
    partnerApplications, supportTickets, chats, promoCodes, loyaltySettings,
    referralSettings, advertisements, applicationSettings, trackingSettings,
    commissionSettings, siteContent, subscriptionPlans, invoices, refundRequests,
    selectedCurrency, setSelectedCurrency, formatPrice, getReviewsForPartner,
    getPartnerById, getUserById, getLogisticsPartnerById, getAllUsers, getAllTickets,
    updatePartner, togglePartnerFeaturedStatus, updateSiteContent,
    submitPartnerApplication, approvePartnerApplication, rejectPartnerApplication,
    deletePartner, linkUserToPartner, linkUserToLogisticsPartner, savePartnerService,
    deletePartnerService, createSupportTicket, addMessageToTicket, updateTicketStatus,
    addMessageToChat, addDriver, updateLoyaltySettings, updateReferralSettings,
    updateTrackingSettings, updateCommissionSettings, assignDriverToOrder,
    assignDriverForDelivery, reassignPartner, muteChat, logNotificationEvent,
    sendBulkNotifications, addAdvertisement, updateAdvertisement, deleteAdvertisement,
    addPromoCode, updatePromoCode, deletePromoCode, reassignDriver,
    addLogisticsPartner, updateLogisticsPartner, deleteLogisticsPartner,
    updateApplicationSettings, submitRefundRequest, approveRefundRequest,
    rejectRefundRequest, getChatbotResponse, generatePersonalizedRecommendation,
    analyzeLaundryImage, analyzeStainImage, analyzePartnerHealth,
    analyzePartnerReviews, generateReviewResponse, submitReviewReply,
    generateMarketingPromo, regeneratePromoImage, generateDemandForecast,
    suggestReassignment, optimizeRoutes, confirmOptimizedRoutes, addAdmin,
    apiUpdateUserPermissions, addService, updateService, deleteService,
    getChatForOrder, getDriversForLogisticsPartner
  ]);

  return (
    <DataContext.Provider value={value as any}>
      {children}
    </DataContext.Provider>
  );
};
