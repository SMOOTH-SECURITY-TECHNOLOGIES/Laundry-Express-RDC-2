import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ClaimType(str, Enum):
    DELIVERY = "delivery"
    PAYMENT = "payment"
    REFUND = "refund"
    DRIVER = "driver"
    PARTNER = "partner"
    QUALITY = "quality"
    ACCOUNT = "account"
    FRAUD = "fraud"
    SLA = "sla"
    OTHER = "other"


class ClaimStatus(str, Enum):
    NEW = "new"
    OPEN = "open"
    INVESTIGATING = "investigating"
    WAITING_CUSTOMER = "waiting_customer"
    WAITING_PARTNER = "waiting_partner"
    WAITING_DRIVER = "waiting_driver"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"


class ClaimPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ClaimRefundStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Claim(BaseModel):
    __tablename__ = "claims"

    claim_number = Column(String(32), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True, index=True)
    type = Column(String(32), nullable=False, default=ClaimType.OTHER.value)
    priority = Column(String(16), nullable=False, default=ClaimPriority.MEDIUM.value)
    status = Column(String(32), nullable=False, default=ClaimStatus.NEW.value)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    ai_summary = Column(Text, nullable=True)
    risk_score = Column(Float, nullable=False, default=0.0)
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    zone = Column(String(64), nullable=True)

    events = relationship("ClaimEvent", back_populates="claim", cascade="all, delete-orphan")
    notes = relationship("ClaimNote", back_populates="claim", cascade="all, delete-orphan")
    attachments = relationship("ClaimAttachment", back_populates="claim", cascade="all, delete-orphan")
    escalations = relationship("ClaimEscalation", back_populates="claim", cascade="all, delete-orphan")
    assignments = relationship("ClaimAssignment", back_populates="claim", cascade="all, delete-orphan")
    refunds = relationship("ClaimRefund", back_populates="claim", cascade="all, delete-orphan")
    status_history = relationship("ClaimStatusHistory", back_populates="claim", cascade="all, delete-orphan")


class ClaimEvent(BaseModel):
    __tablename__ = "claim_events"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    old_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    payload = Column(JSONB, nullable=True)
    claim = relationship("Claim", back_populates="events")


class ClaimNote(BaseModel):
    __tablename__ = "claim_notes"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(String(8), nullable=False, default="true")
    claim = relationship("Claim", back_populates="notes")


class ClaimAttachment(BaseModel):
    __tablename__ = "claim_attachments"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    file_url = Column(String(512), nullable=False)
    mime_type = Column(String(128), nullable=True)
    size = Column(Integer, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    claim = relationship("Claim", back_populates="attachments")


class ClaimEscalation(BaseModel):
    __tablename__ = "claim_escalations"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    escalated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    severity = Column(String(16), nullable=False, default="high")
    claim = relationship("Claim", back_populates="escalations")


class ClaimAssignment(BaseModel):
    __tablename__ = "claim_assignments"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    claim = relationship("Claim", back_populates="assignments")


class ClaimSlaRule(BaseModel):
    __tablename__ = "claim_sla_rules"

    claim_type = Column(String(32), unique=True, nullable=False)
    hours = Column(Integer, nullable=False)
    at_risk_pct = Column(Float, nullable=False, default=0.75)


class ClaimRefund(BaseModel):
    __tablename__ = "claim_refunds"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    requested_amount = Column(Float, nullable=False, default=0.0)
    approved_amount = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="USD")
    status = Column(String(16), nullable=False, default=ClaimRefundStatus.PENDING.value)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    claim = relationship("Claim", back_populates="refunds")


class ClaimCategory(BaseModel):
    __tablename__ = "claim_categories"

    key = Column(String(32), unique=True, nullable=False)
    label = Column(String(128), nullable=False)
    color = Column(String(16), nullable=True)


class ClaimStatusHistory(BaseModel):
    __tablename__ = "claim_status_history"

    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False, index=True)
    old_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    claim = relationship("Claim", back_populates="status_history")
