from pydantic import BaseModel, Field


class UserKpiResponse(BaseModel):
    total_users: int = 0
    total_users_change: float = 0
    total_users_sparkline: list[int] = Field(default_factory=list)
    new_signups: int = 0
    new_signups_change: float = 0
    new_signups_sparkline: list[int] = Field(default_factory=list)
    active_users: int = 0
    active_users_change: float = 0
    active_users_sparkline: list[int] = Field(default_factory=list)
    inactive_users: int = 0
    inactive_users_change: float = 0
    inactive_users_sparkline: list[int] = Field(default_factory=list)
    partners: int = 0
    partners_change: float = 0
    partners_sparkline: list[int] = Field(default_factory=list)
    drivers: int = 0
    drivers_change: float = 0
    drivers_sparkline: list[int] = Field(default_factory=list)


class UserListItemResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    role_label: str
    status: str
    status_label: str
    loyalty_points: int
    referral_code: str | None
    created_at: str | None
    last_login_at: str | None


class RoleDistributionResponse(BaseModel):
    role: str
    count: int
    percent: float
    color: str


class StatusBreakdownResponse(BaseModel):
    status: str
    count: int
    percent: float


class GrowthPointResponse(BaseModel):
    date: str
    new_signups: int
    active_users: int


class AcquisitionSourceResponse(BaseModel):
    source: str
    count: int
    percent: float
    color: str


class TopZoneResponse(BaseModel):
    zone: str
    users: int
    percent: float


class ActivityItemResponse(BaseModel):
    id: str
    user_name: str
    action: str
    detail: str
    device: str
    date: str | None


class DeviceBreakdownResponse(BaseModel):
    device: str
    count: int
    percent: float
    color: str


class LoyaltySummaryResponse(BaseModel):
    users_with_points: int
    users_with_points_percent: float
    total_points: int
    average_balance: float
    top_holders: list[dict] = Field(default_factory=list)


class SecuritySummaryResponse(BaseModel):
    two_fa_enabled_percent: float
    verified_accounts_percent: float
    unverified_accounts_percent: float
    suspicious_logins: int


class WatchlistItemResponse(BaseModel):
    id: str
    message: str
    count: int
    severity: str


class TopUserResponse(BaseModel):
    user_id: str
    name: str
    orders: int
    revenue: float
    loyalty_points: int
    last_activity: str | None


class SegmentResponse(BaseModel):
    segment: str
    segment_key: str
    count: int
    percent: float


class ValueUserResponse(BaseModel):
    user_id: str
    name: str
    clv: float
    avg_basket: float
    frequency: float
    last_order: str | None


class UserDashboardResponse(BaseModel):
    kpis: UserKpiResponse
    users: list[UserListItemResponse] = Field(default_factory=list)
    role_distribution: list[RoleDistributionResponse] = Field(default_factory=list)
    status_breakdown: list[StatusBreakdownResponse] = Field(default_factory=list)
    growth: list[GrowthPointResponse] = Field(default_factory=list)
    acquisition_sources: list[AcquisitionSourceResponse] = Field(default_factory=list)
    top_zones: list[TopZoneResponse] = Field(default_factory=list)
    recent_activity: list[ActivityItemResponse] = Field(default_factory=list)
    devices: list[DeviceBreakdownResponse] = Field(default_factory=list)
    loyalty: LoyaltySummaryResponse
    security: SecuritySummaryResponse
    watchlist: list[WatchlistItemResponse] = Field(default_factory=list)
    top_users: list[TopUserResponse] = Field(default_factory=list)
    segments: list[SegmentResponse] = Field(default_factory=list)
    value_users: list[ValueUserResponse] = Field(default_factory=list)
    source: str = "backend"


class UserDetailResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    status: str
    loyalty_points: int
    referral_code: str | None
    is_email_verified: bool
    is_phone_verified: bool
    is_2fa_enabled: bool
    created_at: str | None
    last_login_at: str | None
    orders_count: int = 0
    total_spent: float = 0
    referrals_count: int = 0


class UserSecurityDetailResponse(BaseModel):
    user_id: str
    two_fa_enabled: bool
    suspicious_logins: int
    recent_logins: list[dict] = Field(default_factory=list)
    active_sessions: int = 0


class UserExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "users"
