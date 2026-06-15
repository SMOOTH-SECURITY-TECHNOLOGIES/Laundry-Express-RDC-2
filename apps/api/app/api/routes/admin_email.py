from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.email_dashboard import (
    EmailCampaignCreate, EmailDashboardResponse, EmailExportRequest,
    EmailSendRequest, EmailTemplateCreate,
)
from app.services.email_dashboard_service import EmailDashboardService

router = APIRouter(prefix="/admin/email", tags=["admin-email"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=EmailDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard()


@router.get("/messages")
def get_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().messages


@router.get("/messages/{msg_id}")
def get_message(msg_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    msg = EmailDashboardService(db).get_message(msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Email introuvable")
    return msg


@router.post("/send")
def send_email(payload: EmailSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "queued", "to_email": payload.to_email}


@router.post("/retry")
def retry_email(reference: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "retrying", "reference": reference}


@router.get("/templates")
def get_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().templates


@router.post("/templates")
def create_template(payload: EmailTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name}


@router.put("/templates/{template_id}")
def update_template(template_id: str, payload: EmailTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "updated"}


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "deleted"}


@router.post("/templates/{template_id}/test")
def test_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"template_id": template_id, "status": "test_sent"}


@router.get("/campaigns")
def get_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().campaigns


@router.post("/campaigns")
def create_campaign(payload: EmailCampaignCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name}


@router.patch("/campaigns/{campaign_id}")
def update_campaign(campaign_id: str, payload: EmailCampaignCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": campaign_id, "status": "updated"}


@router.get("/automations")
def get_automations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().automations


@router.post("/automations")
def create_automation(name: str, trigger_key: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"name": name, "trigger_key": trigger_key, "status": "created"}


@router.patch("/automations/{automation_id}")
def update_automation(automation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": automation_id, "status": "updated"}


@router.get("/deliverability")
def get_deliverability(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().deliverability


@router.get("/bounces")
def get_bounces(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().bounces


@router.get("/unsubscribes")
def get_unsubscribes(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = EmailDashboardService(db).get_dashboard()
    return {"summary": dash.unsubscribe_summary, "items": dash.unsubscribes}


@router.get("/invoices")
def get_invoices(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = EmailDashboardService(db).get_dashboard()
    return {"summary": dash.invoice_summary, "items": dash.invoices}


@router.get("/webhooks")
def get_webhooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().webhooks


@router.post("/webhooks/test")
def test_webhook(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "ok", "response_ms": 120}


@router.post("/webhooks/replay")
def replay_webhook(event: str = "email.delivered", current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"event": event, "status": "replayed"}


@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return EmailDashboardService(db).get_dashboard().analytics


@router.post("/export")
def export_data(payload: EmailExportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = EmailDashboardService(db).get_dashboard()
    return {"format": payload.format, "rows": len(dash.messages), "sent_today": dash.kpis.sent_today}
