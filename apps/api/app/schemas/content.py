from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class HowItWorksStepPayload(BaseModel):
    id: str
    title: str
    description: str
    icon: Literal["shoppingBag", "truck", "sparkles", "home"]


class FAQItemPayload(BaseModel):
    id: str
    question: str
    answer: str


class SiteContentPayload(BaseModel):
    hero: dict[str, str] = Field(default_factory=lambda: {"title": "", "subtitle": ""})
    howItWorksSteps: list[HowItWorksStepPayload] = Field(default_factory=list)
    faq: list[FAQItemPayload] = Field(default_factory=list)


class SiteContentResponse(BaseModel):
    id: UUID | None = None
    key: str
    content_data: SiteContentPayload
    created_at: datetime | None = None
    updated_at: datetime | None = None
