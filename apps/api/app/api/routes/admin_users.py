from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User, UserStatus
from app.schemas.user_dashboard import UserDashboardResponse, UserDetailResponse, UserExportRequest, UserSecurityDetailResponse
from app.services.audit_service import AuditService
from app.services.users_dashboard_service import UsersDashboardService

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=UserDashboardResponse)
def get_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard(days=days)


@router.get("")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().users


@router.get("/activity")
def activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().recent_activity


@router.get("/security")
def security_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().security


@router.get("/loyalty")
def loyalty(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().loyalty


@router.get("/referrals")
def referrals(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = UsersDashboardService(db).get_dashboard()
    return {"acquisition_sources": dash.acquisition_sources, "top_users": dash.top_users}


@router.get("/orders")
def orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().top_users


@router.get("/payments")
def payments(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().value_users


@router.get("/segments")
def segments(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().segments


@router.get("/top-users")
def top_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().top_users


@router.get("/top-zones")
def top_zones(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().top_zones


@router.get("/watchlist")
def watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().watchlist


@router.get("/devices")
def devices(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return UsersDashboardService(db).get_dashboard().devices


@router.post("/export")
def export_users(
    payload: UserExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    users = UsersDashboardService(db).get_dashboard().users
    AuditService(db).log_event(user_id=current_user.id, action="export", resource_type="users", details={"format": payload.format, "count": len(users)})
    return {"filename": f"users_export.{payload.format}", "count": len(users), "format": payload.format}


@router.post("/suspend")
def suspend_user(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user_id = data.get("user_id")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    u.status = UserStatus.SUSPENDED
    db.commit()
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="users", resource_id=u.id, details={"action": "suspend"})
    return {"user_id": str(u.id), "status": "suspended"}


@router.post("/reactivate")
def reactivate_user(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user_id = data.get("user_id")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    u.status = UserStatus.ACTIVE
    db.commit()
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="users", resource_id=u.id, details={"action": "reactivate"})
    return {"user_id": str(u.id), "status": "active"}


@router.post("/reset-password")
def reset_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user_id = data.get("user_id")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    AuditService(db).log_event(user_id=current_user.id, action="password_change", resource_type="users", resource_id=u.id, details={"initiated_by": "admin"})
    return {"user_id": str(u.id), "status": "reset_email_sent"}


@router.post("/logout-all")
def logout_all(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user_id = data.get("user_id")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    AuditService(db).log_event(user_id=current_user.id, action="logout", resource_type="users", resource_id=u.id, details={"scope": "all_sessions"})
    return {"user_id": str(u.id), "sessions_revoked": True}


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(user_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = UsersDashboardService(db).get_user(user_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return detail


@router.get("/{user_id}/security", response_model=UserSecurityDetailResponse)
def get_user_security(user_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    sec = UsersDashboardService(db).get_security(user_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return sec
