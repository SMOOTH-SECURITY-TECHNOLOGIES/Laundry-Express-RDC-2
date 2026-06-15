import type { PromotionsCenterBundle, PromoKpis } from './promotions-types';

export const promoKpis: PromoKpis = {
  activePromotions: 24,
  activeChange: 14,
  usages: 4820,
  usagesChange: 18,
  revenueGenerated: 42500,
  revenueChange: 22,
  avgRoi: 5.8,
  roiChange: 12,
  reactivatedClients: 312,
  reactivatedChange: 20,
  conversionRate: 18.4,
  conversionChange: 8,
};

export function promotionsFixtureBundle(): PromotionsCenterBundle {
  return {
    kpis: promoKpis,
    growthScore: { score: 82, label: 'Excellent', acquisition: 85, conversion: 78, retention: 88, reactivation: 76 },
    activePromotions: [
      { id: 'p1', code: 'WELCOME20', type: 'percentage', reduction: '20%', usages: 248, revenue: 8400, startDate: '01/06', endDate: '30/06', status: 'active', roi: 6.2 },
      { id: 'p2', code: 'WEEKEND15', type: 'percentage', reduction: '15%', usages: 412, revenue: 6200, startDate: '01/06', endDate: '31/12', status: 'active', roi: 5.4 },
      { id: 'p3', code: 'FREESHIP', type: 'delivery', reduction: 'Livraison gratuite', usages: 890, revenue: 11200, startDate: '15/05', endDate: '15/07', status: 'active', roi: 7.1 },
      { id: 'p4', code: 'CASHBACK10', type: 'cashback', reduction: '10% cashback', usages: 156, revenue: 3800, startDate: '01/06', endDate: '30/06', status: 'active', roi: 4.8 },
      { id: 'p5', code: 'VIP50', type: 'fixed', reduction: '10 $', usages: 89, revenue: 2900, startDate: '01/05', endDate: '31/08', status: 'active', roi: 5.1 },
      { id: 'p6', code: 'REACTIVATE30', type: 'percentage', reduction: '30%', usages: 312, revenue: 5200, startDate: '01/06', endDate: '30/06', status: 'active', roi: 8.2 },
    ],
    campaigns: [
      { id: 'c1', name: 'Retour clients dormants Juin', objective: 'Réactivation', audience: 'Dormants 30j+', budget: 5000, conversions: 312, roi: 8.2, status: 'active' },
      { id: 'c2', name: 'Black Friday Early', objective: 'Acquisition', audience: 'Nouveaux clients', budget: 8000, conversions: 420, roi: 6.5, status: 'active' },
      { id: 'c3', name: 'Promo Gombe Weekend', objective: 'Conversion', audience: 'Zone Gombe', budget: 2500, conversions: 185, roi: 5.9, status: 'active' },
      { id: 'c4', name: 'Happy Hour 14h-16h', objective: 'Fréquence', audience: 'Clients actifs', budget: 1200, conversions: 98, roi: 4.2, status: 'completed' },
    ],
    segments: [
      { segment: 'Nouveaux', segmentKey: 'new', clients: 1240, revenue: 14200, conversionRate: 22.4 },
      { segment: 'Actifs', segmentKey: 'active', clients: 3850, revenue: 18600, conversionRate: 16.8 },
      { segment: 'VIP', segmentKey: 'vip', clients: 420, revenue: 9800, conversionRate: 12.2 },
      { segment: 'Dormants 30j+', segmentKey: 'dormant', clients: 3980, revenue: 4200, conversionRate: 7.8 },
      { segment: 'Faible panier', segmentKey: 'low_basket', clients: 2100, revenue: 5800, conversionRate: 14.1 },
      { segment: 'Fort panier', segmentKey: 'high_basket', clients: 680, revenue: 11200, conversionRate: 19.6 },
    ],
    reactivation: {
      dormant30: 3980, dormant60: 2450, dormant90: 1820,
      reactivated: 312, reactivationRate: 7.84,
      bestOffer: 'REACTIVATE30',
      topActions: [
        { action: 'WhatsApp + Coupon', count: 142 },
        { action: 'SMS + Cashback', count: 98 },
        { action: 'Email + Livraison gratuite', count: 72 },
      ],
    },
    loyalty: {
      pointsDistributed: 48200,
      pointsUsed: 28400,
      rewardsRedeemed: 156,
      topClients: [
        { name: 'Marie K.', points: 4200, revenue: 3200 },
        { name: 'Jean M.', points: 3800, revenue: 2850 },
        { name: 'Paul T.', points: 3100, revenue: 2400 },
      ],
    },
    referral: {
      invitationsSent: 842,
      accountsCreated: 312,
      ordersGenerated: 186,
      rewardsDistributed: 4200,
    },
    zones: [
      { id: 'gombe', name: 'Gombe', promotionsUsed: 1240, revenue: 12450, conversionRate: 18.2, mapX: 52, mapY: 38, heatColor: '#22C55E' },
      { id: 'limete', name: 'Limete', promotionsUsed: 890, revenue: 8200, conversionRate: 15.4, mapX: 58, mapY: 45, heatColor: '#3B82F6' },
      { id: 'ngaliema', name: 'Ngaliema', promotionsUsed: 720, revenue: 6800, conversionRate: 14.8, mapX: 42, mapY: 42, heatColor: '#3B82F6' },
      { id: 'masina', name: 'Masina', promotionsUsed: 540, revenue: 4200, conversionRate: 12.1, mapX: 65, mapY: 55, heatColor: '#F59E0B' },
      { id: 'kintambo', name: 'Kintambo', promotionsUsed: 480, revenue: 3850, conversionRate: 11.8, mapX: 48, mapY: 50, heatColor: '#F59E0B' },
    ],
    funnel: [
      { stage: 'Vues', count: 10000, percent: 100 },
      { stage: 'Cliqué', count: 3200, percent: 32 },
      { stage: 'Coupon obtenu', count: 1200, percent: 12 },
      { stage: 'Coupon utilisé', count: 980, percent: 9.8 },
      { stage: 'Commande', count: 840, percent: 8.4 },
    ],
    attribution: [
      { channel: 'WhatsApp', channelKey: 'whatsapp', percent: 44, conversions: 2116, revenue: 18700, roi: 6.8, color: '#25D366' },
      { channel: 'SMS', channelKey: 'sms', percent: 22, conversions: 1060, revenue: 9350, roi: 5.2, color: '#3B82F6' },
      { channel: 'Email', channelKey: 'email', percent: 18, conversions: 868, revenue: 7650, roi: 4.8, color: '#8B5CF6' },
      { channel: 'Push', channelKey: 'push', percent: 10, conversions: 482, revenue: 4250, roi: 4.1, color: '#F59E0B' },
      { channel: 'Web', channelKey: 'web', percent: 6, conversions: 294, revenue: 2550, roi: 3.9, color: '#6B7280' },
    ],
    abTests: [
      { id: 'ab1', name: '10% réduction', conversionRate: 14.2, roi: 4.8, avgBasket: 32.5 },
      { id: 'ab2', name: '15% réduction', conversionRate: 17.8, roi: 5.6, avgBasket: 34.2, isWinner: true },
      { id: 'ab3', name: '20% réduction', conversionRate: 16.4, roi: 4.2, avgBasket: 38.1 },
      { id: 'ab4', name: 'Cashback 10%', conversionRate: 15.1, roi: 5.1, avgBasket: 33.8 },
      { id: 'ab5', name: 'Livraison gratuite', conversionRate: 19.2, roi: 7.1, avgBasket: 28.4, isWinner: true },
    ],
    topPromotions: [
      { code: 'FREESHIP', revenue: 11200, roi: 7.1, usages: 890, rank: 1 },
      { code: 'WELCOME20', revenue: 8400, roi: 6.2, usages: 248, rank: 2 },
      { code: 'WEEKEND15', revenue: 6200, roi: 5.4, usages: 412, rank: 3 },
      { code: 'REACTIVATE30', revenue: 5200, roi: 8.2, usages: 312, rank: 4 },
      { code: 'CASHBACK10', revenue: 3800, roi: 4.8, usages: 156, rank: 5 },
    ],
    riskPromotions: [
      { id: 'r1', code: 'FLASH50', issue: 'Budget explosé', level: 'high', impact: '92% budget consommé en 2j' },
      { id: 'r2', code: 'MULTIUSE', issue: 'Abus détecté', level: 'high', impact: '12 utilisations même client' },
      { id: 'r3', code: 'OLDPROMO', issue: 'Taux conversion faible', level: 'medium', impact: '2.1% vs 18.4% moyenne' },
    ],
    insights: [
      { id: 'i1', text: 'Les coupons livraison gratuite convertissent 2,1x mieux que les réductions en pourcentage.', type: 'success' },
      { id: 'i2', text: 'Le segment dormant réagit mieux aux cashback (+34% vs email).', type: 'info' },
      { id: 'i3', text: 'Les clients VIP utilisent peu les réductions mais génèrent le plus de CA post-promo.', type: 'warning' },
      { id: 'i4', text: 'WhatsApp génère 44% des conversions promo — canal le plus rentable.', type: 'success' },
    ],
  };
}
