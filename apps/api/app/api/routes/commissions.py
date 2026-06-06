from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_sync_db,
    get_current_user,
    get_user_partner_ids_sync,
    is_admin_user,
    is_partner_user,
    user_has_partner_access_sync,
)
from app.models.user import User, UserRole
from app.models.partner import Partner
from app.schemas.commission import (
    CommissionRecordResponse,
    CommissionComputeRequest,
    CommissionSummary,
    PartnerCommissionOverview,
)
from app.services.payment_service import PaymentService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/commissions", tags=["commissions"])


@router.post("/recompute/{order_id}", response_model=CommissionRecordResponse)
def recompute_commission(
    order_id: UUID,
    data: CommissionComputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Recalculer la commission pour une commande (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent recalculer les commissions"
        )

    payment_service = PaymentService(db)
    audit_service = AuditService(db)
    try:
        commission = payment_service.compute_commission(order_id, data)
        audit_service.log_event(
            user_id=current_user.id,
            action="recompute",
            resource_type="commission",
            resource_id=commission.id,
            details={
                "order_id": str(order_id),
                "platform_commission_rate": data.platform_commission_rate,
                "force_recompute": data.force_recompute,
            },
        )
        return commission
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{commission_id}/settle", response_model=CommissionRecordResponse)
def settle_commission(
    commission_id: UUID,
    settlement_notes: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Marquer une commission comme réglée (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent régler les commissions"
        )

    payment_service = PaymentService(db)
    audit_service = AuditService(db)
    try:
        commission = payment_service.settle_commission(commission_id, settlement_notes)
        audit_service.log_event(
            user_id=current_user.id,
            action="settle",
            resource_type="commission",
            resource_id=commission.id,
            details={
                "settlement_notes": settlement_notes,
            },
        )
        return commission
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}", response_model=CommissionRecordResponse)
def get_commission_for_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir la commission pour une commande"""
    payment_service = PaymentService(db)
    try:
        commission = payment_service.commission_repo.get_commission_for_order(order_id)
        if not commission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commission non trouvée pour cette commande"
            )
        
        # Vérifier les permissions
        if not user_has_partner_access_sync(db, current_user, commission.partner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette commission"
            )
        
        return commission
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/partners/{partner_id}/summary", response_model=CommissionSummary)
def get_commission_summary_for_partner(
    partner_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un résumé des commissions pour un partenaire"""
    # Vérifier les permissions
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce résumé de commissions"
        )

    payment_service = PaymentService(db)
    try:
        summary = payment_service.commission_repo.get_commission_summary_for_partner(partner_id)
        
        # Récupérer les enregistrements de commission
        commission_records = payment_service.commission_repo.get_commissions_for_partner(partner_id, limit=20)
        
        return CommissionSummary(
            partner_id=partner_id,
            total_gross_amount=summary["total_gross_amount"],
            total_platform_commission=summary["total_platform_commission"],
            total_partner_net_amount=summary["total_partner_net_amount"],
            pending_commissions=summary["pending_amount"],
            computed_commissions=summary["computed_amount"],
            settled_commissions=summary["settled_amount"],
            commission_records=commission_records,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/partners/{partner_id}/overview", response_model=PartnerCommissionOverview)
def get_partner_commission_overview(
    partner_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un aperçu des commissions d'un partenaire"""
    # Vérifier les permissions
    if not user_has_partner_access_sync(db, current_user, partner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cet aperçu de commissions"
        )

    payment_service = PaymentService(db)
    try:
        summary = payment_service.commission_repo.get_commission_summary_for_partner(partner_id)
        
        # Récupérer les informations du partenaire
        partner = db.query(Partner).filter(Partner.id == partner_id).first()
        
        if not partner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partenaire non trouvé"
            )
        
        # Calculer le taux de commission moyen
        avg_commission_rate = 0
        if summary["total_gross_amount"] > 0:
            avg_commission_rate = (summary["total_platform_commission"] / summary["total_gross_amount"]) * 100
        
        # Dernière date de règlement
        settled_commissions = payment_service.commission_repo.get_settled_commissions_for_partner(partner_id)
        last_settlement_date = None
        if settled_commissions:
            last_settlement_date = settled_commissions[0].updated_at
        
        return PartnerCommissionOverview(
            partner_id=partner_id,
            partner_name=partner.name or partner.email,
            total_orders=summary["total_orders"],
            total_gross_amount=summary["total_gross_amount"],
            total_commission=summary["total_platform_commission"],
            total_payout=summary["settled_amount"],
            pending_payout=summary["computed_amount"],
            last_settlement_date=last_settlement_date,
            commission_rate=avg_commission_rate,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[CommissionRecordResponse])
def list_commissions(
    partner_id: UUID = None,
    status: str = None,
    order_id: UUID = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Lister les commissions"""
    payment_service = PaymentService(db)
    try:
        query = payment_service.commission_repo.db.query(payment_service.commission_repo.model)
        
        # Filtres
        if partner_id:
            query = query.filter(payment_service.commission_repo.model.partner_id == partner_id)
        
        if status:
            query = query.filter(payment_service.commission_repo.model.status == status)
        
        if order_id:
            query = query.filter(payment_service.commission_repo.model.order_id == order_id)
        
        # Permissions
        if is_partner_user(current_user):
            partner_ids = list(get_user_partner_ids_sync(db, current_user.id))
            if not partner_ids:
                return []
            query = query.filter(payment_service.commission_repo.model.partner_id.in_(partner_ids))
        # Admin peut voir tout
        
        commissions = query.order_by(payment_service.commission_repo.model.created_at.desc()).limit(limit).all()
        return commissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/pending", response_model=List[CommissionRecordResponse])
def get_pending_commissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir les commissions en attente (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent voir les commissions en attente"
        )

    payment_service = PaymentService(db)
    try:
        commissions = payment_service.commission_repo.get_pending_commissions()
        return commissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/computed", response_model=List[CommissionRecordResponse])
def get_computed_commissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir les commissions calculées (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent voir les commissions calculées"
        )

    payment_service = PaymentService(db)
    try:
        commissions = payment_service.commission_repo.get_computed_commissions()
        return commissions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{commission_id}", response_model=CommissionRecordResponse)
def get_commission(
    commission_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir une commission par son ID"""
    payment_service = PaymentService(db)
    try:
        commission = payment_service.commission_repo.get_by_id(commission_id)
        if not commission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commission non trouvée"
            )
        
        # Vérifier les permissions
        if not user_has_partner_access_sync(db, current_user, commission.partner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette commission"
            )
        
        return commission
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
