from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class IntegrationsApiKey(BaseModel):
    __tablename__ = "integrations_api_keys"

    name = Column(String(128), nullable=False)
    key_hash = Column(String(128), nullable=False)
    key_type = Column(String(32), nullable=False, default="internal")
    scope = Column(String(255), nullable=False, default="orders.read")
    status = Column(String(32), nullable=False, default="active")
    created_by = Column(String(128), nullable=True)
    last_used_at = Column(String(64), nullable=True)


class IntegrationsWebhook(BaseModel):
    __tablename__ = "integrations_webhooks"

    name = Column(String(128), nullable=False)
    url = Column(String(512), nullable=False)
    event = Column(String(64), nullable=False)
    secret = Column(String(128), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    success_count = Column(Integer, nullable=False, default=0)
    failure_count = Column(Integer, nullable=False, default=0)
    last_call_at = Column(String(64), nullable=True)


class IntegrationsWebhookDelivery(BaseModel):
    __tablename__ = "integrations_webhook_deliveries"

    webhook_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    payload = Column(JSONB, nullable=True)
    headers = Column(JSONB, nullable=True)
    signature = Column(String(255), nullable=True)
    response_body = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="success")
    duration_ms = Column(Integer, nullable=False, default=0)
    attempts = Column(Integer, nullable=False, default=1)


class IntegrationsTrackingConfig(BaseModel):
    __tablename__ = "integrations_tracking_configs"

    provider = Column(String(64), nullable=False, unique=True)
    config_json = Column(JSONB, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    health_status = Column(String(32), nullable=False, default="healthy")


class IntegrationsHealth(BaseModel):
    __tablename__ = "integrations_health"

    integration_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False, default="other")
    status = Column(String(32), nullable=False, default="healthy")
    last_sync_at = Column(String(64), nullable=True)
    response_time_ms = Column(Integer, nullable=False, default=0)
    uptime_pct = Column(Float, nullable=False, default=99.0)


class IntegrationsApiLog(BaseModel):
    __tablename__ = "integrations_api_logs"

    source = Column(String(64), nullable=False)
    endpoint = Column(String(255), nullable=False)
    log_type = Column(String(32), nullable=False, default="api")
    user_name = Column(String(128), nullable=True)
    integration_name = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="success")
    response_time_ms = Column(Integer, nullable=False, default=0)
    occurred_at = Column(String(64), nullable=True)


class IntegrationsAlert(BaseModel):
    __tablename__ = "integrations_alerts"

    alert_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="medium")
    count = Column(Integer, nullable=False, default=1)
