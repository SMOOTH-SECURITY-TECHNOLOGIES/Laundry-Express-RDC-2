from datetime import datetime
import json
from typing import Optional, Any, List
from uuid import UUID

from pydantic import BaseModel, Field, validator, field_validator

from app.models.payment import (
    PaymentMethod,
    PaymentIntentStatus,
    PaymentTransactionStatus,
    PaymentTransactionType,
    PaymentProvider,
)


# Payment Intent Schemas
class PaymentIntentCreate(BaseModel):
    """Schéma pour créer une intention de paiement"""
    order_id: UUID
    payment_method: PaymentMethod
    amount_expected: float = Field(gt=0, description="Montant attendu")
    currency: str = "CDF"
    provider_name: Optional[PaymentProvider] = None
    expires_at: Optional[datetime] = None
    payment_metadata: Optional[dict[str, Any]] = None

    @validator("amount_expected")
    def validate_amount_expected(cls, v):
        if v <= 0:
            raise ValueError("Le montant attendu doit être supérieur à 0")
        return v


class PaymentIntentResponse(BaseModel):
    """Schéma de réponse pour une intention de paiement"""
    id: UUID
    order_id: UUID
    customer_id: UUID
    payment_method: PaymentMethod
    currency: str
    amount_expected: float
    amount_paid: float
    status: PaymentIntentStatus
    provider_name: Optional[PaymentProvider]
    provider_reference: Optional[str]
    expires_at: Optional[datetime]
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    payment_metadata: Optional[dict[str, Any]]

    @field_validator("payment_metadata", mode="before")
    @classmethod
    def parse_payment_metadata(cls, value):
        if value is None or isinstance(value, dict):
            return value
        if isinstance(value, str):
            return json.loads(value)
        return value

    class Config:
        from_attributes = True


class CashPaymentConfirmRequest(BaseModel):
    """Schéma pour confirmer un paiement cash"""
    confirmed_by_user_id: UUID
    amount_paid: float = Field(gt=0, description="Montant effectivement payé")
    notes: Optional[str] = None

    @validator("amount_paid")
    def validate_amount_paid(cls, v):
        if v <= 0:
            raise ValueError("Le montant payé doit être supérieur à 0")
        return v


class ProviderWebhookRequest(BaseModel):
    """Schéma pour les webhooks des fournisseurs de paiement"""
    provider: PaymentProvider
    event_type: str
    payload: dict[str, Any]
    signature: Optional[str] = None
    timestamp: Optional[datetime] = None


# Payment Transaction Schemas
class PaymentTransactionResponse(BaseModel):
    """Schéma de réponse pour une transaction de paiement"""
    id: UUID
    payment_intent_id: UUID
    order_id: UUID
    transaction_type: PaymentTransactionType
    provider_name: Optional[PaymentProvider]
    provider_transaction_id: Optional[str]
    status: PaymentTransactionStatus
    amount: float
    currency: str
    failure_reason: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Order Payment Summary
class OrderPaymentSummary(BaseModel):
    """Résumé des paiements d'une commande"""
    order_id: UUID
    total_amount: float
    amount_paid: float
    amount_due: float
    payment_status: str
    payment_intents: List[PaymentIntentResponse]
    transactions: List[PaymentTransactionResponse]

    class Config:
        from_attributes = True


# Webhook Response
class WebhookResponse(BaseModel):
    """Réponse pour les webhooks"""
    success: bool
    message: str
    payment_intent_id: Optional[UUID] = None
    transaction_id: Optional[UUID] = None
