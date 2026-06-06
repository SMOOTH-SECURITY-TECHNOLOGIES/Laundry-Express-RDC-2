import json
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.admin import AuditLog


class AuditService:
    """Service minimal pour enregistrer des événements d'audit administratifs."""

    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        *,
        user_id: Optional[UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[UUID] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        serialized_details: Optional[str]
        if details is None:
            serialized_details = None
        elif isinstance(details, str):
            serialized_details = details
        else:
            serialized_details = json.dumps(details, default=str)

        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=serialized_details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        self.db.flush()
        return log
