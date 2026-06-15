from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PromoCodeBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=100)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: float = Field(..., gt=0)
    min_order_value: Optional[float] = Field(None, ge=0)
    is_for_new_users_only: bool = False
    is_active: bool = True
    partner_id: Optional[UUID] = None
    max_usage: Optional[int] = Field(None, ge=0)
    usage_limit_per_customer: Optional[int] = Field(None, ge=1)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    applicable_services: List[str] = []
    description: Optional[str] = None
    geographic_restrictions: List[str] = []


class PromoCodeCreate(PromoCodeBase):
    pass


class PromoCodeUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=100)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_value: Optional[float] = Field(None, ge=0)
    is_for_new_users_only: Optional[bool] = None
    is_active: Optional[bool] = None
    partner_id: Optional[UUID] = None
    max_usage: Optional[int] = Field(None, ge=0)
    usage_limit_per_customer: Optional[int] = Field(None, ge=1)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    applicable_services: Optional[List[str]] = None
    description: Optional[str] = None
    geographic_restrictions: Optional[List[str]] = None


class PromoCodeResponse(BaseModel):
    id: UUID
    code: str
    discount_type: str
    discount_value: float
    min_order_value: Optional[float] = None
    is_for_new_users_only: bool
    is_active: bool
    partner_id: Optional[UUID] = None
    created_by_user_id: Optional[UUID] = None
    usage_count: int
    max_usage: Optional[int] = None
    usage_limit_per_customer: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    applicable_services: List[str] = []
    description: Optional[str] = None
    geographic_restrictions: List[str] = []
    created_at: str
    updated_at: str


class PromoCodeListResponse(BaseModel):
    promo_codes: List[PromoCodeResponse]
    total: int


class PromoUsageHistoryEntry(BaseModel):
    id: UUID
    promo_code: str
    order_id: UUID
    discount_applied: float
    consumed_at: Optional[str] = None


class PromoUsageHistoryResponse(BaseModel):
    entries: List[PromoUsageHistoryEntry]
    total: int
