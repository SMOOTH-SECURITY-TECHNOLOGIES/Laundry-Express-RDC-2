from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.sms_dashboard import (
    LogDetail, MessageDetail, SmsBulkSendRequest, SmsCampaignCreate, SmsDashboardResponse,
    SmsExportRequest, SmsRechargeRequest, SmsSendRequest, SmsTemplateCreate,
)
from app.services.sms_dashboard_service import SmsDashboardService

router = APIRouter(prefix="/admin/sms", tags=["admin-sms"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=SmsDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard()


@router.get("/messages")
def get_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().messages


@router.get("/messages/{msg_id}", response_model=MessageDetail)
def get_message(msg_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = SmsDashboardService(db).get_message(msg_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return detail


@router.post("/send")
def send_sms(payload: SmsSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "queued", "phone_number": payload.phone_number, "message_type": payload.message_type}


@router.post("/send-bulk")
def send_bulk(payload: SmsBulkSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "queued", "count": len(payload.phones)}


@router.get("/campaigns")
def get_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().campaigns


@router.post("/campaigns")
def create_campaign(payload: SmsCampaignCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name}


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    campaigns = SmsDashboardService(db).get_dashboard().campaigns
    c = next((x for x in campaigns if x.id == campaign_id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    return c


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: str, payload: SmsCampaignCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": campaign_id, "status": "updated"}


@router.get("/templates")
def get_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().templates


@router.post("/templates")
def create_template(payload: SmsTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name}


@router.put("/templates/{template_id}")
def update_template(template_id: str, payload: SmsTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "updated"}


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "deleted"}


@router.get("/senders")
def get_senders(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().senders


@router.post("/senders")
def create_sender(name: str = Query(...), sender_id: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"name": name, "sender_id": sender_id, "status": "pending"}


@router.get("/credits")
def get_credits(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = SmsDashboardService(db).get_dashboard()
    return {"credits": dash.credits, "ledger": dash.credit_ledger}


@router.post("/recharge")
def recharge(payload: SmsRechargeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "recharged", "amount": payload.amount}


@router.get("/logs")
def get_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().logs


@router.get("/logs/{log_id}", response_model=LogDetail)
def get_log(log_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = SmsDashboardService(db).get_log(log_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Log introuvable")
    return detail


@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().analytics


@router.get("/providers")
def get_providers(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return SmsDashboardService(db).get_dashboard().operator_performance


@router.post("/webhooks/provider")
def provider_webhook(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "ok"}


@router.post("/export")
def export_data(payload: SmsExportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = SmsDashboardService(db).get_dashboard()
    return {"format": payload.format, "rows": len(dash.messages), "sent_today": dash.kpis.sent_today}
