
import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
// FIX: Add missing ID type import
import { Partner, LogisticsPartner, SiteContent, Review, User, PartnerApplication, SupportTicket, Chat, Service, ServiceType, PromoCode, ApplicationStatus, TicketStatus, TicketMessage, ChatMessage, LoyaltySettings, ReferralSettings, Order, AppNotification, Advertisement, ApplicationSettings, PartnerType, Article, OptimizedRoute, AdminSection, AdminPermissions, NotificationAnalytic, BulkNotificationTarget, WebhookEvent, ActivityLog, ActivityLogAction, DataContextType, TeamMemberRole, AutomationSettings, TrackingSettings, SubscriptionPlan, Invoice, CommissionSettings, RefundRequest, ID, Currency, InventoryItem, DeliverySettings, SecurityAlert, NotificationType } from '../types';
import * as api from '../constants';
import { useLanguageContext } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { appEvents } from '../utils/events.ts';
import { ResponseSanitizer } from '../backend/utils/sanitize';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { realApi, CatalogPartnerSummary, SiteContentData, BackendSubscriptionPlan, BackendAdvertisement } from '../services/real-api';
import { features } from '../config/features';
import { EMPTY_LOCAL_DATA } from '../config/localData';
import { mapBackendOrderResponseToFrontend } from '../utils/order-mappers';
import { mapPublicReviewToFrontend } from '../utils/review-mappers';
import {
  mapApiPromoToFrontend,
  mapFrontendPromoToApiCreate,
  mergePromoExtras,
  savePromoExtras,
} from '../utils/promoApiMapper';

const catalogServiceTypeBySlug: Record<string, ServiceType> = {
  pressing: ServiceType.PRESSING,
  blanchisserie: ServiceType.BLANCHISSERIE,
  cordonnerie: ServiceType.CORDONNERIE,
};

const catalogServiceIconBySlug: Record<string, string> = {
  pressing: 'shirt',
  blanchisserie: 'wash',
  cordonnerie: 'sparkles',
};

const catalogServiceImageBySlug: Record<string, string> = {
  pressing: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&q=80',
  blanchisserie: 'https://images.unsplash.com/photo-1545173153-5dd9215b6f57?w=400&q=80',
  cordonnerie: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
};

const catalogServicePriceBySlug: Record<string, number> = {
  pressing: 2.5,
  blanchisserie: 1.5,
  cordonnerie: 5,
};

const catalogServicePriceModelBySlug: Record<string, Service['priceModel']> = {
  pressing: 'per_item',
  blanchisserie: 'per_kg',
  cordonnerie: 'per_item',
};

const catalogServiceArticlesBySlug: Record<string, { name: string; price: number }[]> = {
  pressing: [{ name: 'Chemise', price: 2.5 }, { name: 'Pantalon', price: 3.5 }],
  blanchisserie: [],
  cordonnerie: [{ name: 'Reparation Talon', price: 10 }, { name: 'Cirage Complet', price: 5 }],
};

const emptySiteContent: SiteContent = {
  hero: { title: '', subtitle: '' },
  howItWorksSteps: [],
  faq: [],
};

const mapSiteContentDataToFrontend = (contentData: SiteContentData): SiteContent => ({
  hero: {
    title: contentData.hero?.title || '',
    subtitle: contentData.hero?.subtitle || '',
  },
  howItWorksSteps: contentData.howItWorksSteps || [],
  faq: contentData.faq || [],
});

const mapSubscriptionPlanToFrontend = (plan: BackendSubscriptionPlan): SubscriptionPlan => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  priceMonthly: Number(plan.price_monthly || 0),
  priceYearly: Number(plan.price_yearly || 0),
  isMostPopular: !!plan.is_most_popular,
  features: plan.features || {},
});

const mapAdvertisementToFrontend = (ad: BackendAdvertisement): Advertisement => ({
  id: ad.id,
  title: ad.title,
  description: ad.description,
  imageUrl: ad.imageUrl,
  linkUrl: ad.linkUrl,
  isActive: ad.isActive,
  createdAt: ad.createdAt,
});

const defaultPartnerFeatures = {
  promotions: true,
  financials: true,
  analytics: true,
  customDomain: false,
  customSubdomain: false,
  teamManagement: true,
  apiAccess: true,
  advancedAutomation: true,
  aiReviewAssistant: true,
  invoiceGenerator: true,
};

const mapCatalogPartnerType = (partnerType: string): PartnerType => {
  switch ((partnerType || '').toLowerCase()) {
    case 'pressing':
    case 'dry_cleaning':
      return PartnerType.PRESSING;
    case 'laundry':
    case 'multi_service':
    default:
      return PartnerType.LAVANDIER;
  }
};

const mapCatalogPartnerToFrontend = (partner: CatalogPartnerSummary): Partner => {
  const addressParts = [
    partner.address_line_1,
    partner.address_line_2,
    partner.commune,
    partner.city,
  ].filter(Boolean);

  return {
    id: partner.id,
    name: partner.name,
    slug: partner.business_name
      ? partner.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : partner.id,
    type: mapCatalogPartnerType(partner.partner_type),
    rating: Number(partner.rating || 0),
    reviewCount: Number(partner.total_reviews || 0),
    imageUrls: [],
    address: addressParts.join(', '),
    coordinates: {
      lat: Number(partner.latitude || 0),
      lng: Number(partner.longitude || 0),
    },
    serviceIds: Array.from(
      { length: Number(partner.available_service_count || 0) },
      (_, index) => `${partner.id}-service-${index + 1}`
    ),
    isFeatured: partner.is_featured,
    createdAt: undefined,
    enabledFeatures: defaultPartnerFeatures,
    currency: 'USD',
  };
};

const mergeCatalogPartnerWithLocal = (
  catalogPartner: CatalogPartnerSummary,
  localPartner?: Partner
): Partner => {
  const mappedCatalogPartner = mapCatalogPartnerToFrontend(catalogPartner);

  if (!localPartner) {
    return mappedCatalogPartner;
  }

  return {
    ...localPartner,
    ...mappedCatalogPartner,
    id: mappedCatalogPartner.id,
    name: mappedCatalogPartner.name,
    slug: localPartner.slug || mappedCatalogPartner.slug,
    type: mappedCatalogPartner.type,
    rating: mappedCatalogPartner.rating,
    reviewCount: mappedCatalogPartner.reviewCount,
    address: mappedCatalogPartner.address || localPartner.address,
    coordinates: mappedCatalogPartner.coordinates,
    isFeatured: mappedCatalogPartner.isFeatured,
    createdAt: localPartner.createdAt,
    serviceIds:
      localPartner.serviceIds && localPartner.serviceIds.length > 0
        ? localPartner.serviceIds
        : mappedCatalogPartner.serviceIds,
    imageUrls:
      localPartner.imageUrls && localPartner.imageUrls.length > 0
        ? localPartner.imageUrls
        : mappedCatalogPartner.imageUrls,
    videoUrl: localPartner.videoUrl,
    mediaGallery: localPartner.mediaGallery,
    workingHours: localPartner.workingHours,
    unavailability: localPartner.unavailability,
    customDomain: localPartner.customDomain,
    enabledFeatures: localPartner.enabledFeatures || mappedCatalogPartner.enabledFeatures,
    currency: localPartner.currency || mappedCatalogPartner.currency,
    commissionRate: localPartner.commissionRate,
    inventory: localPartner.inventory,
    deliverySettings: localPartner.deliverySettings,
    deliveryOps: localPartner.deliveryOps,
    automationSettings: localPartner.automationSettings,
  };
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
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({ isEnabled: true, pointsPerDollar: 10, pointsToDollar: 100, pointsExpiryDays: null });
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
        const [data, catalogPartners, catalogData, siteContentResponse, subscriptionPlanResponse, trackingSettingsResponse, advertisementsResponse, loyaltySettingsResponse, referralSettingsResponse, publicReviewsResponse] = await Promise.all([
          features.useMockApi ? api.fetchAllData() : Promise.resolve(EMPTY_LOCAL_DATA),
          realApi.getCatalogPartners().catch(() => [] as CatalogPartnerSummary[]),
          realApi.getCatalog().catch(() => null),
          realApi.getSiteContent().catch(() => null),
          realApi.getSubscriptionPlans().catch(() => null),
          realApi.getTrackingSettings().catch(() => null),
          realApi.getAdvertisements().catch(() => null),
          realApi.getLoyaltySettings().catch(() => null),
          realApi.getReferralSettings().catch(() => null),
          !features.useMockApi ? realApi.getPublicReviews({ limit: 20 }).catch(() => []) : Promise.resolve([]),
        ]);

        const localPartnersFromStorage = (api.DB.get('partners') as Partner[]) || [];
        const resolvedPartners =
          catalogPartners.length > 0
            ? catalogPartners.map((catalogPartner) =>
                mergeCatalogPartnerWithLocal(
                  catalogPartner,
                  localPartnersFromStorage.find((partner) => partner.id === catalogPartner.id) ||
                    data.partners.find((partner) => partner.id === catalogPartner.id)
                )
              )
            : localPartnersFromStorage.length > 0
              ? localPartnersFromStorage
              : data.partners;

        setPartners(resolvedPartners);

        const mappedCatalogServices: Service[] = catalogData?.service_types?.length
          ? catalogData.service_types
              .filter((st) => ['pressing', 'blanchisserie', 'cordonnerie'].includes(st.slug))
              .map((st) => {
                const slug = st.slug || st.name.toLowerCase().replace(/\s+/g, '-');
                const articles = catalogServiceArticlesBySlug[slug] || [];
                return {
                  id: st.id,
                  type: catalogServiceTypeBySlug[slug] || ServiceType.PRESSING,
                  title: st.name,
                  description: st.description || '',
                  iconName: catalogServiceIconBySlug[slug] || 'wash',
                  imageUrl: catalogServiceImageBySlug[slug] || '',
                  priceModel: catalogServicePriceModelBySlug[slug] || 'per_item',
                  price: catalogServicePriceBySlug[slug] || 2,
                  articleCategories: articles.length > 0
                    ? [{
                        name: 'General',
                        items: articles.map((article, index) => ({
                          id: `${st.id}-art-${index}`,
                          name: article.name,
                          price: article.price,
                          description: article.name,
                          imageUrl: '',
                        })),
                      }]
                    : undefined,
                };
              })
          : data.services;

        setServices(mappedCatalogServices);
        setLogisticsPartners(data.logisticsPartners);
        setReviews(
          !features.useMockApi && publicReviewsResponse.length > 0
            ? publicReviewsResponse.map(mapPublicReviewToFrontend)
            : data.reviews
        );
        setUsers(data.users);

        let resolvedOrderHistory = data.orderHistory;
        if (user && user.role === 'customer' && !features.useMockApi) {
          try {
            const ordersResponse = await realApi.getOrders({ page: 1, page_size: 100 });
            resolvedOrderHistory = (ordersResponse.orders || []).map((backendOrder) =>
              mapBackendOrderResponseToFrontend(backendOrder, resolvedPartners)
            );
          } catch (orderError) {
            console.warn('Failed to load customer orders from API', orderError);
          }
        }
        setOrderHistory(resolvedOrderHistory);
        setPartnerApplications(data.partnerApplications.filter(app => app.status === ApplicationStatus.PENDING));
        setSupportTickets(data.supportTickets);
        setChats(data.chats);
        let resolvedPromoCodes: PromoCode[] = data.promoCodes;
        if (!features.useMockApi) {
          const localPromoCodes = ((api.DB.get('promoCodes') as PromoCode[]) || []).map(mergePromoExtras);
          if (user?.partnerId && String(user.role).startsWith('partner')) {
            try {
              const response = await realApi.getPartnerPromoCodes(user.partnerId);
              resolvedPromoCodes = response.promo_codes.map((item) => mapApiPromoToFrontend(item));
            } catch (promoError) {
              console.warn('Failed to load partner promos from API, using local cache', promoError);
              resolvedPromoCodes = localPromoCodes.filter(
                (promo) => String(promo.partnerId) === String(user.partnerId),
              );
            }
          } else if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            try {
              const response = await realApi.getPromoCodes();
              resolvedPromoCodes = response.promo_codes.map((item) => mapApiPromoToFrontend(item));
            } catch (promoError) {
              console.warn('Failed to load admin promos from API, using local cache', promoError);
              resolvedPromoCodes = localPromoCodes;
            }
          } else {
            resolvedPromoCodes = localPromoCodes;
          }
        }
        setPromoCodes(resolvedPromoCodes);
        setLoyaltySettings(
          loyaltySettingsResponse
            ? {
                isEnabled: !!loyaltySettingsResponse.isEnabled,
                pointsPerDollar: Number(loyaltySettingsResponse.pointsPerDollar || 0),
                pointsToDollar: Number(loyaltySettingsResponse.pointsToDollar || 100),
                pointsExpiryDays: loyaltySettingsResponse.pointsExpiryDays == null ? null : Number(loyaltySettingsResponse.pointsExpiryDays),
              }
            : data.loyaltySettings
        );
        setReferralSettings(
          referralSettingsResponse
            ? {
                isEnabled: !!referralSettingsResponse.isEnabled,
                referrerBonusPoints: Number(referralSettingsResponse.referrerBonusPoints || 0),
                refereeDiscountAmount: Number(referralSettingsResponse.refereeDiscountAmount || 0),
              }
            : data.referralSettings
        );
        setAdvertisements(
          advertisementsResponse?.advertisements?.length
            ? advertisementsResponse.advertisements.map(mapAdvertisementToFrontend)
            : data.advertisements
        );
        setNotificationAnalytics(data.notificationAnalytics);
        setApplicationSettings(data.applicationSettings);
        setTrackingSettings(
          trackingSettingsResponse
            ? {
                gtmContainerId: trackingSettingsResponse.gtmContainerId || '',
                metaPixelId: trackingSettingsResponse.metaPixelId || '',
              }
            : data.trackingSettings
        );
        setCommissionSettings(data.commissionSettings);
        setRawSiteContent(
          siteContentResponse?.content_data
            ? mapSiteContentDataToFrontend(siteContentResponse.content_data)
            : data.siteContent
        );
        setSubscriptionPlans(
          subscriptionPlanResponse?.plans?.length
            ? subscriptionPlanResponse.plans.map(mapSubscriptionPlanToFrontend)
            : data.subscriptionPlans
        );
        setInvoices(data.invoices);
        setRefundRequests(data.refundRequests);
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
  }, [user]);

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
    const response = await realApi.updateSiteContent(newContent);
    setRawSiteContent(mapSiteContentDataToFrontend(response.content_data));
    addNotification(t('notifications.siteContentUpdated'), 'success');
  }, [addNotification, t]);

  const addSubscriptionPlan = useCallback(async (plan: Omit<SubscriptionPlan, 'id'>) => {
    const slug = plan.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const created = await realApi.createSubscriptionPlan({
      slug,
      name: plan.name,
      description: plan.description,
      price_monthly: plan.priceMonthly,
      price_yearly: plan.priceYearly,
      is_most_popular: !!plan.isMostPopular,
      features: plan.features || {},
    });
    setSubscriptionPlans((current) => [...current, mapSubscriptionPlanToFrontend(created)]);
    addNotification(t('subscriptionManagement.planSaved', { default: 'Subscription plan saved.' }), 'success');
  }, [addNotification, t]);

  const updateSubscriptionPlan = useCallback(async (plan: SubscriptionPlan) => {
    const updated = await realApi.updateSubscriptionPlan(plan.id, {
      name: plan.name,
      description: plan.description,
      price_monthly: plan.priceMonthly,
      price_yearly: plan.priceYearly,
      is_most_popular: !!plan.isMostPopular,
      features: plan.features || {},
    });
    setSubscriptionPlans((current) =>
      current.map((item) => (item.id === updated.id ? mapSubscriptionPlanToFrontend(updated) : item))
    );
    addNotification(t('subscriptionManagement.planUpdated', { default: 'Subscription plan updated.' }), 'success');
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
  
  const createSupportTicket = useCallback(async (ticketData: {
    subject: string;
    message: string;
    orderId?: string;
    userId?: string;
  }) => {
      if (!features.useMockApi) {
        await realApi.createCustomerSupportTicket({
          title: ticketData.subject,
          description: ticketData.message,
          order_id: ticketData.orderId,
          category: 'order',
        });
      } else {
        await api.apiCreateSupportTicket(ticketData);
      }
      addNotification(t('notifications.ticketCreated'), 'success');
      appEvents.emit('data_changed');
  }, [addNotification, t]);
  
  const addMessageToTicket = useCallback(async (ticketId: string, messageData: { message: string }) => {
      if (!features.useMockApi) {
        await realApi.replyCustomerSupportTicket(ticketId, messageData.message);
      } else {
        await api.apiAddMessageToTicket(ticketId, messageData);
      }
      appEvents.emit('data_changed');
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
    const response = await realApi.updateLoyaltySettings(settings);
    setLoyaltySettings({
      isEnabled: !!response.isEnabled,
      pointsPerDollar: Number(response.pointsPerDollar || 0),
      pointsToDollar: Number(response.pointsToDollar || 100),
      pointsExpiryDays: response.pointsExpiryDays == null ? null : Number(response.pointsExpiryDays),
    });
    addNotification(t('loyaltyManagement.settingsSaved'), 'success');
  }, [addNotification, t]);
  
  const updateReferralSettings = useCallback(async (settings: ReferralSettings) => {
    const response = await realApi.updateReferralSettings(settings);
    setReferralSettings({
      isEnabled: !!response.isEnabled,
      referrerBonusPoints: Number(response.referrerBonusPoints || 0),
      refereeDiscountAmount: Number(response.refereeDiscountAmount || 0),
    });
    addNotification(t('referralManagement.settingsSaved'), 'success');
  }, [addNotification, t]);

  const updateTrackingSettings = useCallback(async (settings: TrackingSettings) => {
      const response = await realApi.updateTrackingSettings(settings);
      setTrackingSettings({
        gtmContainerId: response.gtmContainerId || '',
        metaPixelId: response.metaPixelId || '',
      });
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

  const addAdvertisement = useCallback(async (adData: any) => {
    const created = await realApi.createAdvertisement(adData);
    setAdvertisements((current) => [mapAdvertisementToFrontend(created), ...current]);
    addNotification(t('adManagement.saved', { default: 'Advertisement saved.' }), 'success');
  }, [addNotification, t]);
  const updateAdvertisement = useCallback(async (ad: Advertisement) => {
    const updated = await realApi.updateAdvertisement(ad.id, {
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      isActive: ad.isActive,
    });
    setAdvertisements((current) =>
      current.map((item) => (item.id === updated.id ? mapAdvertisementToFrontend(updated) : item))
    );
    addNotification(t('adManagement.updated', { default: 'Advertisement updated.' }), 'success');
  }, [addNotification, t]);
  const deleteAdvertisement = useCallback(async (adId: string) => {
    await realApi.deleteAdvertisement(adId);
    setAdvertisements((current) => current.filter((item) => item.id !== adId));
    addNotification(t('adManagement.deleted', { default: 'Advertisement deleted.' }), 'success');
  }, [addNotification, t]);

  const addPromoCode = useCallback(async (promo: Omit<PromoCode, 'id' | 'createdAt'>) => {
      if (!features.useMockApi && promo.partnerId) {
        const apiPromo = await realApi.createPartnerPromoCode(
          promo.partnerId,
          mapFrontendPromoToApiCreate(promo),
        );
        const created = mapApiPromoToFrontend(apiPromo, promo);
        savePromoExtras(created.id, promo);
        setPromoCodes((current) => [...current, created]);
        addNotification(t('notifications.promoAdded'), 'success');
        return created;
      }

      const created = await api.apiAddPromoCode(promo);
      setPromoCodes((current) => [...current, created]);
      addNotification(t('notifications.promoAdded'), 'success');
      return created;
  }, [addNotification, t]);

  const recordPromoUsage = useCallback(async (code: string, discountAmount: number) => {
      const promo = promoCodes.find((p) => p.code.toUpperCase() === code.toUpperCase());
      if (!promo) return;
      const updated: PromoCode = {
        ...promo,
        usageCount: (promo.usageCount || 0) + 1,
        budgetUsed: (promo.budgetUsed || 0) + Math.max(0, discountAmount),
      };
      await api.apiUpdatePromoCode(updated);
      setPromoCodes((current) => current.map((p) => (p.id === updated.id ? updated : p)));
  }, [promoCodes]);
  const updatePromoCode = useCallback(async (promo: PromoCode) => {
      await api.apiUpdatePromoCode(promo);
      addNotification(t('notifications.promoUpdated'), 'success');
  }, [addNotification, t]);
  const deletePromoCode = useCallback(async (promoId: string) => {
      await api.apiDeletePromoCode(promoId);
      setPromoCodes((current) => current.filter((p) => p.id !== promoId));
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
  const analyzeFabric = useCallback((imageData: string) => api.apiAnalyzeFabric(imageData), []);
  const smartPricingAdvice = useCallback((partnerId: string) => api.apiSmartPricingAdvice(partnerId), []);
  const generateBirthdayReward = useCallback((userName: string, orderCount: number) => api.apiGenerateBirthdayReward(userName, orderCount), []);
  const checkCapacity = useCallback(() => api.apiCheckCapacity(), []);
  const smartPriceEstimate = useCallback((params: { serviceType: string; commune: string; volume: number; garmentTypes?: string[] }) => api.apiSmartPriceEstimate(params), []);
  const generateChurnCoupon = useCallback((customerId: string, orderCount: number, lastOrderDays: number) => api.apiGenerateChurnCoupon(customerId, orderCount, lastOrderDays), []);
  const detectFraud = useCallback(() => api.apiDetectFraud(), []);
  
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
    recordPromoUsage,
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
    analyzeFabric,
    smartPricingAdvice,
    generateBirthdayReward,
    checkCapacity,
    smartPriceEstimate,
    generateChurnCoupon,
    detectFraud,
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
    apiUpdatePartnerDeliveryOps: api.apiUpdatePartnerDeliveryOps,
    apiUpdatePartnerMedia: api.apiUpdatePartnerMedia,
    apiGenerateProforma: api.apiGenerateProforma,
    apiGenerateInvoice: api.apiGenerateInvoice,
    addSubscriptionPlan,
    updateSubscriptionPlan
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
    addPromoCode,
    recordPromoUsage, updatePromoCode, deletePromoCode, reassignDriver,
    addLogisticsPartner, updateLogisticsPartner, deleteLogisticsPartner,
    updateApplicationSettings, submitRefundRequest, approveRefundRequest,
    rejectRefundRequest, getChatbotResponse, generatePersonalizedRecommendation,
    analyzeLaundryImage, analyzeStainImage, analyzePartnerHealth,
    analyzePartnerReviews, generateReviewResponse, submitReviewReply,
    generateMarketingPromo, regeneratePromoImage, generateDemandForecast,
    suggestReassignment, optimizeRoutes, confirmOptimizedRoutes, addAdmin,
    apiUpdateUserPermissions, addService, updateService, deleteService,
    getChatForOrder, getDriversForLogisticsPartner, addSubscriptionPlan, updateSubscriptionPlan
  ]);

  return (
    <DataContext.Provider value={value as any}>
      {children}
    </DataContext.Provider>
  );
};
