from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_sync_db, get_current_user, is_admin_user
from app.models.payment import RefundRequest
from app.models.user import User, UserRole
from app.schemas.refund import (
    RefundRequestCreate,
    RefundRequestApprove,
    RefundRequestReject,
    RefundRequestResponse,
    RefundTransactionResponse,
    RefundSummary,
)
from app.services.payment_service import PaymentService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("/requests", response_model=RefundRequestResponse, status_code=status.HTTP_201_CREATED)
def create_refund_request(
    data: RefundRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Créer une demande de remboursement"""
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les clients peuvent créer des demandes de remboursement"
        )

    payment_service = PaymentService(db)
    try:
        refund_request = payment_service.create_refund_request(data, current_user.id)
        return refund_request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/requests/{request_id}/approve", response_model=RefundRequestResponse)
def approve_refund_request(
    request_id: UUID,
    data: RefundRequestApprove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Approuver une demande de remboursement (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent approuver les demandes de remboursement"
        )

    payment_service = PaymentService(db)
    audit_service = AuditService(db)
    try:
        refund_request = payment_service.approve_refund_request(request_id, current_user.id, data)
        audit_service.log_event(
            user_id=current_user.id,
            action="approve",
            resource_type="refund_request",
            resource_id=refund_request.id,
            details={
                "approved_amount": data.approved_amount,
                "notes": data.notes,
            },
        )
        return refund_request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/requests/{request_id}/reject", response_model=RefundRequestResponse)
def reject_refund_request(
    request_id: UUID,
    data: RefundRequestReject,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Rejeter une demande de remboursement (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent rejeter les demandes de remboursement"
        )

    payment_service = PaymentService(db)
    audit_service = AuditService(db)
    try:
        refund_request = payment_service.reject_refund_request(request_id, current_user.id, data)
        audit_service.log_event(
            user_id=current_user.id,
            action="reject",
            resource_type="refund_request",
            resource_id=refund_request.id,
            details={
                "reason": data.reason,
                "notes": data.notes,
            },
        )
        return refund_request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/requests/{request_id}/process", response_model=RefundTransactionResponse)
def process_refund(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Traiter un remboursement approuvé (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent traiter les remboursements"
        )

    payment_service = PaymentService(db)
    audit_service = AuditService(db)
    try:
        transaction = payment_service.process_refund(request_id)
        audit_service.log_event(
            user_id=current_user.id,
            action="process",
            resource_type="refund_request",
            resource_id=request_id,
            details={
                "refund_transaction_id": str(transaction.id),
            },
        )
        return transaction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/requests/{request_id}", response_model=RefundRequestResponse)
def get_refund_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir une demande de remboursement par son ID"""
    payment_service = PaymentService(db)
    try:
        refund_request = payment_service.refund_repo.get_by_id(request_id)
        if not refund_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demande de remboursement non trouvée"
            )
        
        # Vérifier les permissions
        if not is_admin_user(current_user) and str(refund_request.customer_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette demande de remboursement"
            )
        
        return refund_request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}/requests", response_model=List[RefundRequestResponse])
def get_refund_requests_for_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir les demandes de remboursement pour une commande"""
    payment_service = PaymentService(db)
    try:
        refund_requests = payment_service.refund_repo.get_requests_for_order(order_id)
        
        # Vérifier les permissions
        if refund_requests:
            first_request = refund_requests[0]
            if not is_admin_user(current_user) and str(first_request.customer_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'avez pas accès à ces demandes de remboursement"
                )
        
        return refund_requests
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/summary", response_model=RefundSummary)
def get_refund_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un résumé des remboursements (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent voir le résumé des remboursements"
        )

    payment_service = PaymentService(db)
    try:
        # Calculer les statistiques
        from datetime import datetime, timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        stats = payment_service.refund_repo.get_refund_stats_for_period(start_date, end_date)
        
        return RefundSummary(
            total_requested=stats.get("total_requested_amount", 0),
            total_approved=stats.get("total_approved_amount", 0),
            total_processed=stats.get("total_refunded", 0),
            pending_requests=stats.get("created_requests", 0) - stats.get("approved_requests", 0),
            approved_requests=stats.get("approved_requests", 0),
            completed_refunds=stats.get("completed_requests", 0),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/requests", response_model=List[RefundRequestResponse])
def list_refund_requests(
    refund_status: str = None,
    customer_id: UUID = None,
    order_id: UUID = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Lister les demandes de remboursement (admin seulement)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent lister toutes les demandes de remboursement"
        )

    payment_service = PaymentService(db)
    try:
        query = (
            db.query(RefundRequest)
            .options(
                joinedload(RefundRequest.order),
                joinedload(RefundRequest.customer),
                joinedload(RefundRequest.refund_transactions),
            )
        )
        
        if refund_status:
            query = query.filter(RefundRequest.status == refund_status)
        
        if customer_id:
            query = query.filter(RefundRequest.customer_id == customer_id)
        
        if order_id:
            query = query.filter(RefundRequest.order_id == order_id)
        
        requests = query.order_by(RefundRequest.created_at.desc()).limit(limit).all()
        return requests
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
