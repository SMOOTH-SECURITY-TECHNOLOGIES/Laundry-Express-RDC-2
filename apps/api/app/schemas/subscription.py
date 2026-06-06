from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SubscriptionPlanFeatures(BaseModel):
    promotions: bool = False
    financials: bool = False
    analytics: bool = False
    customDomain: bool = False
    customSubdomain: bool = False
    teamManagement: bool = False
    apiAccess: bool = False
    advancedAutomation: bool = False
    aiReviewAssistant: bool = False
    invoiceGenerator: bool = False


class SubscriptionPlanBase(BaseModel):
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    is_most_popular: bool = False
    features: SubscriptionPlanFeatures = Field(default_factory=SubscriptionPlanFeatures)


class SubscriptionPlanCreate(SubscriptionPlanBase):
    slug: str


class SubscriptionPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price_monthly: float | None = None
    price_yearly: float | None = None
    is_most_popular: bool | None = None
    features: SubscriptionPlanFeatures | None = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID
    slug: str
    created_at: datetime
    updated_at: datetime


class SubscriptionPlanListResponse(BaseModel):
    plans: list[SubscriptionPlanResponse]
    total: int
