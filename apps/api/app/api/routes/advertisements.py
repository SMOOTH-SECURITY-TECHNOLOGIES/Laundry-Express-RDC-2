from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.advertisement import AdvertisementConfig
from app.models.user import User
from app.schemas.advertisement import (
    AdvertisementCreate,
    AdvertisementListResponse,
    AdvertisementResponse,
    AdvertisementUpdate,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/advertisements", tags=["advertisements"])


def _to_response(ad: AdvertisementConfig) -> AdvertisementResponse:
    return AdvertisementResponse(
        id=ad.id,
        title=ad.title,
        description=ad.description,
        imageUrl=ad.image_url,
        linkUrl=ad.link_url,
        isActive=ad.is_active,
        createdAt=ad.created_at,
        updatedAt=ad.updated_at,
    )


@router.get("", response_model=AdvertisementListResponse)
def list_advertisements(db: Session = Depends(get_sync_db)):
    advertisements = db.query(AdvertisementConfig).order_by(AdvertisementConfig.created_at.desc()).all()
    return AdvertisementListResponse(
        advertisements=[_to_response(ad) for ad in advertisements],
        total=len(advertisements),
    )


@router.post("", response_model=AdvertisementResponse, status_code=status.HTTP_201_CREATED)
def create_advertisement(
    data: AdvertisementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    ad = AdvertisementConfig(
        title=data.title,
        description=data.description,
        image_url=data.imageUrl,
        link_url=data.linkUrl,
        is_active=data.isActive,
    )
    db.add(ad)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="create",
        resource_type="advertisement",
        resource_id=ad.id,
        details={"title": ad.title},
    )
    db.commit()
    db.refresh(ad)
    return _to_response(ad)


@router.patch("/{advertisement_id}", response_model=AdvertisementResponse)
def update_advertisement(
    advertisement_id: str,
    data: AdvertisementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    ad = db.query(AdvertisementConfig).filter(AdvertisementConfig.id == advertisement_id).first()
    if not ad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicité non trouvée")

    payload = data.model_dump(exclude_unset=True)
    if "title" in payload:
        ad.title = payload["title"]
    if "description" in payload:
        ad.description = payload["description"]
    if "imageUrl" in payload:
        ad.image_url = payload["imageUrl"]
    if "linkUrl" in payload:
        ad.link_url = payload["linkUrl"]
    if "isActive" in payload:
        ad.is_active = payload["isActive"]

    db.add(ad)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="advertisement",
        resource_id=ad.id,
        details={"title": ad.title},
    )
    db.commit()
    db.refresh(ad)
    return _to_response(ad)


@router.delete("/{advertisement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_advertisement(
    advertisement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    ad = db.query(AdvertisementConfig).filter(AdvertisementConfig.id == advertisement_id).first()
    if not ad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicité non trouvée")

    AuditService(db).log_event(
        user_id=current_user.id,
        action="delete",
        resource_type="advertisement",
        resource_id=ad.id,
        details={"title": ad.title},
    )
    db.delete(ad)
    db.commit()
    return None
