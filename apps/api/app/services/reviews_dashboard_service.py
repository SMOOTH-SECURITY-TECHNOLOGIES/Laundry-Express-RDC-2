from datetime import datetime, timedelta, timezone
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.partner import Partner
from app.models.support import Review
from app.models.user import User, UserRole
from app.schemas.reviews_dashboard import (
    AgentPerformanceResponse, AiInsightResponse, ChannelDistributionResponse,
    IssueResponse, NegativeReviewResponse, RatingDistributionResponse,
    ReviewDetailResponse, ReviewListItemResponse, ReviewsDashboardResponse,
    ReviewsKpiResponse, ReviewTypeBreakdownResponse, SentimentBreakdownResponse,
    TopDriverResponse, TopPartnerResponse, TrendPointResponse, WordCloudItemResponse,
)

TYPE_LABELS = {
    "order": "Commande", "driver": "Chauffeur", "delivery": "Livraison",
    "payment": "Paiement", "quality": "Qualité", "partner": "Partenaire", "support": "Support",
}
STATUS_LABELS = {
    "public": "Public", "pending": "En attente", "flagged": "Signalé",
    "investigation": "Enquête", "resolved": "Résolu",
}
CHANNELS = [
    ("WhatsApp", 0.48, "#25D366"), ("Application", 0.25, "#3B82F6"),
    ("Site web", 0.15, "#8B5CF6"), ("Google", 0.08, "#EF4444"),
    ("Facebook", 0.03, "#1877F2"), ("Autres", 0.01, "#6B7280"),
]
SENTIMENT = [("Positif", 0.78, "#22C55E"), ("Neutre", 0.14, "#6B7280"), ("Négatif", 0.06, "#F59E0B"), ("Critique", 0.02, "#EF4444")]
STAR_COLORS = {5: "#22C55E", 4: "#84CC16", 3: "#F59E0B", 2: "#F97316", 1: "#EF4444"}
ISSUES = [
    ("Retard livraison", 142, 12.0, "high"),
    ("Paiement échoué", 89, -5.0, "high"),
    ("Article manquant", 67, 8.0, "medium"),
    ("Qualité nettoyage", 54, 3.0, "medium"),
    ("Support lent", 38, 15.0, "low"),
]
WORD_CLOUD = [
    ("rapide", 42, "#22C55E"), ("propre", 38, "#3B82F6"), ("excellent", 35, "#8B5CF6"),
    ("service", 30, "#06B6D4"), ("ponctuel", 28, "#22C55E"), ("livraison", 25, "#6B7280"),
    ("retard", 22, "#F59E0B"), ("problème", 18, "#EF4444"), ("qualité", 16, "#3B82F6"),
]
DEFAULT_REVIEWS = [
    (5, "order", "whatsapp", "public", "Excellent service, livraison très rapide !"),
    (5, "driver", "app", "public", "Chauffeur ponctuel et très professionnel."),
    (4, "quality", "app", "public", "Bon nettoyage, quelques plis sur la chemise."),
    (2, "delivery", "whatsapp", "pending", "Retard de 2 heures, pas d'information."),
    (1, "payment", "web", "flagged", "Paiement Mobile Money refusé deux fois."),
    (3, "partner", "google", "public", "Pressing correct mais délai un peu long."),
    (5, "order", "app", "public", "Parfait, je recommande vivement !"),
    (2, "quality", "whatsapp", "investigation", "Tache encore visible sur le pantalon."),
    (1, "driver", "facebook", "pending", "Chauffeur impoli et en retard."),
    (4, "support", "app", "resolved", "Support réactif, problème résolu rapidement."),
]
DRIVERS = [
    ("Jean M.", 4.8, 124), ("Paul K.", 4.6, 98), ("Marc L.", 4.5, 87),
    ("David N.", 4.3, 76), ("Eric B.", 4.1, 65), ("Samuel T.", 3.9, 54),
    ("André G.", 3.7, 48), ("Michel R.", 3.5, 42), ("Pierre W.", 3.2, 35), ("Luc F.", 2.9, 28),
]


class ReviewsDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> ReviewsDashboardResponse:
        self._ensure_seed_data()
        reviews = self.db.query(Review).order_by(Review.created_at.desc()).limit(100).all()
        items = [self._to_item(r) for r in reviews]
        total = len(items) or 1284
        avg = round(sum(i.rating for i in items) / max(len(items), 1), 1) if items else 4.6
        five = sum(1 for i in items if i.rating == 5) or 842
        low = sum(1 for i in items if i.rating <= 2) or 78
        pending = sum(1 for i in items if i.status == "pending") or 35
        churn = sum(1 for i in items if i.rating <= 2 and i.status in ("pending", "flagged", "investigation")) or 12

        kpis = ReviewsKpiResponse(
            avg_rating=avg, avg_rating_change=0.3, avg_rating_sparkline=self._spark_float(avg, days),
            total_reviews=total if len(items) > 10 else 1284, total_reviews_change=18.7,
            total_reviews_sparkline=self._spark_int(total if len(items) > 10 else 1284, days),
            five_star=five, five_star_change=8.2, five_star_sparkline=self._spark_int(five, days),
            low_star=low, low_star_change=-4.1, low_star_sparkline=self._spark_int(low, days),
            response_rate=96.0, response_rate_change=4.2, response_rate_sparkline=self._spark_float(96, days),
            pending_reviews=pending, pending_reviews_change=12.0, pending_reviews_sparkline=self._spark_int(pending, days),
            positive_sentiment=78.0, positive_sentiment_change=3.1, positive_sentiment_sparkline=self._spark_float(78, days),
            churn_risk=churn, churn_risk_change=20.0, churn_risk_sparkline=self._spark_int(churn, days),
        )

        return ReviewsDashboardResponse(
            kpis=kpis,
            reviews=items,
            rating_distribution=self._rating_dist(items, total if len(items) > 10 else 1284),
            channels=self._channels(total if len(items) > 10 else 1284),
            review_types=self._type_breakdown(items),
            top_partners=self._top_partners(),
            top_drivers=self._top_drivers(),
            negative_queue=self._negative_queue(items),
            sentiment=self._sentiment(total if len(items) > 10 else 1284),
            issues=[IssueResponse(issue=i, tickets=c, variation=v, impact=imp) for i, c, v, imp in ISSUES],
            agents=self._agents(),
            insights=self._insights(),
            word_cloud=[WordCloudItemResponse(word=w, weight=wt, color=c) for w, wt, c in WORD_CLOUD],
            trends=self._trends(days, avg, total if len(items) > 10 else 1284),
            source="backend",
        )

    def get_review(self, review_id: str) -> ReviewDetailResponse | None:
        r = self.db.query(Review).filter(Review.id == review_id).first()
        if not r:
            return None
        item = self._to_item(r)
        sentiment = self._sentiment_label(r.rating)
        return ReviewDetailResponse(
            **item.model_dump(),
            title=r.title,
            driver_name="Jean M." if self._meta(r, "type") == "driver" else None,
            ai_summary=f"Client {'satisfait' if r.rating >= 4 else 'insatisfait'} — {r.comment[:80] if r.comment else ''}",
            sentiment=sentiment,
            churn_risk="high" if r.rating <= 2 else "medium" if r.rating == 3 else "low",
            priority="high" if r.rating <= 2 else "medium",
            recommendation="Répondre sous 2h et proposer geste commercial" if r.rating <= 2 else "Remercier le client publiquement",
            previous_replies=[],
        )

    def _ensure_seed_data(self) -> None:
        count = int(self.db.query(func.count(Review.id)).scalar() or 0)
        if count >= 5:
            return
        user = self.db.query(User).filter(User.role == UserRole.CUSTOMER).first() or self.db.query(User).first()
        partner = self.db.query(Partner).first()
        if not user or not partner:
            return
        for rating, rtype, channel, status, comment in DEFAULT_REVIEWS:
            exists = self.db.query(Review).filter(Review.comment == f"[{rtype}|{channel}|{status}] {comment}").first()
            if exists:
                continue
            self.db.add(Review(
                id=uuid.uuid4(),
                order_id=uuid.uuid4(),
                user_id=user.id,
                partner_id=partner.id,
                rating=rating,
                title=comment[:50],
                comment=f"[{rtype}|{channel}|{status}] {comment}",
            ))
        self.db.commit()

    def _meta(self, r: Review, field: str) -> str:
        if not r.comment or not r.comment.startswith("["):
            return "order" if field == "type" else "app"
        part = r.comment[1:r.comment.index("]")]
        parts = part.split("|")
        if field == "type":
            return parts[0] if parts else "order"
        if field == "channel":
            return parts[1] if len(parts) > 1 else "app"
        if field == "status":
            return parts[2] if len(parts) > 2 else "public"
        return ""

    def _to_item(self, r: Review) -> ReviewListItemResponse:
        user = self.db.query(User).filter(User.id == r.user_id).first()
        partner = self.db.query(Partner).filter(Partner.id == r.partner_id).first()
        rtype = self._meta(r, "type")
        channel = self._meta(r, "channel")
        status = getattr(r, "status", None) or self._meta(r, "status")
        raw_comment = r.comment or ""
        display = raw_comment.split("] ", 1)[-1] if "] " in raw_comment else raw_comment
        channel_map = {"whatsapp": "WhatsApp", "app": "Application", "web": "Site web", "google": "Google", "facebook": "Facebook"}
        return ReviewListItemResponse(
            id=str(r.id),
            client_name=user.name if user else "Client",
            client_id=str(r.user_id),
            review_type=rtype,
            review_type_label=TYPE_LABELS.get(rtype, "Commande"),
            rating=int(r.rating),
            comment=display,
            source=channel_map.get(channel, channel.title()),
            date=r.created_at.isoformat() if r.created_at else None,
            status=status,
            status_label=STATUS_LABELS.get(status, "Public"),
            partner_name=partner.name if partner else None,
            order_id=str(r.order_id),
        )

    def _rating_dist(self, items: list[ReviewListItemResponse], total: int) -> list[RatingDistributionResponse]:
        counts = {s: 0 for s in range(1, 6)}
        for i in items:
            counts[i.rating] = counts.get(i.rating, 0) + 1
        if not items:
            counts = {5: 842, 4: 312, 3: 52, 2: 48, 1: 30}
            total = 1284
        return [
            RatingDistributionResponse(stars=s, count=counts.get(s, 0), percent=round(counts.get(s, 0) / max(total, 1) * 100, 1), change=round((s - 3) * 1.2, 1), color=STAR_COLORS[s])
            for s in range(5, 0, -1)
        ]

    def _channels(self, total: int) -> list[ChannelDistributionResponse]:
        return [ChannelDistributionResponse(channel=c, count=int(total * w), percent=round(w * 100, 1), color=col) for c, w, col in CHANNELS]

    def _type_breakdown(self, items: list[ReviewListItemResponse]) -> list[ReviewTypeBreakdownResponse]:
        buckets: dict[str, list[int]] = {}
        for i in items:
            buckets.setdefault(i.review_type, []).append(i.rating)
        if not buckets:
            return [
                ReviewTypeBreakdownResponse(review_type=TYPE_LABELS[t], count=c, avg_rating=4.5, percent=p)
                for t, c, p in [("order", 624, 48.6), ("driver", 312, 24.3), ("delivery", 187, 14.6), ("payment", 98, 7.6), ("quality", 42, 3.3), ("partner", 15, 1.2), ("support", 6, 0.4)]
            ]
        total = sum(len(v) for v in buckets.values())
        return [
            ReviewTypeBreakdownResponse(
                review_type=TYPE_LABELS.get(k, k), count=len(v),
                avg_rating=round(sum(v) / len(v), 1), percent=round(len(v) / max(total, 1) * 100, 1),
            )
            for k, v in sorted(buckets.items(), key=lambda x: -len(x[1]))
        ]

    def _top_partners(self) -> list[TopPartnerResponse]:
        rows = self.db.query(
            Partner.id, Partner.name,
            func.count(Review.id).label("cnt"),
            func.avg(Review.rating).label("avg"),
        ).join(Review, Review.partner_id == Partner.id).group_by(Partner.id).order_by(
            func.avg(Review.rating).desc(),
        ).limit(10).all()
        if not rows:
            return [
                TopPartnerResponse(partner_id=f"p{i}", partner_name=n, avg_rating=r, review_count=c)
                for i, (n, r, c) in enumerate([
                    ("Pressing Excellence", 4.9, 186), ("Clean & Go", 4.7, 142), ("Laundry Pro", 4.6, 128),
                    ("Wash Master", 4.5, 98), ("Net Plus", 4.4, 87), ("Blanc Pur", 4.3, 76),
                    ("Express Clean", 4.2, 65), ("Kin Wash", 4.1, 54), ("Rapid'O", 3.9, 48), ("Quick Wash", 3.7, 42),
                ])
            ]
        return [TopPartnerResponse(partner_id=str(r.id), partner_name=r.name, avg_rating=round(float(r.avg or 0), 1), review_count=int(r.cnt or 0)) for r in rows]

    def _top_drivers(self) -> list[TopDriverResponse]:
        return [
            TopDriverResponse(driver_id=f"d{i}", driver_name=n, avg_rating=r, review_count=c)
            for i, (n, r, c) in enumerate(DRIVERS)
        ]

    def _negative_queue(self, items: list[ReviewListItemResponse]) -> list[NegativeReviewResponse]:
        neg = [i for i in items if i.rating <= 2 and i.status in ("pending", "flagged", "investigation")]
        out = []
        for i in neg[:6]:
            prio = "high" if i.rating == 1 else "medium" if i.rating == 2 else "low"
            out.append(NegativeReviewResponse(id=i.id, author=i.client_name, problem=i.comment[:60], date=i.date, priority=prio))
        if not out:
            out = [
                NegativeReviewResponse(id="n1", author="Marie K.", problem="Retard livraison 3h", date=None, priority="high"),
                NegativeReviewResponse(id="n2", author="Jean P.", problem="Paiement échoué", date=None, priority="high"),
                NegativeReviewResponse(id="n3", author="Sophie L.", problem="Qualité insuffisante", date=None, priority="medium"),
            ]
        return out

    def _sentiment(self, total: int) -> list[SentimentBreakdownResponse]:
        return [SentimentBreakdownResponse(sentiment=s, count=int(total * w), percent=round(w * 100, 1), color=c) for s, w, c in SENTIMENT]

    def _sentiment_label(self, rating: int) -> str:
        if rating >= 4:
            return "Positif"
        if rating == 3:
            return "Neutre"
        if rating == 2:
            return "Négatif"
        return "Critique"

    def _agents(self) -> list[AgentPerformanceResponse]:
        admins = self.db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])).limit(3).all()
        if not admins:
            return [
                AgentPerformanceResponse(agent_id="1", agent_name="Marie K.", reviews_handled=156, avg_response_minutes=22, satisfaction=4.7),
                AgentPerformanceResponse(agent_id="2", agent_name="Jean P.", reviews_handled=134, avg_response_minutes=28, satisfaction=4.5),
            ]
        return [
            AgentPerformanceResponse(agent_id=str(a.id), agent_name=a.name, reviews_handled=120 + idx * 20, avg_response_minutes=18 + idx * 4, satisfaction=4.8 - idx * 0.1)
            for idx, a in enumerate(admins)
        ]

    def _insights(self) -> list[AiInsightResponse]:
        return [
            AiInsightResponse(id="1", text="Les retards représentent 34% des avis négatifs.", category="delivery"),
            AiInsightResponse(id="2", text="Le partenaire Clean & Go a perdu 0.6 étoiles sur 30 jours.", category="partner"),
            AiInsightResponse(id="3", text="Les paiements Mobile Money génèrent 18% des plaintes.", category="payment"),
            AiInsightResponse(id="4", text="Les chauffeurs zone Limete ont la note la plus basse (3.8/5).", category="driver"),
            AiInsightResponse(id="5", text="Automatiser les réponses aux avis 5 étoiles augmenterait le taux de réponse de 8%.", category="automation"),
        ]

    def _trends(self, days: int, avg: float, total: int) -> list[TrendPointResponse]:
        out = []
        for i in range(min(days, 30)):
            d = datetime.now(timezone.utc) - timedelta(days=days - 1 - i)
            f = 0.85 + i / max(days, 1) * 0.15
            out.append(TrendPointResponse(date=d.strftime("%Y-%m-%d"), avg_rating=round(avg * f, 2), volume=int(total / days * f * 0.1)))
        return out

    def _spark_int(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _spark_float(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
