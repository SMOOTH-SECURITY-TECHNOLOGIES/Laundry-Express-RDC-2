from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.models.payment import RefundStatus


# Refund Transaction Schemas (défini d'abord pour éviter les références circulaires)
class RefundTransactionResponse(BaseModel):
    """Schéma de réponse pour une transaction de remboursement"""
    id: UUID
    refund_request_id: UUID
    payment_intent_id: UUID
    provider_name: Optional[str]
    provider_refund_id: Optional[str]
    status: str
    amount: float
    failure_reason: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Refund Request Schemas
class RefundRequestCreate(BaseModel):
    """Schéma pour créer une demande de remboursement"""
    order_id: UUID
    reason_code: str = Field(..., min_length=1, max_length=50, description="Code de raison")
    reason_text: Optional[str] = None
    requested_amount: float = Field(gt=0, description="Montant demandé")
    dispute_id: Optional[UUID] = None

    @validator("requested_amount")
    def validate_requested_amount(cls, v):
        if v <= 0:
            raise ValueError("Le montant demandé doit être supérieur à 0")
        return v


class RefundRequestApprove(BaseModel):
    """Schéma pour approuver une demande de remboursement"""
    approved_amount: float = Field(gt=0, description="Montant approuvé")
    notes: Optional[str] = None

    @validator("approved_amount")
    def validate_approved_amount(cls, v):
        if v <= 0:
            raise ValueError("Le montant approuvé doit être supérieur à 0")
        return v


class RefundRequestReject(BaseModel):
    """Schéma pour rejeter une demande de remboursement"""
    reason: str = Field(..., min_length=1, description="Raison du rejet")
    notes: Optional[str] = None


class RefundRequestResponse(BaseModel):
    """Schéma de réponse pour une demande de remboursement"""
    id: UUID
    order_id: UUID
    order_number: Optional[str] = None
    payment_intent_id: UUID
    customer_id: UUID
    customer_name: Optional[str] = None
    dispute_id: Optional[UUID]
    reason_code: str
    reason_text: Optional[str]
    requested_amount: float
    approved_amount: Optional[float]
    status: RefundStatus
    reviewed_by_user_id: Optional[UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    refund_transactions: List[RefundTransactionResponse] = []

    class Config:
        from_attributes = True


# Refund Summary
class RefundSummary(BaseModel):
    """Résumé des remboursements"""
    total_requested: float
    total_approved: float
    total_processed: float
    pending_requests: int
    approved_requests: int
    completed_refunds: int


# Mise à jour des références circulaires
RefundRequestResponse.model_rebuild()
