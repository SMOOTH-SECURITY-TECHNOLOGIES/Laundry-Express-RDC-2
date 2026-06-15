from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.notifications_dashboard import (
    NotificationAutomationPatchRequest, NotificationExportRequest,
    NotificationsDashboardResponse, NotificationSendRequest,
    NotificationTemplateCreateRequest, NotificationTemplateUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.notifications_dashboard_service import NotificationsDashboardService
from app.services.notifications_ops_service import NotificationsOpsService

router = APIRouter(prefix="/admin/notifications", tags=["admin-notifications"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=NotificationsDashboardResponse)
def get_dashboard(days: int = Query(default=30, ge=1, le=365), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard(days=days)


@router.get("/channels/performance")
def channel_performance(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().channel_performance


@router.get("/errors")
def list_errors(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().errors


@router.get("/unsubscribes")
def list_unsubscribes(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().unsubscribes


@router.get("/segments")
def list_segments(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().segments


@router.get("/templates")
def list_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().templates


@router.post("/templates")
def create_template(payload: NotificationTemplateCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    tpl = NotificationsOpsService(db).create_template(payload.model_dump())
    return {"id": str(tpl.id), "name": tpl.name}


@router.put("/templates/{template_id}")
def update_template(template_id: str, payload: NotificationTemplateUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    tpl = NotificationsOpsService(db).update_template(UUID(template_id), payload.model_dump(exclude_none=True))
    if not tpl:
        raise HTTPException(status_code=404, detail="Template introuvable")
    return {"id": str(tpl.id), "status": tpl.status}


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    if not NotificationsOpsService(db).archive_template(UUID(template_id)):
        raise HTTPException(status_code=404, detail="Template introuvable")
    return {"ok": True}


@router.get("/automations")
def list_automations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().automations


@router.post("/automations")
def create_automation(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    raise HTTPException(status_code=501, detail="Création automatisation — bientôt disponible")


@router.patch("/automations/{automation_id}")
def patch_automation(automation_id: str, payload: NotificationAutomationPatchRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    auto = NotificationsOpsService(db).patch_automation(UUID(automation_id), payload.model_dump(exclude_none=True))
    if not auto:
        raise HTTPException(status_code=404, detail="Automatisation introuvable")
    return {"id": str(auto.id), "status": auto.status}


@router.post("/send")
def send_notification(payload: NotificationSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    item = NotificationsOpsService(db).create_notification(payload.model_dump(), current_user.id)
    AuditService(db).log_event(user_id=current_user.id, action="send", resource_type="notification_ops", details={"id": str(item.id)})
    db.commit()
    return {"id": str(item.id), "status": item.status}


@router.post("/schedule")
def schedule_notification(payload: NotificationSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    data = payload.model_dump()
    data["schedule_at"] = data.get("schedule_at") or "scheduled"
    item = NotificationsOpsService(db).create_notification(data, current_user.id)
    return {"id": str(item.id), "status": item.status}


@router.post("/retry")
def retry_notification(notification_id: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        item = NotificationsOpsService(db).retry_notification(UUID(notification_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="ID invalide")
    if not item:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return {"id": str(item.id), "status": item.status}


@router.post("/export")
def export_notifications(payload: NotificationExportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = NotificationsDashboardService(db).get_dashboard()
    return {"format": payload.format, "rows": len(dash.notifications), "exported_at": dash.kpis.total_sent}


@router.get("")
def list_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return NotificationsDashboardService(db).get_dashboard().notifications


@router.get("/{notification_id}")
def get_notification(notification_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = NotificationsDashboardService(db).get_notification(notification_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return detail
