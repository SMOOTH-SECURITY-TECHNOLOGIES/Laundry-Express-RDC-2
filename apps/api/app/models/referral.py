from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class ReferralSettingsConfig(BaseModel):
    __tablename__ = "referral_settings_configs"

    key = Column(String(100), nullable=False, unique=True, index=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    referrer_bonus_points = Column(Integer, nullable=False, default=500)
    referee_discount_amount = Column(Numeric(10, 2), nullable=False, default=5)
    referee_bonus_points = Column(Integer, nullable=False, default=100)
    points_expiry_days = Column(Integer, nullable=True)
    bonus_cap_per_referrer = Column(Integer, nullable=True)
    allowed_channels = Column(Text, nullable=True, default="whatsapp,email,sms,link")


class ReferralCampaign(BaseModel):
    __tablename__ = "referral_campaigns"

    name = Column(String(255), nullable=False)
    audience = Column(String(255), nullable=True)
    budget = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String(32), nullable=False, default="active")
    start_date = Column(String(32), nullable=True)
    end_date = Column(String(32), nullable=True)


class ReferralReviewStatus(BaseModel):
    __tablename__ = "referral_review_statuses"

    referrer_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    review_status = Column(String(50), nullable=False, default="clear")
    review_note = Column(Text, nullable=True)
    reviewed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
