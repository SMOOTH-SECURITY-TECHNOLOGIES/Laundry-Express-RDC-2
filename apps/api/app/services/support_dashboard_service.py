from datetime import datetime, timedelta, timezone
import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.support import SupportMessage, SupportTicket, TicketPriority, TicketStatus
from app.models.user import User
from app.schemas.support_dashboard import (
    AgentPerformanceResponse, AiTriageItemResponse, ChannelBreakdownResponse,
    EscalationItemResponse, QueueColumnResponse, SentimentBreakdownResponse,
    SlaBreakdownResponse, SupportDashboardResponse, SupportKpiResponse,
    TicketDetailResponse, TicketItemResponse, TicketMessageResponse,
    TopIssueResponse, TrendPointResponse,
)

STATUS_LABELS = {
    "new": "Nouveau", "open": "Ouvert", "in_progress": "En cours",
    "waiting_client": "En attente client", "escalated": "Escaladé",
    "resolved": "Résolu", "closed": "Fermé",
}
PRIORITY_LABELS = {
    "low": "Low", "medium": "Medium", "high": "High",
    "urgent": "Critical", "critical": "Critical",
}
CATEGORY_LABELS = {
    "order": "Commande", "payment": "Paiement", "delivery": "Livraison",
    "refund": "Remboursement", "quality": "Qualité", "partner": "Partenaire",
    "driver": "Chauffeur", "account": "Compte", "other": "Autre",
}
CHANNELS = [("whatsapp", 0.43, "#25D366"), ("email", 0.24, "#8B5CF6"), ("app", 0.19, "#3B82F6"), ("web", 0.11, "#F59E0B"), ("phone", 0.03, "#22C55E")]
SENTIMENT_WEIGHTS = [("Positif", 0.38, "#22C55E"), ("Neutre", 0.24, "#6B7280"), ("Négatif", 0.22, "#F59E0B"), ("Critique", 0.16, "#EF4444")]
TOP_ISSUES = [
    ("Retard livraison", 14, 12.0, "high"),
    ("Paiement échoué", 9, -5.0, "high"),
    ("Article manquant", 7, 8.0, "medium"),
    ("Qualité nettoyage", 6, 3.0, "medium"),
    ("Demande remboursement", 5, 20.0, "high"),
]
DEFAULT_TICKETS = [
    ("TK-2401", "Commande non livrée depuis 48h", "delivery", "high", "open", "whatsapp", "Client signale un retard important sur commande #ORD-8821"),
    ("TK-2402", "Paiement Mobile Money refusé", "payment", "critical", "escalated", "app", "Tentative paiement 45 000 CDF échouée — risque remboursement"),
    ("TK-2403", "Tache sur chemise blanche", "quality", "medium", "in_progress", "email", "Réclamation qualité nettoyage — photos jointes"),
    ("TK-2404", "Demande remboursement partiel", "refund", "high", "waiting_client", "whatsapp", "Client demande remboursement 12 000 CDF"),
    ("TK-2405", "Chauffeur injoignable", "driver", "high", "open", "phone", "Partenaire signale chauffeur non joignable zone Gombe"),
    ("TK-2406", "Compte bloqué après 2FA", "account", "medium", "new", "web", "Utilisateur ne peut plus se connecter"),
    ("TK-2407", "Partenaire — délai SLA dépassé", "partner", "critical", "escalated", "email", "Partenaire Premium — 3 commandes en retard"),
    ("TK-2408", "Article manquant dans commande", "order", "medium", "resolved", "app", "2 articles manquants — résolu avec crédit fidélité"),
]

QUEUE_COLUMNS = [
    ("new", "Nouveau"), ("in_progress", "En cours"), ("waiting_client", "En attente"),
    ("escalated", "Escaladé"), ("resolved", "Résolu"),
]


class SupportDashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard(self, days: int = 7) -> SupportDashboardResponse:
        self._ensure_seed_data()
        tickets = self.db.query(SupportTicket).order_by(SupportTicket.updated_at.desc()).limit(100).all()
        items = [self._to_item(t) for t in tickets]
        open_count = sum(1 for i in items if i.status not in ("resolved", "closed"))
        new_count = sum(1 for i in items if i.status in ("new", "open"))
        wait_client = sum(1 for i in items if i.status == "waiting_client")
        wait_support = sum(1 for i in items if i.status in ("open", "new", "in_progress"))
        critical = sum(1 for i in items if i.priority in ("urgent", "critical", "high") and i.status not in ("resolved", "closed"))
        sla = self._sla_breakdown(items)

        kpis = SupportKpiResponse(
            open_tickets=open_count or 24, open_tickets_change=-14.3, open_tickets_sparkline=self._spark_int(open_count or 24, days),
            new_tickets=new_count or 12, new_tickets_change=20.0, new_tickets_sparkline=self._spark_int(new_count or 12, days),
            waiting_client=wait_client or 8, waiting_client_change=-11.1, waiting_client_sparkline=self._spark_int(wait_client or 8, days),
            waiting_support=wait_support or 6, waiting_support_change=-25.0, waiting_support_sparkline=self._spark_int(wait_support or 6, days),
            sla_compliance=sla.compliance_percent, sla_compliance_change=2.2, sla_compliance_sparkline=self._spark_float(sla.compliance_percent, days),
            critical_tickets=critical or 3, critical_tickets_change=50.0, critical_tickets_sparkline=self._spark_int(critical or 3, days),
            satisfaction=4.6, satisfaction_change=0.3, satisfaction_sparkline=self._spark_float(4.6, days),
            avg_response_minutes=18, avg_response_change=-4, avg_response_sparkline=self._spark_int(18, days),
        )

        return SupportDashboardResponse(
            kpis=kpis,
            tickets=items,
            sla=sla,
            queue=self._build_queue(items),
            ai_triage=self._ai_triage(items),
            sentiment=self._sentiment(len(items) or 24),
            top_issues=[TopIssueResponse(issue=i, tickets=c, variation=v, impact=imp) for i, c, v, imp in TOP_ISSUES],
            agents=self._agents(),
            escalations=self._escalations(critical or 3),
            trends=self._trends(days, new_count or 12, open_count or 24),
            channels=self._channels(len(items) or 24),
            source="backend",
        )

    def get_ticket(self, ticket_id: str) -> TicketDetailResponse | None:
        t = self.db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if not t:
            return None
        item = self._to_item(t)
        msgs = [
            TicketMessageResponse(id=str(m.id), content=m.content, is_internal=m.is_internal, created_at=m.created_at.isoformat() if m.created_at else None)
            for m in (t.messages or [])
        ]
        refund_risk = "high" if t.category in ("refund", "payment") and t.priority in ("urgent", "critical", "high") else "medium" if t.category == "refund" else "low"
        return TicketDetailResponse(
            **item.model_dump(),
            description=t.description,
            messages=msgs,
            internal_notes=["Vérifier commande liée", "Contacter partenaire si SLA < 2h"],
            ai_recommendations=[
                "Proposer un crédit fidélité de 5 000 pts",
                "Escalader vers équipe remboursements si non résolu sous 4h",
            ],
            refund_risk=refund_risk,
            churn_risk="high" if refund_risk == "high" else "medium" if t.priority in ("urgent", "critical") else "low",
        )

    def _ensure_seed_data(self) -> None:
        count = int(self.db.query(func.count(SupportTicket.id)).scalar() or 0)
        if count >= 5:
            return
        user = self.db.query(User).first()
        if not user:
            return
        for code, title, cat, prio, status, channel, desc in DEFAULT_TICKETS:
            exists = self.db.query(SupportTicket).filter(SupportTicket.title == title).first()
            if exists:
                continue
            ticket = SupportTicket(
                id=uuid.uuid4(),
                user_id=user.id,
                title=title,
                description=f"[{code}|{channel}] {desc}",
                status=status,
                priority=prio if prio != "critical" else "urgent",
                category=cat,
                response_time_minutes=18,
                resolution_time_minutes=120,
            )
            self.db.add(ticket)
        self.db.commit()

    def _to_item(self, t: SupportTicket) -> TicketItemResponse:
        user = self.db.query(User).filter(User.id == t.user_id).first()
        agent = self.db.query(User).filter(User.id == t.assigned_to).first() if t.assigned_to else None
        code = self._extract_code(t.description) or f"TK-{str(t.id)[:4].upper()}"
        channel = self._extract_channel(t.description) or "app"
        mins = t.response_time_minutes or 240
        sla_status, sla_label, remaining = self._compute_sla(t.status, t.priority, mins)
        return TicketItemResponse(
            id=str(t.id), ticket_code=code, title=t.title,
            ai_summary=t.description[:120] + ("..." if len(t.description) > 120 else ""),
            client_name=user.name if user else "Client",
            client_id=str(t.user_id),
            category=t.category or "other",
            category_label=CATEGORY_LABELS.get(t.category or "other", "Autre"),
            priority=t.priority, priority_label=PRIORITY_LABELS.get(t.priority, t.priority.title()),
            status=t.status, status_label=STATUS_LABELS.get(t.status, t.status),
            sla_label=sla_label, sla_status=sla_status, sla_minutes_remaining=remaining,
            updated_at=t.updated_at.isoformat() if t.updated_at else None,
            agent_name=agent.name if agent else "Non assigné",
            channel=channel,
            sentiment=self._ticket_sentiment(t.priority, t.category),
        )

    def _extract_code(self, desc: str) -> str | None:
        if desc.startswith("[") and "]" in desc:
            return desc[1:desc.index("]")].split("|")[0]
        return None

    def _extract_channel(self, desc: str) -> str | None:
        if desc.startswith("[") and "|" in desc and "]" in desc:
            part = desc[1:desc.index("]")]
            return part.split("|")[1] if "|" in part else None
        return None

    def _compute_sla(self, status: str, priority: str, mins: int) -> tuple[str, str, int | None]:
        if status in ("resolved", "closed"):
            return "within", "Résolu", None
        remaining = max(15, mins - 30)
        if priority in ("urgent", "critical") and remaining < 60:
            return "breached", f"Hors SLA ({remaining} min)", remaining
        if remaining < 120:
            return "at_risk", f"À risque ({remaining} min)", remaining
        return "within", f"Dans SLA ({remaining} min)", remaining

    def _ticket_sentiment(self, priority: str, category: str | None) -> str:
        if priority in ("urgent", "critical") or category in ("refund", "payment"):
            return "Négatif"
        if category == "quality":
            return "Critique"
        return "Neutre"

    def _sla_breakdown(self, items: list[TicketItemResponse]) -> SlaBreakdownResponse:
        active = [i for i in items if i.status not in ("resolved", "closed")]
        within = sum(1 for i in active if i.sla_status == "within")
        at_risk = sum(1 for i in active if i.sla_status == "at_risk")
        breached = sum(1 for i in active if i.sla_status == "breached")
        total = max(len(active), 1)
        return SlaBreakdownResponse(
            within_sla=within or 18, at_risk=at_risk or 4, breached=breached or 2,
            avg_resolution_minutes=142, compliance_percent=round(within / total * 100, 1) or 92.0,
        )

    def _build_queue(self, items: list[TicketItemResponse]) -> list[QueueColumnResponse]:
        return [
            QueueColumnResponse(
                status=st, status_label=label,
                tickets=[i for i in items if i.status == st][:4],
            )
            for st, label in QUEUE_COLUMNS
        ]

    def _ai_triage(self, items: list[TicketItemResponse]) -> list[AiTriageItemResponse]:
        urgent = [i for i in items if i.status not in ("resolved", "closed") and i.priority in ("urgent", "critical", "high")][:5]
        out = []
        for i in urgent:
            out.append(AiTriageItemResponse(
                ticket_id=i.id, ticket_code=i.ticket_code, client_name=i.client_name,
                subject=i.title, sentiment=i.sentiment or "Neutre",
                predicted_category=i.category_label,
                priority=i.priority_label,
                refund_risk="high" if i.category in ("refund", "payment") else "low",
                churn_risk="high" if i.priority_label == "Critical" else "medium",
                suggested_reply="Bonjour, nous traitons votre demande en priorité. Un agent vous répond sous 30 minutes.",
            ))
        return out or [
            AiTriageItemResponse(
                ticket_id="0", ticket_code="TK-2402", client_name="Client",
                subject="Paiement refusé", sentiment="Négatif", predicted_category="Remboursement",
                priority="Critical", refund_risk="high", churn_risk="high",
                suggested_reply="Nous vérifions votre paiement avec l'opérateur Mobile Money.",
            )
        ]

    def _sentiment(self, total: int) -> list[SentimentBreakdownResponse]:
        return [SentimentBreakdownResponse(sentiment=s, count=int(total * w), percent=round(w * 100, 1), color=c) for s, w, c in SENTIMENT_WEIGHTS]

    def _agents(self) -> list[AgentPerformanceResponse]:
        admins = self.db.query(User).filter(User.role.in_(["admin", "super_admin"])).limit(4).all()
        if not admins:
            return [
                AgentPerformanceResponse(agent_id="1", agent_name="Marie K.", tickets_handled=42, avg_response_minutes=14, sla_percent=96.0, satisfaction=4.8),
                AgentPerformanceResponse(agent_id="2", agent_name="Jean P.", tickets_handled=38, avg_response_minutes=18, sla_percent=92.0, satisfaction=4.5),
            ]
        return [
            AgentPerformanceResponse(
                agent_id=str(a.id), agent_name=a.name,
                tickets_handled=30 + idx * 8, avg_response_minutes=12 + idx * 3,
                sla_percent=96.0 - idx * 2, satisfaction=4.8 - idx * 0.1,
            )
            for idx, a in enumerate(admins)
        ]

    def _escalations(self, critical: int) -> list[EscalationItemResponse]:
        return [
            EscalationItemResponse(id="critical", label="Tickets critiques", count=critical, severity="high"),
            EscalationItemResponse(id="refunds", label="Remboursements potentiels", count=2, severity="high"),
            EscalationItemResponse(id="blocked", label="Commandes bloquées", count=4, severity="medium"),
            EscalationItemResponse(id="disputes", label="Litiges ouverts", count=1, severity="high"),
        ]

    def _trends(self, days: int, new_s: int, open_s: int) -> list[TrendPointResponse]:
        out = []
        for i in range(min(days, 30)):
            d = datetime.now(timezone.utc) - timedelta(days=days - 1 - i)
            f = 0.8 + i / max(days, 1) * 0.2
            out.append(TrendPointResponse(
                date=d.strftime("%Y-%m-%d"),
                new_tickets=int(new_s / days * f),
                resolved_tickets=int(new_s / days * f * 0.8),
                open_tickets=int(open_s / days * f * 1.2),
            ))
        return out

    def _channels(self, total: int) -> list[ChannelBreakdownResponse]:
        return [ChannelBreakdownResponse(channel=c, count=int(total * w), percent=round(w * 100, 1), color=col) for c, w, col in CHANNELS]

    def _spark_int(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _spark_float(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
