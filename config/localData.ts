import { PartnerType } from '../types';

/** Empty local mock payload — never used for transactional data in real API mode. */
export const EMPTY_LOCAL_DATA = {
  partners: [],
  services: [],
  logisticsPartners: [],
  reviews: [],
  users: [],
  orderHistory: [],
  partnerApplications: [],
  supportTickets: [],
  chats: [],
  promoCodes: [],
  loyaltySettings: { isEnabled: true, pointsPerDollar: 10, pointsToDollar: 100, pointsExpiryDays: null },
  referralSettings: { isEnabled: true, referrerBonusPoints: 500, refereeDiscountAmount: 5 },
  appNotifications: [],
  notificationAnalytics: [],
  advertisements: [],
  applicationSettings: {
    [PartnerType.PRESSING]: true,
    [PartnerType.LAVANDIER]: true,
    [PartnerType.LOGISTICS]: true,
  },
  trackingSettings: { gtmContainerId: '', metaPixelId: '' },
  commissionSettings: { globalRate: 0, byServiceType: {} },
  siteContent: {},
  subscriptionPlans: [],
  invoices: [],
  refundRequests: [],
};
