import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    MarkAllNotificationsReadRequest,
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _serialize(notification: Notification) -> NotificationResponse:
    raw_metadata = notification.notification_metadata
    parsed_metadata = None
    if raw_metadata:
        if isinstance(raw_metadata, dict):
            parsed_metadata = raw_metadata
        else:
            try:
                parsed_metadata = json.loads(raw_metadata)
            except (TypeError, json.JSONDecodeError):
                parsed_metadata = {"raw": raw_metadata}

    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        notification_metadata=parsed_metadata,
        is_read=notification.is_read,
        created_at=notification.created_at,
        updated_at=notification.updated_at,
    )


@router.get("/me", response_model=NotificationListResponse)
def list_my_notifications(
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    notifications, total, unread_count = service.list_for_user(current_user.id, limit=limit)
    return NotificationListResponse(
        notifications=[_serialize(notification) for notification in notifications],
        total=total,
        unread_count=unread_count,
    )


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    user_id: Optional[UUID] = None,
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    target_user_id = user_id or current_user.id
    if target_user_id != current_user.id and not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    service = NotificationService(db)
    notifications, total, unread_count = service.list_for_user(target_user_id, limit=limit)
    return NotificationListResponse(
        notifications=[_serialize(notification) for notification in notifications],
        total=total,
        unread_count=unread_count,
    )


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    if data.user_id != current_user.id and not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    service = NotificationService(db)
    notification = service.create(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        metadata=data.notification_metadata,
    )
    db.commit()
    db.refresh(notification)
    return _serialize(notification)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    if not service.mark_one_read(notification_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification non trouvée")
    db.commit()
    return None


@router.post("/read-all")
def mark_all_notifications_read(
    data: MarkAllNotificationsReadRequest = MarkAllNotificationsReadRequest(),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    target_user_id = data.user_id or current_user.id
    if target_user_id != current_user.id and not is_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    service = NotificationService(db)
    updated_count = service.mark_all_read(target_user_id)
    db.commit()
    return {"updated": updated_count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(db)
    if not service.delete_for_user(notification_id, current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification non trouvée")
    db.commit()
    return None
