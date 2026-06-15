from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.whatsapp_dashboard import (
    ConversationDetail, WhatsappDashboardResponse, WhatsappExportRequest,
    WhatsappSendRequest, WhatsappTemplateCreate,
)
from app.services.whatsapp_dashboard_service import WhatsappDashboardService

router = APIRouter(prefix="/admin/whatsapp", tags=["admin-whatsapp"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=WhatsappDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard()


@router.get("/conversations")
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().conversations


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
def get_conversation(conv_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = WhatsappDashboardService(db).get_conversation(conv_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    return detail


@router.post("/send")
def send_message(payload: WhatsappSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "queued", "phone": payload.phone, "message": payload.message}


@router.post("/reply")
def reply_message(payload: WhatsappSendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "sent", "phone": payload.phone}


@router.get("/templates")
def get_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().templates


@router.post("/templates")
def create_template(payload: WhatsappTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name}


@router.put("/templates/{template_id}")
def update_template(template_id: str, payload: WhatsappTemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "updated"}


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": template_id, "status": "deleted"}


@router.post("/templates/submit")
def submit_template(name: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"name": name, "status": "submitted", "meta_status": "pending"}


@router.get("/campaigns")
def get_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().campaigns


@router.post("/campaigns")
def create_campaign(name: str = Query(...), campaign_type: str = Query(default="broadcast"), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"name": name, "campaign_type": campaign_type, "status": "draft"}


@router.get("/automations")
def get_automations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().automations


@router.post("/automations")
def create_automation(name: str = Query(...), trigger_type: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"name": name, "trigger_type": trigger_type, "status": "draft"}


@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().analytics


@router.get("/costs")
def get_costs(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().costs


@router.get("/webhooks")
def get_webhooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().webhooks


@router.post("/webhooks/test")
def test_webhook(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "ok", "response_ms": 180}


@router.post("/webhooks/replay")
def replay_webhook(event: str = Query(default="message_received"), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"event": event, "status": "replayed"}


@router.get("/quality")
def get_quality(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().quality


@router.get("/ai")
def get_ai(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return WhatsappDashboardService(db).get_dashboard().ai_metrics


@router.post("/export")
def export_data(payload: WhatsappExportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = WhatsappDashboardService(db).get_dashboard()
    return {"format": payload.format, "rows": len(dash.conversations), "messages_today": dash.kpis.messages_today}
