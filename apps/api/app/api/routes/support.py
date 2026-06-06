from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.support import SupportTicket
from app.models.user import User
from app.schemas.support import SupportTicketResponse

router = APIRouter(prefix="/support", tags=["support"])


def _build_support_ticket_response(ticket: SupportTicket, db: Session) -> SupportTicketResponse:
    user = db.query(User).filter(User.id == ticket.user_id).first()
    return SupportTicketResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        user_name=getattr(user, "name", None),
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        subcategory=ticket.subcategory,
        assigned_to=ticket.assigned_to,
        response_time_minutes=ticket.response_time_minutes,
        resolution_time_minutes=ticket.resolution_time_minutes,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        messages=ticket.messages,
    )


@router.get("/tickets", response_model=list[SupportTicketResponse])
def list_support_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    tickets = (
        db.query(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .order_by(SupportTicket.updated_at.desc())
        .limit(200)
        .all()
    )
    return [_build_support_ticket_response(ticket, db) for ticket in tickets]

