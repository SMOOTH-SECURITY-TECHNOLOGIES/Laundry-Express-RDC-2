import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_sync_db,
    is_admin_user,
    user_has_partner_access_sync,
)
from app.models.promotion import PromoCode
from app.models.user import User
from app.schemas.promotion import PromoCodeCreate, PromoCodeListResponse, PromoCodeResponse, PromoCodeUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/promotions", tags=["promotions"])


def _to_response(promo: PromoCode) -> PromoCodeResponse:
    return PromoCodeResponse(
        id=promo.id,
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=float(promo.discount_value),
        min_order_value=float(promo.min_order_value) if promo.min_order_value is not None else None,
        is_for_new_users_only=promo.is_for_new_users_only,
        is_active=promo.is_active,
        partner_id=promo.partner_id,
        created_by_user_id=promo.created_by_user_id,
        usage_count=promo.usage_count,
        max_usage=promo.max_usage,
        usage_limit_per_customer=promo.usage_limit_per_customer,
        start_date=promo.start_date,
        end_date=promo.end_date,
        applicable_services=promo.applicable_services_list,
        description=promo.description,
        geographic_restrictions=promo.geographic_restrictions_list,
        created_at=str(promo.created_at),
        updated_at=str(promo.updated_at),
    )


@router.get("", response_model=PromoCodeListResponse)
def list_promo_codes(
    partner_id: UUID | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    query = db.query(PromoCode)
    if partner_id:
        query = query.filter(PromoCode.partner_id == partner_id)

    promo_codes = query.order_by(PromoCode.created_at.desc()).limit(limit).all()
    return PromoCodeListResponse(
        promo_codes=[_to_response(promo) for promo in promo_codes],
        total=len(promo_codes),
    )


@router.get("/partners/{partner_id}", response_model=PromoCodeListResponse)
def list_partner_promo_codes(
    partner_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à ces promotions partenaire")

    promo_codes = (
        db.query(PromoCode)
        .filter(PromoCode.partner_id == partner_id)
        .order_by(PromoCode.created_at.desc())
        .all()
    )
    return PromoCodeListResponse(
        promo_codes=[_to_response(promo) for promo in promo_codes],
        total=len(promo_codes),
    )


@router.post("", response_model=PromoCodeResponse, status_code=status.HTTP_201_CREATED)
def create_promo_code(
    data: PromoCodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    existing = db.query(PromoCode).filter(PromoCode.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un code promo avec ce code existe déjà")

    promo = PromoCode(
        code=data.code.upper(),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_order_value=data.min_order_value,
        is_for_new_users_only=data.is_for_new_users_only,
        is_active=data.is_active,
        partner_id=data.partner_id,
        created_by_user_id=current_user.id,
        max_usage=data.max_usage,
        usage_limit_per_customer=data.usage_limit_per_customer,
        start_date=data.start_date,
        end_date=data.end_date,
        applicable_services=json.dumps(data.applicable_services),
        description=data.description,
        geographic_restrictions=json.dumps(data.geographic_restrictions),
    )
    db.add(promo)
    db.flush()

    AuditService(db).log_event(
        user_id=current_user.id,
        action="create",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code},
    )
    db.commit()
    db.refresh(promo)
    return _to_response(promo)


@router.post("/partners/{partner_id}", response_model=PromoCodeResponse, status_code=status.HTTP_201_CREATED)
def create_partner_promo_code(
    partner_id: UUID,
    data: PromoCodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à ces promotions partenaire")

    existing = db.query(PromoCode).filter(PromoCode.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un code promo avec ce code existe déjà")

    promo = PromoCode(
        code=data.code.upper(),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_order_value=data.min_order_value,
        is_for_new_users_only=data.is_for_new_users_only,
        is_active=data.is_active,
        partner_id=partner_id,
        created_by_user_id=current_user.id,
        max_usage=data.max_usage,
        usage_limit_per_customer=data.usage_limit_per_customer,
        start_date=data.start_date,
        end_date=data.end_date,
        applicable_services=json.dumps(data.applicable_services),
        description=data.description,
        geographic_restrictions=json.dumps(data.geographic_restrictions),
    )
    db.add(promo)
    db.flush()

    AuditService(db).log_event(
        user_id=current_user.id,
        action="create",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code, "partner_id": str(partner_id)},
    )
    db.commit()
    db.refresh(promo)
    return _to_response(promo)


@router.patch("/{promo_id}", response_model=PromoCodeResponse)
def update_promo_code(
    promo_id: UUID,
    data: PromoCodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code promo non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "code" and value is not None:
            setattr(promo, field, value.upper())
        elif field in {"applicable_services", "geographic_restrictions"} and value is not None:
            setattr(promo, field, json.dumps(value))
        else:
            setattr(promo, field, value)

    db.add(promo)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code},
    )
    db.commit()
    db.refresh(promo)
    return _to_response(promo)


@router.patch("/partners/{partner_id}/{promo_id}", response_model=PromoCodeResponse)
def update_partner_promo_code(
    partner_id: UUID,
    promo_id: UUID,
    data: PromoCodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à ces promotions partenaire")

    promo = db.query(PromoCode).filter(PromoCode.id == promo_id, PromoCode.partner_id == partner_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code promo non trouvé")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "code" and value is not None:
            setattr(promo, field, value.upper())
        elif field == "partner_id":
            continue
        elif field in {"applicable_services", "geographic_restrictions"} and value is not None:
            setattr(promo, field, json.dumps(value))
        else:
            setattr(promo, field, value)

    db.add(promo)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code, "partner_id": str(partner_id)},
    )
    db.commit()
    db.refresh(promo)
    return _to_response(promo)


@router.delete("/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promo_code(
    promo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code promo non trouvé")

    AuditService(db).log_event(
        user_id=current_user.id,
        action="delete",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code},
    )
    db.delete(promo)
    db.commit()
    return None


@router.delete("/partners/{partner_id}/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_partner_promo_code(
    partner_id: UUID,
    promo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à ces promotions partenaire")

    promo = db.query(PromoCode).filter(PromoCode.id == promo_id, PromoCode.partner_id == partner_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code promo non trouvé")

    AuditService(db).log_event(
        user_id=current_user.id,
        action="delete",
        resource_type="promo_code",
        resource_id=promo.id,
        details={"code": promo.code, "partner_id": str(partner_id)},
    )
    db.delete(promo)
    db.commit()
    return None
