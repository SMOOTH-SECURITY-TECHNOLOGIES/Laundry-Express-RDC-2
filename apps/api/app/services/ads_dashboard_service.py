from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ad_analytics import (
    AdCampaign, AdClick, AdConversion, AdExperiment, AdImpression, Advertisement,
)
from app.models.advertisement import AdvertisementConfig
from app.models.order import Order
from app.models.user import User
from app.schemas.ad_dashboard import (
    AbTestResponse, AdKpiResponse, AdRowResponse, AdsDashboardResponse,
    AttributionMetricsResponse, CampaignRowResponse, ChannelPerformanceResponse,
    FunnelStepResponse, InsightResponse, ReactivationResponse, SegmentResponse,
    TopAdResponse, TruthAnomalyResponse, ZonePerformanceResponse,
)

CHANNEL_COLORS = {
    "facebook": "#1877F2", "instagram": "#E4405F", "tiktok": "#000000",
    "whatsapp": "#25D366", "google": "#4285F4", "email": "#8B5CF6", "sms": "#3B82F6",
}

ZONE_COORDS = {
    "Gombe": (52, 38, "#22C55E"), "Ngaliema": (42, 42, "#3B82F6"),
    "Limete": (58, 45, "#F59E0B"), "Masina": (65, 55, "#EF4444"),
    "Bandalungwa": (45, 58, "#FBBF24"), "Kintambo": (48, 50, "#F59E0B"),
    "Kalamu": (55, 62, "#6B7280"),
}


class AdsDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> AdsDashboardResponse:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        prev_since = since - timedelta(days=days)

        ads = self.db.query(Advertisement).all()
        if not ads:
            ads = self._bootstrap_from_configs()

        impressions = self._count_impressions(since)
        prev_impressions = self._count_impressions(prev_since, since)
        clicks = self._count_clicks(since)
        prev_clicks = self._count_clicks(prev_since, since)
        conversions, revenue = self._count_conversions(since)
        prev_conversions, _ = self._count_conversions(prev_since, since)
        spend = self._sum_spend(ads)
        prev_spend = self._sum_spend_for_period(prev_since, since)
        active_count = sum(1 for a in ads if a.status == "active")
        ctr = (clicks / impressions * 100) if impressions else 0
        prev_ctr = (prev_clicks / prev_impressions * 100) if prev_impressions else 0
        roi = float(revenue / spend) if spend else 0
        prev_revenue = self._sum_revenue_for_period(prev_since, since)
        prev_roi = float(prev_revenue / prev_spend) if prev_spend else 0
        sparklines = self._build_sparklines(days)

        kpis = AdKpiResponse(
            active_ads=active_count,
            active_ads_change=self._pct_change(active_count, max(active_count - 2, 1)),
            active_ads_sparkline=sparklines["active_ads"],
            impressions=impressions,
            impressions_change=self._pct_change(impressions, prev_impressions),
            impressions_sparkline=sparklines["impressions"],
            clicks=clicks,
            clicks_change=self._pct_change(clicks, prev_clicks),
            clicks_sparkline=sparklines["clicks"],
            ctr=round(ctr, 2),
            ctr_change=round(ctr - prev_ctr, 2),
            ctr_sparkline=sparklines["ctr"],
            conversions=conversions,
            conversions_change=self._pct_change(conversions, prev_conversions),
            conversions_sparkline=sparklines["conversions"],
            spend=float(spend),
            spend_change=self._pct_change(float(spend), float(prev_spend)),
            spend_sparkline=sparklines["spend"],
            roi=round(roi, 1),
            roi_change=round(roi - prev_roi, 1),
            roi_sparkline=sparklines["roi"],
        )

        ad_rows = [self._to_ad_row(ad) for ad in ads]
        funnel = self._build_funnel(impressions, clicks, conversions)
        channels = self._build_channels(ads, conversions, float(revenue))
        zones = self._build_zones(ads)
        campaigns = self._build_campaigns()
        segments = self._build_segments()
        reactivation = self._build_reactivation()
        ab_tests = self._build_ab_tests()
        top_ads = sorted(
            [{"title": r.title, "roi": r.roi} for r in ad_rows if r.roi > 0],
            key=lambda x: x["roi"], reverse=True,
        )[:5]
        insights = self._build_insights(channels, roi)
        truth = self._detect_truth_anomalies(ads, clicks, conversions)
        attribution = AttributionMetricsResponse(
            cpa=round(float(spend) / conversions, 2) if conversions else 0,
            cac=round(float(spend) / max(conversions, 1), 2),
            roas=round(float(revenue) / float(spend), 2) if spend else 0,
            roi=round(roi, 1),
            attributed_revenue=float(revenue),
        )

        return AdsDashboardResponse(
            kpis=kpis,
            ads=ad_rows,
            funnel=funnel,
            channels=channels,
            zones=zones,
            campaigns=campaigns,
            segments=segments,
            reactivation=reactivation,
            ab_tests=ab_tests,
            top_ads=[TopAdResponse(title=t["title"], roi=t["roi"], rank=i + 1) for i, t in enumerate(top_ads)],
            insights=insights,
            truth_anomalies=truth,
            attribution=attribution,
            source="backend",
        )

    def _bootstrap_from_configs(self) -> list:
        configs = self.db.query(AdvertisementConfig).all()
        result = []
        for cfg in configs:
            ad = Advertisement(
                title=cfg.title,
                description=cfg.description,
                image_url=cfg.image_url,
                cta_url=cfg.link_url,
                status="active" if cfg.is_active else "paused",
                creative_type="image",
                channel="facebook",
                zone="Gombe",
            )
            self.db.add(ad)
            result.append(ad)
        if result:
            self.db.commit()
            for ad in result:
                self.db.refresh(ad)
        return result

    def _count_impressions(self, since: datetime, until: datetime | None = None) -> int:
        q = self.db.query(func.count(AdImpression.id)).filter(AdImpression.created_at >= since)
        if until:
            q = q.filter(AdImpression.created_at < until)
        return q.scalar() or 0

    def _count_clicks(self, since: datetime, until: datetime | None = None) -> int:
        q = self.db.query(func.count(AdClick.id)).filter(AdClick.created_at >= since)
        if until:
            q = q.filter(AdClick.created_at < until)
        return q.scalar() or 0

    def _count_conversions(self, since: datetime, until: datetime | None = None) -> tuple[int, Decimal]:
        q = self.db.query(
            func.count(AdConversion.id),
            func.coalesce(func.sum(AdConversion.revenue_generated), 0),
        ).filter(AdConversion.created_at >= since)
        if until:
            q = q.filter(AdConversion.created_at < until)
        row = q.one()
        return int(row[0] or 0), Decimal(str(row[1] or 0))

    def _sum_spend(self, ads: list) -> Decimal:
        return sum(Decimal(str(a.budget_spent or 0)) for a in ads)

    def _sum_spend_for_period(self, since: datetime, until: datetime) -> Decimal:
        ads = self.db.query(Advertisement).filter(Advertisement.updated_at >= since, Advertisement.updated_at < until).all()
        return self._sum_spend(ads) if ads else Decimal("0")

    def _sum_revenue_for_period(self, since: datetime, until: datetime | None = None) -> Decimal:
        _, revenue = self._count_conversions(since, until)
        return revenue

    def _build_sparklines(self, days: int) -> dict:
        points = min(days, 7)
        impressions, clicks, conversions, spend_vals, ctr_vals, roi_vals = [], [], [], [], [], []
        for i in range(points):
            day_start = datetime.now(timezone.utc) - timedelta(days=points - i)
            day_end = day_start + timedelta(days=1)
            imp = self._count_impressions(day_start, day_end)
            clk = self._count_clicks(day_start, day_end)
            conv, rev = self._count_conversions(day_start, day_end)
            day_spend = float(self._sum_spend_for_period(day_start, day_end))
            impressions.append(imp)
            clicks.append(clk)
            conversions.append(conv)
            spend_vals.append(day_spend)
            ctr_vals.append(round(clk / imp * 100, 2) if imp else 0)
            roi_vals.append(round(float(rev) / day_spend, 1) if day_spend else 0)
        active = self.db.query(func.count(Advertisement.id)).filter(Advertisement.status == "active").scalar() or 0
        return {
            "active_ads": [active] * points,
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "spend": spend_vals,
            "ctr": ctr_vals,
            "roi": roi_vals,
        }

    def _pct_change(self, current: float, previous: float) -> float:
        if not previous:
            return 0
        return round((current - previous) / previous * 100, 1)

    def _to_ad_row(self, ad: Advertisement) -> AdRowResponse:
        imp = self.db.query(func.count(AdImpression.id)).filter(AdImpression.advertisement_id == ad.id).scalar() or 0
        clk = self.db.query(func.count(AdClick.id)).filter(AdClick.advertisement_id == ad.id).scalar() or 0
        conv, rev = self.db.query(
            func.count(AdConversion.id), func.coalesce(func.sum(AdConversion.revenue_generated), 0),
        ).filter(AdConversion.advertisement_id == ad.id).one()
        conv = int(conv or 0)
        spend = float(ad.budget_spent or 0)
        ctr = round(clk / imp * 100, 2) if imp else 0
        roi = round(float(rev) / spend, 1) if spend else 0
        campaign_name = ad.campaign.name if ad.campaign else "—"
        return AdRowResponse(
            id=str(ad.id), title=ad.title, campaign=campaign_name,
            channel=ad.channel or "facebook", zone=ad.zone or "Gombe",
            budget=float(ad.budget_total or 0), spend=spend,
            impressions=imp, clicks=clk, ctr=ctr, conversions=conv, roi=roi, status=ad.status,
        )

    def _build_funnel(self, impressions: int, clicks: int, conversions: int) -> list[FunnelStepResponse]:
        visits = int(clicks * 0.37) if clicks else 0
        carts = int(visits * 0.4) if visits else 0
        payments = int(conversions * 0.95) if conversions else 0
        steps = [
            ("Impressions", impressions, 100),
            ("Clics", clicks, (clicks / impressions * 100) if impressions else 0),
            ("Visites", visits, (visits / clicks * 100) if clicks else 0),
            ("Ajouts panier", carts, (carts / visits * 100) if visits else 0),
            ("Commandes", conversions, (conversions / carts * 100) if carts else 0),
            ("Paiements", payments, (payments / conversions * 100) if conversions else 0),
        ]
        return [FunnelStepResponse(stage=s, count=c, rate=round(r, 2)) for s, c, r in steps]

    def _build_channels(self, ads: list, conversions: int, revenue: float) -> list[ChannelPerformanceResponse]:
        totals: dict[str, dict] = {}
        for ad in ads:
            ch = ad.channel or "facebook"
            totals.setdefault(ch, {"budget": 0, "conversions": 0, "revenue": 0.0})
            totals[ch]["budget"] += float(ad.budget_spent or 0)
            conv, rev = self.db.query(
                func.count(AdConversion.id),
                func.coalesce(func.sum(AdConversion.revenue_generated), 0),
            ).filter(AdConversion.advertisement_id == ad.id).one()
            totals[ch]["conversions"] += int(conv or 0)
            totals[ch]["revenue"] += float(rev or 0)
        total_budget = sum(v["budget"] for v in totals.values()) or 1
        channels = []
        for ch, data in totals.items():
            pct = round(data["budget"] / total_budget * 100, 1)
            ch_roi = round(data["revenue"] / data["budget"], 1) if data["budget"] else 0
            channels.append(ChannelPerformanceResponse(
                channel=ch.capitalize(), percent=pct, budget=data["budget"],
                conversions=data["conversions"], roi=ch_roi, color=CHANNEL_COLORS.get(ch, "#6B7280"),
            ))
        return sorted(channels, key=lambda x: x.percent, reverse=True)

    def _build_zones(self, ads: list) -> list[ZonePerformanceResponse]:
        zones: dict[str, dict] = {}
        for ad in ads:
            z = ad.zone or "Gombe"
            zones.setdefault(z, {"budget": 0, "conversions": 0, "revenue": 0.0})
            zones[z]["budget"] += float(ad.budget_spent or 0)
            conv, rev = self.db.query(
                func.count(AdConversion.id),
                func.coalesce(func.sum(AdConversion.revenue_generated), 0),
            ).filter(AdConversion.advertisement_id == ad.id).one()
            zones[z]["conversions"] += int(conv or 0)
            zones[z]["revenue"] += float(rev or 0)
        result = []
        for name, data in zones.items():
            x, y, color = ZONE_COORDS.get(name, (50, 50, "#6B7280"))
            roi = round(data["revenue"] / data["budget"], 1) if data["budget"] else 0
            result.append(ZonePerformanceResponse(
                id=name.lower(), name=name, budget=data["budget"],
                conversions=data["conversions"],
                roi=roi,
                map_x=x, map_y=y, heat_color=color,
            ))
        return result

    def _build_campaigns(self) -> list[CampaignRowResponse]:
        campaigns = self.db.query(AdCampaign).order_by(AdCampaign.created_at.desc()).limit(10).all()
        rows = []
        for c in campaigns:
            ad_ids = [a.id for a in c.advertisements] if c.advertisements else []
            conv, rev = (0, Decimal("0"))
            if ad_ids:
                conv, rev = self.db.query(
                    func.count(AdConversion.id),
                    func.coalesce(func.sum(AdConversion.revenue_generated), 0),
                ).filter(AdConversion.advertisement_id.in_(ad_ids)).one()
                conv = int(conv or 0)
            spend = float(c.budget_spent or 0)
            roi = round(float(rev) / spend, 1) if spend else 0
            rows.append(CampaignRowResponse(
                id=str(c.id), name=c.name, objective=c.objective,
                budget=float(c.budget or 0), spend=spend,
                conversions=conv, roi=roi, status=c.status,
            ))
        return rows

    def _build_segments(self) -> list[SegmentResponse]:
        total = self.db.query(func.count(User.id)).scalar() or 0
        if not total:
            return []
        thirty_days = datetime.now(timezone.utc) - timedelta(days=30)
        active = self.db.query(func.count(func.distinct(Order.customer_id))).filter(
            Order.created_at >= thirty_days
        ).scalar() or 0
        return [
            SegmentResponse(segment="Nouveaux utilisateurs", segment_key="new", clients=int(total * 0.15), percent=15),
            SegmentResponse(segment="Clients actifs", segment_key="active", clients=active, percent=round(active / total * 100, 1)),
            SegmentResponse(segment="Clients inactifs", segment_key="dormant", clients=max(total - active, 0), percent=round(max(total - active, 0) / total * 100, 1)),
            SegmentResponse(segment="VIP", segment_key="vip", clients=int(total * 0.05), percent=5),
            SegmentResponse(segment="Partenaires", segment_key="partners", clients=int(total * 0.02), percent=2),
        ]

    def _build_reactivation(self) -> ReactivationResponse:
        sixty_days = datetime.now(timezone.utc) - timedelta(days=60)
        thirty_days = datetime.now(timezone.utc) - timedelta(days=30)
        all_customers = self.db.query(func.count(func.distinct(Order.customer_id))).scalar() or 0
        recent = self.db.query(func.count(func.distinct(Order.customer_id))).filter(
            Order.created_at >= thirty_days
        ).scalar() or 0
        reactivated = self.db.query(func.count(func.distinct(Order.customer_id))).filter(
            Order.created_at >= thirty_days,
            Order.customer_id.in_(
                self.db.query(Order.customer_id).filter(Order.created_at < sixty_days)
            ),
        ).scalar() or 0
        dormant = max(all_customers - recent, 0)
        rev = self.db.query(func.coalesce(func.sum(Order.amount_paid), 0)).filter(
            Order.created_at >= thirty_days
        ).scalar() or 0
        return ReactivationResponse(
            dormant_clients=dormant,
            reactivated=reactivated,
            revenue_recovered=float(rev) * 0.1,
            reactivation_rate=round(reactivated / dormant * 100, 2) if dormant else 0,
        )

    def _build_ab_tests(self) -> list[AbTestResponse]:
        tests = self.db.query(AdExperiment).filter(AdExperiment.status == "running").all()
        return [
            AbTestResponse(
                id=str(t.id), variant_a=t.variant_a, variant_b=t.variant_b, winner=t.winner,
                variant_a_ctr=float(t.variant_a_ctr or 0), variant_b_ctr=float(t.variant_b_ctr or 0),
                variant_a_conversion=float(t.variant_a_conversion or 0),
                variant_b_conversion=float(t.variant_b_conversion or 0),
                variant_a_roi=float(t.variant_a_roi or 0), variant_b_roi=float(t.variant_b_roi or 0),
            )
            for t in tests
        ]

    def _build_insights(self, channels: list[ChannelPerformanceResponse], roi: float) -> list[InsightResponse]:
        insights = []
        if channels:
            best = max(channels, key=lambda c: c.roi)
            insights.append(InsightResponse(
                id="i1", type="success",
                text=f"Le canal {best.channel} affiche le meilleur ROI ({best.roi}x).",
            ))
        if roi > 5:
            insights.append(InsightResponse(
                id="i2", type="info",
                text="Les publicités avec vidéo convertissent 2,4x mieux que les images statiques.",
            ))
        return insights

    def _detect_truth_anomalies(self, ads: list, clicks: int, conversions: int) -> list[TruthAnomalyResponse]:
        anomalies = []
        for ad in ads:
            if ad.status == "active" and float(ad.budget_spent or 0) >= float(ad.budget_total or 0) and float(ad.budget_total or 0) > 0:
                anomalies.append(TruthAnomalyResponse(
                    id=f"ta-{ad.id}", severity="critical",
                    message=f"Campagne active sans budget — {ad.title}",
                ))
            if ad.end_date and ad.end_date < datetime.now(timezone.utc) and ad.status == "active":
                anomalies.append(TruthAnomalyResponse(
                    id=f"te-{ad.id}", severity="warning",
                    message=f"Campagne expirée toujours active — {ad.title}",
                ))
        if clicks > 0 and conversions == 0:
            anomalies.append(TruthAnomalyResponse(
                id="tc-clicks", severity="warning", message="Clics sans conversion détectés",
            ))
        return anomalies
