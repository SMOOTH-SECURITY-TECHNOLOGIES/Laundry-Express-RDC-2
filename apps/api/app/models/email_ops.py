from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class EmailTemplate(BaseModel):
    __tablename__ = "email_templates"

    name = Column(String(128), nullable=False)
    template_type = Column(String(32), nullable=False, default="transactional")
    language = Column(String(16), nullable=False, default="fr")
    subject = Column(String(255), nullable=False)
    preheader = Column(String(255), nullable=True)
    body_html = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="active")
    usage_count = Column(Integer, nullable=False, default=0)
    open_rate = Column(Float, nullable=False, default=0.0)
    click_rate = Column(Float, nullable=False, default=0.0)
    version = Column(Integer, nullable=False, default=1)


class EmailCampaign(BaseModel):
    __tablename__ = "email_campaigns"

    name = Column(String(128), nullable=False)
    audience = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="draft")
    sent_count = Column(Integer, nullable=False, default=0)
    opened_count = Column(Integer, nullable=False, default=0)
    clicked_count = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
    roi = Column(Float, nullable=False, default=0.0)
    scheduled_at = Column(String(64), nullable=True)


class EmailAutomation(BaseModel):
    __tablename__ = "email_automations"

    name = Column(String(128), nullable=False)
    trigger_key = Column(String(64), nullable=False)
    template_name = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    last_run_at = Column(String(64), nullable=True)
    volume_30d = Column(Integer, nullable=False, default=0)
    open_rate = Column(Float, nullable=False, default=0.0)
    click_rate = Column(Float, nullable=False, default=0.0)


class EmailMessage(BaseModel):
    __tablename__ = "email_messages"

    reference = Column(String(64), unique=True, nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    recipient_name = Column(String(128), nullable=True)
    subject = Column(String(255), nullable=False)
    message_type = Column(String(32), nullable=False, default="transactional")
    template_name = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="sent")
    open_rate = Column(Float, nullable=True)
    click_rate = Column(Float, nullable=True)
    provider_message_id = Column(String(128), nullable=True)
    domain = Column(String(128), nullable=True)
    sent_at = Column(String(64), nullable=True)


class EmailBounce(BaseModel):
    __tablename__ = "email_bounces"

    email = Column(String(255), nullable=False, index=True)
    bounce_type = Column(String(32), nullable=False)
    reason = Column(String(255), nullable=True)
    provider_code = Column(String(64), nullable=True)
    occurred_at = Column(String(64), nullable=True)


class EmailUnsubscribe(BaseModel):
    __tablename__ = "email_unsubscribes"

    email = Column(String(255), nullable=False, index=True)
    unsubscribe_type = Column(String(32), nullable=False, default="marketing")
    reason = Column(String(255), nullable=True)
    consent_audit = Column(JSONB, nullable=True)


class EmailInvoiceLog(BaseModel):
    __tablename__ = "email_invoice_logs"

    invoice_ref = Column(String(64), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False, default="sent")
    opened = Column(Boolean, nullable=False, default=False)
    downloaded = Column(Boolean, nullable=False, default=False)
    reminder_count = Column(Integer, nullable=False, default=0)


class EmailDeliverability(BaseModel):
    __tablename__ = "email_deliverability"

    domain = Column(String(128), unique=True, nullable=False)
    health_status = Column(String(32), nullable=False, default="healthy")
    spf = Column(String(32), nullable=False, default="pass")
    dkim = Column(String(32), nullable=False, default="pass")
    dmarc = Column(String(32), nullable=False, default="pass")
    bounce_rate = Column(Float, nullable=False, default=0.0)
    spam_complaints = Column(Float, nullable=False, default=0.0)
    reputation_score = Column(Float, nullable=False, default=95.0)
    delivery_rate = Column(Float, nullable=False, default=99.0)
    open_rate = Column(Float, nullable=False, default=0.0)
    click_rate = Column(Float, nullable=False, default=0.0)


class EmailWebhook(BaseModel):
    __tablename__ = "email_webhooks"

    endpoint = Column(String(512), nullable=False)
    secret_masked = Column(String(64), nullable=True)
    last_call_at = Column(String(64), nullable=True)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    events = Column(JSONB, nullable=True)


class EmailAlert(BaseModel):
    __tablename__ = "email_alerts"

    alert_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="medium")
    count = Column(Integer, nullable=False, default=0)


class EmailSettings(BaseModel):
    __tablename__ = "email_settings"

    key = Column(String(64), unique=True, nullable=False)
    value_json = Column(JSONB, nullable=True)
