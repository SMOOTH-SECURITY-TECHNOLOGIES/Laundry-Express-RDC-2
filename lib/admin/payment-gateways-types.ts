export interface PaymentGatewayKpis {
  revenueTrend: number; revenueTrendSparkline: number[];
  revenueToday: number; revenueTodayChange: number; revenueTodayTx: number;
  revenueWeek: number; revenueWeekChange: number; revenueWeekTx: number;
  revenueMonth: number; revenueMonthChange: number; revenueMonthTx: number;
  commissionsDue: number; commissionsDueOps: number;
  commissionsPaid: number; commissionsPaidOps: number;
  cashInTransit: number; cashInTransitOps: number;
}

export interface PaymentGateway {
  id: string; slug: string; name: string; channel: string; logoKey: string | null;
  status: string; statusLabel: string; volume: number; revenue: number;
  commission: number; successRate: number; lastIncidentAt: string | null;
}

export interface RevenueDistribution { label: string; amount: number; percent: number; color: string; trend?: number }
export interface ChannelPerformance { channel: string; deliveryRate: number; successRate: number; failureRate: number; avgTimeMs: number; latencyMs: number }
export interface PaymentGatewayTransaction {
  id: string; reference: string; clientName: string; gatewaySlug: string; gatewayName: string;
  amount: number; currency: string; status: string; statusLabel: string; createdAt: string | null;
}
export interface CashFlow { cashReceived: number; cashWithdrawn: number; cashInTransit: number; cashNet: number; sparkline7d: number[]; sparkline30d: number[]; sparkline90d: number[] }
export interface CommissionSummary { generated: number; paid: number; pending: number; cancelled: number; distribution: RevenueDistribution[] }
export interface PaymentIncident { id: string; incidentType: string; title: string; severity: string; gatewaySlug: string | null; impact: string | null; occurredAt: string | null }
export interface SuccessRatePoint { label: string; rate: number }
export interface TopPartner { name: string; revenue: number; transactions: number; avgBasket: number }
export interface PaymentSettlement { id: string; gatewaySlug: string; gatewayName: string; scheduledAt: string | null; amount: number; status: string; statusLabel: string }
export interface PaymentWebhook { id: string; gatewaySlug: string; endpoint: string; lastCallAt: string | null; successCount: number; errorCount: number; retryCount: number; events: string[] }
export interface PaymentReconciliation { id: string; reference: string; providerAmount: number | null; internalAmount: number | null; status: string; statusLabel: string; gatewaySlug: string | null }
export interface PaymentProviderHealth { gatewaySlug: string; name: string; uptime: number; latencyMs: number; errorRate: number; successRate: number; status: string }
export interface PaymentRefund { id: string; clientName: string; amount: number; reason: string | null; status: string; gatewaySlug: string | null }
export interface FraudMetrics { score: number; repeatedPayments: number; suspiciousAmounts: number; abusiveRefunds: number; multipleAttempts: number }

export interface PaymentGatewaysDashboardSummary {
  kpis: PaymentGatewayKpis; gateways: PaymentGateway[];
  revenueDistribution: RevenueDistribution[]; channelPerformance: ChannelPerformance[];
  transactions: PaymentGatewayTransaction[]; cashFlow: CashFlow;
  commissions: CommissionSummary; incidents: PaymentIncident[];
  successRateTrend: SuccessRatePoint[]; topPartners: TopPartner[];
  settlements: PaymentSettlement[]; webhooks: PaymentWebhook[];
  reconciliations: PaymentReconciliation[]; providerHealth: PaymentProviderHealth[];
  refunds: PaymentRefund[]; fraud: FraudMetrics; source: string;
}
