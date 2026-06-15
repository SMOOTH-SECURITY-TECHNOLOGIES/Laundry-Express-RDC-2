from pydantic import BaseModel, Field


class CampaignKpiResponse(BaseModel):
    active_campaigns: int = 0
    active_campaigns_change: float = 0
    active_campaigns_sparkline: list[int] = Field(default_factory=list)
    messages_sent: int = 0
    messages_sent_change: float = 0
    messages_sent_sparkline: list[int] = Field(default_factory=list)
    open_rate: float = 0
    open_rate_change: float = 0
    open_rate_sparkline: list[float] = Field(default_factory=list)
    click_rate: float = 0
    click_rate_change: float = 0
    click_rate_sparkline: list[float] = Field(default_factory=list)
    conversions: int = 0
    conversions_change: float = 0
    conversions_sparkline: list[int] = Field(default_factory=list)
    attributed_revenue: float = 0
    attributed_revenue_change: float = 0
    attributed_revenue_sparkline: list[float] = Field(default_factory=list)


class CampaignItemResponse(BaseModel):
    id: str
    name: str
    channel: str
    audience: str | None
    segment: str | None
    status: str
    messages_sent: int
    opens: int
    open_rate: float
    clicks: int
    click_rate: float
    conversions: int
    conversion_rate: float
    roi: float
    revenue: float
    scheduled_at: str | None = None


class ChannelPerformanceResponse(BaseModel):
    channel: str
    percent: float
    messages: int
    conversions: int
    revenue: float
    color: str


class FunnelStepResponse(BaseModel):
    stage: str
    count: int
    rate: float


class TrendPointResponse(BaseModel):
    date: str
    messages: int
    conversions: int
    revenue: float


class TopCampaignResponse(BaseModel):
    id: str
    name: str
    channel: str
    roi: float
    conversions: int
    revenue: float


class SegmentResponse(BaseModel):
    segment: str
    segment_key: str
    audience_size: int
    conversion_rate: float
    revenue: float


class AutomationResponse(BaseModel):
    id: str
    name: str
    trigger: str
    status: str
    conversions: int
    revenue: float


class CalendarEventResponse(BaseModel):
    id: str
    title: str
    date: str
    time: str
    channel: str
    audience: str | None


class RoiResponse(BaseModel):
    budget_spent: float
    revenue_generated: float
    global_roi: float
    cost_per_acquisition: float
    customer_lifetime_value: float
    roas: float


class WatchlistItemResponse(BaseModel):
    id: str
    message: str
    count: int
    severity: str


class CampaignDashboardResponse(BaseModel):
    kpis: CampaignKpiResponse
    campaigns: list[CampaignItemResponse] = Field(default_factory=list)
    channels: list[ChannelPerformanceResponse] = Field(default_factory=list)
    funnel: list[FunnelStepResponse] = Field(default_factory=list)
    trends: list[TrendPointResponse] = Field(default_factory=list)
    top_campaigns: list[TopCampaignResponse] = Field(default_factory=list)
    segments: list[SegmentResponse] = Field(default_factory=list)
    automations: list[AutomationResponse] = Field(default_factory=list)
    calendar: list[CalendarEventResponse] = Field(default_factory=list)
    roi: RoiResponse
    watchlist: list[WatchlistItemResponse] = Field(default_factory=list)
    source: str = "backend"


class CampaignCreateRequest(BaseModel):
    name: str
    channel: str
    audience: str | None = None
    segment: str | None = None
    content: str | None = None
    budget: float = 0
    scheduled_at: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    zone: str | None = None
    partner: str | None = None


class CampaignUpdateRequest(BaseModel):
    name: str | None = None
    channel: str | None = None
    audience: str | None = None
    segment: str | None = None
    content: str | None = None
    budget: float | None = None
    status: str | None = None
    scheduled_at: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class CampaignAnalyticsResponse(BaseModel):
    campaign_id: str
    name: str
    messages_sent: int
    opens: int
    clicks: int
    conversions: int
    revenue: float
    roi: float
    open_rate: float
    click_rate: float
    conversion_rate: float


class CampaignExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "campaigns"


class RfmSegmentResponse(BaseModel):
    segment: str
    segment_key: str
    audience_size: int
    recency_score: int
    frequency_score: int
    monetary_score: int
    recommended_action: str


class GrowthAutomationRuleResponse(BaseModel):
    key: str
    name: str
    trigger: str
    channels: list[str] = Field(default_factory=list)
    eligible_customers: int
    status: str
    next_action: str


class PromoFraudRiskResponse(BaseModel):
    promo_code: str
    risk_score: int
    severity: str
    signals: list[str] = Field(default_factory=list)
    recommended_action: str


class TrendingOfferResponse(BaseModel):
    id: str
    title: str
    offer_type: str
    score: float
    ctr: float
    conversion_rate: float
    revenue: float
    placements: list[str] = Field(default_factory=list)


class GrowthRoiResponse(BaseModel):
    promo_revenue: float
    loyalty_revenue: float
    referral_revenue: float
    remarketing_revenue: float
    reactivation_revenue: float
    estimated_cac: float
    estimated_ltv: float
    estimated_roi: float


class GrowthDashboardResponse(BaseModel):
    acquisition: int
    activation: int
    conversion: int
    retention: int
    referral: int
    revenue: float
    rfm_segments: list[RfmSegmentResponse] = Field(default_factory=list)
    automations: list[GrowthAutomationRuleResponse] = Field(default_factory=list)
    promo_fraud_risks: list[PromoFraudRiskResponse] = Field(default_factory=list)
    trending_offers: list[TrendingOfferResponse] = Field(default_factory=list)
    roi: GrowthRoiResponse
    source: str = "backend"
