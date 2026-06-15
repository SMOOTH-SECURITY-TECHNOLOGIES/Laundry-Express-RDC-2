export type ServiceStatus = 'active' | 'inactive' | 'draft' | 'deprecated';
export type ServiceCategory = 'pressing' | 'blanchisserie' | 'livraison' | 'reparation' | 'repassage';

export interface AdminServiceSummary {
  activeServices: number;
  monthlyRevenue: number;
  totalOrders: number;
  averageSla: number;
  averageRating: number;
  globalTruthScore: number;
  currency: 'USD' | 'CDF';
}

export interface AdminServicePerformance {
  id: string;
  name: string;
  category: ServiceCategory;
  revenue: number;
  orders: number;
  sla: number;
  rating: number;
  growth: number;
}

export interface AdminServiceRevenuePoint {
  date: string;
  'Nettoyage à sec': number;
  'Lessive': number;
  'Express': number;
  'Cordonnerie': number;
  'Repassage': number;
}

export interface AdminServiceMixItem {
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface AdminServiceGeoZone {
  name: string;
  partners: number;
  revenue: number;
  sla: number;
  services: number;
  x: number;
  y: number;
}

export interface AdminServiceHealthItem {
  name: string;
  availability: number;
  sla: number;
  delays: number;
  disputes: number;
  refunds: number;
  score: number;
}

export interface AdminServiceTruthCorridor {
  name: string;
  order: number;
  payment: number;
  logistics: number;
  total: number;
}

export interface AdminServiceFunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AdminServiceWatchItem {
  name: string;
  problem: string;
  sla: number;
  anomalies: number;
  impact: 'Élevé' | 'Moyen' | 'Faible';
}

export interface AdminServiceRankingItem {
  rank: number;
  name: string;
  value: number;
}

export interface AdminServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  partnerCount: number;
  averagePrice: number;
  revenue: number;
  orders: number;
  sla: number;
  truthScore: number;
  status: ServiceStatus;
}

export interface AdminServiceAlert {
  icon: string;
  color: string;
  label: string;
  description: string;
}
