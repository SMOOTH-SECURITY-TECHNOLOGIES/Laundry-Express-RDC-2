from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderStatus
from app.schemas.partner_orders import (
    PartnerOrderListItem,
    PartnerOrdersListResponse,
    PartnerOrdersListSummary,
)


class PartnerOrdersService:
    """Source canonique pour la liste des commandes partenaire."""

    def __init__(self, db: Session):
        self.db = db

    def list_partner_orders(
        self,
        partner_id: UUID,
        *,
        status: OrderStatus | None = None,
        page: int = 1,
        page_size: int = 20,
        date_from: date | None = None,
        date_to: date | None = None,
        search: str | None = None,
    ) -> PartnerOrdersListResponse:
        query = self._build_query(
            partner_id=partner_id,
            status=status,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )

        total = query.count()
        status_counts_rows = (
            query.with_entities(Order.status, func.count(Order.id))
            .group_by(Order.status)
            .all()
        )
        status_counts = {str(status_key): count for status_key, count in status_counts_rows}

        orders = (
            query.options(
                joinedload(Order.customer),
                joinedload(Order.items),
            )
            .order_by(Order.created_at.desc(), Order.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return PartnerOrdersListResponse(
            items=[self._serialize_order(order) for order in orders],
            total=total,
            page=page,
            page_size=page_size,
            summary=PartnerOrdersListSummary(
                total_orders=total,
                status_counts=status_counts,
            ),
        )

    def _build_query(
        self,
        *,
        partner_id: UUID,
        status: OrderStatus | None,
        date_from: date | None,
        date_to: date | None,
        search: str | None,
    ):
        query = self.db.query(Order).filter(Order.partner_id == partner_id)

        if status:
            query = query.filter(Order.status == status.value)

        if date_from:
            start = datetime.combine(date_from, time.min).replace(tzinfo=timezone.utc)
            query = query.filter(Order.created_at >= start)

        if date_to:
            end_exclusive = datetime.combine(date_to + timedelta(days=1), time.min).replace(
                tzinfo=timezone.utc
            )
            query = query.filter(Order.created_at < end_exclusive)

        normalized_search = (search or "").strip()
        if normalized_search:
            like_term = f"%{normalized_search}%"
            query = query.filter(
                or_(
                    Order.order_number.ilike(like_term),
                    Order.customer.has(User.name.ilike(like_term)),
                    Order.customer.has(User.phone.ilike(like_term)),
                    Order.items.any(OrderItem.item_name.ilike(like_term)),
                )
            )

        return query

    @staticmethod
    def _serialize_order(order: Order) -> PartnerOrderListItem:
        service_labels = sorted(
            {
                (item.item_name or "").strip()
                for item in (order.items or [])
                if (item.item_name or "").strip()
            }
        )
        return PartnerOrderListItem(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            created_at=order.created_at,
            completed_at=order.completed_at,
            total_amount=order.total_amount,
            amount_paid=order.amount_paid,
            payment_status=order.payment_status,
            service_labels=service_labels,
        )
