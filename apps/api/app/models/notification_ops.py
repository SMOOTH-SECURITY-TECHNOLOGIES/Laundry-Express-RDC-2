import uuid
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class NotificationOpsChannel(str, Enum):
    PUSH = "push"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"


class NotificationOpsStatus(str, Enum):
    DELIVERED = "delivered"
    PENDING = "pending"
    FAILED = "failed"
    OPENED = "opened"
    CLICKED = "clicked"
    UNSUBSCRIBED = "unsubscribed"


class NotificationOpsItem(BaseModel):
    __tablename__ = "notification_ops_items"

    title = Column(String(255), nullable=False)
    message_preview = Column(String(512), nullable=True)
    channel = Column(String(32), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    audience = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, default=NotificationOpsStatus.DELIVERED.value)
    delivery_rate = Column(Float, nullable=False, default=100.0)
    open_rate = Column(Float, nullable=True)
    click_rate = Column(Float, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    partner_id = Column(UUID(as_uuid=True), nullable=True)
    zone = Column(String(64), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("notification_ops_templates.id"), nullable=True)
    metadata_json = Column(JSONB, nullable=True)


class NotificationOpsTemplate(BaseModel):
    __tablename__ = "notification_ops_templates"

    name = Column(String(128), nullable=False, index=True)
    channel = Column(String(32), nullable=False)
    event_type = Column(String(64), nullable=False)
    language = Column(String(16), nullable=False, default="fr")
    status = Column(String(32), nullable=False, default="active")
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False, default="")
    variables = Column(JSONB, nullable=True)
    translations = Column(JSONB, nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    delivery_rate = Column(Float, nullable=False, default=98.0)
    open_rate = Column(Float, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)


class NotificationOpsAutomation(BaseModel):
    __tablename__ = "notification_ops_automations"

    name = Column(String(255), nullable=False)
    trigger_key = Column(String(128), nullable=False)
    channel = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False, default="active")
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    config = Column(JSONB, nullable=True)


class NotificationOpsSegment(BaseModel):
    __tablename__ = "notification_ops_segments"

    name = Column(String(128), nullable=False)
    slug = Column(String(64), unique=True, nullable=False)
    size = Column(Integer, nullable=False, default=0)
    rules = Column(JSONB, nullable=True)
    preferred_channel = Column(String(32), nullable=True)
    engagement_rate = Column(Float, nullable=False, default=0.0)


class NotificationOpsError(BaseModel):
    __tablename__ = "notification_ops_errors"

    channel = Column(String(32), nullable=False)
    provider = Column(String(64), nullable=False)
    error_code = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    occurrences = Column(Integer, nullable=False, default=1)
    last_occurrence_at = Column(DateTime(timezone=True), nullable=True)


class NotificationOpsUnsubscribe(BaseModel):
    __tablename__ = "notification_ops_unsubscribes"

    channel = Column(String(32), nullable=False)
    user_email = Column(String(255), nullable=True)
    user_phone = Column(String(32), nullable=True)
    reason = Column(String(255), nullable=True)
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)


class NotificationOpsProviderHealth(BaseModel):
    __tablename__ = "notification_ops_provider_health"

    channel = Column(String(32), unique=True, nullable=False)
    provider = Column(String(64), nullable=False)
    delivery_rate = Column(Float, nullable=False, default=99.0)
    latency_ms = Column(Integer, nullable=False, default=200)
    error_count = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="healthy")
    last_incident_at = Column(DateTime(timezone=True), nullable=True)


class NotificationOpsActivity(BaseModel):
    __tablename__ = "notification_ops_activities"

    activity_type = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    actor_name = Column(String(128), nullable=True)
    metadata_json = Column(JSONB, nullable=True)
