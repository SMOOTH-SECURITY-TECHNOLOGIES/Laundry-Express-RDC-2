from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class OrderStatus(str, Enum):
    """Statuts métier des commandes"""
    DRAFT = "draft"
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKUP_DRIVER_ASSIGNED = "pickup_driver_assigned"
    PICKUP_IN_PROGRESS = "pickup_in_progress"
    PICKED_UP = "picked_up"
    RECEIVED_BY_PARTNER = "received_by_partner"
    CLEANING_IN_PROGRESS = "cleaning_in_progress"
    QUALITY_CHECK = "quality_check"
    READY_FOR_DELIVERY = "ready_for_delivery"
    DELIVERY_DRIVER_ASSIGNED = "delivery_driver_assigned"
    DELIVERY_IN_PROGRESS = "delivery_in_progress"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    DISPUTED = "disputed"


class PaymentStatus(str, Enum):
    """Statuts de paiement"""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CASH_PENDING = "cash_pending"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class Order(BaseModel):
    """Commande"""
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal_amount >= 0", name="ck_orders_subtotal_non_negative"),
        CheckConstraint("discount_amount >= 0", name="ck_orders_discount_non_negative"),
        CheckConstraint("pickup_fee >= 0", name="ck_orders_pickup_fee_non_negative"),
        CheckConstraint("delivery_fee >= 0", name="ck_orders_delivery_fee_non_negative"),
        CheckConstraint("total_amount >= 0", name="ck_orders_total_non_negative"),
        CheckConstraint("amount_paid >= 0", name="ck_orders_amount_paid_non_negative"),
        CheckConstraint("refunded_amount >= 0", name="ck_orders_refunded_amount_non_negative"),
        CheckConstraint("amount_paid <= total_amount", name="ck_orders_amount_paid_lte_total"),
        CheckConstraint("refunded_amount <= amount_paid", name="ck_orders_refunded_amount_lte_paid"),
    )

    # Références
    order_number = Column(String(50), nullable=False, unique=True, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    pickup_address_id = Column(UUID(as_uuid=True), ForeignKey("customer_addresses.id"), nullable=True)
    delivery_address_id = Column(UUID(as_uuid=True), ForeignKey("customer_addresses.id"), nullable=True)
    idempotency_key = Column(String(128), nullable=True, unique=True, index=True)
    
    # Statuts
    status = Column(
        SQLEnum(
            OrderStatus,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=OrderStatus.DRAFT,
        nullable=False,
    )
    payment_status = Column(
        SQLEnum(
            PaymentStatus,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    
    # Montants
    currency = Column(String(3), default="CDF", nullable=False)
    subtotal_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    pickup_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    delivery_fee = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    amount_paid = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    refunded_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    
    # Instructions
    special_instructions = Column(Text, nullable=True)
    calculation_breakdown = Column(JSONB, nullable=True)
    express = Column(Boolean, nullable=False, default=False)
    pickup_requested = Column(Boolean, nullable=False, default=True)
    delivery_requested = Column(Boolean, nullable=False, default=True)
    
    # Dates et créneaux
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    pickup_time_slot = Column(String(50), nullable=True)
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    delivery_time_slot = Column(String(50), nullable=True)
    
    # Dates métier
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Optimistic locking
    version = Column(Integer, nullable=False, default=1)
    
    # Relations
    customer = relationship("User", foreign_keys=[customer_id])
    partner = relationship("Partner", foreign_keys=[partner_id])
    pickup_address = relationship("CustomerAddress", foreign_keys=[pickup_address_id])
    delivery_address = relationship("CustomerAddress", foreign_keys=[delivery_address_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    events = relationship("OrderEvent", back_populates="order", cascade="all, delete-orphan")
    attachments = relationship("OrderAttachment", back_populates="order", cascade="all, delete-orphan")
    proofs = relationship("OperationalProof", back_populates="order", cascade="all, delete-orphan")
    timeline_events = relationship("OperationalTimeline", back_populates="order", cascade="all, delete-orphan")

    @property
    def customer_name(self):
        return getattr(self.customer, "name", None)

    @property
    def customer_phone(self):
        return getattr(self.customer, "phone", None)

    @property
    def partner_name(self):
        return getattr(self.partner, "name", None)

    @property
    def pickup_contact_name(self):
        return getattr(self.pickup_address, "contact_name", None)

    @property
    def pickup_contact_phone(self):
        return getattr(self.pickup_address, "contact_phone", None)

    @property
    def pickup_commune(self):
        return getattr(self.pickup_address, "commune", None)
    
    def __repr__(self):
        return f"<Order(id={self.id}, order_number={self.order_number}, status={self.status})>"


class OrderItem(BaseModel):
    """Article de commande"""
    __tablename__ = "order_items"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("partner_services.id"), nullable=False, index=True)
    
    # Informations de base
    item_name = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)
    
    # Détails
    notes = Column(Text, nullable=True)
    detected_by_ai = Column(Boolean, default=False, nullable=False)
    
    # Relations
    order = relationship("Order", back_populates="items")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, item_name={self.item_name})>"


class OrderStatusHistory(BaseModel):
    """Historique des statuts de commande"""
    __tablename__ = "order_status_history"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    # Statuts
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    
    # Métadonnées
    changed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    change_reason = Column(Text, nullable=True)
    
    # Relations
    order = relationship("Order", back_populates="status_history")
    
    def __repr__(self):
        return f"<OrderStatusHistory(id={self.id}, order_id={self.order_id}, old_status={self.old_status}, new_status={self.new_status})>"


class OrderEvent(BaseModel):
    """Événement de commande"""
    __tablename__ = "order_events"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    # Événement
    event_type = Column(String(100), nullable=False)
    event_data = Column(Text, nullable=True)  # JSON
    notes = Column(Text, nullable=True)
    
    # Relations
    order = relationship("Order", back_populates="events")
    
    def __repr__(self):
        return f"<OrderEvent(id={self.id}, order_id={self.order_id}, event_type={self.event_type})>"


class OrderAttachment(BaseModel):
    """Pièce jointe de commande"""
    __tablename__ = "order_attachments"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    # Fichier
    file_url = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    
    # Métadonnées
    description = Column(Text, nullable=True)
    
    # Relations
    order = relationship("Order", back_populates="attachments")
    
    def __repr__(self):
        return f"<OrderAttachment(id={self.id}, order_id={self.order_id}, file_name={self.file_name})>"
