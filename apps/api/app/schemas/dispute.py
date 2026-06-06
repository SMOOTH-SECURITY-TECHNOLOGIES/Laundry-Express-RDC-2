from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.dispute import (
    DisputeStatus,
    DisputeCategory,
    DisputeResolutionType,
)
from app.schemas.refund import RefundRequestResponse


# Dispute Schemas
class DisputeCreate(BaseModel):
    """Schéma pour créer un litige"""
    order_id: UUID
    category: DisputeCategory
    title: str = Field(..., min_length=1, max_length=255, description="Titre du litige")
    description: str = Field(..., min_length=1, description="Description détaillée")
    refund_requested: bool = False
    requested_amount: Optional[float] = Field(None, gt=0, description="Montant demandé en remboursement")


class DisputeResolveRequest(BaseModel):
    """Schéma pour résoudre un litige"""
    resolution_type: DisputeResolutionType
    resolution_notes: Optional[str] = None
    refund_amount: Optional[float] = Field(None, ge=0, description="Montant de remboursement si applicable")


class DisputeResponse(BaseModel):
    """Schéma de réponse pour un litige"""
    id: UUID
    order_id: UUID
    customer_id: UUID
    partner_id: UUID
    category: DisputeCategory
    title: str
    description: str
    status: DisputeStatus
    resolution_type: Optional[DisputeResolutionType]
    resolution_notes: Optional[str]
    resolved_by_user_id: Optional[UUID]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    refund_requests: List[RefundRequestResponse] = []

    class Config:
        from_attributes = True


# Dispute Summary
class DisputeSummary(BaseModel):
    """Résumé des litiges"""
    total_disputes: int
    open_disputes: int
    under_review: int
    resolved_disputes: int
    average_resolution_time_hours: Optional[float]
    by_category: dict[str, int]


# Update forward references
DisputeResponse.model_rebuild()
