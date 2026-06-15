export type OrderStatusFilter = 'all' | 'created' | 'confirmed' | 'pickup_assigned' | 'picked_up' | 'cleaning' | 'quality' | 'delivery_assigned' | 'delivered' | 'completed' | 'dispute';

export interface OrderKpis {
  total: number;
  active: number;
  inPickup: number;
  inCleaning: number;
  inDelivery: number;
  disputes: number;
  slaGlobal: number;
  revenueToday: number;
}

export interface PipelineStep {
  label: string;
  count: number;
  icon: string;
  color: string;
}

export interface LiveOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  partnerName: string;
  partnerCommune: string;
  driverName: string;
  driverPhone: string;
  status: string;
  statusColor: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  eta: string;
  sla: number;
  slaColor: string;
  commune: string;
}

export interface OrderSlaData {
  inSla: number;
  atRisk: number;
  outOfSla: number;
  inSlaPercent: number;
  atRiskPercent: number;
  outOfSlaPercent: number;
}

export interface OrderFunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface OrderRevenueData {
  mrr: number;
  mrrChange: number;
  monthly: Array<{ month: string; value: number }>;
}

export interface OrderRevenueBlock {
  grossRevenue: number;
  commissions: number;
  refunds: number;
  net: number;
}

export interface OrderAnomaly {
  id: string;
  title: string;
  count: number;
  icon: string;
  color: string;
}

export interface OrderPartner {
  name: string;
  activeOrders: number;
  sla: number;
  deliveriesInProgress: number;
  rating: number;
}

export interface OrderInvoiceKpis {
  issued: number;
  paid: number;
  overdue: number;
  collected: number;
}

export interface OrderActivity {
  id: string;
  time: string;
  action: string;
  detail: string;
  icon: string;
  color: string;
}

export interface OrderMapZone {
  name: string;
  type: string;
  count: number;
  color: string;
  x: number;
  y: number;
}
