from sqlalchemy import Boolean, Column, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import BaseModel


class SubscriptionPlanConfig(BaseModel):
    __tablename__ = "subscription_plan_configs"

    slug = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_yearly = Column(Numeric(10, 2), nullable=False)
    is_most_popular = Column(Boolean, nullable=False, default=False)
    features = Column(JSONB, nullable=False, default=dict)
