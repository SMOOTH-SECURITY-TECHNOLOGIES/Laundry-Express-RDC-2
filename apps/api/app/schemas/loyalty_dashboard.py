from pydantic import BaseModel, Field


class LoyaltyKpiResponse(BaseModel):
    members: int = 0
    members_change: float = 0
    members_sparkline: list[int] = Field(default_factory=list)
    points_circulation: int = 0
    points_circulation_change: float = 0
    points_circulation_sparkline: list[int] = Field(default_factory=list)
    points_earned: int = 0
    points_earned_change: float = 0
    points_earned_sparkline: list[int] = Field(default_factory=list)
    points_redeemed: int = 0
    points_redeemed_change: float = 0
    points_redeemed_sparkline: list[int] = Field(default_factory=list)
    points_value: float = 0
    points_value_change: float = 0
    points_value_sparkline: list[float] = Field(default_factory=list)
    redemption_rate: float = 0
    redemption_rate_change: float = 0
    redemption_rate_sparkline: list[float] = Field(default_factory=list)
    influenced_revenue: float = 0
    influenced_revenue_change: float = 0
    influenced_revenue_sparkline: list[float] = Field(default_factory=list)
    retention_rate: float = 0
    retention_rate_change: float = 0
    retention_rate_sparkline: list[float] = Field(default_factory=list)


class LoyaltyHealthResponse(BaseModel):
    score: int = 0
    status: str = "healthy"
    redemption_rate: float = 0
    points_liability: float = 0
    retention_uplift: float = 0
    fraud_risk: int = 0
    unused_points: int = 0


class LoyaltySettingsCardResponse(BaseModel):
    is_enabled: bool = True
    points_per_dollar: int = 10
    points_to_dollar: int = 100
    points_expiry_days: int | None = None
    redemption_cap: int | None = None
    first_order_bonus: int = 200


class RewardRowResponse(BaseModel):
    id: str
    name: str
    points_required: int
    value_dollars: float
    uses_count: int
    status: str


class EarningRuleResponse(BaseModel):
    id: str
    name: str
    condition: str
    points: str
    status: str
    performance: int


class ActivityRowResponse(BaseModel):
    id: str
    client_name: str
    client_email: str
    entry_type: str
    order_number: str | None
    points_delta: int
    balance_after: int
    created_at: str | None
    source: str


class TopUserRowResponse(BaseModel):
    user_id: str
    name: str
    email: str
    points: int
    estimated_value: float
    orders_count: int
    last_activity: str | None


class TopRedeemerRowResponse(BaseModel):
    user_id: str
    name: str
    points_used: int
    amount_saved: float
    linked_orders: int


class RetentionPointResponse(BaseModel):
    period: str
    members: float
    non_members: float


class RevenueImpactResponse(BaseModel):
    influenced_revenue: float
    influenced_revenue_change: float
    avg_basket_members: float
    avg_basket_non_members: float
    order_frequency_members: float
    points_cost: float
    loyalty_roi: float


class CohortRowResponse(BaseModel):
    month: str
    m0: float
    m1: float
    m2: float
    m3: float
    m4: float


class RiskItemResponse(BaseModel):
    id: str
    message: str
    count: int
    severity: str


class SegmentRowResponse(BaseModel):
    segment: str
    segment_key: str
    count: int
    percent: float


class IntegrationStatusResponse(BaseModel):
    module: str
    status: str
    connected: bool


class LoyaltyDashboardResponse(BaseModel):
    kpis: LoyaltyKpiResponse
    health: LoyaltyHealthResponse
    settings: LoyaltySettingsCardResponse
    rewards: list[RewardRowResponse] = Field(default_factory=list)
    earning_rules: list[EarningRuleResponse] = Field(default_factory=list)
    activity: list[ActivityRowResponse] = Field(default_factory=list)
    top_users: list[TopUserRowResponse] = Field(default_factory=list)
    top_redeemers: list[TopRedeemerRowResponse] = Field(default_factory=list)
    retention: list[RetentionPointResponse] = Field(default_factory=list)
    revenue_impact: RevenueImpactResponse
    cohorts: list[CohortRowResponse] = Field(default_factory=list)
    risks: list[RiskItemResponse] = Field(default_factory=list)
    segments: list[SegmentRowResponse] = Field(default_factory=list)
    integrations: list[IntegrationStatusResponse] = Field(default_factory=list)
    source: str = "backend"


class RewardCreateRequest(BaseModel):
    name: str
    points_required: int
    value_dollars: float = 0


class RewardUpdateRequest(BaseModel):
    name: str | None = None
    points_required: int | None = None
    value_dollars: float | None = None
    is_active: bool | None = None


class LoyaltySettingsUpdateRequest(BaseModel):
    is_enabled: bool | None = None
    points_per_dollar: int | None = None
    points_to_dollar: int | None = None
    points_expiry_days: int | None = None
    redemption_cap: int | None = None
    first_order_bonus: int | None = None


class LoyaltyExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "activity"


class LoyaltyExportResponse(BaseModel):
    filename: str
    count: int
    format: str
