from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AdvertisementBase(BaseModel):
    title: str
    description: str
    imageUrl: str
    linkUrl: str
    isActive: bool = True


class AdvertisementCreate(AdvertisementBase):
    pass


class AdvertisementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    imageUrl: str | None = None
    linkUrl: str | None = None
    isActive: bool | None = None


class AdvertisementResponse(AdvertisementBase):
    id: UUID
    createdAt: datetime
    updatedAt: datetime


class AdvertisementListResponse(BaseModel):
    advertisements: list[AdvertisementResponse]
    total: int
