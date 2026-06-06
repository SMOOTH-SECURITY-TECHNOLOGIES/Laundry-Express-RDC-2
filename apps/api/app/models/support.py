import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TicketStatus(str, Enum):
    """Statuts de ticket"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Priorités de ticket"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SupportTicket(BaseModel):
    """Ticket de support"""
    __tablename__ = "support_tickets"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Informations de base
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=TicketStatus.OPEN, nullable=False)
    priority = Column(String(50), default=TicketPriority.MEDIUM, nullable=False)
    
    # Catégorisation
    category = Column(String(100), nullable=True)
    subcategory = Column(String(100), nullable=True)
    
    # Assignation
    assigned_to = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Métriques
    response_time_minutes = Column(Integer, nullable=True)
    resolution_time_minutes = Column(Integer, nullable=True)
    
    # Relations
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SupportTicket(id={self.id}, user_id={self.user_id}, title={self.title})>"


class SupportMessage(BaseModel):
    """Message de support"""
    __tablename__ = "support_messages"

    ticket_id = Column(UUID(as_uuid=True), ForeignKey("support_tickets.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Contenu
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)
    
    # Métadonnées
    attachments = Column(Text, nullable=True)  # JSON des URLs des pièces jointes
    
    # Relations
    ticket = relationship("SupportTicket", back_populates="messages")
    
    def __repr__(self):
        return f"<SupportMessage(id={self.id}, ticket_id={self.ticket_id}, user_id={self.user_id})>"


class Review(BaseModel):
    """Avis"""
    __tablename__ = "reviews"

    order_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    partner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Évaluation
    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Métadonnées
    is_verified = Column(Boolean, default=False, nullable=False)
    is_helpful = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<Review(id={self.id}, order_id={self.order_id}, rating={self.rating})>"
