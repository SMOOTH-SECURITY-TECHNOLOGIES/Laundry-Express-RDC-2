import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.core.config import settings
from app.core.database import SyncSessionLocal
from app.models.user import User
from app.schemas.activity_log_dashboard import ActivityLogDashboardResponse, ActivityLogExportRequest
from app.services.activity_log_dashboard_service import ActivityLogDashboardService, user_has_sensitive_access

router = APIRouter(prefix="/admin", tags=["admin-activity-log"])

_live_connections: set[WebSocket] = set()


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/activity-log", response_model=ActivityLogDashboardResponse)
def get_activity_log_dashboard(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ActivityLogDashboardService(db).get_dashboard(
        limit=limit,
        sensitive_access=user_has_sensitive_access(current_user),
    )


@router.get("/activity-log/stats", response_model=ActivityLogDashboardResponse)
def get_activity_log_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ActivityLogDashboardService(db).get_dashboard(sensitive_access=user_has_sensitive_access(current_user))


@router.get("/activity-log/anomalies")
def get_activity_log_anomalies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    dash = ActivityLogDashboardService(db).get_dashboard(sensitive_access=user_has_sensitive_access(current_user))
    return {"anomalies": dash.anomalies, "count": len(dash.anomalies)}


@router.get("/activity-log/{event_id}")
def get_activity_log_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    event = ActivityLogDashboardService(db).get_event(event_id, sensitive_access=user_has_sensitive_access(current_user))
    if not event:
        raise HTTPException(status_code=404, detail="Événement introuvable")
    return event


@router.post("/activity-log/export")
def export_activity_log(
    payload: ActivityLogExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    dash = ActivityLogDashboardService(db).get_dashboard(limit=500, sensitive_access=user_has_sensitive_access(current_user))
    return {
        "format": payload.format,
        "period": payload.period,
        "rows": len(dash.events),
        "total": dash.total,
        "status": "ready",
    }


def _authenticate_ws_token(token: str | None) -> bool:
    if not token:
        return False
    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return True
    except JWTError:
        return False


@router.websocket("/activity-log/live")
async def activity_log_live(websocket: WebSocket):
    await websocket.accept()
    token = websocket.query_params.get("token")
    if not _authenticate_ws_token(token):
        await websocket.close(code=4401, reason="Unauthorized")
        return
    _live_connections.add(websocket)
    db = SyncSessionLocal()
    try:
        svc = ActivityLogDashboardService(db)
        dash = svc.get_dashboard(limit=5)
        await websocket.send_json({"type": "snapshot", "events": [e.model_dump() for e in dash.live_events]})
        while True:
            await asyncio.sleep(8)
            dash = svc.get_dashboard(limit=3)
            if dash.live_events:
                await websocket.send_json({"type": "live", "events": [e.model_dump() for e in dash.live_events[:1]]})
            else:
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.send_json({"type": "error", "message": "live_feed_unavailable"})
        except Exception:
            pass
    finally:
        _live_connections.discard(websocket)
        db.close()
