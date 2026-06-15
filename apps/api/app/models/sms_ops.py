from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class SmsProvider(BaseModel):
    __tablename__ = "sms_providers"

    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    provider_type = Column(String(32), nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    delivery_rate = Column(Float, nullable=False, default=95.0)
    cost_per_sms = Column(Float, nullable=False, default=0.021)
    avg_delivery_ms = Column(Integer, nullable=False, default=3000)


class SmsSender(BaseModel):
    __tablename__ = "sms_senders"

    name = Column(String(64), nullable=False)
    sender_id = Column(String(32), unique=True, nullable=False)
    approved = Column(Boolean, nullable=False, default=False)
    active = Column(Boolean, nullable=False, default=True)
    approval_status = Column(String(32), nullable=False, default="pending")
    volume = Column(Integer, nullable=False, default=0)
    delivery_rate = Column(Float, nullable=False, default=95.0)


class SmsTemplate(BaseModel):
    __tablename__ = "sms_templates"

    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False, default="transaction")
    content = Column(Text, nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    usage_count = Column(Integer, nullable=False, default=0)
    delivery_rate = Column(Float, nullable=False, default=95.0)


class SmsCampaign(BaseModel):
    __tablename__ = "sms_campaigns"

    name = Column(String(128), nullable=False)
    campaign_type = Column(String(32), nullable=False, default="marketing")
    status = Column(String(32), nullable=False, default="draft")
    message = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    target_count = Column(Integer, nullable=False, default=0)
    sent_count = Column(Integer, nullable=False, default=0)
    delivered_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)
    reply_count = Column(Integer, nullable=False, default=0)
    audience = Column(String(128), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)


class SmsMessage(BaseModel):
    __tablename__ = "sms_messages"

    reference = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    campaign_id = Column(UUID(as_uuid=True), nullable=True)
    template_id = Column(UUID(as_uuid=True), nullable=True)
    sender_id = Column(UUID(as_uuid=True), nullable=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True)
    operator_slug = Column(String(64), nullable=True, index=True)
    phone_number = Column(String(32), nullable=False, index=True)
    recipient_name = Column(String(128), nullable=True)
    message = Column(Text, nullable=False)
    message_type = Column(String(32), nullable=False, default="transaction")
    status = Column(String(32), nullable=False, default="pending")
    provider_message_id = Column(String(128), nullable=True)
    cost = Column(Float, nullable=False, default=0.0)
    sender_name = Column(String(64), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)


class SmsCreditLedger(BaseModel):
    __tablename__ = "sms_credit_ledger"

    provider_id = Column(UUID(as_uuid=True), nullable=True)
    provider_slug = Column(String(64), nullable=True)
    movement_type = Column(String(32), nullable=False)
    amount = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)


class SmsLog(BaseModel):
    __tablename__ = "sms_logs"

    message_id = Column(UUID(as_uuid=True), nullable=True)
    reference = Column(String(64), nullable=True, index=True)
    phone_number = Column(String(32), nullable=True)
    event_type = Column(String(64), nullable=False)
    request_json = Column(JSONB, nullable=True)
    response_json = Column(JSONB, nullable=True)
    provider_id = Column(String(128), nullable=True)
    status = Column(String(32), nullable=True)


class SmsOtpRecord(BaseModel):
    __tablename__ = "sms_otp_records"

    phone_number = Column(String(32), nullable=False, index=True)
    code_masked = Column(String(16), nullable=False)
    status = Column(String(32), nullable=False, default="pending")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)


class SmsAlert(BaseModel):
    __tablename__ = "sms_alerts"

    alert_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="medium")
    count = Column(Integer, nullable=False, default=0)
    resolved = Column(Boolean, nullable=False, default=False)


class SmsWebhook(BaseModel):
    __tablename__ = "sms_webhooks"

    endpoint = Column(String(512), nullable=False)
    secret_masked = Column(String(64), nullable=True)
    last_call_at = Column(DateTime(timezone=True), nullable=True)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    consecutive_errors = Column(Integer, nullable=False, default=0)


class SmsSettings(BaseModel):
    __tablename__ = "sms_settings"

    key = Column(String(64), unique=True, nullable=False)
    value_json = Column(JSONB, nullable=True)
