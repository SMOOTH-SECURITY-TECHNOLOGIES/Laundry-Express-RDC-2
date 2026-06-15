from enum import Enum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AdStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class AdCreativeType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"


class CampaignObjective(str, Enum):
    AWARENESS = "awareness"
    TRAFFIC = "traffic"
    CONVERSION = "conversion"
    RETENTION = "retention"
    REACTIVATION = "reactivation"


class AdSurface(str, Enum):
    HOMEPAGE = "homepage"
    MARKETPLACE = "marketplace"
    CHECKOUT = "checkout"
    PARTNER_PAGE = "partner_page"
    MINI_SITE = "mini_site"


class AdChannel(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    WHATSAPP = "whatsapp"
    GOOGLE = "google"
    EMAIL = "email"
    SMS = "sms"


class AdCampaign(BaseModel):
    __tablename__ = "ad_campaigns"

    name = Column(String(255), nullable=False)
    objective = Column(String(32), nullable=False, default=CampaignObjective.CONVERSION.value)
    budget = Column(Numeric(12, 2), nullable=False, default=0)
    budget_spent = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String(32), nullable=False, default="active")
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    target_audience = Column(Text, nullable=True)

    advertisements = relationship("Advertisement", back_populates="campaign")


class Advertisement(BaseModel):
    __tablename__ = "advertisements"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    creative_type = Column(String(32), nullable=False, default=AdCreativeType.IMAGE.value)
    image_url = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    cta_text = Column(String(128), nullable=True)
    cta_url = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default=AdStatus.DRAFT.value)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("ad_campaigns.id"), nullable=True, index=True)
    budget_total = Column(Numeric(12, 2), nullable=False, default=0)
    budget_spent = Column(Numeric(12, 2), nullable=False, default=0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True)
    channel = Column(String(32), nullable=True, default=AdChannel.FACEBOOK.value)
    zone = Column(String(64), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    campaign = relationship("AdCampaign", back_populates="advertisements")
    impressions = relationship("AdImpression", back_populates="advertisement")
    clicks = relationship("AdClick", back_populates="advertisement")
    conversions = relationship("AdConversion", back_populates="advertisement")


class AdImpression(BaseModel):
    __tablename__ = "ad_impressions"

    advertisement_id = Column(UUID(as_uuid=True), ForeignKey("advertisements.id"), nullable=False, index=True)
    viewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    surface = Column(String(32), nullable=False, default=AdSurface.HOMEPAGE.value)

    advertisement = relationship("Advertisement", back_populates="impressions")


class AdClick(BaseModel):
    __tablename__ = "ad_clicks"

    advertisement_id = Column(UUID(as_uuid=True), ForeignKey("advertisements.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    surface = Column(String(32), nullable=False, default=AdSurface.HOMEPAGE.value)

    advertisement = relationship("Advertisement", back_populates="clicks")


class AdConversion(BaseModel):
    __tablename__ = "ad_conversions"

    advertisement_id = Column(UUID(as_uuid=True), ForeignKey("advertisements.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    revenue_generated = Column(Numeric(12, 2), nullable=False, default=0)

    advertisement = relationship("Advertisement", back_populates="conversions")


class AdExperiment(BaseModel):
    __tablename__ = "ad_experiments"

    campaign_id = Column(UUID(as_uuid=True), ForeignKey("ad_campaigns.id"), nullable=True, index=True)
    variant_a = Column(String(255), nullable=False)
    variant_b = Column(String(255), nullable=False)
    winner = Column(String(8), nullable=True)
    status = Column(String(32), nullable=False, default="running")
    variant_a_ctr = Column(Numeric(8, 4), nullable=True)
    variant_b_ctr = Column(Numeric(8, 4), nullable=True)
    variant_a_conversion = Column(Numeric(8, 4), nullable=True)
    variant_b_conversion = Column(Numeric(8, 4), nullable=True)
    variant_a_roi = Column(Numeric(8, 2), nullable=True)
    variant_b_roi = Column(Numeric(8, 2), nullable=True)
