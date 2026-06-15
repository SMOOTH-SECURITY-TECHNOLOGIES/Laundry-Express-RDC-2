from sqlalchemy import Boolean, Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class ActivityLogEvent(BaseModel):
    __tablename__ = "activity_logs"

    event_id = Column(String(32), unique=True, nullable=False, index=True)
    occurred_at = Column(String(64), nullable=True, index=True)

    actor_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    actor_type = Column(String(32), nullable=False, default="admin")
    actor_name = Column(String(128), nullable=False)
    actor_role = Column(String(64), nullable=True)

    action = Column(String(64), nullable=False)
    action_label = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)

    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    reference = Column(String(64), nullable=True, index=True)

    corridor = Column(String(32), nullable=False, default="platform")
    severity = Column(String(32), nullable=False, default="info")
    status = Column(String(32), nullable=False, default="success")
    impact = Column(String(64), nullable=True)

    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device = Column(String(128), nullable=True)
    browser = Column(String(128), nullable=True)
    os_name = Column(String(64), nullable=True)

    before_state = Column(JSONB, nullable=True)
    after_state = Column(JSONB, nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=True)
    corridors_impacted = Column(JSONB, nullable=True)
    tenant_id = Column(String(64), nullable=True, index=True)
    is_anomaly = Column(Boolean, nullable=False, default=False)
