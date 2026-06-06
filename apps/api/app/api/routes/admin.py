from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.admin import AuditLog
from app.models.dispute import Dispute, DisputeStatus
from app.models.logistics import Driver
from app.models.order import Order
from app.models.partner import Partner
from app.models.payment import RefundRequest, RefundStatus
from app.models.support import SupportTicket, TicketStatus
from app.models.user import User
from app.schemas.admin import AdminOverviewResponse, AdminActivityLogListResponse, AdminActivityLogResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Retourne une vue d'ensemble admin basée sur les données réelles."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    total_partners = db.query(func.count(Partner.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_drivers = db.query(func.count(Driver.id)).scalar() or 0

    orders_last_30_days = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= thirty_days_ago)
        .scalar()
        or 0
    )
    revenue_last_30_days = (
        db.query(func.coalesce(func.sum(Order.amount_paid), 0))
        .filter(Order.created_at >= thirty_days_ago)
        .scalar()
        or 0
    )

    open_disputes = (
        db.query(func.count(Dispute.id))
        .filter(Dispute.status.in_([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]))
        .scalar()
        or 0
    )
    open_tickets = (
        db.query(func.count(SupportTicket.id))
        .filter(SupportTicket.status.in_([TicketStatus.OPEN.value, TicketStatus.IN_PROGRESS.value]))
        .scalar()
        or 0
    )
    pending_refunds = (
        db.query(func.count(RefundRequest.id))
        .filter(
            RefundRequest.status.in_(
                [
                    RefundStatus.REQUESTED.value,
                    RefundStatus.UNDER_REVIEW.value,
                    RefundStatus.APPROVED.value,
                    RefundStatus.PROCESSING.value,
                ]
            )
        )
        .scalar()
        or 0
    )

    return AdminOverviewResponse(
        total_partners=total_partners,
        total_users=total_users,
        total_orders=total_orders,
        total_drivers=total_drivers,
        orders_last_30_days=orders_last_30_days,
        revenue_last_30_days=revenue_last_30_days,
        open_disputes=open_disputes,
        open_tickets=open_tickets,
        pending_refunds=pending_refunds,
    )


@router.get("/activity-logs", response_model=AdminActivityLogListResponse)
def get_admin_activity_logs(
    limit: int = 200,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Retourne les journaux d'activité admin disponibles en base."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    safe_limit = max(1, min(limit, 500))

    audit_service = AuditService(db)
    audit_service.log_event(
        user_id=current_user.id,
        action="read",
        resource_type="admin_activity_logs",
        details={"limit": safe_limit},
    )

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(safe_limit)
        .all()
    )

    total = db.query(func.count(AuditLog.id)).scalar() or 0

    user_ids = [log.user_id for log in logs if log.user_id]
    user_lookup = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_lookup = {str(user.id): user.name for user in users}

    response_logs = [
        AdminActivityLogResponse(
            id=str(log.id),
            user_id=str(log.user_id) if log.user_id else None,
            user_name=user_lookup.get(str(log.user_id), "System"),
            action=log.action,
            resource_type=log.resource_type,
            resource_id=str(log.resource_id) if log.resource_id else None,
            details=log.details,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            created_at=str(log.created_at),
            updated_at=str(log.updated_at),
        )
        for log in logs
    ]

    return AdminActivityLogListResponse(
        logs=response_logs,
        total=total,
        limit=safe_limit,
    )
