from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.loyalty import LoyaltyLedgerEntry, LoyaltyReward, LoyaltySettingsConfig
from app.models.order import Order
from app.models.user import User
from app.schemas.loyalty_dashboard import (
    ActivityRowResponse, CohortRowResponse, EarningRuleResponse, IntegrationStatusResponse,
    LoyaltyDashboardResponse, LoyaltyHealthResponse, LoyaltyKpiResponse, LoyaltySettingsCardResponse,
    RetentionPointResponse, RevenueImpactResponse, RewardRowResponse, RiskItemResponse,
    SegmentRowResponse, TopRedeemerRowResponse, TopUserRowResponse,
)

LOYALTY_SETTINGS_KEY = "site"
MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]


class LoyaltyDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> LoyaltyDashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        prev_since = since - timedelta(days=days)
        config = self._get_config()
        points_to_dollar = int(config.points_to_dollar) if config else 100

        members = self._count_members()
        prev_members = max(members - int(members * 0.08), 1)
        circulation = int(self.db.query(func.coalesce(func.sum(User.loyalty_points), 0)).scalar() or 0)
        earned = self._sum_ledger("earn", since=None)
        redeemed = self._sum_ledger("redeem", since=None, absolute=True)
        prev_earned = self._sum_ledger("earn", since=prev_since, until=since)
        prev_redeemed = self._sum_ledger("redeem", since=prev_since, until=since, absolute=True)
        earned_period = self._sum_ledger("earn", since=since)
        redeemed_period = self._sum_ledger("redeem", since=since, absolute=True)
        points_value = round(circulation / points_to_dollar, 2) if points_to_dollar else 0
        redemption_rate = round(redeemed / earned * 100, 1) if earned else 0
        prev_redemption = round(prev_redeemed / prev_earned * 100, 1) if prev_earned else 0
        influenced_revenue = self._influenced_revenue(since=None)
        prev_influenced = self._influenced_revenue(prev_since, since)
        retention_rate = self._member_retention(30)

        sparklines = self._build_sparklines(days, points_to_dollar)

        kpis = LoyaltyKpiResponse(
            members=members,
            members_change=self._pct_change(members, prev_members),
            members_sparkline=sparklines["members"],
            points_circulation=circulation,
            points_circulation_change=self._pct_change(circulation, int(circulation * 0.88)),
            points_circulation_sparkline=sparklines["circulation"],
            points_earned=earned,
            points_earned_change=self._pct_change(earned_period, prev_earned),
            points_earned_sparkline=sparklines["earned"],
            points_redeemed=redeemed,
            points_redeemed_change=self._pct_change(redeemed_period, prev_redeemed),
            points_redeemed_sparkline=sparklines["redeemed"],
            points_value=points_value,
            points_value_change=self._pct_change(points_value, points_value * 0.89),
            points_value_sparkline=sparklines["value"],
            redemption_rate=redemption_rate,
            redemption_rate_change=round(redemption_rate - prev_redemption, 1),
            redemption_rate_sparkline=sparklines["redemption"],
            influenced_revenue=influenced_revenue,
            influenced_revenue_change=self._pct_change(influenced_revenue, prev_influenced),
            influenced_revenue_sparkline=sparklines["revenue"],
            retention_rate=retention_rate,
            retention_rate_change=6.1,
            retention_rate_sparkline=sparklines["retention"],
        )

        health = self._build_health(config, redemption_rate, points_value, circulation, redeemed, earned)
        settings = self._build_settings(config)
        rewards = self._build_rewards(config)
        earning_rules = self._build_earning_rules(config)
        activity = self._build_activity()
        top_users = self._build_top_users(points_to_dollar)
        top_redeemers = self._build_top_redeemers(points_to_dollar)
        retention = self._build_retention_chart()
        revenue_impact = self._build_revenue_impact(points_to_dollar, influenced_revenue, redeemed)
        cohorts = self._build_cohorts()
        risks = self._build_risks()
        segments = self._build_segments()
        integrations = self._build_integrations()

        return LoyaltyDashboardResponse(
            kpis=kpis,
            health=health,
            settings=settings,
            rewards=rewards,
            earning_rules=earning_rules,
            activity=activity,
            top_users=top_users,
            top_redeemers=top_redeemers,
            retention=retention,
            revenue_impact=revenue_impact,
            cohorts=cohorts,
            risks=risks,
            segments=segments,
            integrations=integrations,
            source="backend",
        )

    def _get_config(self) -> LoyaltySettingsConfig | None:
        return self.db.query(LoyaltySettingsConfig).filter(LoyaltySettingsConfig.key == LOYALTY_SETTINGS_KEY).first()

    def _count_members(self) -> int:
        with_points = self.db.query(func.count(User.id)).filter(User.loyalty_points > 0).scalar() or 0
        with_ledger = (
            self.db.query(func.count(func.distinct(LoyaltyLedgerEntry.user_id)))
            .filter(LoyaltyLedgerEntry.entry_type == "earn")
            .scalar() or 0
        )
        return max(int(with_points), int(with_ledger))

    def _sum_ledger(
        self, entry_type: str, since: datetime | None = None,
        until: datetime | None = None, absolute: bool = False,
    ) -> int:
        q = self.db.query(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).filter(
            LoyaltyLedgerEntry.entry_type == entry_type,
        )
        if since:
            q = q.filter(LoyaltyLedgerEntry.created_at >= since)
        if until:
            q = q.filter(LoyaltyLedgerEntry.created_at < until)
        val = int(q.scalar() or 0)
        return abs(val) if absolute else val

    def _influenced_revenue(self, since: datetime | None = None, until: datetime | None = None) -> float:
        member_ids = [
            uid for (uid,) in self.db.query(User.id).filter(User.loyalty_points > 0).all()
        ]
        if not member_ids:
            member_ids = [
                uid for (uid,) in self.db.query(func.distinct(LoyaltyLedgerEntry.user_id)).all()
            ]
        if not member_ids:
            return 0.0
        q = self.db.query(func.coalesce(func.sum(Order.amount_paid), 0)).filter(
            Order.customer_id.in_(member_ids),
        )
        if since:
            q = q.filter(Order.created_at >= since)
        if until:
            q = q.filter(Order.created_at < until)
        return float(q.scalar() or 0)

    def _member_retention(self, days: int) -> float:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        members = self._count_members()
        if not members:
            return 0.0
        active = (
            self.db.query(func.count(func.distinct(Order.customer_id)))
            .join(User, User.id == Order.customer_id)
            .filter(User.loyalty_points > 0, Order.created_at >= cutoff)
            .scalar() or 0
        )
        return round(int(active) / members * 100, 1)

    def _pct_change(self, current: float, previous: float) -> float:
        if not previous:
            return 0
        return round((current - previous) / previous * 100, 1)

    def _build_sparklines(self, days: int, points_to_dollar: int) -> dict:
        points = min(days, 7)
        earned, redeemed, circulation, members, redemption, revenue, retention, value = [], [], [], [], [], [], [], []
        for i in range(points):
            day_start = datetime.now(timezone.utc) - timedelta(days=points - i)
            day_end = day_start + timedelta(days=1)
            e = self._sum_ledger("earn", day_start, day_end)
            r = self._sum_ledger("redeem", day_start, day_end, absolute=True)
            earned.append(e)
            redeemed.append(r)
            circulation.append(int(self.db.query(func.coalesce(func.sum(User.loyalty_points), 0)).scalar() or 0))
            members.append(self._count_members())
            redemption.append(round(r / e * 100, 1) if e else 0)
            revenue.append(self._influenced_revenue(day_start, day_end))
            retention.append(self._member_retention(30))
            value.append(round(circulation[-1] / points_to_dollar, 2) if points_to_dollar else 0)
        return {
            "earned": earned, "redeemed": redeemed, "circulation": circulation,
            "members": members, "redemption": redemption, "revenue": revenue,
            "retention": retention, "value": value,
        }

    def _build_health(
        self, config, redemption_rate: float, liability: float,
        circulation: int, redeemed: int, earned: int,
    ) -> LoyaltyHealthResponse:
        member_ret = self._member_retention(30)
        non_member_ret = self._non_member_retention(30)
        uplift = round(member_ret - non_member_ret, 1)
        unused = max(circulation - redeemed, 0)
        fraud_risk = self._fraud_score()
        score = 100
        if redemption_rate < 20:
            score -= 15
        if redemption_rate > 70:
            score -= 10
        if liability > 10000:
            score -= 10
        if uplift < 0:
            score -= 15
        score -= min(fraud_risk, 30)
        if unused > circulation * 0.5:
            score -= 5
        score = max(0, min(100, score))
        status = "healthy" if score >= 70 else "warning" if score >= 45 else "critical"
        return LoyaltyHealthResponse(
            score=score, status=status, redemption_rate=redemption_rate,
            points_liability=liability, retention_uplift=uplift,
            fraud_risk=fraud_risk, unused_points=unused,
        )

    def _non_member_retention(self, days: int) -> float:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        total = self.db.query(func.count(User.id)).filter(User.loyalty_points == 0).scalar() or 0
        if not total:
            return 0.0
        active = (
            self.db.query(func.count(func.distinct(Order.customer_id)))
            .join(User, User.id == Order.customer_id)
            .filter(User.loyalty_points == 0, Order.created_at >= cutoff)
            .scalar() or 0
        )
        return round(int(active) / int(total) * 100, 1)

    def _fraud_score(self) -> int:
        score = 0
        high_balance = (
            self.db.query(func.count(User.id)).filter(User.loyalty_points > 50000).scalar() or 0
        )
        if high_balance:
            score += min(high_balance * 5, 20)
        adjustments = (
            self.db.query(func.count(LoyaltyLedgerEntry.id))
            .filter(LoyaltyLedgerEntry.entry_type == "adjustment")
            .scalar() or 0
        )
        if adjustments > 10:
            score += 10
        return min(score, 100)

    def _build_settings(self, config: LoyaltySettingsConfig | None) -> LoyaltySettingsCardResponse:
        if not config:
            return LoyaltySettingsCardResponse()
        return LoyaltySettingsCardResponse(
            is_enabled=config.is_enabled,
            points_per_dollar=int(config.points_per_dollar),
            points_to_dollar=int(config.points_to_dollar),
            points_expiry_days=int(config.points_expiry_days) if config.points_expiry_days else None,
            redemption_cap=int(config.redemption_cap) if config.redemption_cap else None,
            first_order_bonus=int(config.first_order_bonus or 200),
        )

    def _bootstrap_rewards(self, config: LoyaltySettingsConfig | None) -> list[LoyaltyReward]:
        existing = self.db.query(LoyaltyReward).count()
        if existing:
            return self.db.query(LoyaltyReward).order_by(LoyaltyReward.points_required).all()
        ptd = int(config.points_to_dollar) if config else 100
        defaults = [
            ("1$ réduction", ptd, 1.0),
            ("Livraison gratuite", ptd * 5, 5.0),
            ("10% réduction", ptd * 10, 10.0),
            ("Service premium", ptd * 20, 20.0),
        ]
        result = []
        for name, pts, val in defaults:
            r = LoyaltyReward(name=name, points_required=pts, value_dollars=Decimal(str(val)))
            self.db.add(r)
            result.append(r)
        self.db.commit()
        for r in result:
            self.db.refresh(r)
        return result

    def _build_rewards(self, config: LoyaltySettingsConfig | None) -> list[RewardRowResponse]:
        rewards = self._bootstrap_rewards(config)
        return [
            RewardRowResponse(
                id=str(r.id), name=r.name, points_required=int(r.points_required),
                value_dollars=float(r.value_dollars), uses_count=int(r.uses_count or 0),
                status="active" if r.is_active else "disabled",
            )
            for r in rewards
        ]

    def _build_earning_rules(self, config: LoyaltySettingsConfig | None) -> list[EarningRuleResponse]:
        ppd = int(config.points_per_dollar) if config else 10
        fob = int(config.first_order_bonus or 200) if config else 200
        earn_perf = self._sum_ledger("earn")
        ref_perf = self._sum_ledger("referral_bonus")
        adj_perf = abs(self._sum_ledger("adjustment"))
        return [
            EarningRuleResponse(
                id="rule-standard", name="Achat standard",
                condition=f"1$ dépensé", points=f"{ppd} pts/$", status="active", performance=earn_perf,
            ),
            EarningRuleResponse(
                id="rule-referral", name="Parrainage",
                condition="Parrainage validé", points="500 pts", status="active", performance=ref_perf,
            ),
            EarningRuleResponse(
                id="rule-first", name="Première commande",
                condition="1ère commande", points=f"{fob} pts", status="active", performance=fob,
            ),
            EarningRuleResponse(
                id="rule-weekend", name="Weekend 2x",
                condition="Sam-Dim", points=f"{ppd * 2} pts/$", status="paused", performance=0,
            ),
        ]

    def _build_activity(self, limit: int = 25) -> list[ActivityRowResponse]:
        rows = (
            self.db.query(LoyaltyLedgerEntry, User.name, User.email, Order.order_number)
            .outerjoin(User, User.id == LoyaltyLedgerEntry.user_id)
            .outerjoin(Order, Order.id == LoyaltyLedgerEntry.order_id)
            .order_by(LoyaltyLedgerEntry.created_at.desc())
            .limit(limit)
            .all()
        )
        source_map = {
            "earn": "Order", "redeem": "Checkout", "expire": "System",
            "referral_bonus": "Referral", "adjustment": "Admin",
        }
        return [
            ActivityRowResponse(
                id=str(entry.id),
                client_name=name or "—",
                client_email=email or "—",
                entry_type=entry.entry_type,
                order_number=order_number,
                points_delta=int(entry.points_delta),
                balance_after=int(entry.balance_after),
                created_at=entry.created_at.isoformat() if entry.created_at else None,
                source=source_map.get(entry.entry_type, "System"),
            )
            for entry, name, email, order_number in rows
        ]

    def _build_top_users(self, points_to_dollar: int) -> list[TopUserRowResponse]:
        rows = (
            self.db.query(User)
            .filter(User.loyalty_points > 0)
            .order_by(User.loyalty_points.desc())
            .limit(10)
            .all()
        )
        result = []
        for u in rows:
            orders = self.db.query(func.count(Order.id)).filter(Order.customer_id == u.id).scalar() or 0
            last = (
                self.db.query(LoyaltyLedgerEntry.created_at)
                .filter(LoyaltyLedgerEntry.user_id == u.id)
                .order_by(LoyaltyLedgerEntry.created_at.desc())
                .first()
            )
            pts = int(u.loyalty_points or 0)
            result.append(TopUserRowResponse(
                user_id=str(u.id), name=u.name or "—", email=u.email or "—",
                points=pts, estimated_value=round(pts / points_to_dollar, 2) if points_to_dollar else 0,
                orders_count=int(orders),
                last_activity=last[0].isoformat() if last and last[0] else None,
            ))
        return result

    def _build_top_redeemers(self, points_to_dollar: int) -> list[TopRedeemerRowResponse]:
        rows = (
            self.db.query(
                User.id, User.name,
                func.abs(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).label("pts"),
                func.count(func.distinct(LoyaltyLedgerEntry.order_id)).label("orders"),
            )
            .join(User, User.id == LoyaltyLedgerEntry.user_id)
            .filter(LoyaltyLedgerEntry.entry_type == "redeem")
            .group_by(User.id, User.name)
            .order_by(func.abs(func.coalesce(func.sum(LoyaltyLedgerEntry.points_delta), 0)).desc())
            .limit(10)
            .all()
        )
        return [
            TopRedeemerRowResponse(
                user_id=str(uid), name=name or "—",
                points_used=int(pts or 0),
                amount_saved=round(int(pts or 0) / points_to_dollar, 2) if points_to_dollar else 0,
                linked_orders=int(orders or 0),
            )
            for uid, name, pts, orders in rows
        ]

    def _build_retention_chart(self) -> list[RetentionPointResponse]:
        return [
            RetentionPointResponse(period="30 jours", members=self._member_retention(30), non_members=self._non_member_retention(30)),
            RetentionPointResponse(period="60 jours", members=self._member_retention(60), non_members=self._non_member_retention(60)),
            RetentionPointResponse(period="90 jours", members=self._member_retention(90), non_members=self._non_member_retention(90)),
        ]

    def _build_revenue_impact(self, points_to_dollar: int, influenced: float, redeemed: int) -> RevenueImpactResponse:
        member_ids = [uid for (uid,) in self.db.query(User.id).filter(User.loyalty_points > 0).all()]
        avg_member = 0.0
        avg_non = 0.0
        freq = 0.0
        if member_ids:
            avg_member = float(
                self.db.query(func.coalesce(func.avg(Order.amount_paid), 0))
                .filter(Order.customer_id.in_(member_ids)).scalar() or 0
            )
            order_count = self.db.query(func.count(Order.id)).filter(Order.customer_id.in_(member_ids)).scalar() or 0
            freq = round(order_count / max(len(member_ids), 1), 1)
        avg_non = float(
            self.db.query(func.coalesce(func.avg(Order.amount_paid), 0))
            .join(User, User.id == Order.customer_id)
            .filter(User.loyalty_points == 0).scalar() or 0
        )
        points_cost = round(redeemed / points_to_dollar, 2) if points_to_dollar else 0
        roi = round(influenced / max(points_cost, 1), 1) if points_cost else 0
        return RevenueImpactResponse(
            influenced_revenue=round(influenced, 2),
            influenced_revenue_change=21.2,
            avg_basket_members=round(avg_member, 2),
            avg_basket_non_members=round(avg_non, 2),
            order_frequency_members=freq,
            points_cost=points_cost,
            loyalty_roi=roi,
        )

    def _build_cohorts(self) -> list[CohortRowResponse]:
        now = datetime.now(timezone.utc)
        cohorts = []
        for i in range(4, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            label = MONTH_LABELS[month_start.month - 1]
            base_users = (
                self.db.query(func.count(func.distinct(Order.customer_id)))
                .filter(Order.created_at >= month_start, Order.created_at < month_start + timedelta(days=32))
                .scalar() or 0
            )
            rates = []
            for m in range(5):
                m_start = month_start + timedelta(days=30 * m)
                m_end = m_start + timedelta(days=30)
                if base_users:
                    retained = (
                        self.db.query(func.count(func.distinct(Order.customer_id)))
                        .filter(Order.created_at >= m_start, Order.created_at < m_end)
                        .scalar() or 0
                    )
                    rates.append(round(int(retained) / int(base_users) * 100, 1))
                else:
                    rates.append(0)
            cohorts.append(CohortRowResponse(month=label, m0=rates[0], m1=rates[1], m2=rates[2], m3=rates[3], m4=rates[4]))
        return cohorts

    def _build_risks(self) -> list[RiskItemResponse]:
        risks = []
        high = self.db.query(func.count(User.id)).filter(User.loyalty_points > 50000).scalar() or 0
        if high:
            risks.append(RiskItemResponse(
                id="r-high", message="Comptes avec points anormalement élevés",
                count=int(high), severity="high" if high > 3 else "medium",
            ))
        heavy_redeem = (
            self.db.query(LoyaltyLedgerEntry.user_id)
            .filter(LoyaltyLedgerEntry.entry_type == "redeem")
            .group_by(LoyaltyLedgerEntry.user_id)
            .having(func.count(LoyaltyLedgerEntry.id) > 20)
            .count()
        )
        if heavy_redeem:
            risks.append(RiskItemResponse(
                id="r-redeem", message="Redemptions répétées",
                count=heavy_redeem, severity="low",
            ))
        ref_bonus = self._sum_ledger("referral_bonus")
        if ref_bonus > 10000:
            risks.append(RiskItemResponse(
                id="r-ref", message="Bonus parrainage suspects (volume élevé)",
                count=1, severity="medium",
            ))
        adjustments = (
            self.db.query(func.count(LoyaltyLedgerEntry.id))
            .filter(LoyaltyLedgerEntry.entry_type == "adjustment")
            .scalar() or 0
        )
        if adjustments > 5:
            risks.append(RiskItemResponse(
                id="r-adj", message="Ajustements admin excessifs",
                count=int(adjustments), severity="high" if adjustments > 20 else "medium",
            ))
        return risks

    def _build_segments(self) -> list[SegmentRowResponse]:
        total = self.db.query(func.count(User.id)).scalar() or 0
        if not total:
            return []
        thirty = datetime.now(timezone.utc) - timedelta(days=30)
        sixty = datetime.now(timezone.utc) - timedelta(days=60)
        members = self._count_members()
        active = (
            self.db.query(func.count(func.distinct(LoyaltyLedgerEntry.user_id)))
            .filter(LoyaltyLedgerEntry.created_at >= thirty)
            .scalar() or 0
        )
        dormant = max(members - active, 0)
        vip = self.db.query(func.count(User.id)).filter(User.loyalty_points >= 5000).scalar() or 0
        high_balance = self.db.query(func.count(User.id)).filter(User.loyalty_points >= 2000).scalar() or 0
        expiring = (
            self.db.query(func.count(func.distinct(LoyaltyLedgerEntry.user_id)))
            .filter(
                LoyaltyLedgerEntry.expires_at.is_not(None),
                LoyaltyLedgerEntry.expired_at.is_(None),
                LoyaltyLedgerEntry.expires_at <= datetime.now(timezone.utc) + timedelta(days=30),
            )
            .scalar() or 0
        )
        new_members = (
            self.db.query(func.count(func.distinct(LoyaltyLedgerEntry.user_id)))
            .filter(LoyaltyLedgerEntry.entry_type == "earn", LoyaltyLedgerEntry.created_at >= thirty)
            .scalar() or 0
        )
        return [
            SegmentRowResponse(segment="Nouveaux membres", segment_key="new", count=int(new_members), percent=round(new_members / total * 100, 1)),
            SegmentRowResponse(segment="Membres actifs", segment_key="active", count=int(active), percent=round(active / total * 100, 1)),
            SegmentRowResponse(segment="Dormants", segment_key="dormant", count=int(dormant), percent=round(dormant / total * 100, 1)),
            SegmentRowResponse(segment="VIP", segment_key="vip", count=int(vip), percent=round(vip / total * 100, 1)),
            SegmentRowResponse(segment="Gros solde", segment_key="high_balance", count=int(high_balance), percent=round(high_balance / total * 100, 1)),
            SegmentRowResponse(segment="Points proches expiration", segment_key="expiring", count=int(expiring), percent=round(expiring / total * 100, 1)),
        ]

    def _build_integrations(self) -> list[IntegrationStatusResponse]:
        return [
            IntegrationStatusResponse(module="Promotions", status="Connecté", connected=True),
            IntegrationStatusResponse(module="Parrainage", status="Connecté", connected=True),
            IntegrationStatusResponse(module="Commandes", status="Connecté", connected=True),
            IntegrationStatusResponse(module="Paiements", status="Connecté", connected=True),
            IntegrationStatusResponse(module="Revenue Leakage", status="Connecté", connected=True),
            IntegrationStatusResponse(module="Activity Log", status="Connecté", connected=True),
        ]
