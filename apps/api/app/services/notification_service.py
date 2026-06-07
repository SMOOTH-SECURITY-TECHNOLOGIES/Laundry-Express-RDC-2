import json
from typing import Any, Dict, Iterable, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.partner import PartnerStaff
from app.models.user import User, UserRole


class NotificationService:
    """In-app notification orchestration for operational events."""

    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: UUID, limit: int = 100) -> tuple[List[Notification], int, int]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        total = query.count()
        unread_count = query.filter(Notification.is_read == False).count()
        notifications = (
            query.order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )
        return notifications, total, unread_count

    def create(
        self,
        *,
        user_id: UUID,
        title: str,
        message: str,
        notification_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            notification_metadata=json.dumps(metadata or {}),
            is_read=False,
        )
        self.db.add(notification)
        self.db.flush()
        return notification

    def create_many(
        self,
        *,
        user_ids: Iterable[UUID],
        title: str,
        message: str,
        notification_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> List[Notification]:
        notifications: List[Notification] = []
        seen: set[UUID] = set()
        for user_id in user_ids:
            if not user_id or user_id in seen:
                continue
            seen.add(user_id)
            notifications.append(
                self.create(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    metadata=metadata,
                )
            )
        return notifications

    def mark_one_read(self, notification_id: UUID, user_id: UUID) -> bool:
        notification = (
            self.db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notification:
            return False
        notification.is_read = True
        self.db.flush()
        return True

    def mark_all_read(self, user_id: UUID) -> int:
        updated = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .update({"is_read": True}, synchronize_session=False)
        )
        self.db.flush()
        return int(updated or 0)

    def delete_for_user(self, notification_id: UUID, user_id: UUID) -> bool:
        notification = (
            self.db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notification:
            return False
        self.db.delete(notification)
        self.db.flush()
        return True

    def partner_staff_user_ids(self, partner_id: UUID) -> List[UUID]:
        rows = (
            self.db.query(PartnerStaff.user_id)
            .filter(PartnerStaff.partner_id == partner_id, PartnerStaff.is_active == True)
            .all()
        )
        return [row[0] for row in rows]

    def admin_user_ids(self) -> List[UUID]:
        rows = (
            self.db.query(User.id)
            .filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
            .all()
        )
        return [row[0] for row in rows]

    def logistics_manager_user_ids(self) -> List[UUID]:
        rows = (
            self.db.query(User.id)
            .filter(User.role == UserRole.LOGISTICS_MANAGER)
            .all()
        )
        return [row[0] for row in rows]
