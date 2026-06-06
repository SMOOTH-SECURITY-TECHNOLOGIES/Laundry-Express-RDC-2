from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus
from app.schemas.partner_financials import (
    PartnerDailyRevenuePoint,
    PartnerFinancialSummaryResponse,
    PartnerFinancialTotals,
    PartnerFinancialTransaction,
)


class PartnerFinancialService:
    """Résumé financier canonique d'un partenaire."""

    def __init__(self, db: Session):
        self.db = db

    def get_partner_financial_summary(self, partner_id: UUID) -> PartnerFinancialSummaryResponse:
        completed_orders = (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.COMPLETED.value,
            )
            .order_by(Order.created_at.desc(), Order.id.desc())
            .all()
        )

        now = datetime.utcnow()
        last_30_days_start = now - timedelta(days=29)

        revenue_total = sum((order.total_amount or Decimal("0.00")) for order in completed_orders)
        recent_completed_orders = [
            order
            for order in completed_orders
            if (order.completed_at or order.created_at) and (order.completed_at or order.created_at).replace(tzinfo=None) >= last_30_days_start
        ]
        revenue_last_30_days = sum(
            (order.total_amount or Decimal("0.00")) for order in recent_completed_orders
        )
        average_order_value = (
            revenue_total / len(completed_orders) if completed_orders else Decimal("0.00")
        )

        revenue_by_day: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
        for order in recent_completed_orders:
            reference_dt = (order.completed_at or order.created_at)
            if not reference_dt:
                continue
            date_key = reference_dt.date().isoformat()
            revenue_by_day[date_key] += order.total_amount or Decimal("0.00")

        daily_revenue = []
        for offset in range(30):
            day = (last_30_days_start.date() + timedelta(days=offset)).isoformat()
            daily_revenue.append(
                PartnerDailyRevenuePoint(
                    date=day,
                    amount=revenue_by_day[day],
                )
            )

        transactions = [
            PartnerFinancialTransaction(
                order_id=order.id,
                order_number=order.order_number,
                completed_at=(order.completed_at or order.created_at).isoformat() if (order.completed_at or order.created_at) else None,
                service_label=", ".join(sorted({
                    (item.item_name or "").strip()
                    for item in (order.items or [])
                    if (item.item_name or "").strip()
                })) or order.order_number,
                amount=order.total_amount or Decimal("0.00"),
                payment_status=str(order.payment_status),
                payout_status=self._derive_payout_status(order),
            )
            for order in completed_orders
        ]

        return PartnerFinancialSummaryResponse(
            totals=PartnerFinancialTotals(
                revenue_total=revenue_total,
                revenue_last_30_days=revenue_last_30_days,
                completed_orders=len(completed_orders),
                average_order_value=average_order_value,
            ),
            daily_revenue=daily_revenue,
            transactions=transactions,
        )

    @staticmethod
    def _derive_payout_status(order: Order) -> str:
        reference_dt = order.completed_at or order.created_at
        if not reference_dt:
            return "pending"

        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        return "paid_out" if reference_dt.replace(tzinfo=None) < seven_days_ago else "pending"
