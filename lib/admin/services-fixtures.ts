import type { AdminServiceSummary, AdminServicePerformance, AdminServiceRevenuePoint, AdminServiceMixItem, AdminServiceGeoZone, AdminServiceHealthItem, AdminServiceTruthCorridor, AdminServiceFunnelStep, AdminServiceWatchItem, AdminServiceRankingItem, AdminServiceCatalogItem, AdminServiceAlert } from './services-types';

export const MOCK_SUMMARY: AdminServiceSummary = {
  activeServices: 18,
  monthlyRevenue: 84500,
  totalOrders: 12458,
  averageSla: 94,
  averageRating: 4.8,
  globalTruthScore: 97,
  currency: 'USD',
};

export const MOCK_PERFORMANCE: AdminServicePerformance[] = [
  { id: 'S1', name: 'Nettoyage à sec', category: 'pressing', revenue: 45800, orders: 5200, sla: 96, rating: 4.9, growth: 18 },
  { id: 'S2', name: 'Lessive', category: 'blanchisserie', revenue: 30400, orders: 4800, sla: 94, rating: 4.8, growth: 12 },
  { id: 'S3', name: 'Express', category: 'livraison', revenue: 11900, orders: 1200, sla: 91, rating: 4.7, growth: 9 },
  { id: 'S4', name: 'Cordonnerie', category: 'reparation', revenue: 7300, orders: 600, sla: 88, rating: 4.5, growth: 4 },
  { id: 'S5', name: 'Repassage', category: 'blanchisserie', revenue: 4100, orders: 420, sla: 93, rating: 4.6, growth: 7 },
];

export const MOCK_REVENUE: AdminServiceRevenuePoint[] = [
  { date: '7 mai', 'Nettoyage à sec': 1200, 'Lessive': 800, 'Express': 350, 'Cordonnerie': 180, 'Repassage': 100 },
  { date: '14 mai', 'Nettoyage à sec': 1500, 'Lessive': 1000, 'Express': 400, 'Cordonnerie': 220, 'Repassage': 130 },
  { date: '21 mai', 'Nettoyage à sec': 1400, 'Lessive': 950, 'Express': 380, 'Cordonnerie': 200, 'Repassage': 110 },
  { date: '28 mai', 'Nettoyage à sec': 1600, 'Lessive': 1100, 'Express': 450, 'Cordonnerie': 250, 'Repassage': 140 },
  { date: '4 juin', 'Nettoyage à sec': 1800, 'Lessive': 1200, 'Express': 500, 'Cordonnerie': 280, 'Repassage': 150 },
];

export const MOCK_MIX: AdminServiceMixItem[] = [
  { name: 'Nettoyage à sec', percentage: 45, amount: 38025, color: '#3B82F6' },
  { name: 'Lessive', percentage: 30, amount: 25350, color: '#22C55E' },
  { name: 'Express', percentage: 15, amount: 12675, color: '#8B5CF6' },
  { name: 'Cordonnerie', percentage: 10, amount: 8450, color: '#F59E0B' },
];

export const MOCK_GEO: AdminServiceGeoZone[] = [
  { name: 'Gombe', partners: 12, revenue: 18800, sla: 95, services: 5, x: 200, y: 120 },
  { name: 'Limete', partners: 11, revenue: 16800, sla: 94, services: 4, x: 320, y: 200 },
  { name: 'Ngaliema', partners: 9, revenue: 14200, sla: 91, services: 4, x: 100, y: 250 },
  { name: 'Kalamu', partners: 7, revenue: 9300, sla: 92, services: 3, x: 250, y: 300 },
  { name: 'Kimbanseke', partners: 5, revenue: 5800, sla: 90, services: 3, x: 380, y: 320 },
  { name: 'Masina', partners: 6, revenue: 6600, sla: 88, services: 3, x: 420, y: 250 },
];

export const MOCK_HEALTH: AdminServiceHealthItem[] = [
  { name: 'Nettoyage à sec', availability: 98, sla: 96, delays: 2, disputes: 1, refunds: 1, score: 92 },
  { name: 'Lessive', availability: 97, sla: 94, delays: 3, disputes: 2, refunds: 2, score: 88 },
  { name: 'Express', availability: 93, sla: 91, delays: 6, disputes: 4, refunds: 4, score: 78 },
  { name: 'Cordonnerie', availability: 90, sla: 88, delays: 7, disputes: 5, refunds: 5, score: 72 },
  { name: 'Repassage', availability: 95, sla: 93, delays: 4, disputes: 2, refunds: 2, score: 85 },
];

export const MOCK_TRUTH: AdminServiceTruthCorridor[] = [
  { name: 'Nettoyage à sec', order: 0, payment: 1, logistics: 0, total: 1 },
  { name: 'Lessive', order: 1, payment: 1, logistics: 0, total: 2 },
  { name: 'Express', order: 2, payment: 2, logistics: 1, total: 5 },
  { name: 'Cordonnerie', order: 1, payment: 1, logistics: 0, total: 2 },
  { name: 'Repassage', order: 0, payment: 1, logistics: 0, total: 1 },
];

export const MOCK_FUNNEL: AdminServiceFunnelStep[] = [
  { label: 'Visites', value: 124580, percentage: 100, color: '#3B82F6' },
  { label: 'Estimations', value: 48230, percentage: 38.8, color: '#6366F1' },
  { label: 'Commandes', value: 21450, percentage: 44.4, color: '#8B5CF6' },
  { label: 'Paiements', value: 20120, percentage: 93.8, color: '#22C55E' },
  { label: 'Collectes', value: 18450, percentage: 91.7, color: '#F59E0B' },
  { label: 'Livraisons', value: 17620, percentage: 95.5, color: '#10B981' },
];

export const MOCK_WATCHLIST: AdminServiceWatchItem[] = [
  { name: 'Express Premium', problem: 'SLA faible', sla: 78, anomalies: 7, impact: 'Élevé' },
  { name: 'Repassage', problem: 'Faible adoption', sla: 65, anomalies: 3, impact: 'Moyen' },
  { name: 'Cordonnerie', problem: 'Retards élevés', sla: 80, anomalies: 5, impact: 'Élevé' },
  { name: 'Lessive Standard', problem: 'Remboursements', sla: 85, anomalies: 4, impact: 'Moyen' },
];

export const MOCK_RANKINGS: Record<string, AdminServiceRankingItem[]> = {
  Revenus: [
    { rank: 1, name: 'Nettoyage à sec', value: 45800 },
    { rank: 2, name: 'Lessive', value: 30400 },
    { rank: 3, name: 'Express', value: 11900 },
    { rank: 4, name: 'Cordonnerie', value: 7300 },
    { rank: 5, name: 'Repassage', value: 4100 },
  ],
  Croissance: [
    { rank: 1, name: 'Nettoyage à sec', value: 18 },
    { rank: 2, name: 'Lessive', value: 12 },
    { rank: 3, name: 'Express', value: 9 },
    { rank: 4, name: 'Repassage', value: 7 },
    { rank: 5, name: 'Cordonnerie', value: 4 },
  ],
  Satisfaction: [
    { rank: 1, name: 'Nettoyage à sec', value: 4.9 },
    { rank: 2, name: 'Lessive', value: 4.8 },
    { rank: 3, name: 'Express', value: 4.7 },
    { rank: 4, name: 'Repassage', value: 4.6 },
    { rank: 5, name: 'Cordonnerie', value: 4.5 },
  ],
  Marge: [
    { rank: 1, name: 'Nettoyage à sec', value: 72 },
    { rank: 2, name: 'Lessive', value: 65 },
    { rank: 3, name: 'Express', value: 58 },
    { rank: 4, name: 'Cordonnerie', value: 52 },
    { rank: 5, name: 'Repassage', value: 48 },
  ],
};

export const MOCK_CATALOG: AdminServiceCatalogItem[] = [
  { id: 'S1', name: 'Nettoyage à sec', category: 'pressing', partnerCount: 42, averagePrice: 18, revenue: 45800, orders: 5200, sla: 96, truthScore: 99, status: 'active' },
  { id: 'S2', name: 'Lessive', category: 'blanchisserie', partnerCount: 38, averagePrice: 7.5, revenue: 30400, orders: 4800, sla: 94, truthScore: 97, status: 'active' },
  { id: 'S3', name: 'Express', category: 'livraison', partnerCount: 27, averagePrice: 5, revenue: 11900, orders: 1200, sla: 91, truthScore: 95, status: 'active' },
  { id: 'S4', name: 'Cordonnerie', category: 'reparation', partnerCount: 15, averagePrice: 4, revenue: 7300, orders: 600, sla: 88, truthScore: 93, status: 'active' },
  { id: 'S5', name: 'Repassage', category: 'blanchisserie', partnerCount: 12, averagePrice: 3, revenue: 4100, orders: 420, sla: 93, truthScore: 96, status: 'active' },
];

export const MOCK_ALERTS: AdminServiceAlert[] = [
  { icon: 'warning', color: 'text-red-500', label: '2 services sous SLA', description: 'SLA < 90%' },
  { icon: 'shield-check', color: 'text-orange-500', label: '3 anomalies détectées', description: 'Corridors de vérité' },
  { icon: 'currencyDollar', color: 'text-yellow-500', label: '5 remboursements élevés', description: 'Sur les 7 derniers jours' },
  { icon: 'users', color: 'text-blue-500', label: '2 services à faible adoption', description: '< 10 commandes / jour' },
];
