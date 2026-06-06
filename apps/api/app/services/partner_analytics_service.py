import re
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus
from app.models.promotion import PromoCode
from app.schemas.partner_analytics import (
    PartnerAnalyticsCustomerInsights,
    PartnerAnalyticsOverview,
    PartnerAnalyticsPromoPerformance,
    PartnerAnalyticsPromoRevenuePoint,
    PartnerAnalyticsPromoUsagePoint,
    PartnerAnalyticsRange,
    PartnerAnalyticsRevenuePoint,
    PartnerAnalyticsServicePoint,
    PartnerAnalyticsSummaryResponse,
    PartnerAnalyticsTopClient,
)


PROMO_CODE_PATTERN = re.compile(r"Code promo ([A-Z0-9_-]+)", re.IGNORECASE)


class PartnerAnalyticsService:
    """Résumé analytique canonique d'un partenaire."""

    def __init__(self, db: Session):
        self.db = db

    def get_partner_analytics_summary(
        self,
        partner_id: UUID,
        range_value: PartnerAnalyticsRange,
    ) -> PartnerAnalyticsSummaryResponse:
        period_start = self._get_period_start(range_value)

        all_partner_orders = (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.items))
            .filter(Order.partner_id == partner_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
            .all()
        )

        completed_orders_in_range = [
            order
            for order in all_partner_orders
            if order.status == OrderStatus.COMPLETED.value
            and self._get_reference_dt(order) >= period_start
        ]

        all_orders_in_range = [
            order for order in all_partner_orders if order.created_at.replace(tzinfo=None) >= period_start
        ]

        total_revenue = sum(
            (order.total_amount or Decimal("0.00")) for order in completed_orders_in_range
        )
        average_order_value = (
            total_revenue / len(completed_orders_in_range)
            if completed_orders_in_range
            else Decimal("0.00")
        )

        service_counts: dict[str, int] = defaultdict(int)
        for order in completed_orders_in_range:
            for item in order.items or []:
                item_name = (item.item_name or "").strip()
                if item_name:
                    service_counts[item_name] += 1

        customer_order_counts: dict[str, int] = defaultdict(int)
        customer_names: dict[str, str] = {}
        for order in all_orders_in_range:
            customer_id = str(order.customer_id)
            customer_order_counts[customer_id] += 1
            customer_names[customer_id] = order.customer_name or "Client inconnu"

        new_customers = sum(1 for count in customer_order_counts.values() if count == 1)
        returning_customers = sum(1 for count in customer_order_counts.values() if count > 1)

        promos = (
            self.db.query(PromoCode)
            .filter(PromoCode.partner_id == partner_id)
            .order_by(PromoCode.usage_count.desc(), PromoCode.code.asc())
            .all()
        )

        promo_revenue: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
        for order in completed_orders_in_range:
            promo_code = self._extract_applied_promo_code(order)
            if promo_code:
                promo_revenue[promo_code] += order.total_amount or Decimal("0.00")

        return PartnerAnalyticsSummaryResponse(
            range=range_value.value,
            overview=PartnerAnalyticsOverview(
                total_revenue=total_revenue,
                average_order_value=average_order_value,
                orders_in_range=len(completed_orders_in_range),
            ),
            revenue_series=self._build_revenue_series(completed_orders_in_range, range_value, period_start),
            popular_services=[
                PartnerAnalyticsServicePoint(name=name, count=count)
                for name, count in sorted(service_counts.items(), key=lambda item: (-item[1], item[0]))[:5]
            ],
            customer_insights=PartnerAnalyticsCustomerInsights(
                new_customers=new_customers,
                returning_customers=returning_customers,
            ),
            top_clients=[
                PartnerAnalyticsTopClient(name=customer_names[customer_id], orders=count)
                for customer_id, count in sorted(
                    customer_order_counts.items(), key=lambda item: (-item[1], item[0])
                )[:5]
            ],
            promo_performance=PartnerAnalyticsPromoPerformance(
                top_by_usage=[
                    PartnerAnalyticsPromoUsagePoint(
                        code=promo.code,
                        usage_count=int(promo.usage_count or 0),
                    )
                    for promo in promos
                    if int(promo.usage_count or 0) > 0
                ][:5],
                top_by_revenue=[
                    PartnerAnalyticsPromoRevenuePoint(code=code, revenue=revenue)
                    for code, revenue in sorted(
                        promo_revenue.items(), key=lambda item: (-item[1], item[0])
                    )[:5]
                ],
            ),
        )

    @staticmethod
    def _get_period_start(range_value: PartnerAnalyticsRange) -> datetime:
        now = datetime.utcnow()
        if range_value == PartnerAnalyticsRange.WEEK:
            return now - timedelta(days=7)
        if range_value == PartnerAnalyticsRange.YEAR:
            return datetime(now.year, 1, 1)
        month_ago = now - timedelta(days=30)
        return month_ago

    @staticmethod
    def _get_reference_dt(order: Order) -> datetime:
        reference_dt = order.completed_at or order.created_at
        return reference_dt.replace(tzinfo=None)

    def _build_revenue_series(
        self,
        orders: list[Order],
        range_value: PartnerAnalyticsRange,
        period_start: datetime,
    ) -> list[PartnerAnalyticsRevenuePoint]:
        revenue_by_bucket: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))

        if range_value == PartnerAnalyticsRange.YEAR:
            for order in orders:
                reference_dt = self._get_reference_dt(order)
                bucket = reference_dt.strftime("%Y-%m")
                revenue_by_bucket[bucket] += order.total_amount or Decimal("0.00")

            labels = [
                f"{period_start.year}-{month:02d}"
                for month in range(1, datetime.utcnow().month + 1)
            ]
        else:
            for order in orders:
                reference_dt = self._get_reference_dt(order)
                bucket = reference_dt.date().isoformat()
                revenue_by_bucket[bucket] += order.total_amount or Decimal("0.00")

            days = 8 if range_value == PartnerAnalyticsRange.WEEK else 30
            labels = [
                (period_start.date() + timedelta(days=offset)).isoformat()
                for offset in range(days)
            ]

        return [
            PartnerAnalyticsRevenuePoint(label=label, value=revenue_by_bucket[label])
            for label in labels
        ]

    @staticmethod
    def _extract_applied_promo_code(order: Order) -> str | None:
        breakdown = order.calculation_breakdown or {}
        explanation = str(breakdown.get("explanation") or "")
        match = PROMO_CODE_PATTERN.search(explanation)
        if not match:
            return None
        return match.group(1).upper()
