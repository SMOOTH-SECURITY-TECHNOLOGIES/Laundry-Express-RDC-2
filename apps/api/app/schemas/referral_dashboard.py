from pydantic import BaseModel, Field


class ReferralKpiResponse(BaseModel):
    users_with_code: int = 0
    users_with_code_change: float = 0
    users_with_code_sparkline: list[int] = Field(default_factory=list)
    referred_users: int = 0
    referred_users_change: float = 0
    referred_users_sparkline: list[int] = Field(default_factory=list)
    discounts_used: int = 0
    discounts_used_change: float = 0
    discounts_used_sparkline: list[int] = Field(default_factory=list)
    bonus_points: int = 0
    bonus_points_change: float = 0
    bonus_points_sparkline: list[int] = Field(default_factory=list)
    completed_conversions: int = 0
    completed_conversions_change: float = 0
    completed_conversions_sparkline: list[int] = Field(default_factory=list)
    revenue_generated: float = 0
    revenue_generated_change: float = 0
    revenue_generated_sparkline: list[float] = Field(default_factory=list)


class ReferralSettingsCardResponse(BaseModel):
    is_enabled: bool = True
    referrer_bonus_points: int = 500
    referee_discount_amount: float = 5.0
    referrer_conversion_bonus: int = 500
    referee_conversion_bonus: int = 100
    points_expiry_days: int | None = 365
    bonus_cap_per_referrer: int | None = 50000
    allowed_channels: list[str] = Field(default_factory=lambda: ["whatsapp", "email", "sms", "link"])


class ChannelPerformanceResponse(BaseModel):
    channel: str
    percent: float
    conversions: int
    roi: float
    color: str


class TopReferrerResponse(BaseModel):
    rank: int
    user_id: str
    name: str
    email: str
    referral_code: str | None
    referees: int
    conversions: int
    bonus_points: int
    revenue_generated: float


class ReferralConversionResponse(BaseModel):
    id: str
    referee_name: str
    referee_email: str
    order_id: str | None
    date: str | None
    discount_used: float
    status: str


class WatchlistItemResponse(BaseModel):
    id: str
    message: str
    count: int
    severity: str


class TrendPointResponse(BaseModel):
    date: str
    conversions: int
    revenue: float


class ImpactMetricResponse(BaseModel):
    indicator: str
    referred: float
    non_referred: float
    difference: float


class PopularCodeResponse(BaseModel):
    code: str
    uses: int
    conversions: int
    roi: float


class ReferralDashboardResponse(BaseModel):
    kpis: ReferralKpiResponse
    settings: ReferralSettingsCardResponse
    channels: list[ChannelPerformanceResponse] = Field(default_factory=list)
    top_referrers: list[TopReferrerResponse] = Field(default_factory=list)
    recent_conversions: list[ReferralConversionResponse] = Field(default_factory=list)
    watchlist: list[WatchlistItemResponse] = Field(default_factory=list)
    trends: list[TrendPointResponse] = Field(default_factory=list)
    impact: list[ImpactMetricResponse] = Field(default_factory=list)
    popular_codes: list[PopularCodeResponse] = Field(default_factory=list)
    total_revenue: float = 0
    source: str = "backend"


class ReferralSettingsUpdateRequest(BaseModel):
    is_enabled: bool | None = None
    referrer_bonus_points: int | None = None
    referee_discount_amount: float | None = None
    referee_bonus_points: int | None = None
    points_expiry_days: int | None = None
    bonus_cap_per_referrer: int | None = None
    allowed_channels: list[str] | None = None


class ReferralCampaignCreateRequest(BaseModel):
    name: str
    audience: str | None = None
    budget: float = 0
    start_date: str | None = None
    end_date: str | None = None


class ManualBonusRequest(BaseModel):
    user_id: str
    points: int
    reason: str


class ReferralExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "conversions"


class ReferralExportResponse(BaseModel):
    filename: str
    count: int
    format: str
