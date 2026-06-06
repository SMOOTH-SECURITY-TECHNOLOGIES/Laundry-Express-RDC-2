from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PartnerFinancialTotals(BaseModel):
    revenue_total: Decimal
    revenue_last_30_days: Decimal
    completed_orders: int
    average_order_value: Decimal


class PartnerDailyRevenuePoint(BaseModel):
    date: str
    amount: Decimal


class PartnerFinancialTransaction(BaseModel):
    order_id: UUID
    order_number: str
    completed_at: Optional[str] = None
    service_label: str
    amount: Decimal
    payment_status: str
    payout_status: str


class PartnerFinancialSummaryResponse(BaseModel):
    totals: PartnerFinancialTotals
    daily_revenue: list[PartnerDailyRevenuePoint] = Field(default_factory=list)
    transactions: list[PartnerFinancialTransaction] = Field(default_factory=list)
