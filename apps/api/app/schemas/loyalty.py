from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LoyaltySettingsPayload(BaseModel):
    isEnabled: bool = True
    pointsPerDollar: int = Field(default=10, ge=0)
    pointsToDollar: int = Field(default=100, ge=1)
    pointsExpiryDays: int | None = Field(default=None, ge=1)


class LoyaltySettingsResponse(BaseModel):
    id: UUID | None = None
    key: str
    isEnabled: bool
    pointsPerDollar: int
    pointsToDollar: int
    pointsExpiryDays: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class LoyaltyLedgerEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str | None = None
    order_id: UUID | None = None
    order_number: str | None = None
    entry_type: str
    points_delta: int
    balance_after: int
    description: str
    expires_at: datetime | None = None
    expired_at: datetime | None = None
    created_at: datetime | None = None


class LoyaltyHistoryResponse(BaseModel):
    entries: list[LoyaltyLedgerEntryResponse]
    total: int


class LoyaltyAdjustmentRequest(BaseModel):
    user_id: UUID
    points_delta: int = Field(..., ne=0)
    reason: str = Field(..., min_length=3, max_length=255)


class LoyaltyAdjustmentResponse(BaseModel):
    user_id: UUID
    points_delta: int
    new_balance: int
    reason: str


class LoyaltyTopUserResponse(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    loyalty_points: int


class LoyaltyTopRedeemerResponse(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    total_points_redeemed: int


class LoyaltyPolicyMetricsResponse(BaseModel):
    is_enabled: bool
    points_per_dollar: int
    points_to_dollar: int
    points_expiry_days: int | None = None
    reward_value_per_point: float
    reward_value_per_100_spent: float


class LoyaltyExpiryRunRequest(BaseModel):
    user_id: UUID | None = None
    as_of: datetime | None = None


class LoyaltyExpiryRunResponse(BaseModel):
    users_processed: int
    expired_points: int
    expired_entries: int


class LoyaltyAdminOverviewResponse(BaseModel):
    total_users_with_points: int
    total_points_balance: int
    average_points_balance: float
    ledger_entries_total: int
    total_points_earned: int
    total_points_redeemed: int
    total_points_expired: int
    total_referral_bonus_points: int
    total_adjustment_points_net: int
    users_with_expiring_points: int
    expiring_points_total: int
    policy_metrics: LoyaltyPolicyMetricsResponse
    top_users: list[LoyaltyTopUserResponse]
    top_redeemers: list[LoyaltyTopRedeemerResponse]
    recent_entries: list[LoyaltyLedgerEntryResponse]
