from decimal import Decimal
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class PartnerAnalyticsRange(str, Enum):
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class PartnerAnalyticsOverview(BaseModel):
    total_revenue: Decimal
    average_order_value: Decimal
    orders_in_range: int


class PartnerAnalyticsRevenuePoint(BaseModel):
    label: str
    value: Decimal


class PartnerAnalyticsServicePoint(BaseModel):
    name: str
    count: int


class PartnerAnalyticsCustomerInsights(BaseModel):
    new_customers: int
    returning_customers: int


class PartnerAnalyticsTopClient(BaseModel):
    name: str
    orders: int


class PartnerAnalyticsPromoUsagePoint(BaseModel):
    code: str
    usage_count: int


class PartnerAnalyticsPromoRevenuePoint(BaseModel):
    code: str
    revenue: Decimal


class PartnerAnalyticsPromoPerformance(BaseModel):
    top_by_usage: list[PartnerAnalyticsPromoUsagePoint] = Field(default_factory=list)
    top_by_revenue: list[PartnerAnalyticsPromoRevenuePoint] = Field(default_factory=list)


class PartnerAnalyticsSummaryResponse(BaseModel):
    range: Literal["week", "month", "year"]
    overview: PartnerAnalyticsOverview
    revenue_series: list[PartnerAnalyticsRevenuePoint] = Field(default_factory=list)
    popular_services: list[PartnerAnalyticsServicePoint] = Field(default_factory=list)
    customer_insights: PartnerAnalyticsCustomerInsights
    top_clients: list[PartnerAnalyticsTopClient] = Field(default_factory=list)
    promo_performance: PartnerAnalyticsPromoPerformance
