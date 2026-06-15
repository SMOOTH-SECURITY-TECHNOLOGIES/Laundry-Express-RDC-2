from typing import Dict, List

from pydantic import BaseModel, Field


class PartnerProfileDayHours(BaseModel):
    open: str
    close: str
    is_closed: bool


class PartnerProfileWorkingHours(BaseModel):
    monday: PartnerProfileDayHours
    tuesday: PartnerProfileDayHours
    wednesday: PartnerProfileDayHours
    thursday: PartnerProfileDayHours
    friday: PartnerProfileDayHours
    saturday: PartnerProfileDayHours
    sunday: PartnerProfileDayHours


class PartnerProfileMediaGallery(BaseModel):
    couverture: List[str] = Field(default_factory=list)
    boutique: List[str] = Field(default_factory=list)
    machines: List[str] = Field(default_factory=list)
    equipe: List[str] = Field(default_factory=list)
    livraison: List[str] = Field(default_factory=list)
    avant_apres: List[str] = Field(default_factory=list, alias="avant-apres")

    class Config:
        populate_by_name = True


class PartnerProfileMediaUpdateRequest(BaseModel):
    media_gallery: Dict[str, List[str]] = Field(default_factory=dict)
    image_urls: List[str] = Field(default_factory=list)
    video_url: str | None = None


class PartnerProfileDetailResponse(BaseModel):
    id: str
    name: str
    business_name: str
    email: str
    phone: str
    status: str
    is_featured: bool
    is_accepting_orders: bool
    address: str
    city: str | None = None
    commune: str | None = None
    video_url: str | None = None
    image_urls: List[str] = Field(default_factory=list)
    media_gallery: Dict[str, List[str]] = Field(default_factory=dict)
    service_count: int = 0
    working_hours: PartnerProfileWorkingHours


class PartnerPublicProfileResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str | None = None
    commune: str | None = None
    rating: float = 0.0
    total_reviews: int = 0
    video_url: str | None = None
    image_urls: List[str] = Field(default_factory=list)
    media_gallery: Dict[str, List[str]] = Field(default_factory=dict)
    working_hours: PartnerProfileWorkingHours


class PartnerProfileUpdateRequest(BaseModel):
    name: str
    address: str
    city: str | None = None
    commune: str | None = None


class PartnerProfileWorkingHoursUpdateRequest(BaseModel):
    working_hours: PartnerProfileWorkingHours
