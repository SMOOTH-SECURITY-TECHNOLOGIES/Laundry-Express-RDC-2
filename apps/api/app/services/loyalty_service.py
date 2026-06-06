from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.loyalty import LoyaltyLedgerEntry, LoyaltySettingsConfig
from app.models.user import User


class LoyaltyService:
    def __init__(self, db: Session):
        self.db = db

    def record_entry(
        self,
        *,
        user_id: UUID,
        entry_type: str,
        points_delta: int,
        balance_after: int,
        description: str,
        order_id: UUID | None = None,
        as_of: datetime | None = None,
    ) -> LoyaltyLedgerEntry:
        timestamp = as_of or datetime.now(timezone.utc)
        entry = LoyaltyLedgerEntry(
            user_id=user_id,
            order_id=order_id,
            entry_type=entry_type,
            points_delta=points_delta,
            balance_after=balance_after,
            description=description,
            created_at=timestamp,
            updated_at=timestamp,
            expires_at=self._compute_expiry_at(entry_type=entry_type, points_delta=points_delta, created_at=timestamp),
        )
        self.db.add(entry)
        return entry

    def get_user_history(self, user_id: UUID, limit: int = 50) -> tuple[list[LoyaltyLedgerEntry], int]:
        self.apply_expiration(user_id=user_id)
        query = (
            self.db.query(LoyaltyLedgerEntry)
            .filter(LoyaltyLedgerEntry.user_id == user_id)
            .order_by(LoyaltyLedgerEntry.created_at.desc())
        )
        total = query.count()
        entries = query.limit(limit).all()
        return entries, total

    def _get_settings(self) -> LoyaltySettingsConfig | None:
        return (
            self.db.query(LoyaltySettingsConfig)
            .filter(LoyaltySettingsConfig.key == "site")
            .first()
        )

    def _compute_expiry_at(
        self,
        *,
        entry_type: str,
        points_delta: int,
        created_at: datetime,
    ) -> datetime | None:
        if points_delta <= 0:
            return None
        if entry_type not in {"earn", "referral_bonus", "adjustment"}:
            return None
        settings = self._get_settings()
        expiry_days = int(settings.points_expiry_days) if settings and settings.points_expiry_days else 0
        if expiry_days <= 0:
            return None
        return created_at + timedelta(days=expiry_days)

    def apply_expiration(
        self,
        *,
        user_id: UUID,
        as_of: datetime | None = None,
    ) -> tuple[int, int]:
        effective_at = as_of or datetime.now(timezone.utc)
        entries = (
            self.db.query(LoyaltyLedgerEntry)
            .filter(LoyaltyLedgerEntry.user_id == user_id)
            .order_by(LoyaltyLedgerEntry.created_at.asc(), LoyaltyLedgerEntry.id.asc())
            .all()
        )
        if not entries:
            return 0, 0

        positive_buckets: list[dict[str, object]] = []
        for entry in entries:
            delta = int(entry.points_delta or 0)
            if delta > 0:
                positive_buckets.append({"entry": entry, "remaining": delta})
                continue
            if delta >= 0:
                continue

            to_consume = abs(delta)
            for bucket in positive_buckets:
                remaining = int(bucket["remaining"])
                if remaining <= 0:
                    continue
                consumed = min(remaining, to_consume)
                bucket["remaining"] = remaining - consumed
                to_consume -= consumed
                if to_consume <= 0:
                    break

        expired_points = 0
        expired_entries = 0
        for bucket in positive_buckets:
            entry = bucket["entry"]
            remaining = int(bucket["remaining"])
            if remaining <= 0:
                continue
            if entry.expired_at is not None:
                continue
            if entry.expires_at is None or entry.expires_at > effective_at:
                continue
            expired_points += remaining
            expired_entries += 1
            entry.expired_at = effective_at
            entry.updated_at = effective_at
            self.db.add(entry)

        if expired_points <= 0:
            return 0, 0

        user = self.db.query(User).filter(User.id == user_id).first()
        if user is None:
            return 0, 0

        current_balance = int(getattr(user, "loyalty_points", 0) or 0)
        new_balance = max(0, current_balance - expired_points)
        user.loyalty_points = new_balance
        self.db.add(user)
        self.record_entry(
            user_id=user_id,
            entry_type="expire",
            points_delta=-expired_points,
            balance_after=new_balance,
            description=f"Expired {expired_points} loyalty points",
            as_of=effective_at,
        )
        self.db.flush()
        return expired_points, expired_entries
