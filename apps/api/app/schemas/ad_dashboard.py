from pydantic import BaseModel, Field


class AdKpiResponse(BaseModel):
    active_ads: int = 0
    active_ads_change: float = 0
    active_ads_sparkline: list[int] = Field(default_factory=list)
    impressions: int = 0
    impressions_change: float = 0
    impressions_sparkline: list[int] = Field(default_factory=list)
    clicks: int = 0
    clicks_change: float = 0
    clicks_sparkline: list[int] = Field(default_factory=list)
    ctr: float = 0
    ctr_change: float = 0
    ctr_sparkline: list[float] = Field(default_factory=list)
    conversions: int = 0
    conversions_change: float = 0
    conversions_sparkline: list[int] = Field(default_factory=list)
    spend: float = 0
    spend_change: float = 0
    spend_sparkline: list[float] = Field(default_factory=list)
    roi: float = 0
    roi_change: float = 0
    roi_sparkline: list[float] = Field(default_factory=list)


class AdRowResponse(BaseModel):
    id: str
    title: str
    campaign: str
    channel: str
    zone: str
    budget: float
    spend: float
    impressions: int
    clicks: int
    ctr: float
    conversions: int
    roi: float
    status: str


class FunnelStepResponse(BaseModel):
    stage: str
    count: int
    rate: float


class ChannelPerformanceResponse(BaseModel):
    channel: str
    percent: float
    budget: float
    conversions: int
    roi: float
    color: str


class ZonePerformanceResponse(BaseModel):
    id: str
    name: str
    budget: float
    conversions: int
    roi: float
    map_x: float
    map_y: float
    heat_color: str


class CampaignRowResponse(BaseModel):
    id: str
    name: str
    objective: str
    budget: float
    spend: float
    conversions: int
    roi: float
    status: str


class SegmentResponse(BaseModel):
    segment: str
    segment_key: str
    clients: int
    percent: float


class ReactivationResponse(BaseModel):
    dormant_clients: int
    reactivated: int
    revenue_recovered: float
    reactivation_rate: float


class AbTestResponse(BaseModel):
    id: str
    variant_a: str
    variant_b: str
    winner: str | None
    variant_a_ctr: float
    variant_b_ctr: float
    variant_a_conversion: float
    variant_b_conversion: float
    variant_a_roi: float
    variant_b_roi: float


class TopAdResponse(BaseModel):
    title: str
    roi: float
    rank: int


class InsightResponse(BaseModel):
    id: str
    text: str
    type: str


class TruthAnomalyResponse(BaseModel):
    id: str
    message: str
    severity: str


class AttributionMetricsResponse(BaseModel):
    cpa: float
    cac: float
    roas: float
    roi: float
    attributed_revenue: float


class AdsDashboardResponse(BaseModel):
    kpis: AdKpiResponse
    ads: list[AdRowResponse] = Field(default_factory=list)
    funnel: list[FunnelStepResponse] = Field(default_factory=list)
    channels: list[ChannelPerformanceResponse] = Field(default_factory=list)
    zones: list[ZonePerformanceResponse] = Field(default_factory=list)
    campaigns: list[CampaignRowResponse] = Field(default_factory=list)
    segments: list[SegmentResponse] = Field(default_factory=list)
    reactivation: ReactivationResponse
    ab_tests: list[AbTestResponse] = Field(default_factory=list)
    top_ads: list[TopAdResponse] = Field(default_factory=list)
    insights: list[InsightResponse] = Field(default_factory=list)
    truth_anomalies: list[TruthAnomalyResponse] = Field(default_factory=list)
    attribution: AttributionMetricsResponse
    source: str = "backend"


class AdCreateRequest(BaseModel):
    title: str
    description: str | None = None
    creative_type: str = "image"
    image_url: str | None = None
    video_url: str | None = None
    cta_text: str | None = None
    cta_url: str | None = None
    status: str = "draft"
    campaign_id: str | None = None
    budget_total: float = 0
    channel: str = "facebook"
    zone: str = "Gombe"
    partner_id: str | None = None


class AdUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    creative_type: str | None = None
    image_url: str | None = None
    video_url: str | None = None
    cta_text: str | None = None
    cta_url: str | None = None
    status: str | None = None
    campaign_id: str | None = None
    budget_total: float | None = None
    channel: str | None = None
    zone: str | None = None


class AdDetailResponse(BaseModel):
    id: str
    title: str
    description: str | None
    creative_type: str
    image_url: str | None
    video_url: str | None
    cta_text: str | None
    cta_url: str | None
    status: str
    campaign_id: str | None
    budget_total: float
    budget_spent: float
    channel: str | None
    zone: str | None
    partner_id: str | None


class CampaignCreateRequest(BaseModel):
    name: str
    objective: str = "conversion"
    budget: float = 0
    target_audience: str | None = None


class TrackEventRequest(BaseModel):
    surface: str = "homepage"
    user_id: str | None = None


class ExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "campaigns"


class ExportResponse(BaseModel):
    filename: str
    count: int
    format: str
