from pydantic import BaseModel


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
    service_count: int = 0
    working_hours: PartnerProfileWorkingHours


class PartnerProfileUpdateRequest(BaseModel):
    name: str
    address: str
    city: str | None = None
    commune: str | None = None


class PartnerProfileWorkingHoursUpdateRequest(BaseModel):
    working_hours: PartnerProfileWorkingHours
