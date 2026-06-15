from sqlalchemy import Boolean, Column, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import BaseModel


class MarketingCampaign(BaseModel):
    __tablename__ = "marketing_campaigns"

    name = Column(String(255), nullable=False)
    channel = Column(String(32), nullable=False, default="whatsapp")
    audience = Column(String(255), nullable=True)
    segment = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    zone = Column(String(64), nullable=True)
    partner = Column(String(128), nullable=True)
    messages_sent = Column(Integer, nullable=False, default=0)
    opens = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)
    revenue = Column(Numeric(12, 2), nullable=False, default=0)
    budget = Column(Numeric(12, 2), nullable=False, default=0)
    roi = Column(Numeric(8, 2), nullable=False, default=0)
    content = Column(Text, nullable=True)
    scheduled_at = Column(String(32), nullable=True)
    start_date = Column(String(32), nullable=True)
    end_date = Column(String(32), nullable=True)


class MarketingAutomation(BaseModel):
    __tablename__ = "marketing_automations"

    name = Column(String(255), nullable=False)
    trigger = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False, default="active")
    conversions = Column(Integer, nullable=False, default=0)
    revenue = Column(Numeric(12, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
