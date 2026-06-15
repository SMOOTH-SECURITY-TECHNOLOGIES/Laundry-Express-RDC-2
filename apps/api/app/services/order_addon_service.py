from uuid import UUID

from sqlalchemy.orm import Session

from app.models.order_addon import OrderAddOn
from app.schemas.order_addon import (
    OrderAddOnCreateRequest,
    OrderAddOnListResponse,
    OrderAddOnResponse,
    OrderAddOnUpdateRequest,
)


def _serialize(row: OrderAddOn) -> OrderAddOnResponse:
    return OrderAddOnResponse(
        id=row.id,
        slug=row.slug,
        name=row.name,
        description=row.description or "",
        image_url=row.image_url or "",
        price=row.price,
        sort_order=row.sort_order,
        is_active=row.is_active,
    )


class OrderAddOnService:
    def __init__(self, db: Session):
        self.db = db

    def list_add_ons(self, *, active_only: bool = False) -> OrderAddOnListResponse:
        query = self.db.query(OrderAddOn)
        if active_only:
            query = query.filter(OrderAddOn.is_active.is_(True))
        rows = query.order_by(OrderAddOn.sort_order.asc(), OrderAddOn.name.asc()).all()
        items = [_serialize(row) for row in rows]
        return OrderAddOnListResponse(add_ons=items, total=len(items))

    def create_add_on(self, payload: OrderAddOnCreateRequest) -> OrderAddOnResponse:
        row = OrderAddOn(
            slug=payload.slug.strip().lower(),
            name=payload.name.strip(),
            description=payload.description.strip(),
            image_url=payload.image_url.strip(),
            price=payload.price,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        self.db.add(row)
        self.db.flush()
        self.db.refresh(row)
        return _serialize(row)

    def update_add_on(self, add_on_id: UUID, payload: OrderAddOnUpdateRequest) -> OrderAddOnResponse:
        row = self.db.query(OrderAddOn).filter(OrderAddOn.id == add_on_id).first()
        if not row:
            raise ValueError("Add-on introuvable")
        data = payload.model_dump(exclude_unset=True)
        if "slug" in data and data["slug"] is not None:
            data["slug"] = data["slug"].strip().lower()
        if "name" in data and data["name"] is not None:
            data["name"] = data["name"].strip()
        if "description" in data and data["description"] is not None:
            data["description"] = data["description"].strip()
        if "image_url" in data and data["image_url"] is not None:
            data["image_url"] = data["image_url"].strip()
        for key, value in data.items():
            setattr(row, key, value)
        self.db.flush()
        self.db.refresh(row)
        return _serialize(row)

    def delete_add_on(self, add_on_id: UUID) -> None:
        row = self.db.query(OrderAddOn).filter(OrderAddOn.id == add_on_id).first()
        if not row:
            raise ValueError("Add-on introuvable")
        row.is_active = False
        self.db.flush()
