import uuid
from datetime import datetime
from enum import Enum

from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Numeric, String, Text, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class PaymentMethod(str, Enum):
    """Méthodes de paiement"""
    MOBILE_MONEY = "mobile_money"
    CASH_ON_DELIVERY = "cash_on_delivery"
    CARD = "card"
    WALLET = "wallet"
    BANK_TRANSFER = "bank_transfer"


class PaymentStatus(str, Enum):
    """Statuts de paiement pour les commandes"""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CASH_PENDING = "cash_pending"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class PaymentIntentStatus(str, Enum):
    """Statuts des intentions de paiement"""
    CREATED = "created"
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentTransactionStatus(str, Enum):
    """Statuts des transactions de paiement"""
    INITIATED = "initiated"
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class PaymentTransactionType(str, Enum):
    """Types de transactions"""
    PAYMENT = "payment"
    REFUND = "refund"
    AUTHORIZATION = "authorization"
    CAPTURE = "capture"
    VOID = "void"


class PaymentProvider(str, Enum):
    """Fournisseurs de paiement"""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    ORANGE_MONEY = "orange_money"
    MPESA = "mpesa"
    AIRTEL_MONEY = "airtel_money"
    CASH = "cash"
    VODACOM_MPESA = "vodacom_mpesa"
    AIRTEL_MONEY_RDC = "airtel_money_rdc"
    ORANGE_MONEY_RDC = "orange_money_rdc"


class PaymentIntent(BaseModel):
    """Intention de paiement"""
    __tablename__ = "payment_intents"
    __table_args__ = (
        CheckConstraint("amount_paid <= amount_expected", name="ck_payment_intent_amount_paid_lte_expected"),
        CheckConstraint("amount_expected >= 0", name="ck_payment_intent_amount_expected_nonneg"),
        CheckConstraint("amount_paid >= 0", name="ck_payment_intent_amount_paid_nonneg"),
    )

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Informations de base
    payment_method = Column(String(50), nullable=False)
    currency = Column(String(3), default="CDF", nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    amount_expected = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    amount_paid = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    status = Column(String(50), default=PaymentIntentStatus.CREATED, nullable=False)
    
    # Fournisseur
    provider = Column(String(50), nullable=False)
    provider_name = Column(String(50), nullable=True)
    provider_reference = Column(String(255), nullable=True, unique=True)
    
    # Dates
    expires_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    payment_metadata = Column(Text, nullable=True)  # JSON
    
    # Relations
    transactions = relationship("PaymentTransaction", back_populates="payment_intent", cascade="all, delete-orphan")
    refund_requests = relationship("RefundRequest", back_populates="payment_intent", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PaymentIntent(id={self.id}, order_id={self.order_id}, status={self.status})>"


class PaymentTransaction(BaseModel):
    """Transaction de paiement"""
    __tablename__ = "payment_transactions"

    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    
    # Informations de base
    transaction_type = Column(String(50), nullable=False)
    provider_name = Column(String(50), nullable=True)
    provider_transaction_id = Column(String(255), nullable=True, unique=True)
    status = Column(String(50), default=PaymentTransactionStatus.INITIATED, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    currency = Column(String(3), default="CDF", nullable=False)
    
    # Métadonnées
    raw_provider_payload = Column(Text, nullable=True)  # JSON
    failure_reason = Column(Text, nullable=True)
    
    # Dates
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    payment_intent = relationship("PaymentIntent", back_populates="transactions")
    
    def __repr__(self):
        return f"<PaymentTransaction(id={self.id}, payment_intent_id={self.payment_intent_id}, status={self.status})>"


class PaymentProviderEvent(BaseModel):
    """Événement du fournisseur de paiement"""
    __tablename__ = "payment_provider_events"

    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=True, index=True)
    
    # Événement
    event_type = Column(String(100), nullable=False)
    event_data = Column(Text, nullable=False)  # JSON
    provider = Column(String(50), nullable=False)
    provider_event_id = Column(String(255), nullable=True, unique=True)
    
    def __repr__(self):
        return f"<PaymentProviderEvent(id={self.id}, event_type={self.event_type}, provider={self.provider})>"


class RefundStatus(str, Enum):
    """Statuts des remboursements"""
    REQUESTED = "requested"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RefundRequest(BaseModel):
    """Demande de remboursement"""
    __tablename__ = "refund_requests"

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    dispute_id = Column(UUID(as_uuid=True), ForeignKey("disputes.id"), nullable=True, index=True)
    
    # Informations de base
    reason_code = Column(String(50), nullable=False)
    reason_text = Column(Text, nullable=True)
    requested_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    approved_amount = Column(Numeric(10, 2), nullable=True)
    status = Column(String(50), default=RefundStatus.REQUESTED, nullable=False)
    
    # Revue
    reviewed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    order = relationship("Order", foreign_keys=[order_id])
    customer = relationship("User", foreign_keys=[customer_id])
    payment_intent = relationship("PaymentIntent", back_populates="refund_requests")
    dispute = relationship("Dispute", back_populates="refund_requests")
    refund_transactions = relationship("RefundTransaction", back_populates="refund_request", cascade="all, delete-orphan")

    @property
    def order_number(self):
        return getattr(self.order, "order_number", None)

    @property
    def customer_name(self):
        return getattr(self.customer, "name", None)
    
    def __repr__(self):
        return f"<RefundRequest(id={self.id}, order_id={self.order_id}, status={self.status})>"


class RefundTransaction(BaseModel):
    """Transaction de remboursement"""
    __tablename__ = "refund_transactions"

    refund_request_id = Column(UUID(as_uuid=True), ForeignKey("refund_requests.id"), nullable=False, index=True)
    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=False, index=True)
    
    # Informations de base
    provider_name = Column(String(50), nullable=True)
    provider_refund_id = Column(String(255), nullable=True, unique=True)
    status = Column(String(50), default=PaymentTransactionStatus.PENDING, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    failure_reason = Column(Text, nullable=True)
    
    # Dates
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    refund_request = relationship("RefundRequest", back_populates="refund_transactions")
    payment_intent = relationship("PaymentIntent")
    
    def __repr__(self):
        return f"<RefundTransaction(id={self.id}, refund_request_id={self.refund_request_id}, status={self.status})>"
