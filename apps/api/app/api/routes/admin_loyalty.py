import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.loyalty import LoyaltyReward, LoyaltySettingsConfig
from app.models.user import User
from app.schemas.loyalty_dashboard import (
    LoyaltyDashboardResponse, LoyaltyExportRequest, LoyaltyExportResponse,
    LoyaltySettingsUpdateRequest, RewardCreateRequest, RewardUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.loyalty_dashboard_service import LoyaltyDashboardService
from app.services.loyalty_service import LoyaltyService

router = APIRouter(prefix="/admin/loyalty", tags=["admin-loyalty"])
LOYALTY_SETTINGS_KEY = "site"


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


def _get_config(db: Session) -> LoyaltySettingsConfig | None:
    return db.query(LoyaltySettingsConfig).filter(LoyaltySettingsConfig.key == LOYALTY_SETTINGS_KEY).first()


@router.get("/dashboard", response_model=LoyaltyDashboardResponse)
def get_loyalty_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard(days=days)


@router.get("/settings")
def get_loyalty_settings_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().settings


@router.put("/settings")
def update_loyalty_settings_admin(
    payload: LoyaltySettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    config = _get_config(db)
    if not config:
        config = LoyaltySettingsConfig(key=LOYALTY_SETTINGS_KEY)
        db.add(config)
    data = payload.model_dump(exclude_unset=True)
    field_map = {
        "is_enabled": "is_enabled", "points_per_dollar": "points_per_dollar",
        "points_to_dollar": "points_to_dollar", "points_expiry_days": "points_expiry_days",
        "redemption_cap": "redemption_cap", "first_order_bonus": "first_order_bonus",
    }
    for key, col in field_map.items():
        if key in data:
            setattr(config, col, data[key])
    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id, action="update",
        resource_type="loyalty_settings", resource_id=config.id,
        details={"key": LOYALTY_SETTINGS_KEY},
    )
    db.commit()
    return LoyaltyDashboardService(db).get_dashboard().settings


@router.get("/activity")
def get_loyalty_activity(
    limit: int = Query(default=25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().activity[:limit]


@router.get("/users")
def get_loyalty_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().top_users


@router.get("/redeemers")
def get_loyalty_redeemers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().top_redeemers


@router.get("/rewards")
def list_rewards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().rewards


@router.post("/rewards", status_code=status.HTTP_201_CREATED)
def create_reward(
    payload: RewardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    reward = LoyaltyReward(
        name=payload.name,
        points_required=payload.points_required,
        value_dollars=payload.value_dollars,
    )
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return {"id": str(reward.id), "name": reward.name}


@router.patch("/rewards/{reward_id}")
def update_reward(
    reward_id: str,
    payload: RewardUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Récompense introuvable")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(reward, key, value)
    db.commit()
    db.refresh(reward)
    return {"id": str(reward.id), "status": "active" if reward.is_active else "disabled"}


@router.get("/retention")
def get_retention(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().retention


@router.get("/revenue-impact")
def get_revenue_impact(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().revenue_impact


@router.get("/cohorts")
def get_cohorts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().cohorts


@router.get("/risk")
def get_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return LoyaltyDashboardService(db).get_dashboard().risks


@router.post("/expire")
def run_expiration(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    from datetime import datetime, timezone
    loyalty_service = LoyaltyService(db)
    user_ids = [uid for (uid,) in db.query(User.id).filter(User.loyalty_points > 0).all()]
    total_expired = 0
    for user_id in user_ids:
        expired, _ = loyalty_service.apply_expiration(user_id=user_id, as_of=datetime.now(timezone.utc))
        total_expired += expired
    AuditService(db).log_event(
        user_id=current_user.id, action="run_expiration",
        resource_type="loyalty_points", details={"expired_points": total_expired},
    )
    db.commit()
    return {"users_processed": len(user_ids), "expired_points": total_expired}


@router.post("/export", response_model=LoyaltyExportResponse)
def export_loyalty(
    payload: LoyaltyExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    bundle = LoyaltyDashboardService(db).get_dashboard()
    count_map = {
        "activity": len(bundle.activity),
        "users": len(bundle.top_users),
        "rewards": len(bundle.rewards),
        "cohorts": len(bundle.cohorts),
        "segments": len(bundle.segments),
    }
    ext = "xlsx" if payload.format == "excel" else payload.format
    return LoyaltyExportResponse(
        filename=f"loyalty-{payload.scope}.{ext}",
        count=count_map.get(payload.scope, len(bundle.activity)),
        format=payload.format,
    )
