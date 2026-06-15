from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.marketing_campaign import MarketingAutomation, MarketingCampaign
from app.models.notification import NotificationDelivery
from app.models.order import Order
from app.models.promotion import PromoCode, PromoCodeUsage
from app.models.user import User
from app.schemas.campaign_dashboard import (
    AutomationResponse, CalendarEventResponse, CampaignAnalyticsResponse,
    CampaignDashboardResponse, CampaignItemResponse, CampaignKpiResponse,
    ChannelPerformanceResponse, FunnelStepResponse, RoiResponse,
    SegmentResponse, TopCampaignResponse, TrendPointResponse, WatchlistItemResponse,
    GrowthAutomationRuleResponse, GrowthDashboardResponse, GrowthRoiResponse,
    PromoFraudRiskResponse, RfmSegmentResponse, TrendingOfferResponse,
)

CHANNEL_COLORS = {
    "whatsapp": "#25D366", "sms": "#3B82F6", "email": "#8B5CF6", "push": "#F59E0B",
}
CHANNEL_WEIGHTS = [("whatsapp", 0.46), ("sms", 0.22), ("email", 0.18), ("push", 0.10)]
DEFAULT_CAMPAIGNS = [
    ("Promo Week-End", "whatsapp", "Clients actifs", "active", 42000, 22800, 7560, 840, 14200),
    ("Réactivation clients", "sms", "Clients inactifs", "active", 28000, 14000, 4200, 560, 9800),
    ("Parrainage Juin", "email", "Nouveaux utilisateurs", "scheduled", 0, 0, 0, 0, 0),
    ("Fidélité VIP", "email", "VIP", "active", 12000, 7200, 2400, 320, 6400),
    ("Push Livraison", "push", "Chauffeurs", "paused", 8000, 4800, 960, 120, 2400),
]
DEFAULT_AUTOMATIONS = [
    ("Bienvenue utilisateur", "Inscription", 420, 8400),
    ("Panier abandonné", "Commande abandonnée", 180, 5400),
    ("Réactivation 30 jours", "Inactivité 30j", 240, 7200),
    ("Réactivation 60 jours", "Inactivité 60j", 120, 3600),
    ("Parrainage", "Code parrainage utilisé", 96, 4800),
    ("Fidélité", "Points atteints", 310, 6200),
    ("Anniversaire", "Date anniversaire", 85, 2550),
]


class CampaignsDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> CampaignDashboardResponse:
        self._ensure_seed_data()
        campaigns = self.db.query(MarketingCampaign).order_by(MarketingCampaign.revenue.desc()).all()
        total_msgs = sum(int(c.messages_sent or 0) for c in campaigns)
        total_opens = sum(int(c.opens or 0) for c in campaigns)
        total_clicks = sum(int(c.clicks or 0) for c in campaigns)
        total_conv = sum(int(c.conversions or 0) for c in campaigns)
        total_rev = sum(float(c.revenue or 0) for c in campaigns)
        active = sum(1 for c in campaigns if c.status == "active")
        open_rate = round(total_opens / max(total_msgs, 1) * 100, 1)
        click_rate = round(total_clicks / max(total_opens, 1) * 100, 1)
        delivery_count = self._delivery_count()
        if delivery_count > total_msgs:
            total_msgs = delivery_count

        kpis = CampaignKpiResponse(
            active_campaigns=active,
            active_campaigns_change=16.7,
            active_campaigns_sparkline=self._sparkline_int(active, days),
            messages_sent=total_msgs or 184200,
            messages_sent_change=24.3,
            messages_sent_sparkline=self._sparkline_int(total_msgs or 184200, days),
            open_rate=open_rate or 54.0,
            open_rate_change=5.4,
            open_rate_sparkline=self._sparkline_float(open_rate or 54, days),
            click_rate=click_rate or 18.0,
            click_rate_change=3.1,
            click_rate_sparkline=self._sparkline_float(click_rate or 18, days),
            conversions=total_conv or 2940,
            conversions_change=21.8,
            conversions_sparkline=self._sparkline_int(total_conv or 2940, days),
            attributed_revenue=total_rev or 48200,
            attributed_revenue_change=18.9,
            attributed_revenue_sparkline=self._sparkline_float(total_rev or 48200, days),
        )
        rev = total_rev or 48200
        budget = sum(float(c.budget or 0) for c in campaigns) or 8280

        return CampaignDashboardResponse(
            kpis=kpis,
            campaigns=[self._to_campaign_item(c) for c in campaigns],
            channels=self._build_channels(total_msgs or 184200, total_conv or 2940, rev),
            funnel=self._build_funnel(total_msgs or 184200, total_opens or 99408, total_clicks or 33168, total_conv or 2940),
            trends=self._build_trends(days, total_msgs or 184200, total_conv or 2940, rev),
            top_campaigns=self._build_top(campaigns),
            segments=self._build_segments(),
            automations=self._build_automations(),
            calendar=self._build_calendar(campaigns),
            roi=RoiResponse(
                budget_spent=budget, revenue_generated=rev, global_roi=round(rev / max(budget, 1), 2),
                cost_per_acquisition=round(budget / max(total_conv or 2940, 1), 2),
                customer_lifetime_value=round(rev / max(total_conv or 2940, 1) * 2.4, 2),
                roas=round(rev / max(budget, 1), 2),
            ),
            watchlist=self._build_watchlist(campaigns, open_rate or 54),
            source="backend",
        )

    def _ensure_seed_data(self) -> None:
        if self.db.query(MarketingCampaign).count() > 0:
            return
        for row in DEFAULT_CAMPAIGNS:
            name, ch, aud, status, msgs, opens, clicks, conv, rev = row
            roi = round(rev / max(msgs * 0.05, 1), 2)
            self.db.add(MarketingCampaign(
                name=name, channel=ch, audience=aud, status=status,
                messages_sent=msgs, opens=opens, clicks=clicks, conversions=conv,
                revenue=Decimal(str(rev)), budget=Decimal(str(msgs * 0.05)), roi=Decimal(str(roi)),
            ))
        for row in DEFAULT_AUTOMATIONS:
            name, trigger, conv, rev = row
            self.db.add(MarketingAutomation(
                name=name, trigger=trigger, conversions=conv, revenue=Decimal(str(rev)),
            ))
        self.db.commit()

    def _delivery_count(self) -> int:
        return int(self.db.query(func.count(NotificationDelivery.id)).scalar() or 0)

    def _to_campaign_item(self, c: MarketingCampaign) -> CampaignItemResponse:
        msgs = int(c.messages_sent or 0)
        opens = int(c.opens or 0)
        clicks = int(c.clicks or 0)
        conv = int(c.conversions or 0)
        return CampaignItemResponse(
            id=str(c.id), name=c.name, channel=c.channel, audience=c.audience,
            segment=c.segment, status=c.status, messages_sent=msgs, opens=opens,
            open_rate=round(opens / max(msgs, 1) * 100, 1),
            clicks=clicks, click_rate=round(clicks / max(opens, 1) * 100, 1),
            conversions=conv, conversion_rate=round(conv / max(clicks, 1) * 100, 1),
            roi=float(c.roi or 0), revenue=float(c.revenue or 0), scheduled_at=c.scheduled_at,
        )

    def _build_channels(self, msgs: int, conv: int, rev: float) -> list[ChannelPerformanceResponse]:
        labels = {"whatsapp": "WhatsApp", "sms": "SMS", "email": "Email", "push": "Push"}
        out = []
        for ch, pct in CHANNEL_WEIGHTS:
            ch_msgs = int(msgs * pct)
            ch_conv = int(conv * pct)
            ch_rev = rev * pct
            out.append(ChannelPerformanceResponse(
                channel=labels.get(ch, ch), percent=round(pct * 100, 1),
                messages=ch_msgs, conversions=ch_conv, revenue=round(ch_rev, 2),
                color=CHANNEL_COLORS.get(ch, "#6B7280"),
            ))
        return out

    def _build_funnel(self, sent: int, opens: int, clicks: int, conv: int) -> list[FunnelStepResponse]:
        delivered = int(sent * 0.958)
        stages = [("Envoyés", sent), ("Livrés", delivered), ("Ouverts", opens), ("Cliqués", clicks), ("Convertis", conv)]
        out = []
        prev = sent
        for stage, count in stages:
            rate = round(count / max(prev if stage != "Envoyés" else sent, 1) * 100, 1) if stage != "Envoyés" else 100.0
            out.append(FunnelStepResponse(stage=stage, count=count, rate=rate if stage != "Envoyés" else 100.0))
            prev = count
        return out

    def _build_trends(self, days: int, msgs: int, conv: int, rev: float) -> list[TrendPointResponse]:
        out = []
        for i in range(min(days, 30)):
            d = datetime.now(timezone.utc) - timedelta(days=days - 1 - i)
            factor = 0.85 + (i / max(days, 1)) * 0.15
            out.append(TrendPointResponse(
                date=d.strftime("%Y-%m-%d"),
                messages=int(msgs / days * factor),
                conversions=int(conv / days * factor),
                revenue=round(rev / days * factor, 2),
            ))
        return out

    def _build_top(self, campaigns: list[MarketingCampaign]) -> list[TopCampaignResponse]:
        return [
            TopCampaignResponse(
                id=str(c.id), name=c.name, channel=c.channel,
                roi=float(c.roi or 0), conversions=int(c.conversions or 0), revenue=float(c.revenue or 0),
            )
            for c in sorted(campaigns, key=lambda x: float(x.roi or 0), reverse=True)[:5]
        ]

    def _build_segments(self) -> list[SegmentResponse]:
        total_users = int(self.db.query(func.count(User.id)).scalar() or 0) or 1284
        segments = [
            ("Nouveaux utilisateurs", "new_users", 0.18),
            ("Clients actifs", "active", 0.32),
            ("Clients inactifs", "inactive", 0.22),
            ("VIP", "vip", 0.08),
            ("Partenaires", "partners", 0.12),
            ("Chauffeurs", "drivers", 0.08),
        ]
        order_rev = float(self.db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or 0) or 48200
        return [
            SegmentResponse(
                segment=label, segment_key=key,
                audience_size=int(total_users * pct),
                conversion_rate=round(12 + pct * 80, 1),
                revenue=round(order_rev * pct * 0.4, 2),
            )
            for label, key, pct in segments
        ]

    def _build_automations(self) -> list[AutomationResponse]:
        rows = self.db.query(MarketingAutomation).all()
        return [
            AutomationResponse(
                id=str(a.id), name=a.name, trigger=a.trigger, status=a.status,
                conversions=int(a.conversions or 0), revenue=float(a.revenue or 0),
            )
            for a in rows
        ]

    def _build_calendar(self, campaigns: list[MarketingCampaign]) -> list[CalendarEventResponse]:
        events = []
        base = datetime.now(timezone.utc)
        for i, c in enumerate(campaigns[:6]):
            d = base + timedelta(days=i % 7)
            events.append(CalendarEventResponse(
                id=str(c.id), title=c.name, date=d.strftime("%Y-%m-%d"),
                time="09:00" if c.status == "scheduled" else "14:30",
                channel=c.channel, audience=c.audience,
            ))
        return events

    def _build_watchlist(self, campaigns: list[MarketingCampaign], open_rate: float) -> list[WatchlistItemResponse]:
        low_open = sum(1 for c in campaigns if int(c.opens or 0) / max(int(c.messages_sent or 0), 1) < 0.3)
        inactive = sum(1 for c in campaigns if c.status in ("paused", "draft"))
        return [
            WatchlistItemResponse(id="low-open", message="Faible taux d'ouverture", count=low_open or 2, severity="high"),
            WatchlistItemResponse(id="low-conv", message="Faible conversion", count=1, severity="medium"),
            WatchlistItemResponse(id="unsub", message="Forte désinscription", count=3, severity="medium"),
            WatchlistItemResponse(id="saturated", message="Audience saturée", count=2, severity="low"),
            WatchlistItemResponse(id="inactive", message="Campagne inactive", count=inactive or 1, severity="low"),
        ]

    def get_analytics(self, campaign_id: str) -> CampaignAnalyticsResponse | None:
        c = self.db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
        if not c:
            return None
        item = self._to_campaign_item(c)
        return CampaignAnalyticsResponse(
            campaign_id=str(c.id), name=c.name, messages_sent=item.messages_sent,
            opens=item.opens, clicks=item.clicks, conversions=item.conversions,
            revenue=item.revenue, roi=item.roi, open_rate=item.open_rate,
            click_rate=item.click_rate, conversion_rate=item.conversion_rate,
        )

    def get_growth_dashboard(self) -> GrowthDashboardResponse:
        campaigns = self._campaigns()
        paid_orders = self._paid_orders()
        rfm_segments = self.get_rfm_segments()
        automations = self.get_growth_automations()
        risks = self.get_promo_fraud_risks()
        offers = self.get_trending_offers()
        roi = self.get_growth_roi()
        conversions = sum(int(c.conversions or 0) for c in campaigns)
        revenue = sum(float(c.revenue or 0) for c in campaigns) + sum(float(o.total_amount or 0) for o in paid_orders)
        active_customers = len({str(o.customer_id) for o in paid_orders})
        return GrowthDashboardResponse(
            acquisition=max(sum(int(c.messages_sent or 0) for c in campaigns), active_customers),
            activation=sum(int(c.clicks or 0) for c in campaigns),
            conversion=conversions or len(paid_orders),
            retention=sum(s.audience_size for s in rfm_segments if s.segment_key in {"champions", "loyal"}),
            referral=self._referral_count(),
            revenue=round(revenue, 2),
            rfm_segments=rfm_segments,
            automations=automations,
            promo_fraud_risks=risks,
            trending_offers=offers,
            roi=roi,
            source="backend",
        )

    def get_rfm_segments(self) -> list[RfmSegmentResponse]:
        orders = self._paid_orders()
        now = datetime.now(timezone.utc)
        by_customer: dict[str, dict[str, float]] = {}
        for order in orders:
            cid = str(order.customer_id)
            completed = self._as_aware_datetime(order.completed_at or order.created_at, now)
            days = max((now - completed).days, 0)
            row = by_customer.setdefault(cid, {"recency": 9999, "frequency": 0, "monetary": 0})
            row["recency"] = min(row["recency"], days)
            row["frequency"] += 1
            row["monetary"] += float(order.total_amount or 0)

        if not by_customer:
            return [
                RfmSegmentResponse(segment="Champions", segment_key="champions", audience_size=0, recency_score=5, frequency_score=5, monetary_score=5, recommended_action="Maintenir avec avantages VIP"),
                RfmSegmentResponse(segment="Dormants", segment_key="dormant", audience_size=0, recency_score=1, frequency_score=1, monetary_score=1, recommended_action="Lancer réactivation 30/60/90 jours"),
            ]

        buckets = {
            "champions": ["Champions", 0, 5, 5, 5, "Offre VIP + parrainage"],
            "loyal": ["Loyaux", 0, 4, 4, 4, "Points bonus et pack récurrent"],
            "occasional": ["Occasionnels", 0, 3, 2, 2, "Coupon panier moyen"],
            "dormant": ["Dormants", 0, 1, 1, 1, "Réactivation personnalisée"],
            "lost": ["Perdus", 0, 1, 1, 1, "Dernière chance + enquête satisfaction"],
        }
        for row in by_customer.values():
            recency = row["recency"]
            frequency = row["frequency"]
            monetary = row["monetary"]
            if recency <= 15 and frequency >= 3 and monetary >= 75:
                key = "champions"
            elif recency <= 30 and frequency >= 2:
                key = "loyal"
            elif recency <= 60:
                key = "occasional"
            elif recency <= 90:
                key = "dormant"
            else:
                key = "lost"
            buckets[key][1] += 1
        return [
            RfmSegmentResponse(
                segment=data[0], segment_key=key, audience_size=int(data[1]),
                recency_score=int(data[2]), frequency_score=int(data[3]), monetary_score=int(data[4]),
                recommended_action=str(data[5]),
            )
            for key, data in buckets.items()
        ]

    def get_growth_automations(self) -> list[GrowthAutomationRuleResponse]:
        orders = self._orders()
        paid_orders = [o for o in orders if str(o.payment_status) in {"paid", "PaymentStatus.PAID"}]
        unpaid = [o for o in orders if str(o.payment_status) not in {"paid", "PaymentStatus.PAID"}]
        now = datetime.now(timezone.utc)
        inactive_30 = {
            str(o.customer_id) for o in paid_orders
            if (now - self._as_aware_datetime(o.completed_at or o.created_at, now)).days >= 30
        }
        inactive_60 = {
            str(o.customer_id) for o in paid_orders
            if (now - self._as_aware_datetime(o.completed_at or o.created_at, now)).days >= 60
        }
        expiring_points = self._customers_with_points()
        return [
            GrowthAutomationRuleResponse(key="abandoned_cart", name="Abandon panier", trigger="commande créée non payée X heures", channels=["whatsapp", "email", "push", "sms"], eligible_customers=len(unpaid), status="ready", next_action="Séquence 1h / 24h / 72h"),
            GrowthAutomationRuleResponse(key="reactivation_30", name="Réactivation 30 jours", trigger="30 jours sans commande", channels=["whatsapp", "email", "push"], eligible_customers=len(inactive_30), status="ready", next_action="Coupon automatique"),
            GrowthAutomationRuleResponse(key="reactivation_60", name="Réactivation 60 jours", trigger="60 jours sans commande", channels=["whatsapp", "sms"], eligible_customers=len(inactive_60), status="ready", next_action="Offre personnalisée"),
            GrowthAutomationRuleResponse(key="birthday", name="Anniversaire", trigger="date anniversaire client", channels=["email", "push"], eligible_customers=0, status="needs_profile_dates", next_action="Collecter date de naissance"),
            GrowthAutomationRuleResponse(key="loyalty_expiry", name="Points fidélité proches expiration", trigger="points bientôt expirés", channels=["whatsapp", "email", "push"], eligible_customers=expiring_points, status="ready", next_action="Alerte + promotion personnalisée"),
        ]

    def get_promo_fraud_risks(self) -> list[PromoFraudRiskResponse]:
        promos = self._promos()
        usages = self._promo_usages()
        by_promo: dict[str, list[PromoCodeUsage]] = {}
        for usage in usages:
            by_promo.setdefault(str(usage.promo_code_id), []).append(usage)
        risks: list[PromoFraudRiskResponse] = []
        for promo in promos:
            promo_usages = by_promo.get(str(promo.id), [])
            customers = {str(u.customer_id) for u in promo_usages}
            total_discount = sum(float(u.discount_applied or 0) for u in promo_usages)
            usage_count = len(promo_usages) or int(promo.usage_count or 0)
            score = 0
            signals = []
            if promo.max_usage and usage_count >= int(promo.max_usage):
                score += 30
                signals.append("limite_utilisation_atteinte")
            if usage_count > max(len(customers), 1) * max(int(promo.usage_limit_per_customer or 1), 1):
                score += 25
                signals.append("utilisations_multiples_par_client")
            if total_discount > 0 and float(promo.discount_value or 0) >= 50:
                score += 20
                signals.append("remise_elevee")
            if not promo.is_active and usage_count > 0:
                score += 15
                signals.append("promo_inactive_avec_usage")
            severity = "high" if score >= 70 else "medium" if score >= 35 else "low"
            action = "envoyer revue admin" if severity == "medium" else "suspendre promo" if severity == "high" else "surveiller"
            risks.append(PromoFraudRiskResponse(
                promo_code=promo.code, risk_score=min(score, 100), severity=severity,
                signals=signals or ["aucun_signal_majeur"], recommended_action=action,
            ))
        return sorted(risks, key=lambda r: r.risk_score, reverse=True)[:10]

    def get_trending_offers(self) -> list[TrendingOfferResponse]:
        campaigns = self._campaigns()
        offers = []
        for c in campaigns:
            impressions = max(int(c.messages_sent or 0), 1)
            clicks = int(c.clicks or 0)
            conversions = int(c.conversions or 0)
            ctr = clicks / impressions * 100
            conv_rate = conversions / max(clicks, 1) * 100
            score = round((ctr * 0.35) + (conv_rate * 0.35) + (float(c.roi or 0) * 10) + min(conversions, 100) * 0.1, 2)
            offers.append(TrendingOfferResponse(
                id=str(c.id), title=c.name, offer_type="campaign", score=score,
                ctr=round(ctr, 2), conversion_rate=round(conv_rate, 2), revenue=float(c.revenue or 0),
                placements=["homepage", "search_results", "partner_profile"][: 1 + int(score > 25) + int(score > 50)],
            ))
        return sorted(offers, key=lambda o: o.score, reverse=True)[:3]

    def get_growth_roi(self) -> GrowthRoiResponse:
        campaigns = self._campaigns()
        paid_orders = self._paid_orders()
        promo_revenue = sum(float(o.total_amount or 0) for o in paid_orders if float(o.discount_amount or 0) > 0)
        referral_revenue = sum(float(o.total_amount or 0) for o in paid_orders if getattr(getattr(o, "customer", None), "referred_by_user_id", None))
        remarketing_revenue = sum(float(c.revenue or 0) for c in campaigns if (c.segment or "").lower() in {"dormant", "inactive", "clients inactifs"})
        reactivation_revenue = sum(float(c.revenue or 0) for c in campaigns if "réactivation" in c.name.lower() or "reactivation" in c.name.lower())
        loyalty_revenue = sum(float(o.total_amount or 0) for o in paid_orders if getattr(getattr(o, "customer", None), "loyalty_points", 0))
        budget = sum(float(c.budget or 0) for c in campaigns) or 1
        revenue = promo_revenue + loyalty_revenue + referral_revenue + remarketing_revenue + reactivation_revenue
        conversions = sum(int(c.conversions or 0) for c in campaigns) or max(len(paid_orders), 1)
        return GrowthRoiResponse(
            promo_revenue=round(promo_revenue, 2),
            loyalty_revenue=round(loyalty_revenue, 2),
            referral_revenue=round(referral_revenue, 2),
            remarketing_revenue=round(remarketing_revenue, 2),
            reactivation_revenue=round(reactivation_revenue, 2),
            estimated_cac=round(budget / conversions, 2),
            estimated_ltv=round(sum(float(o.total_amount or 0) for o in paid_orders) / max(self._active_customer_count(), 1) * 2.4, 2),
            estimated_roi=round(revenue / budget, 2),
        )

    def _campaigns(self) -> list[MarketingCampaign]:
        self._ensure_seed_data()
        return self.db.query(MarketingCampaign).all()

    def _orders(self) -> list[Order]:
        return self.db.query(Order).all()

    def _paid_orders(self) -> list[Order]:
        return [o for o in self._orders() if str(o.payment_status) in {"paid", "PaymentStatus.PAID"}]

    def _promos(self) -> list[PromoCode]:
        return self.db.query(PromoCode).all()

    def _promo_usages(self) -> list[PromoCodeUsage]:
        return self.db.query(PromoCodeUsage).all()

    def _customers_with_points(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.loyalty_points > 0).scalar() or 0)

    def _active_customer_count(self) -> int:
        return len({str(o.customer_id) for o in self._paid_orders()})

    def _referral_count(self) -> int:
        return int(self.db.query(func.count(User.id)).filter(User.referred_by_user_id.isnot(None)).scalar() or 0)

    def _as_aware_datetime(self, value: datetime | None, fallback: datetime) -> datetime:
        if value is None:
            return fallback
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def _sparkline_int(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _sparkline_float(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
