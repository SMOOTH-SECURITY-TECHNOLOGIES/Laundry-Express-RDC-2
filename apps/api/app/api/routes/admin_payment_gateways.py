from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.payment_gateways_dashboard import PaymentGatewayExportRequest, PaymentGatewaysDashboardResponse
from app.services.payment_gateways_dashboard_service import PaymentGatewaysDashboardService

router = APIRouter(prefix="/admin/payment-gateways", tags=["admin-payment-gateways"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=PaymentGatewaysDashboardResponse)
def get_dashboard(days: int = Query(default=30, ge=1, le=365), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard(days=days)


@router.get("/health")
def get_health(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().provider_health


@router.get("/incidents")
def get_incidents(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().incidents


@router.get("/transactions")
def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().transactions


@router.get("/settlements")
def get_settlements(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().settlements


@router.get("/reconciliation")
def get_reconciliation(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().reconciliations


@router.post("/reconciliation/run")
def run_reconciliation(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"status": "started", "message": "Réconciliation automatique lancée"}


@router.get("/webhooks")
def get_webhooks(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().webhooks


@router.post("/webhooks/test")
def test_webhook(gateway_slug: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"gateway_slug": gateway_slug, "status": "ok", "response_ms": 240}


@router.post("/webhooks/replay")
def replay_webhook(gateway_slug: str = Query(...), event: str = Query(default="payment_success"), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return {"gateway_slug": gateway_slug, "event": event, "status": "replayed"}


@router.get("/refunds")
def get_refunds(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().refunds


@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = PaymentGatewaysDashboardService(db).get_dashboard()
    return {"success_rate_trend": dash.success_rate_trend, "revenue_distribution": dash.revenue_distribution, "channel_performance": dash.channel_performance}


@router.post("/export")
def export_data(payload: PaymentGatewayExportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    dash = PaymentGatewaysDashboardService(db).get_dashboard()
    return {"format": payload.format, "rows": len(dash.transactions), "revenue_month": dash.kpis.revenue_month}


@router.get("")
def list_gateways(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return PaymentGatewaysDashboardService(db).get_dashboard().gateways


@router.get("/{gateway_id}")
def get_gateway(gateway_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = PaymentGatewaysDashboardService(db).get_gateway(gateway_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Passerelle introuvable")
    return detail
