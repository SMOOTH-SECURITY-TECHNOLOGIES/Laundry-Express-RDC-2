from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.rbac_dashboard import (
    RbacDashboardResponse,
    RbacPermissionCreate,
    RbacRoleCreate,
    RbacRoleUpdate,
    RbacUserPermissionsUpdate,
)
from app.services.audit_service import AuditService
from app.services.rbac_dashboard_service import RbacDashboardService

router = APIRouter(prefix="/admin", tags=["admin-rbac"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/rbac/dashboard", response_model=RbacDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return RbacDashboardService(db).get_dashboard()


@router.get("/roles")
def list_roles(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return RbacDashboardService(db).get_dashboard().roles


@router.post("/roles")
def create_role(payload: RbacRoleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="rbac_role", details={"slug": payload.slug})
    return {"status": "queued", "slug": payload.slug, "name": payload.name}


@router.put("/roles/{role_id}")
def update_role(role_id: str, payload: RbacRoleUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="rbac_role", resource_id=role_id, details=payload.model_dump(exclude_none=True))
    return {"id": role_id, "status": "updated"}


@router.delete("/roles/{role_id}")
def delete_role(role_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="delete", resource_type="rbac_role", resource_id=role_id)
    return {"id": role_id, "status": "archived"}


@router.get("/permissions")
def list_permissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = RbacDashboardService(db).get_dashboard()
    return {"permissions": dash.permissions, "matrix": dash.matrix, "matrix_modules": dash.matrix_modules}


@router.post("/permissions")
def create_permission(payload: RbacPermissionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="rbac_permission", details={"slug": payload.slug})
    return {"status": "queued", "slug": payload.slug}


@router.get("/users/permissions")
def list_user_permissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = RbacDashboardService(db).get_dashboard()
    return {"assignments": dash.user_assignments, "overrides": dash.user_overrides, "temporary": dash.temporary_permissions}


@router.put("/users/{user_id}/permissions")
def update_user_permissions(user_id: str, payload: RbacUserPermissionsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="rbac_user_permissions", resource_id=user_id, details=payload.model_dump())
    return {"id": user_id, "status": "updated"}


@router.get("/permission-audit")
def get_permission_audit(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = RbacDashboardService(db).get_dashboard()
    return {"audit_logs": dash.audit_logs, "history": dash.history, "risk_alerts": dash.risk_alerts}
