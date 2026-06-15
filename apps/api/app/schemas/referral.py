from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReferralSettingsPayload(BaseModel):
    isEnabled: bool = True
    referrerBonusPoints: int = Field(default=500, ge=0)
    refereeDiscountAmount: float = Field(default=5, ge=0)


class ReferralMeResponse(BaseModel):
    referral_code: str | None = None
    referred_users_count: int = 0
    completed_conversions: int = 0
    total_bonus_points: int = 0


class ReferralSettingsResponse(BaseModel):
    id: UUID | None = None
    key: str
    isEnabled: bool
    referrerBonusPoints: int
    refereeDiscountAmount: float
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ReferralTopReferrerResponse(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    referral_code: str | None = None
    successful_referrals: int
    total_bonus_points_awarded: int


class ReferralRecentConversionResponse(BaseModel):
    referred_user_id: UUID
    referred_user_name: str
    referred_user_email: str
    referrer_user_id: UUID
    referrer_user_name: str
    referrer_user_email: str
    referral_code: str | None = None
    referral_discount_used_at: datetime | None = None
    referral_bonus_awarded_at: datetime | None = None


class ReferralReviewStatusPayload(BaseModel):
    review_status: str = Field(..., min_length=3, max_length=50)
    review_note: str | None = Field(default=None, max_length=1000)


class ReferralReviewStatusResponse(BaseModel):
    referrer_user_id: UUID
    review_status: str
    review_note: str | None = None
    reviewed_by_user_id: UUID
    reviewed_at: datetime | None = None


class ReferralWatchlistEntryResponse(BaseModel):
    referrer_user_id: UUID
    referrer_user_name: str
    referrer_user_email: str
    referral_code: str | None = None
    total_referred_users: int
    signed_up_only_count: int
    pending_bonus_count: int
    completed_conversion_count: int
    attention_reason: str
    review_status: str | None = None
    review_note: str | None = None
    reviewed_by_user_id: UUID | None = None
    reviewed_at: datetime | None = None


class ReferralAdminOverviewResponse(BaseModel):
    total_users_with_referral_codes: int
    total_referred_users: int
    total_referred_signed_up_only: int
    total_referred_pending_bonus: int
    total_completed_referral_conversions: int
    total_referral_discounts_used: int
    total_referral_bonuses_awarded: int
    total_referrer_bonus_points_awarded: int
    top_referrers: list[ReferralTopReferrerResponse]
    watchlist: list[ReferralWatchlistEntryResponse]
    recent_conversions: list[ReferralRecentConversionResponse]
