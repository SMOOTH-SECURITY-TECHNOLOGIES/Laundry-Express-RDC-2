import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class CommissionStatus(str, Enum):
    """Statuts des commissions"""
    PENDING = "pending"
    COMPUTED = "computed"
    ADJUSTED = "adjusted"
    SETTLED = "settled"
    CANCELLED = "cancelled"


class CommissionRecord(BaseModel):
    """Enregistrement de commission"""
    __tablename__ = "commission_records"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Montants
    gross_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False, default=0.0)
    net_paid_amount = Column(Float, nullable=False)
    platform_commission_amount = Column(Float, nullable=False)
    partner_net_amount = Column(Float, nullable=False)
    currency = Column(String(3), default="CDF", nullable=False)
    
    # Statut
    status = Column(String(50), default=CommissionStatus.PENDING, nullable=False)
    
    # Dates
    computed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<CommissionRecord(id={self.id}, order_id={self.order_id}, partner_net_amount={self.partner_net_amount})>"