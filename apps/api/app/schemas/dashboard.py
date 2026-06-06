from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class PartnerOnboardingSummary(BaseModel):
    has_working_hours: bool
    has_services: bool
    has_video: bool
    has_promotion: bool
    completed_steps: int
    total_steps: int = 4


class PartnerSummarySection(BaseModel):
    id: UUID
    name: str
    is_featured: bool
    currency: str
    onboarding: PartnerOnboardingSummary


class PartnerOrdersSummary(BaseModel):
    pending_new_orders: int
    active_orders: int
    completed_orders_this_month: int
    revenue_this_month: Decimal
    average_order_value: Decimal


class PartnerPricingSummarySection(BaseModel):
    services_count: int
    rules_count: int
    average_price: Decimal
    min_price: Decimal
    max_price: Decimal
    has_express: bool
    has_pickup_fee: bool
    has_delivery_fee: bool
    has_bulk_discount: bool


class PartnerOperationalState(BaseModel):
    order_intake_status: str
    accepting_orders: bool
    has_data_gaps: bool


class DashboardMeta(BaseModel):
    generated_at: datetime
    timezone: str
    source_version: str


class PartnerDashboardSummaryResponse(BaseModel):
    partner: PartnerSummarySection
    orders: PartnerOrdersSummary
    pricing: PartnerPricingSummarySection
    operational_state: PartnerOperationalState
    meta: DashboardMeta
