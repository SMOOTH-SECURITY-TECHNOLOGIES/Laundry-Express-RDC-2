from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.claim_dashboard import (
    ClaimAssignRequest, ClaimAttachmentRequest, ClaimCreateRequest,
    ClaimDashboardResponse, ClaimDetailResponse, ClaimNoteRequest,
    ClaimRefundActionRequest, ClaimStatusRequest,
)
from app.services.audit_service import AuditService
from app.services.claims_dashboard_service import ClaimsDashboardService
from app.services.claims_service import ClaimsService

router = APIRouter(prefix="/admin/claims", tags=["admin-claims"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=ClaimDashboardResponse)
def get_dashboard(days: int = Query(default=7, ge=1, le=365), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ClaimsDashboardService(db).get_dashboard(days=days)


@router.get("")
def list_claims(
    status: str | None = None,
    priority: str | None = None,
    type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    dash = ClaimsDashboardService(db).get_dashboard()
    claims = dash.claims
    if status:
        claims = [c for c in claims if c.status == status]
    if priority:
        claims = [c for c in claims if c.priority == priority]
    if type:
        claims = [c for c in claims if c.category == type]
    return claims


@router.post("")
def create_claim(payload: ClaimCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    claim = ClaimsService(db).create_claim(payload.model_dump(), current_user.id)
    return {"id": str(claim.id), "claim_number": claim.claim_number}


@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def get_claim(claim_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = ClaimsDashboardService(db).get_claim(claim_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")
    return detail


@router.post("/{claim_id}/status")
def update_status(claim_id: str, payload: ClaimStatusRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        claim = ClaimsService(db).update_status(UUID(claim_id), payload.status, current_user.id, payload.note)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="claims", details={"claim_id": claim_id, "status": payload.status})
    db.commit()
    return {"id": str(claim.id), "status": claim.status}


@router.post("/{claim_id}/assign")
def assign_claim(claim_id: str, payload: ClaimAssignRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        claim = ClaimsService(db).assign(UUID(claim_id), UUID(payload.assignee_id), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(claim.id), "assigned_to": str(claim.assigned_to)}


@router.post("/{claim_id}/notes")
def add_note(claim_id: str, payload: ClaimNoteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    note = ClaimsService(db).add_note(UUID(claim_id), current_user.id, payload.content, payload.is_internal)
    return {"id": str(note.id)}


@router.post("/{claim_id}/attachments")
def add_attachment(claim_id: str, payload: ClaimAttachmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    att = ClaimsService(db).add_attachment(UUID(claim_id), current_user.id, payload.file_url, payload.mime_type, payload.size)
    return {"id": str(att.id), "file_url": att.file_url}


@router.post("/{claim_id}/escalate")
def escalate_claim(claim_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        claim = ClaimsService(db).escalate(UUID(claim_id), current_user.id, "Escalade manuelle")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(claim.id), "status": claim.status}


@router.post("/{claim_id}/refund")
def refund_action(claim_id: str, payload: ClaimRefundActionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    refund = ClaimsService(db).process_refund(UUID(claim_id), payload.action, current_user.id, payload.amount)
    return {"id": str(refund.id), "status": refund.status}
