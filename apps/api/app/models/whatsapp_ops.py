from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import BaseModel


class WhatsappConversation(BaseModel):
    __tablename__ = "whatsapp_conversations"

    client_name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False, index=True)
    last_message = Column(Text, nullable=True)
    channel = Column(String(32), nullable=False, default="whatsapp")
    assigned_to = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="open")
    wait_time_sec = Column(Integer, nullable=False, default=0)
    messages_json = Column(JSONB, nullable=True)
    linked_orders = Column(JSONB, nullable=True)
    linked_tickets = Column(JSONB, nullable=True)
    internal_notes = Column(JSONB, nullable=True)
    ai_suggestions = Column(JSONB, nullable=True)


class WhatsappTemplate(BaseModel):
    __tablename__ = "whatsapp_templates"

    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False, default="utility")
    language = Column(String(16), nullable=False, default="fr")
    meta_status = Column(String(32), nullable=False, default="approved")
    usage_count = Column(Integer, nullable=False, default=0)
    delivery_rate = Column(Float, nullable=False, default=95.0)
    body = Column(Text, nullable=True)
    components_json = Column(JSONB, nullable=True)


class WhatsappCampaign(BaseModel):
    __tablename__ = "whatsapp_campaigns"

    name = Column(String(128), nullable=False)
    campaign_type = Column(String(32), nullable=False, default="broadcast")
    template_name = Column(String(128), nullable=True)
    audience = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    sent = Column(Integer, nullable=False, default=0)
    delivered = Column(Integer, nullable=False, default=0)
    opened = Column(Integer, nullable=False, default=0)
    replies = Column(Integer, nullable=False, default=0)
    clicks = Column(Integer, nullable=False, default=0)
    conversions = Column(Integer, nullable=False, default=0)


class WhatsappAutomation(BaseModel):
    __tablename__ = "whatsapp_automations"

    name = Column(String(128), nullable=False)
    trigger_type = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="active")
    nodes_json = Column(JSONB, nullable=True)
    runs_count = Column(Integer, nullable=False, default=0)
    success_rate = Column(Float, nullable=False, default=90.0)


class WhatsappNotification(BaseModel):
    __tablename__ = "whatsapp_notifications"

    event_type = Column(String(64), nullable=False)
    template_name = Column(String(128), nullable=True)
    recipient = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, default="delivered")
    channel = Column(String(32), nullable=False, default="whatsapp")


class WhatsappWebhook(BaseModel):
    __tablename__ = "whatsapp_webhooks"

    endpoint = Column(String(512), nullable=False)
    secret_masked = Column(String(64), nullable=True)
    last_call_at = Column(String(64), nullable=True)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    retry_count = Column(Integer, nullable=False, default=0)
    events = Column(JSONB, nullable=True)


class WhatsappQuality(BaseModel):
    __tablename__ = "whatsapp_quality"

    quality_rating = Column(String(32), nullable=False, default="high")
    messaging_limit = Column(String(64), nullable=False, default="1000/jour")
    phone_status = Column(String(32), nullable=False, default="connected")
    verification_status = Column(String(32), nullable=False, default="verified")
    alerts_json = Column(JSONB, nullable=True)


class WhatsappCostSnapshot(BaseModel):
    __tablename__ = "whatsapp_cost_snapshots"

    period = Column(String(16), nullable=False, default="current")
    total_today = Column(Float, nullable=False, default=0.0)
    total_week = Column(Float, nullable=False, default=0.0)
    total_month = Column(Float, nullable=False, default=0.0)
    marketing_cost = Column(Float, nullable=False, default=0.0)
    utility_cost = Column(Float, nullable=False, default=0.0)
    auth_cost = Column(Float, nullable=False, default=0.0)
    cost_per_conversation = Column(Float, nullable=False, default=0.0)
    trend = Column(Float, nullable=False, default=0.0)
    forecast = Column(Float, nullable=False, default=0.0)
    data_points = Column(JSONB, nullable=True)


class WhatsappAiMetrics(BaseModel):
    __tablename__ = "whatsapp_ai_metrics"

    ai_conversations_pct = Column(Float, nullable=False, default=72.0)
    human_escalations = Column(Integer, nullable=False, default=0)
    ai_confidence = Column(Float, nullable=False, default=87.0)
    resolution_rate = Column(Float, nullable=False, default=68.0)
    resolved_without_human = Column(Integer, nullable=False, default=0)
    cost_saved = Column(Float, nullable=False, default=0.0)
    satisfaction = Column(Float, nullable=False, default=4.6)
    prompts_json = Column(JSONB, nullable=True)


class WhatsappSegment(BaseModel):
    __tablename__ = "whatsapp_segments"

    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    size = Column(Integer, nullable=False, default=0)
    engagement = Column(Float, nullable=False, default=0.0)
    conversion = Column(Float, nullable=False, default=0.0)
