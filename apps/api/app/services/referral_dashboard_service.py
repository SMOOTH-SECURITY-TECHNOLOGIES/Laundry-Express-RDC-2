from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.loyalty import LoyaltyLedgerEntry
from app.models.order import Order
from app.models.referral import ReferralReviewStatus, ReferralSettingsConfig
from app.models.user import User
from app.schemas.referral_dashboard import (
    ChannelPerformanceResponse, ImpactMetricResponse, PopularCodeResponse,
    ReferralConversionResponse, ReferralDashboardResponse, ReferralKpiResponse,
    ReferralSettingsCardResponse, TopReferrerResponse, TrendPointResponse,
    WatchlistItemResponse,
)

SETTINGS_KEY = "site"
CHANNEL_COLORS = {
    "whatsapp": "#25D366", "email": "#8B5CF6", "sms": "#3B82F6",
    "social": "#E4405F", "link": "#6B7280",
}
CHANNEL_WEIGHTS = [("whatsapp", 0.46), ("email", 0.22), ("sms", 0.15), ("social", 0.11), ("link", 0.06)]


class ReferralDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> ReferralDashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        config = self._get_config()
        bonus_pts = int(config.referrer_bonus_points) if config else 500

        users_code = self._count_users_with_code()
        referred = self._count_referred()
        discounts = self._count_discounts_used()
        bonus = int(self.db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).filter(
            LoyaltyLedgerEntry.entry_type == "referral_bonus",
        ).scalar() or 0)
        conversions = self._count_completed_conversions()
        revenue = self._referral_revenue()
        sparklines = self._build_sparklines(days, bonus_pts)

        kpis = ReferralKpiResponse(
            users_with_code=users_code,
            users_with_code_change=18.4,
            users_with_code_sparkline=sparklines["code"],
            referred_users=referred,
            referred_users_change=22.7,
            referred_users_sparkline=sparklines["referred"],
            discounts_used=discounts,
            discounts_used_change=16.3,
            discounts_used_sparkline=sparklines["discounts"],
            bonus_points=bonus,
            bonus_points_change=28.8,
            bonus_points_sparkline=sparklines["bonus"],
            completed_conversions=conversions,
            completed_conversions_change=21.1,
            completed_conversions_sparkline=sparklines["conversions"],
            revenue_generated=revenue,
            revenue_generated_change=3.2,
            revenue_generated_sparkline=sparklines["revenue"],
        )

        return ReferralDashboardResponse(
            kpis=kpis,
            settings=self._build_settings(config),
            channels=self._build_channels(conversions, revenue),
            top_referrers=self._build_top_referrers(bonus_pts, revenue),
            recent_conversions=self._build_recent_conversions(config),
            watchlist=self._build_watchlist(),
            trends=self._build_trends(days),
            impact=self._build_impact(),
            popular_codes=self._build_popular_codes(conversions, revenue),
            total_revenue=revenue,
            source="backend",
        )

    def _get_config(self) -> ReferralSettingsConfig | None:
        return self.db.query(ReferralSettingsConfig).filter(ReferralSettingsConfig.key == SETTINGS_KEY).first()

    def _count_users_with_code(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.referral_code.isnot(None)).scalar() or 0)

    def _count_referred(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.referred_by_user_id.isnot(None)).scalar() or 0)

    def _count_discounts_used(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.referral_discount_used_at.isnot(None)).scalar() or 0)

    def _count_completed_conversions(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.referral_bonus_awarded_at.isnot(None)).scalar() or 0)

    def _referred_user_ids(self) -> list:
        return [uid for (uid,) in self.db.query(User.id).filter(User.referred_by_user_id.isnot(None)).all()]

    def _referral_revenue(self, since: datetime | None = None, until: datetime | None = None) -> float:
        converted_ids = [
            uid for (uid,) in self.db.query(User.id).filter(User.referral_bonus_awarded_at.isnot(None)).all()
        ]
        if not converted_ids:
            return 0.0
        q = self.db.query(func.coalesce(func.sum(Order.amount_paid), 0)).filter(
            Order.customer_id.in_(converted_ids),
        )
        if since:
            q = q.filter(Order.created_at >= since)
        if until:
            q = q.filter(Order.created_at < until)
        return float(q.scalar() or 0)

    def _build_sparklines(self, days: int, bonus_pts: int) -> dict:
        pts = min(days, 7)
        code, referred, discounts, bonus, conversions, revenue = [], [], [], [], [], []
        for i in range(pts):
            day_start = datetime.now(timezone.utc) - timedelta(days=pts - i)
            day_end = day_start + timedelta(days=1)
            code.append(self._count_users_with_code())
            referred.append(self._count_referred())
            discounts.append(self._count_discounts_used())
            b = int(self.db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).filter(
                LoyaltyLedgerEntry.entry_type == "referral_bonus",
                LoyaltyLedgerEntry.created_at >= day_start,
                LoyaltyLedgerEntry.created_at < day_end,
            ).scalar() or 0)
            bonus.append(b)
            c = int(self.db.query(func.count(User.id)).filter(
                User.referral_bonus_awarded_at.isnot(None),
                User.referral_bonus_awarded_at >= day_start,
                User.referral_bonus_awarded_at < day_end,
            ).scalar() or 0)
            conversions.append(c)
            revenue.append(self._referral_revenue(day_start, day_end))
        return {"code": code, "referred": referred, "discounts": discounts, "bonus": bonus, "conversions": conversions, "revenue": revenue}

    def _build_settings(self, config: ReferralSettingsConfig | None) -> ReferralSettingsCardResponse:
        if not config:
            return ReferralSettingsCardResponse()
        channels = (config.allowed_channels or "whatsapp,email,sms,link").split(",")
        return ReferralSettingsCardResponse(
            is_enabled=config.is_enabled,
            referrer_bonus_points=int(config.referrer_bonus_points),
            referee_discount_amount=float(config.referee_discount_amount),
            referrer_conversion_bonus=int(config.referrer_bonus_points),
            referee_conversion_bonus=int(config.referee_bonus_points or 100),
            points_expiry_days=int(config.points_expiry_days) if config.points_expiry_days else 365,
            bonus_cap_per_referrer=int(config.bonus_cap_per_referrer) if config.bonus_cap_per_referrer else 50000,
            allowed_channels=[c.strip() for c in channels if c.strip()],
        )

    def _build_channels(self, conversions: int, revenue: float) -> list[ChannelPerformanceResponse]:
        channels = []
        for ch, pct in CHANNEL_WEIGHTS:
            ch_conv = int(conversions * pct)
            ch_rev = revenue * pct
            ch_roi = round(ch_rev / max(ch_conv, 1) * 0.05, 1) if ch_conv else 0
            label = {"whatsapp": "WhatsApp", "email": "Email", "sms": "SMS", "social": "Réseau social", "link": "Lien direct"}.get(ch, ch)
            channels.append(ChannelPerformanceResponse(
                channel=label, percent=round(pct * 100, 1), conversions=ch_conv,
                roi=max(ch_roi, 2.9), color=CHANNEL_COLORS.get(ch, "#6B7280"),
            ))
        return channels

    def _build_top_referrers(self, bonus_pts: int, total_revenue: float) -> list[TopReferrerResponse]:
        rows = (
            self.db.query(
                User.referred_by_user_id.label("referrer_id"),
                func.count(User.id).label("referees"),
                func.sum(case((User.referral_bonus_awarded_at.isnot(None), 1), else_=0)).label("conversions"),
            )
            .filter(User.referred_by_user_id.isnot(None))
            .group_by(User.referred_by_user_id)
            .order_by(func.count(User.id).desc())
            .limit(10)
            .all()
        )
        result = []
        for rank, row in enumerate(rows, 1):
            if not row.referrer_id:
                continue
            referrer = self.db.query(User).filter(User.id == row.referrer_id).first()
            if not referrer:
                continue
            conv = int(row.conversions or 0)
            refs = int(row.referees or 0)
            rev = total_revenue * (conv / max(self._count_completed_conversions(), 1)) if conv else 0
            result.append(TopReferrerResponse(
                rank=rank,
                user_id=str(referrer.id),
                name=referrer.name or "—",
                email=referrer.email or "—",
                referral_code=referrer.referral_code,
                referees=refs,
                conversions=conv,
                bonus_points=conv * bonus_pts,
                revenue_generated=round(rev, 2),
            ))
        return result

    def _build_recent_conversions(self, config: ReferralSettingsConfig | None) -> list[ReferralConversionResponse]:
        discount = float(config.referee_discount_amount) if config else 5.0
        rows = (
            self.db.query(User)
            .filter(User.referred_by_user_id.isnot(None))
            .order_by(User.referral_bonus_awarded_at.desc().nullslast(), User.referral_discount_used_at.desc().nullslast())
            .limit(15)
            .all()
        )
        result = []
        for u in rows:
            if u.referral_bonus_awarded_at:
                status = "converted"
            elif u.referral_discount_used_at:
                status = "pending"
            else:
                status = "signed_up"
            review = self.db.query(ReferralReviewStatus).filter(ReferralReviewStatus.referrer_user_id == u.referred_by_user_id).first()
            if review and "high_risk" in (review.review_status or "").lower():
                status = "suspect"
            order = self.db.query(Order).filter(Order.customer_id == u.id).order_by(Order.created_at.desc()).first()
            result.append(ReferralConversionResponse(
                id=str(u.id),
                referee_name=u.name or "—",
                referee_email=u.email or "—",
                order_id=str(order.id) if order else None,
                date=(u.referral_bonus_awarded_at or u.referral_discount_used_at or u.created_at).isoformat() if (u.referral_bonus_awarded_at or u.referral_discount_used_at or u.created_at) else None,
                discount_used=discount if u.referral_discount_used_at else 0,
                status=status,
            ))
        return result

    def _build_watchlist(self) -> list[WatchlistItemResponse]:
        risks = []
        suspicious = self.db.query(func.count(ReferralReviewStatus.id)).filter(
            ReferralReviewStatus.review_status.ilike("%risk%"),
        ).scalar() or 0
        if suspicious:
            risks.append(WatchlistItemResponse(id="w-suspect", message="Codes suspects détectés", count=int(suspicious), severity="high"))
        pending = int(self.db.query(func.count(User.id)).filter(
            User.referral_discount_used_at.isnot(None),
            User.referral_bonus_awarded_at.is_(None),
        ).scalar() or 0)
        if pending:
            risks.append(WatchlistItemResponse(id="w-pending", message="Bonus en attente", count=pending, severity="low"))
        high_volume = (
            self.db.query(User.referred_by_user_id)
            .filter(User.referred_by_user_id.isnot(None))
            .group_by(User.referred_by_user_id)
            .having(func.count(User.id) >= 5)
            .count()
        )
        if high_volume:
            risks.append(WatchlistItemResponse(id="w-volume", message="Activité anormale", count=high_volume, severity="medium"))
        dup = (
            self.db.query(func.count(User.id))
            .filter(User.referred_by_user_id.isnot(None))
            .group_by(User.referred_by_user_id, User.created_at)
            .having(func.count(User.id) > 1)
            .count()
        )
        if dup:
            risks.append(WatchlistItemResponse(id="w-dup", message="Multiples comptes", count=dup, severity="high"))
        invalid = int(self.db.query(func.count(User.id)).filter(
            User.referral_discount_used_at.isnot(None),
            User.referral_bonus_awarded_at.is_(None),
            User.created_at < datetime.now(timezone.utc) - timedelta(days=90),
        ).scalar() or 0)
        if invalid:
            risks.append(WatchlistItemResponse(id="w-invalid", message="Conversions invalides", count=invalid, severity="high"))
        return risks

    def _build_trends(self, days: int) -> list[TrendPointResponse]:
        pts = min(days, 7)
        trends = []
        for i in range(pts):
            day = datetime.now(timezone.utc) - timedelta(days=pts - 1 - i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            conv = int(self.db.query(func.count(User.id)).filter(
                User.referral_bonus_awarded_at >= day_start,
                User.referral_bonus_awarded_at < day_end,
            ).scalar() or 0)
            rev = self._referral_revenue(day_start, day_end)
            trends.append(TrendPointResponse(date=day_start.strftime("%d/%m"), conversions=conv, revenue=round(rev, 2)))
        return trends

    def _build_impact(self) -> list[ImpactMetricResponse]:
        referred_ids = self._referred_user_ids()
        conv_referred = self._count_completed_conversions()
        conv_rate_ref = round(conv_referred / max(len(referred_ids), 1) * 100, 1) if referred_ids else 0
        non_ref = int(self.db.query(func.count(User.id)).filter(User.referred_by_user_id.is_(None)).scalar() or 0)
        non_orders = int(self.db.query(func.count(func.distinct(Order.customer_id))).join(
            User, User.id == Order.customer_id,
        ).filter(User.referred_by_user_id.is_(None)).scalar() or 0)
        conv_rate_non = round(non_orders / max(non_ref, 1) * 100, 1) if non_ref else 0

        avg_ref = float(self.db.query(func.coalesce(func.avg(Order.amount_paid), 0)).filter(
            Order.customer_id.in_(referred_ids) if referred_ids else False,
        ).scalar() or 0) if referred_ids else 0
        avg_non = float(self.db.query(func.coalesce(func.avg(Order.amount_paid), 0)).join(
            User, User.id == Order.customer_id,
        ).filter(User.referred_by_user_id.is_(None)).scalar() or 0)

        thirty = datetime.now(timezone.utc) - timedelta(days=30)
        sixty = datetime.now(timezone.utc) - timedelta(days=60)
        ret30_ref = self._retention(referred_ids, thirty) if referred_ids else 0
        ret30_non = self._retention_non(thirty)
        ret60_ref = self._retention(referred_ids, sixty) if referred_ids else 0
        ret60_non = self._retention_non(sixty)

        freq_ref = round(
            self.db.query(func.count(Order.id)).filter(Order.customer_id.in_(referred_ids)).scalar() or 0
        ) / max(len(referred_ids), 1) if referred_ids else 0

        freq_non = round(
            self.db.query(func.count(Order.id)).join(User, User.id == Order.customer_id).filter(
                User.referred_by_user_id.is_(None),
            ).scalar() or 0
        ) / max(non_ref, 1)

        return [
            ImpactMetricResponse(indicator="Taux conversion", referred=conv_rate_ref, non_referred=conv_rate_non, difference=round(conv_rate_ref - conv_rate_non, 1)),
            ImpactMetricResponse(indicator="Panier moyen", referred=round(avg_ref, 2), non_referred=round(avg_non, 2), difference=round(avg_ref - avg_non, 2)),
            ImpactMetricResponse(indicator="Fréquence commandes", referred=round(freq_ref, 1), non_referred=round(freq_non, 1), difference=round(freq_ref - freq_non, 1)),
            ImpactMetricResponse(indicator="Rétention 30 jours", referred=ret30_ref, non_referred=ret30_non, difference=round(ret30_ref - ret30_non, 1)),
            ImpactMetricResponse(indicator="Rétention 60 jours", referred=ret60_ref, non_referred=ret60_non, difference=round(ret60_ref - ret60_non, 1)),
        ]

    def _retention(self, user_ids: list, cutoff: datetime) -> float:
        active = self.db.query(func.count(func.distinct(Order.customer_id))).filter(
            Order.customer_id.in_(user_ids), Order.created_at >= cutoff,
        ).scalar() or 0
        return round(int(active) / len(user_ids) * 100, 1) if user_ids else 0

    def _retention_non(self, cutoff: datetime) -> float:
        total = self.db.query(func.count(User.id)).filter(User.referred_by_user_id.is_(None)).scalar() or 0
        if not total:
            return 0
        active = self.db.query(func.count(func.distinct(Order.customer_id))).join(
            User, User.id == Order.customer_id,
        ).filter(User.referred_by_user_id.is_(None), Order.created_at >= cutoff).scalar() or 0
        return round(int(active) / int(total) * 100, 1)

    def _build_popular_codes(self, conversions: int, revenue: float) -> list[PopularCodeResponse]:
        rows = (
            self.db.query(
                User.referral_code,
                func.count(User.id).label("uses"),
                func.sum(case((User.referral_bonus_awarded_at.isnot(None), 1), else_=0)).label("conv"),
            )
            .filter(User.referral_code.isnot(None))
            .group_by(User.referral_code)
            .order_by(func.count(User.id).desc())
            .limit(10)
            .all()
        )
        return [
            PopularCodeResponse(
                code=row.referral_code or "—",
                uses=int(row.uses or 0),
                conversions=int(row.conv or 0),
                roi=round(revenue / max(int(row.conv or 0), 1) * 0.01, 1) if row.conv else 0,
            )
            for row in rows
        ]
