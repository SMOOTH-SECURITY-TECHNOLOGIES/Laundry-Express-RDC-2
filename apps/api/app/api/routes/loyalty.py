from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.loyalty import LoyaltyLedgerEntry, LoyaltySettingsConfig
from app.models.order import Order
from app.models.user import User
from app.schemas.loyalty import (
    LoyaltyAdminOverviewResponse,
    LoyaltyAdjustmentRequest,
    LoyaltyAdjustmentResponse,
    LoyaltyExpiryRunRequest,
    LoyaltyExpiryRunResponse,
    LoyaltyHistoryResponse,
    LoyaltyLedgerEntryResponse,
    LoyaltyPolicyMetricsResponse,
    LoyaltySettingsPayload,
    LoyaltySettingsResponse,
    LoyaltyTopRedeemerResponse,
    LoyaltyTopUserResponse,
)
from app.services.audit_service import AuditService
from app.services.loyalty_service import LoyaltyService

router = APIRouter(prefix="/loyalty", tags=["loyalty"])

LOYALTY_SETTINGS_KEY = "site"


def _get_config(db: Session) -> LoyaltySettingsConfig | None:
    return (
        db.query(LoyaltySettingsConfig)
        .filter(LoyaltySettingsConfig.key == LOYALTY_SETTINGS_KEY)
        .first()
    )


def _to_response(config: LoyaltySettingsConfig | None) -> LoyaltySettingsResponse:
    if config is None:
        return LoyaltySettingsResponse(
            id=None,
            key=LOYALTY_SETTINGS_KEY,
            isEnabled=True,
            pointsPerDollar=10,
            pointsToDollar=100,
            pointsExpiryDays=None,
            created_at=None,
            updated_at=None,
        )

    return LoyaltySettingsResponse(
        id=config.id,
        key=config.key,
        isEnabled=config.is_enabled,
        pointsPerDollar=config.points_per_dollar,
        pointsToDollar=config.points_to_dollar,
        pointsExpiryDays=config.points_expiry_days,
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("/settings", response_model=LoyaltySettingsResponse)
def get_loyalty_settings(db: Session = Depends(get_sync_db)):
    return _to_response(_get_config(db))


@router.get("/me/history", response_model=LoyaltyHistoryResponse)
def get_my_loyalty_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    history_limit = max(1, min(limit, 100))
    entries, total = LoyaltyService(db).get_user_history(current_user.id, history_limit)
    return LoyaltyHistoryResponse(
        entries=[
            LoyaltyLedgerEntryResponse(
                id=entry.id,
                user_id=entry.user_id,
                order_id=entry.order_id,
                entry_type=entry.entry_type,
                points_delta=entry.points_delta,
                balance_after=entry.balance_after,
                description=entry.description,
                expires_at=entry.expires_at,
                expired_at=entry.expired_at,
                created_at=entry.created_at,
            )
            for entry in entries
        ],
        total=total,
    )


@router.get("/admin/overview", response_model=LoyaltyAdminOverviewResponse)
def get_loyalty_admin_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    total_users_with_points = (
        db.query(func.count(User.id))
        .filter(User.loyalty_points > 0)
        .scalar()
        or 0
    )
    total_points_balance = (
        db.query(func.coalesce(func.sum(User.loyalty_points), 0)).scalar() or 0
    )
    ledger_entries_total = db.query(func.count(LoyaltyLedgerEntry.id)).scalar() or 0
    total_points_earned = (
        db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
        .filter(LoyaltyLedgerEntry.entry_type == "earn")
        .scalar()
        or 0
    )
    total_points_redeemed = abs(
        (
            db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
            .filter(LoyaltyLedgerEntry.entry_type == "redeem")
            .scalar()
            or 0
        )
    )
    total_points_expired = abs(
        (
            db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
            .filter(LoyaltyLedgerEntry.entry_type == "expire")
            .scalar()
            or 0
        )
    )
    total_referral_bonus_points = (
        db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
        .filter(LoyaltyLedgerEntry.entry_type == "referral_bonus")
        .scalar()
        or 0
    )
    total_adjustment_points_net = (
        db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
        .filter(LoyaltyLedgerEntry.entry_type == "adjustment")
        .scalar()
        or 0
    )
    average_points_balance = (
        (float(total_points_balance) / float(total_users_with_points))
        if total_users_with_points
        else 0.0
    )
    config = _get_config(db)
    points_per_dollar = int(config.points_per_dollar) if config else 10
    points_to_dollar = int(config.points_to_dollar) if config else 100
    points_expiry_days = int(config.points_expiry_days) if config and config.points_expiry_days else None
    is_enabled = bool(config.is_enabled) if config else True
    reward_value_per_point = round(1 / points_to_dollar, 4) if points_to_dollar > 0 else 0.0
    reward_value_per_100_spent = round((points_per_dollar / points_to_dollar) * 100, 2) if points_to_dollar > 0 else 0.0
    expiring_soon_cutoff = datetime.now(timezone.utc)
    if points_expiry_days:
        expiring_soon_cutoff = expiring_soon_cutoff.replace(microsecond=0)
    expiring_entries_query = (
        db.query(LoyaltyLedgerEntry)
        .filter(
            LoyaltyLedgerEntry.points_delta > 0,
            LoyaltyLedgerEntry.expired_at.is_(None),
            LoyaltyLedgerEntry.expires_at.is_not(None),
        )
    )
    users_with_expiring_points = (
        db.query(func.count(func.distinct(LoyaltyLedgerEntry.user_id)))
        .filter(
            LoyaltyLedgerEntry.points_delta > 0,
            LoyaltyLedgerEntry.expired_at.is_(None),
            LoyaltyLedgerEntry.expires_at.is_not(None),
        )
        .scalar()
        or 0
    )
    expiring_points_total = (
        expiring_entries_query.with_entities(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).scalar()
        or 0
    )

    recent_entries = (
        db.query(LoyaltyLedgerEntry, User.name, Order.order_number)
        .outerjoin(User, User.id == LoyaltyLedgerEntry.user_id)
        .outerjoin(Order, Order.id == LoyaltyLedgerEntry.order_id)
        .order_by(LoyaltyLedgerEntry.created_at.desc())
        .limit(10)
        .all()
    )
    top_users = (
        db.query(User.id, User.name, User.email, User.loyalty_points)
        .filter(User.loyalty_points > 0)
        .order_by(User.loyalty_points.desc(), User.created_at.asc())
        .limit(10)
        .all()
    )
    top_redeemers = (
        db.query(
            User.id,
            User.name,
            User.email,
            func.abs(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).label("total_points_redeemed"),
        )
        .join(User, User.id == LoyaltyLedgerEntry.user_id)
        .filter(LoyaltyLedgerEntry.entry_type == "redeem")
        .group_by(User.id, User.name, User.email)
        .order_by(func.abs(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).desc(), User.created_at.asc())
        .limit(10)
        .all()
    )

    return LoyaltyAdminOverviewResponse(
        total_users_with_points=int(total_users_with_points),
        total_points_balance=int(total_points_balance),
        average_points_balance=round(average_points_balance, 2),
        ledger_entries_total=int(ledger_entries_total),
        total_points_earned=int(total_points_earned),
        total_points_redeemed=int(total_points_redeemed),
        total_points_expired=int(total_points_expired),
        total_referral_bonus_points=int(total_referral_bonus_points),
        total_adjustment_points_net=int(total_adjustment_points_net),
        users_with_expiring_points=int(users_with_expiring_points),
        expiring_points_total=int(expiring_points_total),
        policy_metrics=LoyaltyPolicyMetricsResponse(
            is_enabled=is_enabled,
            points_per_dollar=points_per_dollar,
            points_to_dollar=points_to_dollar,
            points_expiry_days=points_expiry_days,
            reward_value_per_point=reward_value_per_point,
            reward_value_per_100_spent=reward_value_per_100_spent,
        ),
        top_users=[
            LoyaltyTopUserResponse(
                user_id=user_id,
                user_name=user_name,
                user_email=user_email,
                loyalty_points=int(loyalty_points or 0),
            )
            for user_id, user_name, user_email, loyalty_points in top_users
        ],
        top_redeemers=[
            LoyaltyTopRedeemerResponse(
                user_id=user_id,
                user_name=user_name,
                user_email=user_email,
                total_points_redeemed=int(total_points_redeemed or 0),
            )
            for user_id, user_name, user_email, total_points_redeemed in top_redeemers
        ],
        recent_entries=[
            LoyaltyLedgerEntryResponse(
                id=entry.id,
                user_id=entry.user_id,
                user_name=user_name,
                order_id=entry.order_id,
                order_number=order_number,
                entry_type=entry.entry_type,
                points_delta=entry.points_delta,
                balance_after=entry.balance_after,
                description=entry.description,
                expires_at=entry.expires_at,
                expired_at=entry.expired_at,
                created_at=entry.created_at,
            )
            for entry, user_name, order_number in recent_entries
        ],
    )


@router.post("/admin/run-expiration", response_model=LoyaltyExpiryRunResponse)
def run_loyalty_expiration(
    data: LoyaltyExpiryRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    loyalty_service = LoyaltyService(db)
    effective_at = data.as_of or datetime.now(timezone.utc)
    users_query = db.query(User.id)
    if data.user_id:
        users_query = users_query.filter(User.id == data.user_id)
    else:
        users_query = users_query.filter(User.loyalty_points > 0)

    user_ids = [user_id for (user_id,) in users_query.all()]
    total_expired_points = 0
    total_expired_entries = 0
    for user_id in user_ids:
        expired_points, expired_entries = loyalty_service.apply_expiration(
            user_id=user_id,
            as_of=effective_at,
        )
        total_expired_points += int(expired_points)
        total_expired_entries += int(expired_entries)

    AuditService(db).log_event(
        user_id=current_user.id,
        action="run_expiration",
        resource_type="loyalty_points",
        resource_id=data.user_id,
        details={
            "users_processed": len(user_ids),
            "expired_points": total_expired_points,
            "expired_entries": total_expired_entries,
            "as_of": effective_at.isoformat(),
        },
    )
    db.commit()

    return LoyaltyExpiryRunResponse(
        users_processed=len(user_ids),
        expired_points=total_expired_points,
        expired_entries=total_expired_entries,
    )


@router.post("/admin/adjustments", response_model=LoyaltyAdjustmentResponse)
def adjust_loyalty_points(
    data: LoyaltyAdjustmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    user = db.query(User).filter(User.id == data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    current_balance = int(getattr(user, "loyalty_points", 0) or 0)
    LoyaltyService(db).apply_expiration(user_id=user.id)
    db.refresh(user)
    current_balance = int(getattr(user, "loyalty_points", 0) or 0)
    new_balance = current_balance + int(data.points_delta)
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'ajustement rendrait le solde de fidelite negatif",
        )

    user.loyalty_points = new_balance
    db.add(user)
    LoyaltyService(db).record_entry(
        user_id=user.id,
        entry_type="adjustment",
        points_delta=int(data.points_delta),
        balance_after=new_balance,
        description=data.reason,
    )
    AuditService(db).log_event(
        user_id=current_user.id,
        action="adjust",
        resource_type="loyalty_points",
        resource_id=user.id,
        details={
            "points_delta": int(data.points_delta),
            "new_balance": new_balance,
            "reason": data.reason,
        },
    )
    db.commit()

    return LoyaltyAdjustmentResponse(
        user_id=user.id,
        points_delta=int(data.points_delta),
        new_balance=new_balance,
        reason=data.reason,
    )


@router.put("/settings", response_model=LoyaltySettingsResponse)
def update_loyalty_settings(
    data: LoyaltySettingsPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    config = _get_config(db)
    if config is None:
        config = LoyaltySettingsConfig(
            key=LOYALTY_SETTINGS_KEY,
            is_enabled=data.isEnabled,
            points_per_dollar=data.pointsPerDollar,
            points_to_dollar=data.pointsToDollar,
            points_expiry_days=data.pointsExpiryDays,
        )
        db.add(config)
    else:
        config.is_enabled = data.isEnabled
        config.points_per_dollar = data.pointsPerDollar
        config.points_to_dollar = data.pointsToDollar
        config.points_expiry_days = data.pointsExpiryDays
        db.add(config)

    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="loyalty_settings",
        resource_id=config.id,
        details={"key": LOYALTY_SETTINGS_KEY},
    )
    db.commit()
    db.refresh(config)
    return _to_response(config)
