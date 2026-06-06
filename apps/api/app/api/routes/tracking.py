from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.tracking import TrackingSettingsConfig
from app.models.user import User
from app.schemas.tracking import TrackingSettingsPayload, TrackingSettingsResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/tracking", tags=["tracking"])

TRACKING_SETTINGS_KEY = "site"
DEFAULT_TRACKING_SETTINGS = {
    "gtmContainerId": "",
    "metaPixelId": "",
}


def _get_config(db: Session) -> TrackingSettingsConfig | None:
    return (
        db.query(TrackingSettingsConfig)
        .filter(TrackingSettingsConfig.key == TRACKING_SETTINGS_KEY)
        .first()
    )


def _to_response(config: TrackingSettingsConfig | None) -> TrackingSettingsResponse:
    if config is None:
        return TrackingSettingsResponse(
            id=None,
            key=TRACKING_SETTINGS_KEY,
            gtmContainerId=DEFAULT_TRACKING_SETTINGS["gtmContainerId"],
            metaPixelId=DEFAULT_TRACKING_SETTINGS["metaPixelId"],
            created_at=None,
            updated_at=None,
        )

    return TrackingSettingsResponse(
        id=config.id,
        key=config.key,
        gtmContainerId=config.gtm_container_id or "",
        metaPixelId=config.meta_pixel_id or "",
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("/settings", response_model=TrackingSettingsResponse)
def get_tracking_settings(db: Session = Depends(get_sync_db)):
    return _to_response(_get_config(db))


@router.put("/settings", response_model=TrackingSettingsResponse)
def update_tracking_settings(
    data: TrackingSettingsPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    config = _get_config(db)
    if config is None:
        config = TrackingSettingsConfig(
            key=TRACKING_SETTINGS_KEY,
            gtm_container_id=data.gtmContainerId.strip(),
            meta_pixel_id=data.metaPixelId.strip(),
        )
        db.add(config)
    else:
        config.gtm_container_id = data.gtmContainerId.strip()
        config.meta_pixel_id = data.metaPixelId.strip()
        db.add(config)

    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="tracking_settings",
        resource_id=config.id,
        details={"key": TRACKING_SETTINGS_KEY},
    )
    db.commit()
    db.refresh(config)
    return _to_response(config)
