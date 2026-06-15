export type FinanceTrendDirection = 'up' | 'down' | 'flat';
export type FinanceTruthStatus = 'healthy' | 'warning' | 'critical';
export type FinanceAlertSeverity = 'critical' | 'warning' | 'info';

export interface FinanceDashboard {
  todayRevenue: number;
  todayChange: number;
  weekRevenue: number;
  weekChange: number;
  monthRevenue: number;
  monthChange: number;
  commissionDue: number;
  commissionPaid: number;
  cashInTransit: number;
  grossMargin: number;
  trendPercent: number;
  trendSparkline: number[];
}

export interface DailyRevenuePoint {
  date: string;
  amount: number;
}

export interface DailyRevenueSummary {
  points: DailyRevenuePoint[];
  totalRevenue: number;
  totalOrders: number;
  avgBasket: number;
  growthPercent: number;
}

export interface RevenueBreakdownItem {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

export interface PartnerRevenueRow {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  commission: number;
  trend: FinanceTrendDirection;
}

export interface LeakageItem {
  id: string;
  type: string;
  label: string;
  count: number;
  description: string;
  color: string;
  bg: string;
  border: string;
}

export interface FinancialAlert {
  id: string;
  severity: FinanceAlertSeverity;
  message: string;
  timestamp: string;
  amount: number;
  investigateId?: string;
}

export interface ZoneRevenue {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  avgBasket: number;
  healthColor: string;
  mapX: number;
  mapY: number;
}

export interface FinancialTruthCorridor {
  id: string;
  name: string;
  status: FinanceTruthStatus;
  issues: number;
}

export interface FinanceFilters {
  dateStart: string;
  dateEnd: string;
  service: string;
  zone: string;
  partner: string;
}

export type FinanceWsChannel =
  | 'new_payment'
  | 'new_commission'
  | 'new_refund'
  | 'new_invoice'
  | 'financial_alert'
  | 'revenue_leak_detected';

export interface FinanceWsEvent {
  channel: FinanceWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface FinanceCenterBundle {
  dashboard: FinanceDashboard;
  dailyRevenue: DailyRevenueSummary;
  breakdown: RevenueBreakdownItem[];
  partners: PartnerRevenueRow[];
  leakage: LeakageItem[];
  alerts: FinancialAlert[];
  zones: ZoneRevenue[];
  truthCorridors: FinancialTruthCorridor[];
  degraded: boolean;
}

export interface CreateRevenueRulePayload {
  label: string;
  type: string;
  value: number;
  scope: string;
}
