from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ProofType(str, Enum):
    """Types de preuves opérationnelles"""
    PHOTO = "photo"
    SIGNATURE = "signature"
    GEOLOCATION = "geolocation"
    WEBHOOK = "webhook"
    SYSTEM = "system"
    MANUAL = "manual"


class ActorType(str, Enum):
    """Types d'acteurs opérationnels"""
    CUSTOMER = "customer"
    DRIVER = "driver"
    PARTNER = "partner"
    SYSTEM = "system"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    """Statut de vérification d'une preuve"""
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    REJECTED = "rejected"


class OperationalProof(BaseModel):
    """Preuve immuable attachée à une transition de statut opérationnel"""
    __tablename__ = "operational_proofs"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("delivery_tasks.id", ondelete="SET NULL"), nullable=True, index=True)

    # Quoi
    proof_type = Column(String(50), nullable=False)
    proof_data = Column(JSONB, nullable=False, default=dict)

    # Qui
    actor_type = Column(String(50), nullable=False)
    actor_id = Column(UUID(as_uuid=True), nullable=False)
    actor_name = Column(String(255), nullable=False)

    # Quand
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Où
    location_lat = Column(Numeric(10, 8), nullable=True)
    location_lng = Column(Numeric(11, 8), nullable=True)
    location_accuracy = Column(Numeric(5, 2), nullable=True)

    # Vérification
    verification_status = Column(String(20), default="pending", nullable=False)
    verification_method = Column(String(50), nullable=True)
    verification_notes = Column(Text, nullable=True)

    # Relations
    order = relationship("Order", back_populates="proofs")
    task = relationship("DeliveryTask", back_populates="proofs")

    def __repr__(self):
        return f"<OperationalProof(id={self.id}, type={self.proof_type}, status={self.verification_status})>"


class TimelineEventType(str, Enum):
    """Types d'événements de timeline"""
    STATUS_CHANGE = "status_change"
    PAYMENT = "payment"
    PROOF_ADDED = "proof_added"
    DISPUTE = "dispute"
    MESSAGE = "message"
    REFUND = "refund"
    COMMISSION = "commission"


class OperationalTimeline(BaseModel):
    """Timeline immuable d'événements opérationnels"""
    __tablename__ = "operational_timelines"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("delivery_tasks.id", ondelete="SET NULL"), nullable=True, index=True)

    # Événement
    event_type = Column(String(50), nullable=False)
    event_subtype = Column(String(50), nullable=True)

    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    payload = Column(JSONB, nullable=False, default=dict)

    # Horodatage
    occurred_at = Column(DateTime(timezone=True), nullable=False)

    # Source
    source = Column(String(50), nullable=False)
    correlation_id = Column(String(128), nullable=True)

    # Index composite pour requêtes rapides
    __table_args__ = (
        Index('idx_timeline_order_occurred', 'order_id', 'occurred_at'),
        Index('idx_timeline_task_occurred', 'task_id', 'occurred_at'),
    )

    # Relations
    order = relationship("Order", back_populates="timeline_events")
    task = relationship("DeliveryTask", back_populates="timeline_events")

    def __repr__(self):
        return f"<OperationalTimeline(id={self.id}, event={self.event_type}, occurred={self.occurred_at})>"
