from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OrderAddOnResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str
    image_url: str
    price: Decimal
    sort_order: int
    is_active: bool

    class Config:
        from_attributes = True


class OrderAddOnListResponse(BaseModel):
    add_ons: list[OrderAddOnResponse]
    total: int


class OrderAddOnCreateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=500)
    image_url: str = Field(default="", max_length=2048)
    price: Decimal = Field(ge=0)
    sort_order: int = Field(default=0, ge=0)
    is_active: bool = True


class OrderAddOnUpdateRequest(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=2048)
    price: Decimal | None = Field(default=None, ge=0)
    sort_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
