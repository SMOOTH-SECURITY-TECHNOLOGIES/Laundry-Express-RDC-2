from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.loyalty import LoyaltyLedgerEntry
from app.models.referral import ReferralReviewStatus, ReferralSettingsConfig
from app.models.user import User
from app.schemas.referral import (
    ReferralAdminOverviewResponse,
    ReferralRecentConversionResponse,
    ReferralReviewStatusPayload,
    ReferralReviewStatusResponse,
    ReferralSettingsPayload,
    ReferralSettingsResponse,
    ReferralTopReferrerResponse,
    ReferralWatchlistEntryResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/referral", tags=["referral"])

REFERRAL_SETTINGS_KEY = "site"


def _get_config(db: Session) -> ReferralSettingsConfig | None:
    return (
        db.query(ReferralSettingsConfig)
        .filter(ReferralSettingsConfig.key == REFERRAL_SETTINGS_KEY)
        .first()
    )


def _to_response(config: ReferralSettingsConfig | None) -> ReferralSettingsResponse:
    if config is None:
        return ReferralSettingsResponse(
            id=None,
            key=REFERRAL_SETTINGS_KEY,
            isEnabled=True,
            referrerBonusPoints=500,
            refereeDiscountAmount=5,
            created_at=None,
            updated_at=None,
        )

    return ReferralSettingsResponse(
        id=config.id,
        key=config.key,
        isEnabled=config.is_enabled,
        referrerBonusPoints=config.referrer_bonus_points,
        refereeDiscountAmount=float(config.referee_discount_amount),
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("/settings", response_model=ReferralSettingsResponse)
def get_referral_settings(db: Session = Depends(get_sync_db)):
    return _to_response(_get_config(db))


def _to_review_response(review: ReferralReviewStatus) -> ReferralReviewStatusResponse:
    return ReferralReviewStatusResponse(
        referrer_user_id=review.referrer_user_id,
        review_status=review.review_status,
        review_note=review.review_note,
        reviewed_by_user_id=review.reviewed_by_user_id,
        reviewed_at=review.updated_at,
    )


@router.get("/admin/reviews/{referrer_user_id}", response_model=ReferralReviewStatusResponse)
def get_referral_review_status(
    referrer_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    review = (
        db.query(ReferralReviewStatus)
        .filter(ReferralReviewStatus.referrer_user_id == referrer_user_id)
        .first()
    )
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral review not found",
        )
    return _to_review_response(review)


@router.put("/admin/reviews/{referrer_user_id}", response_model=ReferralReviewStatusResponse)
def upsert_referral_review_status(
    referrer_user_id: str,
    data: ReferralReviewStatusPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    referrer = db.query(User).filter(User.id == referrer_user_id).first()
    if referrer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referrer user not found",
        )

    review = (
        db.query(ReferralReviewStatus)
        .filter(ReferralReviewStatus.referrer_user_id == referrer_user_id)
        .first()
    )
    if review is None:
        review = ReferralReviewStatus(
            referrer_user_id=referrer.id,
            review_status=data.review_status,
            review_note=data.review_note,
            reviewed_by_user_id=current_user.id,
        )
        db.add(review)
    else:
        review.review_status = data.review_status
        review.review_note = data.review_note
        review.reviewed_by_user_id = current_user.id
        db.add(review)

    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="review",
        resource_type="referral_watchlist",
        resource_id=review.id,
        details={
            "referrer_user_id": str(referrer.id),
            "review_status": data.review_status,
        },
    )
    db.commit()
    db.refresh(review)
    return _to_review_response(review)


@router.get("/admin/overview", response_model=ReferralAdminOverviewResponse)
def get_referral_admin_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )

    total_users_with_referral_codes = (
        db.query(func.count(User.id))
        .filter(User.referral_code.isnot(None))
        .scalar()
        or 0
    )
    total_referred_users = (
        db.query(func.count(User.id))
        .filter(User.referred_by_user_id.isnot(None))
        .scalar()
        or 0
    )
    total_referral_discounts_used = (
        db.query(func.count(User.id))
        .filter(User.referral_discount_used_at.isnot(None))
        .scalar()
        or 0
    )
    total_referred_signed_up_only = (
        db.query(func.count(User.id))
        .filter(
            User.referred_by_user_id.isnot(None),
            User.referral_discount_used_at.is_(None),
            User.referral_bonus_awarded_at.is_(None),
        )
        .scalar()
        or 0
    )
    total_referred_pending_bonus = (
        db.query(func.count(User.id))
        .filter(
            User.referred_by_user_id.isnot(None),
            User.referral_discount_used_at.isnot(None),
            User.referral_bonus_awarded_at.is_(None),
        )
        .scalar()
        or 0
    )
    total_referral_bonuses_awarded = (
        db.query(func.count(User.id))
        .filter(User.referral_bonus_awarded_at.isnot(None))
        .scalar()
        or 0
    )
    config = _get_config(db)
    configured_bonus_points = int(config.referrer_bonus_points) if config else 500
    total_referrer_bonus_points_awarded = (
        db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0))
        .filter(LoyaltyLedgerEntry.entry_type == "referral_bonus")
        .scalar()
        or 0
    )
    referral_bonus_rows = (
        db.query(
            User.referred_by_user_id.label("referrer_id"),
            func.count(User.id).label("successful_referrals"),
        )
        .filter(
            User.referred_by_user_id.isnot(None),
            User.referral_bonus_awarded_at.isnot(None),
        )
        .group_by(User.referred_by_user_id)
        .order_by(func.count(User.id).desc(), User.referred_by_user_id.asc())
        .limit(10)
        .all()
    )

    top_referrers = []
    if referral_bonus_rows:
        referrer_ids = [row.referrer_id for row in referral_bonus_rows if row.referrer_id is not None]
        referrers = {
            user.id: user
            for user in db.query(User).filter(User.id.in_(referrer_ids)).all()
        }
        bonus_points_by_referrer = {
            row.referrer_id: int(row.successful_referrals) * configured_bonus_points
            for row in referral_bonus_rows
        }
        top_referrers = [
            ReferralTopReferrerResponse(
                user_id=row.referrer_id,
                user_name=getattr(referrers.get(row.referrer_id), "name", "Unknown user"),
                user_email=getattr(referrers.get(row.referrer_id), "email", ""),
                referral_code=getattr(referrers.get(row.referrer_id), "referral_code", None),
                successful_referrals=int(row.successful_referrals),
                total_bonus_points_awarded=int(bonus_points_by_referrer.get(row.referrer_id, 0)),
            )
            for row in referral_bonus_rows
            if row.referrer_id in referrers
        ]

    referred_alias = User
    referrer_alias = db.query(User).subquery()
    recent_conversion_rows = (
        db.query(
            referred_alias.id.label("referred_user_id"),
            referred_alias.name.label("referred_user_name"),
            referred_alias.email.label("referred_user_email"),
            referred_alias.referral_discount_used_at.label("referral_discount_used_at"),
            referred_alias.referral_bonus_awarded_at.label("referral_bonus_awarded_at"),
            referrer_alias.c.id.label("referrer_user_id"),
            referrer_alias.c.name.label("referrer_user_name"),
            referrer_alias.c.email.label("referrer_user_email"),
            referrer_alias.c.referral_code.label("referral_code"),
        )
        .join(referrer_alias, referrer_alias.c.id == referred_alias.referred_by_user_id)
        .filter(referred_alias.referred_by_user_id.isnot(None))
        .order_by(
            referred_alias.referral_bonus_awarded_at.desc().nullslast(),
            referred_alias.referral_discount_used_at.desc().nullslast(),
            referred_alias.created_at.desc(),
        )
        .limit(10)
        .all()
    )
    watchlist_rows = (
        db.query(
            User.referred_by_user_id.label("referrer_id"),
            func.count(User.id).label("total_referred_users"),
            func.sum(
                case(
                    (
                        (User.referral_discount_used_at.is_(None) & User.referral_bonus_awarded_at.is_(None)),
                        1,
                    ),
                    else_=0,
                )
            ).label("signed_up_only_count"),
            func.sum(
                case(
                    (
                        (User.referral_discount_used_at.isnot(None) & User.referral_bonus_awarded_at.is_(None)),
                        1,
                    ),
                    else_=0,
                )
            ).label("pending_bonus_count"),
            func.sum(
                case(
                    (User.referral_bonus_awarded_at.isnot(None), 1),
                    else_=0,
                )
            ).label("completed_conversion_count"),
        )
        .filter(User.referred_by_user_id.isnot(None))
        .group_by(User.referred_by_user_id)
        .having(func.count(User.id) >= 2)
        .order_by(func.count(User.id).desc(), User.referred_by_user_id.asc())
        .limit(10)
        .all()
    )
    review_rows = db.query(ReferralReviewStatus).all()
    reviews_by_referrer = {str(review.referrer_user_id): review for review in review_rows}
    watchlist = []
    if watchlist_rows:
        watchlist_referrer_ids = [row.referrer_id for row in watchlist_rows if row.referrer_id is not None]
        watchlist_referrers = {
            user.id: user
            for user in db.query(User).filter(User.id.in_(watchlist_referrer_ids)).all()
        }
        for row in watchlist_rows:
            if row.referrer_id not in watchlist_referrers:
                continue
            total_referred = int(row.total_referred_users or 0)
            signed_up_only = int(row.signed_up_only_count or 0)
            pending_bonus = int(row.pending_bonus_count or 0)
            completed = int(row.completed_conversion_count or 0)
            attention_reason = "monitor"
            if signed_up_only >= 3:
                attention_reason = "high_signup_without_usage"
            elif pending_bonus >= 2:
                attention_reason = "multiple_pending_bonus"
            elif total_referred >= 5 and completed == 0:
                attention_reason = "high_volume_without_conversion"

            if attention_reason == "monitor" and total_referred < 3:
                continue

            referrer = watchlist_referrers[row.referrer_id]
            review = reviews_by_referrer.get(str(row.referrer_id))
            watchlist.append(
                ReferralWatchlistEntryResponse(
                    referrer_user_id=row.referrer_id,
                    referrer_user_name=getattr(referrer, "name", "Unknown user"),
                    referrer_user_email=getattr(referrer, "email", ""),
                    referral_code=getattr(referrer, "referral_code", None),
                    total_referred_users=total_referred,
                    signed_up_only_count=signed_up_only,
                    pending_bonus_count=pending_bonus,
                    completed_conversion_count=completed,
                    attention_reason=attention_reason,
                    review_status=getattr(review, "review_status", None),
                    review_note=getattr(review, "review_note", None),
                    reviewed_by_user_id=getattr(review, "reviewed_by_user_id", None),
                    reviewed_at=getattr(review, "updated_at", None),
                )
            )

    return ReferralAdminOverviewResponse(
        total_users_with_referral_codes=int(total_users_with_referral_codes),
        total_referred_users=int(total_referred_users),
        total_referred_signed_up_only=int(total_referred_signed_up_only),
        total_referred_pending_bonus=int(total_referred_pending_bonus),
        total_completed_referral_conversions=int(total_referral_bonuses_awarded),
        total_referral_discounts_used=int(total_referral_discounts_used),
        total_referral_bonuses_awarded=int(total_referral_bonuses_awarded),
        total_referrer_bonus_points_awarded=int(total_referrer_bonus_points_awarded or 0),
        top_referrers=top_referrers,
        watchlist=watchlist,
        recent_conversions=[
            ReferralRecentConversionResponse(
                referred_user_id=row.referred_user_id,
                referred_user_name=row.referred_user_name,
                referred_user_email=row.referred_user_email,
                referrer_user_id=row.referrer_user_id,
                referrer_user_name=row.referrer_user_name,
                referrer_user_email=row.referrer_user_email,
                referral_code=row.referral_code,
                referral_discount_used_at=row.referral_discount_used_at,
                referral_bonus_awarded_at=row.referral_bonus_awarded_at,
            )
            for row in recent_conversion_rows
        ],
    )


@router.put("/settings", response_model=ReferralSettingsResponse)
def update_referral_settings(
    data: ReferralSettingsPayload,
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
        config = ReferralSettingsConfig(
            key=REFERRAL_SETTINGS_KEY,
            is_enabled=data.isEnabled,
            referrer_bonus_points=data.referrerBonusPoints,
            referee_discount_amount=Decimal(str(data.refereeDiscountAmount)),
        )
        db.add(config)
    else:
        config.is_enabled = data.isEnabled
        config.referrer_bonus_points = data.referrerBonusPoints
        config.referee_discount_amount = Decimal(str(data.refereeDiscountAmount))
        db.add(config)

    db.flush()
    AuditService(db).log_event(
        user_id=current_user.id,
        action="update",
        resource_type="referral_settings",
        resource_id=config.id,
        details={"key": REFERRAL_SETTINGS_KEY},
    )
    db.commit()
    db.refresh(config)
    return _to_response(config)
