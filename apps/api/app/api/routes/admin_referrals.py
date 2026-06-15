from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.referral import ReferralCampaign, ReferralSettingsConfig
from app.models.user import User
from app.schemas.referral_dashboard import (
    ManualBonusRequest, ReferralCampaignCreateRequest, ReferralDashboardResponse,
    ReferralExportRequest, ReferralExportResponse, ReferralSettingsUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.loyalty_service import LoyaltyService
from app.services.referral_dashboard_service import ReferralDashboardService

router = APIRouter(prefix="/admin/referrals", tags=["admin-referrals"])
SETTINGS_KEY = "site"


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


def _get_config(db: Session) -> ReferralSettingsConfig | None:
    return db.query(ReferralSettingsConfig).filter(ReferralSettingsConfig.key == SETTINGS_KEY).first()


@router.get("/dashboard", response_model=ReferralDashboardResponse)
def get_referral_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard(days=days)


@router.get("/settings")
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().settings


@router.put("/settings")
def update_settings(
    payload: ReferralSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    config = _get_config(db)
    if not config:
        config = ReferralSettingsConfig(key=SETTINGS_KEY)
        db.add(config)
    data = payload.model_dump(exclude_unset=True)
    if "allowed_channels" in data and data["allowed_channels"]:
        data["allowed_channels"] = ",".join(data["allowed_channels"])
    field_map = {
        "is_enabled": "is_enabled", "referrer_bonus_points": "referrer_bonus_points",
        "referee_discount_amount": "referee_discount_amount", "referee_bonus_points": "referee_bonus_points",
        "points_expiry_days": "points_expiry_days", "bonus_cap_per_referrer": "bonus_cap_per_referrer",
        "allowed_channels": "allowed_channels",
    }
    for key, col in field_map.items():
        if key in data:
            val = data[key]
            if col == "referee_discount_amount":
                val = Decimal(str(val))
            setattr(config, col, val)
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id, action="update",
        resource_type="referral_settings", resource_id=config.id,
        details={"key": SETTINGS_KEY},
    )
    db.commit()
    return ReferralDashboardService(db).get_dashboard().settings


@router.get("/top-referrers")
def top_referrers(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().top_referrers


@router.get("/conversions")
def conversions(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().recent_conversions


@router.get("/watchlist")
def watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().watchlist


@router.get("/channels")
def channels(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().channels


@router.get("/trends")
def trends(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard(days=days).trends


@router.get("/impact")
def impact(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().impact


@router.get("/popular-codes")
def popular_codes(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReferralDashboardService(db).get_dashboard().popular_codes


@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
def create_campaign(
    payload: ReferralCampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    campaign = ReferralCampaign(
        name=payload.name, audience=payload.audience, budget=payload.budget,
        start_date=payload.start_date, end_date=payload.end_date,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return {"id": str(campaign.id), "name": campaign.name}


@router.post("/manual-bonus")
def manual_bonus(
    payload: ManualBonusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    balance = int(user.loyalty_points or 0) + payload.points
    if balance < 0:
        raise HTTPException(status_code=400, detail="Solde négatif")
    user.loyalty_points = balance
    LoyaltyService(db).record_entry(
        user_id=user.id, entry_type="adjustment", points_delta=payload.points,
        balance_after=balance, description=f"Referral manual bonus: {payload.reason}",
    )
    AuditService(db).log_event(
        user_id=current_user.id, action="manual_bonus",
        resource_type="referral_bonus", resource_id=user.id,
        details={"points": payload.points, "reason": payload.reason},
    )
    db.commit()
    return {"user_id": str(user.id), "new_balance": balance}


@router.post("/audit")
def start_audit(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    bundle = ReferralDashboardService(db).get_dashboard()
    return {
        "watchlist_items": len(bundle.watchlist),
        "conversions_audited": len(bundle.recent_conversions),
        "status": "completed",
    }


@router.post("/export", response_model=ReferralExportResponse)
def export_referrals(
    payload: ReferralExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    bundle = ReferralDashboardService(db).get_dashboard()
    counts = {
        "conversions": len(bundle.recent_conversions),
        "referrers": len(bundle.top_referrers),
        "codes": len(bundle.popular_codes),
    }
    ext = "xlsx" if payload.format == "excel" else payload.format
    return ReferralExportResponse(
        filename=f"referrals-{payload.scope}.{ext}",
        count=counts.get(payload.scope, len(bundle.recent_conversions)),
        format=payload.format,
    )
