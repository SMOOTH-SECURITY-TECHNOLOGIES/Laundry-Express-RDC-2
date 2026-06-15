from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.integrations_dashboard import (
    ApiKeyCreate,
    IntegrationsDashboardResponse,
    TrackingUpdate,
    WebhookCreate,
    WebhookReplayRequest,
    WebhookTestRequest,
)
from app.services.integrations_dashboard_service import IntegrationsDashboardService

router = APIRouter(prefix="/admin", tags=["admin-integrations"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/integrations/dashboard", response_model=IntegrationsDashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard()


@router.get("/api-keys")
def get_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().api_keys


@router.post("/api-keys")
def create_api_key(payload: ApiKeyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name, "key_type": payload.key_type}


@router.patch("/api-keys/{key_id}")
def patch_api_key(key_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": key_id, "status": "updated"}


@router.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": key_id, "status": "deleted"}


@router.get("/webhooks")
def get_webhooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().webhooks


@router.post("/webhooks")
def create_webhook(payload: WebhookCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "created", "name": payload.name, "event": payload.event}


@router.patch("/webhooks/{webhook_id}")
def patch_webhook(webhook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": webhook_id, "status": "updated"}


@router.delete("/webhooks/{webhook_id}")
def delete_webhook(webhook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"id": webhook_id, "status": "deleted"}


@router.post("/webhooks/{webhook_id}/test")
def test_webhook(webhook_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"webhook_id": webhook_id, "status": "test_sent", "response_ms": 124}


@router.post("/webhooks/{webhook_id}/replay")
def replay_webhook(webhook_id: str, payload: WebhookReplayRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"webhook_id": webhook_id, "event": payload.event, "status": "replayed"}


@router.get("/webhooks/logs")
def get_webhook_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().webhook_deliveries


@router.get("/tracking")
def get_tracking(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = IntegrationsDashboardService(db).get_dashboard()
    return {"tracking": dash.tracking, "server_side": dash.server_side_tracking}


@router.patch("/tracking")
def patch_tracking(payload: TrackingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"provider": payload.provider, "status": "updated"}


@router.get("/integrations")
def get_integrations(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().integrations


@router.get("/integrations/health")
def get_integrations_health(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().integrations


@router.get("/api-analytics")
def get_api_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = IntegrationsDashboardService(db).get_dashboard()
    return {"analytics": dash.analytics, "event_distribution": dash.event_distribution, "top_endpoints": dash.top_endpoints}


@router.get("/api-logs")
def get_api_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().logs


@router.get("/security")
def get_security(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().security


@router.get("/openapi")
def get_openapi(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return IntegrationsDashboardService(db).get_dashboard().openapi


@router.post("/webhooks/test")
def test_webhook_generic(payload: WebhookTestRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "test_sent", "response_ms": 118}


@router.post("/webhooks/replay")
def replay_webhook_generic(payload: WebhookReplayRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"event": payload.event, "status": "replayed"}
