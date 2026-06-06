from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.commission import CommissionStatus


# Commission Schemas
class CommissionRecordResponse(BaseModel):
    """Schéma de réponse pour un enregistrement de commission"""
    id: UUID
    order_id: UUID
    partner_id: UUID
    gross_amount: float
    discount_amount: float
    net_paid_amount: float
    platform_commission_amount: float
    partner_net_amount: float
    currency: str
    status: CommissionStatus
    computed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommissionComputeRequest(BaseModel):
    """Schéma pour demander le calcul d'une commission"""
    platform_commission_rate: float = Field(ge=0, le=100, description="Taux de commission de la plateforme en pourcentage")
    force_recompute: bool = False


class CommissionSummary(BaseModel):
    """Résumé des commissions"""
    partner_id: UUID
    total_gross_amount: float
    total_platform_commission: float
    total_partner_net_amount: float
    pending_commissions: float
    computed_commissions: float
    settled_commissions: float
    commission_records: List[CommissionRecordResponse] = []


class PartnerCommissionOverview(BaseModel):
    """Aperçu des commissions d'un partenaire"""
    partner_id: UUID
    partner_name: str
    total_orders: int
    total_gross_amount: float
    total_commission: float
    total_payout: float
    pending_payout: float
    last_settlement_date: Optional[datetime]
    commission_rate: float