from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.order_addon import (
    OrderAddOnCreateRequest,
    OrderAddOnListResponse,
    OrderAddOnResponse,
    OrderAddOnUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.order_addon_service import OrderAddOnService

router = APIRouter(prefix="/admin/order-add-ons", tags=["admin-order-add-ons"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("", response_model=OrderAddOnListResponse)
def list_order_add_ons_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return OrderAddOnService(db).list_add_ons(active_only=False)


@router.post("", response_model=OrderAddOnResponse, status_code=status.HTTP_201_CREATED)
def create_order_add_on(
    payload: OrderAddOnCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    try:
        created = OrderAddOnService(db).create_add_on(payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Un add-on avec ce slug existe déjà")
    AuditService(db).log_event(
        user_id=current_user.id,
        action="create",
        resource_type="order_add_on",
        resource_id=created.id,
        details={"slug": created.slug},
    )
    db.commit()
    return created


@router.put("/{add_on_id}", response_model=OrderAddOnResponse)
def update_order_add_on(
    add_on_id: UUID,
    payload: OrderAddOnUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    service = OrderAddOnService(db)
    try:
        updated = service.update_add_on(add_on_id, payload)
    except ValueError:
        raise HTTPException(status_code=404, detail="Add-on introuvable")
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Un add-on avec ce slug existe déjà")
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="order_add_on",
        resource_id=updated.id,
        details={"slug": updated.slug},
    )
    db.commit()
    return updated


@router.delete("/{add_on_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_order_add_on(
    add_on_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    service = OrderAddOnService(db)
    try:
        service.delete_add_on(add_on_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Add-on introuvable")
    AuditService(db).log_event(
        user_id=current_user.id,
        action="deactivate",
        resource_type="order_add_on",
        resource_id=add_on_id,
        details={},
    )
    db.commit()
