from pydantic import BaseModel, Field


class PaymentGatewayKpiResponse(BaseModel):
    revenue_trend: float = 0
    revenue_trend_sparkline: list[float] = Field(default_factory=list)
    revenue_today: float = 0
    revenue_today_change: float = 0
    revenue_today_tx: int = 0
    revenue_week: float = 0
    revenue_week_change: float = 0
    revenue_week_tx: int = 0
    revenue_month: float = 0
    revenue_month_change: float = 0
    revenue_month_tx: int = 0
    commissions_due: float = 0
    commissions_due_ops: int = 0
    commissions_paid: float = 0
    commissions_paid_ops: int = 0
    cash_in_transit: float = 0
    cash_in_transit_ops: int = 0


class GatewayOverviewItem(BaseModel):
    id: str
    slug: str
    name: str
    channel: str
    logo_key: str | None
    status: str
    status_label: str
    volume: int
    revenue: float
    commission: float
    success_rate: float
    last_incident_at: str | None


class RevenueDistributionItem(BaseModel):
    label: str
    amount: float
    percent: float
    color: str
    trend: float = 0


class ChannelPerformanceItem(BaseModel):
    channel: str
    delivery_rate: float
    success_rate: float
    failure_rate: float
    avg_time_ms: int
    latency_ms: int


class GatewayTransactionItem(BaseModel):
    id: str
    reference: str
    client_name: str
    gateway_slug: str
    gateway_name: str
    amount: float
    currency: str
    status: str
    status_label: str
    created_at: str | None


class CashFlowResponse(BaseModel):
    cash_received: float
    cash_withdrawn: float
    cash_in_transit: float
    cash_net: float
    sparkline_7d: list[float] = Field(default_factory=list)
    sparkline_30d: list[float] = Field(default_factory=list)
    sparkline_90d: list[float] = Field(default_factory=list)


class CommissionSummary(BaseModel):
    generated: float
    paid: float
    pending: float
    cancelled: float
    distribution: list[RevenueDistributionItem] = Field(default_factory=list)


class IncidentItem(BaseModel):
    id: str
    incident_type: str
    title: str
    severity: str
    gateway_slug: str | None
    impact: str | None
    occurred_at: str | None


class SuccessRatePoint(BaseModel):
    label: str
    rate: float


class TopPartnerItem(BaseModel):
    name: str
    revenue: float
    transactions: int
    avg_basket: float


class SettlementItem(BaseModel):
    id: str
    gateway_slug: str
    gateway_name: str
    scheduled_at: str | None
    amount: float
    status: str
    status_label: str


class WebhookItem(BaseModel):
    id: str
    gateway_slug: str
    endpoint: str
    last_call_at: str | None
    success_count: int
    error_count: int
    retry_count: int
    events: list[str] = Field(default_factory=list)


class ReconciliationItem(BaseModel):
    id: str
    reference: str
    provider_amount: float | None
    internal_amount: float | None
    status: str
    status_label: str
    gateway_slug: str | None


class ProviderHealthItem(BaseModel):
    gateway_slug: str
    name: str
    uptime: float
    latency_ms: int
    error_rate: float
    success_rate: float
    status: str


class RefundItem(BaseModel):
    id: str
    client_name: str
    amount: float
    reason: str | None
    status: str
    gateway_slug: str | None


class FraudMetrics(BaseModel):
    score: int
    repeated_payments: int
    suspicious_amounts: int
    abusive_refunds: int
    multiple_attempts: int


class PaymentGatewaysDashboardResponse(BaseModel):
    kpis: PaymentGatewayKpiResponse
    gateways: list[GatewayOverviewItem]
    revenue_distribution: list[RevenueDistributionItem]
    channel_performance: list[ChannelPerformanceItem]
    transactions: list[GatewayTransactionItem]
    cash_flow: CashFlowResponse
    commissions: CommissionSummary
    incidents: list[IncidentItem]
    success_rate_trend: list[SuccessRatePoint]
    top_partners: list[TopPartnerItem]
    settlements: list[SettlementItem]
    webhooks: list[WebhookItem]
    reconciliations: list[ReconciliationItem]
    provider_health: list[ProviderHealthItem]
    refunds: list[RefundItem]
    fraud: FraudMetrics
    source: str = "backend"


class PaymentGatewayExportRequest(BaseModel):
    format: str = "csv"
    date_start: str | None = None
    date_end: str | None = None
