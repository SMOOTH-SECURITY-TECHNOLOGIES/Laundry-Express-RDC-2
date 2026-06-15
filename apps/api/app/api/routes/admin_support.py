from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.support import SupportMessage, SupportTicket
from app.models.user import User
from app.schemas.support_dashboard import (
    SupportDashboardResponse, TicketAssignRequest, TicketCreateRequest,
    TicketDetailResponse, TicketReplyRequest, TicketUpdateRequest, SupportExportRequest,
)
from app.services.audit_service import AuditService
from app.services.support_dashboard_service import SupportDashboardService

router = APIRouter(prefix="/admin/support", tags=["admin-support"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=SupportDashboardResponse)
def get_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard(days=days)


@router.get("/tickets")
def list_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().tickets


@router.get("/sla")
def sla(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().sla


@router.get("/agents")
def agents(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().agents


@router.get("/top-issues")
def top_issues(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().top_issues


@router.get("/sentiment")
def sentiment(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().sentiment


@router.get("/ai-triage")
def ai_triage(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SupportDashboardService(db).get_dashboard().ai_triage


@router.post("/export")
def export_support(
    payload: SupportExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    tickets = SupportDashboardService(db).get_dashboard().tickets
    AuditService(db).log_event(user_id=current_user.id, action="export", resource_type="support_tickets", details={"format": payload.format, "count": len(tickets)})
    db.commit()
    return {"filename": f"support_export.{payload.format}", "count": len(tickets), "format": payload.format}


@router.post("/tickets")
def create_ticket(
    payload: TicketCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user_id = payload.user_id or current_user.id
    ticket = SupportTicket(
        user_id=user_id,
        title=payload.title,
        description=f"[NEW|{payload.channel}] {payload.description}",
        status="new",
        priority=payload.priority if payload.priority != "critical" else "urgent",
        category=payload.category,
    )
    db.add(ticket)
    db.flush()
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="support_tickets", resource_id=ticket.id)
    db.commit()
    return {"id": str(ticket.id), "title": ticket.title}


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(ticket_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = SupportDashboardService(db).get_ticket(ticket_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return detail


@router.patch("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    payload: TicketUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    if payload.status:
        t.status = payload.status
    if payload.priority:
        t.priority = payload.priority if payload.priority != "critical" else "urgent"
    if payload.assigned_to:
        t.assigned_to = payload.assigned_to
    if payload.category:
        t.category = payload.category
    db.commit()
    return {"id": str(t.id), "status": t.status}


@router.post("/tickets/{ticket_id}/reply")
def reply_ticket(
    ticket_id: str,
    payload: TicketReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    msg = SupportMessage(ticket_id=t.id, user_id=current_user.id, content=payload.content, is_internal=payload.is_internal)
    db.add(msg)
    if t.status in ("new", "open"):
        t.status = "in_progress"
    db.commit()
    return {"ticket_id": str(t.id), "message_id": str(msg.id)}


@router.post("/tickets/{ticket_id}/assign")
def assign_ticket(
    ticket_id: str,
    payload: TicketAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    t.assigned_to = payload.agent_id
    t.status = "in_progress"
    db.commit()
    return {"ticket_id": str(t.id), "assigned_to": payload.agent_id}


@router.post("/tickets/{ticket_id}/escalate")
def escalate_ticket(ticket_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    t.status = "escalated"
    t.priority = "urgent"
    db.commit()
    return {"ticket_id": str(t.id), "status": "escalated"}


@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    t.status = "resolved"
    db.commit()
    return {"ticket_id": str(t.id), "status": "resolved"}
