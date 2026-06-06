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
from app.schemas.dispute import (
    DisputeCreate,
    DisputeResolveRequest,
    DisputeResponse,
    DisputeSummary,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/disputes", tags=["disputes"])


@router.post("", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def create_dispute(
    data: DisputeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Créer un litige"""
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les clients peuvent créer des litiges"
        )

    payment_service = PaymentService(db)
    try:
        dispute = payment_service.create_dispute(data, current_user.id)
        return dispute
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute(
    dispute_id: UUID,
    data: DisputeResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Résoudre un litige (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent résoudre les litiges"
        )

    payment_service = PaymentService(db)
    try:
        dispute = payment_service.resolve_dispute(dispute_id, current_user.id, data)
        return dispute
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{dispute_id}/reject", response_model=DisputeResponse)
def reject_dispute(
    dispute_id: UUID,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Rejeter un litige (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent rejeter les litiges"
        )

    payment_service = PaymentService(db)
    try:
        dispute = payment_service.reject_dispute(dispute_id, current_user.id, reason)
        return dispute
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}", response_model=List[DisputeResponse])
def get_disputes_for_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir les litiges pour une commande"""
    payment_service = PaymentService(db)
    try:
        disputes = payment_service.dispute_repo.get_disputes_for_order(order_id)
        
        # Vérifier les permissions
        if disputes:
            first_dispute = disputes[0]
            if not is_admin_user(current_user) and str(first_dispute.customer_id) != str(current_user.id):
                if not (
                    is_partner_user(current_user)
                    and user_has_partner_access_sync(db, current_user, first_dispute.partner_id)
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Vous n'avez pas accès à ces litiges"
                    )
        
        return disputes
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/summary", response_model=DisputeSummary)
def get_dispute_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un résumé des litiges (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent voir le résumé des litiges"
        )

    payment_service = PaymentService(db)
    try:
        summary = payment_service.dispute_repo.get_dispute_summary()
        
        return DisputeSummary(
            total_disputes=summary["total_disputes"],
            open_disputes=summary["open_disputes"],
            under_review=summary["under_review"],
            resolved_disputes=summary["resolved_disputes"],
            average_resolution_time_hours=None,  # À calculer si nécessaire
            by_category=summary["by_category"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[DisputeResponse])
def list_disputes(
    status: str = None,
    customer_id: UUID = None,
    partner_id: UUID = None,
    order_id: UUID = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Lister les litiges"""
    payment_service = PaymentService(db)
    try:
        query = payment_service.dispute_repo.db.query(payment_service.dispute_repo.model)
        
        # Filtres
        if status:
            query = query.filter(payment_service.dispute_repo.model.status == status)
        
        if customer_id:
            query = query.filter(payment_service.dispute_repo.model.customer_id == customer_id)
        
        if partner_id:
            query = query.filter(payment_service.dispute_repo.model.partner_id == partner_id)
        
        if order_id:
            query = query.filter(payment_service.dispute_repo.model.order_id == order_id)
        
        # Permissions
        if current_user.role == UserRole.CUSTOMER:
            query = query.filter(payment_service.dispute_repo.model.customer_id == current_user.id)
        elif is_partner_user(current_user):
            partner_ids = list(get_user_partner_ids_sync(db, current_user.id))
            if not partner_ids:
                return []
            query = query.filter(payment_service.dispute_repo.model.partner_id.in_(partner_ids))
        # Admin peut voir tout
        
        disputes = query.order_by(payment_service.dispute_repo.model.created_at.desc()).limit(limit).all()
        return disputes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/open", response_model=List[DisputeResponse])
def get_open_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir les litiges ouverts"""
    payment_service = PaymentService(db)
    try:
        if current_user.role == UserRole.CUSTOMER:
            disputes = payment_service.dispute_repo.get_open_disputes()
            disputes = [d for d in disputes if str(d.customer_id) == str(current_user.id)]
        elif is_partner_user(current_user):
            disputes = payment_service.dispute_repo.get_open_disputes()
            partner_ids = get_user_partner_ids_sync(db, current_user.id)
            disputes = [d for d in disputes if d.partner_id in partner_ids]
        elif is_admin_user(current_user):
            disputes = payment_service.dispute_repo.get_open_disputes()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès aux litiges"
            )
        
        return disputes
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(
    dispute_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un litige par son ID"""
    payment_service = PaymentService(db)
    try:
        dispute = payment_service.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Litige non trouvé"
            )

        # Vérifier les permissions
        if not is_admin_user(current_user) and str(dispute.customer_id) != str(current_user.id):
            if not (
                is_partner_user(current_user)
                and user_has_partner_access_sync(db, current_user, dispute.partner_id)
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'avez pas accès à ce litige"
                )

        return dispute
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
