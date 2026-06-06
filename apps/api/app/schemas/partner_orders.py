from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.order import OrderStatus, PaymentStatus


class PartnerOrdersQueryParams(BaseModel):
    status: Optional[OrderStatus] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    search: Optional[str] = Field(default=None, max_length=255)


class PartnerOrderListItem(BaseModel):
    id: UUID
    order_number: str
    status: OrderStatus
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_amount: Decimal
    amount_paid: Decimal
    payment_status: PaymentStatus
    service_labels: list[str] = Field(default_factory=list)


class PartnerOrdersListSummary(BaseModel):
    total_orders: int
    status_counts: dict[str, int] = Field(default_factory=dict)


class PartnerOrdersListResponse(BaseModel):
    items: list[PartnerOrderListItem]
    total: int
    page: int
    page_size: int
    summary: PartnerOrdersListSummary
