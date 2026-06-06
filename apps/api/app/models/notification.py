import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class NotificationType(str, Enum):
    """Types de notification"""
    ORDER_UPDATE = "order_update"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    DELIVERY_UPDATE = "delivery_update"
    PROMOTION = "promotion"
    SYSTEM = "system"
    SECURITY = "security"


class NotificationChannel(str, Enum):
    """Canaux de notification"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"


class Notification(BaseModel):
    """Notification"""
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Informations de base
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    
    # Métadonnées
    notification_metadata = Column(Text, nullable=True)  # JSON
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Relations
    deliveries = relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, title={self.title})>"


class NotificationDelivery(BaseModel):
    """Livraison de notification"""
    __tablename__ = "notification_deliveries"

    notification_id = Column(UUID(as_uuid=True), ForeignKey("notifications.id"), nullable=False, index=True)
    
    # Canal
    channel = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)  # pending, sent, failed, delivered
    
    # Métadonnées
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    notification = relationship("Notification", back_populates="deliveries")
    
    def __repr__(self):
        return f"<NotificationDelivery(id={self.id}, notification_id={self.notification_id}, channel={self.channel})>"


class NotificationTemplate(BaseModel):
    """Template de notification"""
    __tablename__ = "notification_templates"

    # Informations de base
    template_name = Column(String(100), nullable=False, unique=True, index=True)
    notification_type = Column(String(50), nullable=False)
    channel = Column(String(50), nullable=False)
    
    # Contenu
    subject = Column(String(255), nullable=True)
    title = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    
    # Variables
    variables = Column(Text, nullable=True)  # JSON des variables disponibles
    
    # Configuration
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<NotificationTemplate(id={self.id}, template_name={self.template_name}, channel={self.channel})>"
