from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.models.base import BaseModel


class PaymentGatewayProvider(BaseModel):
    __tablename__ = "payment_gateway_providers"

    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    channel = Column(String(64), nullable=False)
    logo_key = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default="online")
    volume = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0.0)
    commission = Column(Float, nullable=False, default=0.0)
    success_rate = Column(Float, nullable=False, default=99.0)
    last_incident_at = Column(DateTime(timezone=True), nullable=True)
    config = Column(JSONB, nullable=True)


class PaymentGatewayTransaction(BaseModel):
    __tablename__ = "payment_gateway_transactions"

    reference = Column(String(64), unique=True, nullable=False, index=True)
    client_name = Column(String(128), nullable=False)
    gateway_slug = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(8), nullable=False, default="USD")
    status = Column(String(32), nullable=False, default="success")
    channel = Column(String(64), nullable=True)
    partner_name = Column(String(128), nullable=True)
    metadata_json = Column(JSONB, nullable=True)


class PaymentGatewayIncident(BaseModel):
    __tablename__ = "payment_gateway_incidents"

    incident_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), nullable=False, default="medium")
    gateway_slug = Column(String(64), nullable=True)
    impact = Column(String(255), nullable=True)
    occurred_at = Column(DateTime(timezone=True), nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)


class PaymentGatewaySettlement(BaseModel):
    __tablename__ = "payment_gateway_settlements"

    gateway_slug = Column(String(64), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String(32), nullable=False, default="scheduled")


class PaymentGatewayWebhook(BaseModel):
    __tablename__ = "payment_gateway_webhooks"

    gateway_slug = Column(String(64), nullable=False)
    endpoint = Column(String(512), nullable=False)
    last_call_at = Column(DateTime(timezone=True), nullable=True)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    retry_count = Column(Integer, nullable=False, default=0)
    events = Column(JSONB, nullable=True)


class PaymentGatewayReconciliation(BaseModel):
    __tablename__ = "payment_gateway_reconciliations"

    reference = Column(String(64), nullable=False)
    provider_amount = Column(Float, nullable=True)
    internal_amount = Column(Float, nullable=True)
    status = Column(String(32), nullable=False, default="match")
    gateway_slug = Column(String(64), nullable=True)


class PaymentGatewayHealth(BaseModel):
    __tablename__ = "payment_gateway_health"

    gateway_slug = Column(String(64), unique=True, nullable=False)
    uptime = Column(Float, nullable=False, default=99.9)
    latency_ms = Column(Integer, nullable=False, default=200)
    error_rate = Column(Float, nullable=False, default=0.1)
    success_rate = Column(Float, nullable=False, default=99.0)
    status = Column(String(32), nullable=False, default="healthy")


class PaymentGatewayRefund(BaseModel):
    __tablename__ = "payment_gateway_refunds"

    client_name = Column(String(128), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(32), nullable=False, default="pending")
    gateway_slug = Column(String(64), nullable=True)


class PaymentGatewayCashFlow(BaseModel):
    __tablename__ = "payment_gateway_cash_flows"

    period = Column(String(16), nullable=False)
    cash_received = Column(Float, nullable=False, default=0.0)
    cash_withdrawn = Column(Float, nullable=False, default=0.0)
    cash_in_transit = Column(Float, nullable=False, default=0.0)
    cash_net = Column(Float, nullable=False, default=0.0)
    data_points = Column(JSONB, nullable=True)
