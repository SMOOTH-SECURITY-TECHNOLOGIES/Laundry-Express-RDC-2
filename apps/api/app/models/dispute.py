import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class DisputeStatus(str, Enum):
    """Statuts des litiges"""
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    CLOSED = "closed"


class DisputeCategory(str, Enum):
    """Catégories de litiges"""
    QUALITY_ISSUE = "quality_issue"
    DELIVERY_ISSUE = "delivery_issue"
    PRICING_ISSUE = "pricing_issue"
    SERVICE_ISSUE = "service_issue"
    ITEM_MISSING = "item_missing"
    DAMAGED_ITEM = "damaged_item"
    WRONG_ITEM = "wrong_item"
    LATE_DELIVERY = "late_delivery"
    OTHER = "other"


class DisputeResolutionType(str, Enum):
    """Types de résolution"""
    FULL_REFUND = "full_refund"
    PARTIAL_REFUND = "partial_refund"
    REPLACEMENT = "replacement"
    CREDIT = "credit"
    NO_ACTION = "no_action"
    COMPENSATION = "compensation"


class Dispute(BaseModel):
    """Litige"""
    __tablename__ = "disputes"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Informations de base
    category = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=DisputeStatus.OPEN, nullable=False)
    priority = Column(String(20), default="medium", nullable=False)
    
    # Résolution
    resolution_type = Column(String(50), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    refund_requests = relationship("RefundRequest", back_populates="dispute", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Dispute(id={self.id}, order_id={self.order_id}, status={self.status})>"
