from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.admin_management_dashboard import (
    AdminInvitationCreate,
    AdminManagementDashboardResponse,
    AdminUserCreate,
)
from app.services.admin_management_dashboard_service import AdminManagementDashboardService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin/management", tags=["admin-management"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=AdminManagementDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard()


@router.get("/admins")
def list_admins(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard().admins


@router.post("/admins")
def create_admin(payload: AdminUserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="admin_management_users", details={"email": payload.email, "role": payload.role_slug})
    return {"status": "queued", "email": payload.email, "role_slug": payload.role_slug}


@router.get("/roles")
def list_roles(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = AdminManagementDashboardService(db).get_dashboard()
    return {"roles": dash.roles, "rbac_matrix": dash.rbac_matrix, "rbac_resources": dash.rbac_resources}


@router.post("/roles")
def create_role(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "slug": payload.get("slug")}


@router.get("/permissions")
def list_permissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = AdminManagementDashboardService(db).get_dashboard()
    return {"rbac_matrix": dash.rbac_matrix, "rbac_resources": dash.rbac_resources}


@router.get("/invitations")
def list_invitations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard().invitations


@router.post("/invitations")
def create_invitation(payload: AdminInvitationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="admin_invitations", details={"email": payload.email, "role": payload.role_slug})
    return {"status": "sent", "email": payload.email}


@router.get("/sessions")
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard().sessions


@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="delete", resource_type="admin_sessions", resource_id=session_id, details={"action": "revoke"})
    return {"id": session_id, "status": "revoked"}


@router.get("/audit")
def get_audit(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard().audit_logs


@router.get("/activity")
def get_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return AdminManagementDashboardService(db).get_dashboard().activity_logs
