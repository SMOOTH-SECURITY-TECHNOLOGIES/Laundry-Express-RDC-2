from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.claim import Claim, ClaimEscalation, ClaimRefund, ClaimRefundStatus
from app.models.logistics import Driver
from app.models.partner import Partner
from app.models.user import User
from app.schemas.claim_dashboard import (
    ClaimDashboardResponse, ClaimDetailResponse, ClaimKpiResponse, ClaimListItemResponse,
    DistributionItemResponse, DriverRiskResponse, HeatmapZoneResponse, PartnerRiskResponse,
    RefundCenterResponse, RootCauseResponse, SlaPanelResponse, WorkflowColumnResponse,
)
from app.services.claim_sla_service import ClaimSlaService
from app.services.claims_service import ClaimsService

TYPE_LABELS = {
    "delivery": "Livraison", "payment": "Paiement", "refund": "Remboursement",
    "driver": "Chauffeur", "partner": "Partenaire", "quality": "Qualité",
    "account": "Compte", "fraud": "Fraude", "sla": "SLA", "other": "Autre",
}
TYPE_COLORS = {
    "delivery": "#3B82F6", "payment": "#8B5CF6", "refund": "#EF4444", "quality": "#F59E0B",
    "driver": "#22C55E", "partner": "#06B6D4", "account": "#6B7280", "other": "#9CA3AF",
}
STATUS_LABELS = {
    "new": "Nouveau", "open": "Ouvert", "investigating": "Enquête",
    "waiting_customer": "Attente client", "waiting_partner": "Attente partenaire",
    "waiting_driver": "Attente chauffeur", "escalated": "Escaladé",
    "resolved": "Résolu", "closed": "Fermé", "rejected": "Rejeté",
}
PRIORITY_LABELS = {"low": "Low", "medium": "Medium", "high": "High", "critical": "Critical"}
WORKFLOW = [
    ("new", "Nouveau"), ("open", "Analyse"), ("investigating", "Enquête"),
    ("escalated", "Décision"), ("resolved", "Résolution"), ("closed", "Fermeture"),
]
ROOT_CAUSES = [
    ("Retard livraison", "delivery"), ("Paiement échoué", "payment"),
    ("Article manquant", "delivery"), ("Chauffeur injoignable", "driver"),
    ("Qualité nettoyage", "quality"), ("Délai partenaire", "partner"),
]
HEATMAP_ZONES = ["Gombe", "Limete", "Ngaliema", "Kintambo", "Kalamu", "Masina", "Lemba"]


class ClaimsDashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.sla_svc = ClaimSlaService(db)
        ClaimsService(db).sync_from_disputes()

    def get_dashboard(self, days: int = 7) -> ClaimDashboardResponse:
        claims = self.db.query(Claim).order_by(Claim.updated_at.desc()).limit(200).all()
        items = [self._to_item(c) for c in claims]
        open_c = sum(1 for c in claims if c.status not in ("resolved", "closed", "rejected"))
        critical = sum(1 for c in claims if c.priority == "critical" and c.status not in ("resolved", "closed", "rejected"))
        active = sum(1 for c in claims if c.status in ("open", "investigating", "escalated"))
        exposure = float(self.db.query(func.coalesce(func.sum(ClaimRefund.requested_amount), 0)).filter(
            ClaimRefund.status == ClaimRefundStatus.PENDING.value,
        ).scalar() or 0)
        resolved = sum(1 for c in claims if c.status == "resolved")
        in_sla = sum(1 for c in claims if self.sla_svc.sla_state(c)[0] == "in_sla" and c.status not in ("resolved", "closed", "rejected"))
        total_active = max(sum(1 for c in claims if c.status not in ("resolved", "closed", "rejected")), 1)
        sla_pct = round(in_sla / total_active * 100, 1) if claims else 0.0
        avg_hours = self._avg_resolution_hours(claims)

        kpis = ClaimKpiResponse(
            open_claims=open_c, open_claims_change=0.0, open_claims_sparkline=self._spark_int(open_c, days),
            critical_claims=critical, critical_claims_change=0.0, critical_claims_sparkline=self._spark_int(critical, days),
            active_disputes=active, active_disputes_change=0.0, active_disputes_sparkline=self._spark_int(active, days),
            refund_exposure=exposure, refund_exposure_change=0.0, refund_exposure_sparkline=self._spark_float(exposure, days),
            sla_compliance=sla_pct, sla_compliance_change=0.0, sla_compliance_sparkline=self._spark_float(sla_pct, days),
            avg_resolution_hours=avg_hours, avg_resolution_change=0.0, avg_resolution_sparkline=self._spark_float(avg_hours, days),
            resolved_this_month=resolved, resolved_change=0.0, resolved_sparkline=self._spark_int(resolved, days),
            amount_at_risk=exposure, amount_at_risk_change=0.0, amount_at_risk_sparkline=self._spark_float(exposure, days),
        )

        return ClaimDashboardResponse(
            kpis=kpis,
            claims=items,
            distribution=self._distribution(claims),
            sla=self._sla_panel(claims),
            workflow=self._workflow(items),
            root_causes=self._root_causes(claims),
            heatmap=self._heatmap(claims),
            partner_risks=self._partner_risks(),
            driver_risks=self._driver_risks(),
            refunds=self._refund_center(),
            escalations=self._escalations(),
            source="backend",
        )

    def get_claim(self, claim_id: str) -> ClaimDetailResponse | None:
        c = self.db.query(Claim).filter(Claim.id == claim_id).first()
        if not c:
            return None
        item = self._to_item(c)
        refunds = self.db.query(ClaimRefund).filter(ClaimRefund.claim_id == c.id).all()
        fin = float(sum(r.requested_amount or 0 for r in refunds))
        driver_name = None
        if c.driver_id:
            drv = self.db.query(Driver).filter(Driver.id == c.driver_id).first()
            if drv:
                u = self.db.query(User).filter(User.id == drv.user_id).first()
                driver_name = u.name if u else None
        return ClaimDetailResponse(
            **item.model_dump(),
            description=c.description,
            order_id=str(c.order_id) if c.order_id else None,
            driver_name=driver_name,
            risk_score=c.risk_score or 0,
            recommendation="Escalader vers équipe remboursements" if c.priority in ("critical", "high") else "Traiter sous SLA standard",
            timeline=[{"event": e.event_type, "date": e.created_at.isoformat() if e.created_at else None, "detail": e.new_status} for e in (c.events or [])],
            notes=[{"content": n.content, "author_id": str(n.author_id)} for n in (c.notes or [])],
            attachments=[{"url": a.file_url, "mime": a.mime_type} for a in (c.attachments or [])],
            refunds=[{"amount": r.requested_amount, "status": r.status} for r in refunds],
            escalations=[{"reason": e.reason, "severity": e.severity} for e in (c.escalations or [])],
        )

    def _to_item(self, c: Claim) -> ClaimListItemResponse:
        user = self.db.query(User).filter(User.id == c.customer_id).first()
        partner = self.db.query(Partner).filter(Partner.id == c.partner_id).first() if c.partner_id else None
        state, remaining = self.sla_svc.sla_state(c)
        refunds = self.db.query(ClaimRefund).filter(ClaimRefund.claim_id == c.id).all()
        fin = float(sum(r.requested_amount or 0 for r in refunds))
        sla_label = f"Dans SLA ({remaining} min)" if state == "in_sla" and remaining else f"Hors SLA" if state == "breached" else f"À risque ({remaining} min)" if remaining else "Résolu"
        return ClaimListItemResponse(
            id=str(c.id), claim_number=c.claim_number, title=c.title,
            ai_summary=c.ai_summary or c.description[:120],
            client_name=user.name if user else "Client",
            category=c.type, category_label=TYPE_LABELS.get(c.type, c.type),
            priority=c.priority, priority_label=PRIORITY_LABELS.get(c.priority, c.priority),
            status=c.status, status_label=STATUS_LABELS.get(c.status, c.status),
            financial_impact=fin, sla_label=sla_label, sla_state=state,
            sla_minutes_remaining=remaining,
            updated_at=c.updated_at.isoformat() if c.updated_at else None,
            partner_name=partner.name if partner else None,
        )

    def _distribution(self, claims: list[Claim]) -> list[DistributionItemResponse]:
        buckets: dict[str, int] = {}
        for c in claims:
            buckets[c.type] = buckets.get(c.type, 0) + 1
        total = max(len(claims), 1)
        return [DistributionItemResponse(category=TYPE_LABELS.get(k, k), count=v, percent=round(v / total * 100, 1), color=TYPE_COLORS.get(k, "#6B7280")) for k, v in sorted(buckets.items(), key=lambda x: -x[1])]

    def _sla_panel(self, claims: list[Claim]) -> SlaPanelResponse:
        in_s, at_r, br = 0, 0, 0
        by_cat: dict[str, dict] = {}
        for c in claims:
            if c.status in ("resolved", "closed", "rejected"):
                continue
            st, _ = self.sla_svc.sla_state(c)
            if st == "in_sla":
                in_s += 1
            elif st == "at_risk":
                at_r += 1
            else:
                br += 1
            label = TYPE_LABELS.get(c.type, c.type)
            by_cat.setdefault(label, {"in_sla": 0, "at_risk": 0, "breached": 0})
            by_cat[label][st if st != "in_sla" else "in_sla"] = by_cat[label].get(st if st != "in_sla" else "in_sla", 0) + 1
        total = max(in_s + at_r + br, 1)
        return SlaPanelResponse(
            in_sla=in_s, at_risk=at_r, breached=br,
            compliance_percent=round(in_s / total * 100, 1) if total else 0.0,
            by_category=[{"category": k, **v} for k, v in by_cat.items()],
        )

    def _workflow(self, items: list[ClaimListItemResponse]) -> list[WorkflowColumnResponse]:
        mapping = {"new": "new", "open": "open", "investigating": "investigating", "escalated": "escalated", "waiting_customer": "investigating", "waiting_partner": "investigating", "waiting_driver": "investigating", "resolved": "resolved", "closed": "closed", "rejected": "closed"}
        return [WorkflowColumnResponse(stage=st, stage_label=label, claims=[i for i in items if mapping.get(i.status, "open") == st][:5]) for st, label in WORKFLOW]

    def _root_causes(self, claims: list[Claim]) -> list[RootCauseResponse]:
        out = []
        for cause, ctype in ROOT_CAUSES:
            cnt = sum(1 for c in claims if c.type == ctype)
            out.append(RootCauseResponse(cause=cause, occurrences=cnt, trend=0.0, impact="high" if ctype in ("payment", "delivery") else "medium"))
        return out

    def _heatmap(self, claims: list[Claim]) -> list[HeatmapZoneResponse]:
        buckets: dict[str, int] = {z: 0 for z in HEATMAP_ZONES}
        for c in claims:
            z = c.zone or HEATMAP_ZONES[hash(str(c.id)) % len(HEATMAP_ZONES)]
            buckets[z] = buckets.get(z, 0) + 1
        total = max(sum(buckets.values()), 1)
        return [HeatmapZoneResponse(zone=z, claims=cnt, density=round(cnt / total * 100, 1)) for z, cnt in buckets.items()]

    def _partner_risks(self) -> list[PartnerRiskResponse]:
        rows = self.db.query(
            Partner.id, Partner.name, Partner.rating,
            func.count(Claim.id).label("cnt"),
            func.coalesce(func.sum(ClaimRefund.requested_amount), 0).label("refund"),
        ).outerjoin(Claim, Claim.partner_id == Partner.id).outerjoin(ClaimRefund, ClaimRefund.claim_id == Claim.id).group_by(Partner.id).order_by(
            func.count(Claim.id).desc(),
        ).limit(10).all()
        return [
            PartnerRiskResponse(
                partner_id=str(r.id), partner_name=r.name, claim_count=int(r.cnt or 0),
                avg_rating=float(r.rating or 4.0), refund_amount=float(r.refund or 0),
                risk_score=min(100, int(r.cnt or 0) * 8 + float(r.refund or 0) / 100),
            )
            for r in rows
        ]

    def _driver_risks(self) -> list[DriverRiskResponse]:
        rows = self.db.query(Driver).limit(10).all()
        out = []
        for d in rows:
            u = self.db.query(User).filter(User.id == d.user_id).first()
            out.append(DriverRiskResponse(
                driver_id=str(d.id), driver_name=u.name if u else "Chauffeur",
                incident_count=int(self.db.query(func.count(Claim.id)).filter(Claim.driver_id == d.id).scalar() or 0),
                complaints=int(self.db.query(func.count(Claim.id)).filter(Claim.driver_id == d.id, Claim.type == "driver").scalar() or 0),
                avg_rating=float(d.rating_avg or 4.0), risk_score=min(100, int(d.rating_count or 0) * 5 + 20),
            ))
        return out

    def _refund_center(self) -> RefundCenterResponse:
        pending = self.db.query(ClaimRefund).filter(ClaimRefund.status == ClaimRefundStatus.PENDING.value).all()
        approved = self.db.query(ClaimRefund).filter(ClaimRefund.status == ClaimRefundStatus.APPROVED.value).all()
        paid = self.db.query(ClaimRefund).filter(ClaimRefund.status == ClaimRefundStatus.PAID.value).all()
        rejected = self.db.query(ClaimRefund).filter(ClaimRefund.status == ClaimRefundStatus.REJECTED.value).all()
        return RefundCenterResponse(
            pending_count=len(pending), pending_amount=sum(r.requested_amount or 0 for r in pending),
            approved_count=len(approved), approved_amount=sum(r.approved_amount or 0 for r in approved),
            paid_count=len(paid), paid_amount=sum(r.approved_amount or 0 for r in paid),
            rejected_count=len(rejected), rejected_amount=sum(r.requested_amount or 0 for r in rejected),
            total_exposure=sum(r.requested_amount or 0 for r in pending) + sum(r.approved_amount or 0 for r in approved),
        )

    def _escalations(self) -> list[dict]:
        rows = self.db.query(ClaimEscalation).order_by(ClaimEscalation.created_at.desc()).limit(10).all()
        return [{"reason": e.reason, "severity": e.severity, "claim_id": str(e.claim_id)} for e in rows]

    def _avg_resolution_hours(self, claims: list[Claim]) -> float:
        durations = []
        for c in claims:
            if c.resolved_at and c.opened_at:
                durations.append((c.resolved_at - c.opened_at).total_seconds() / 3600)
        return round(sum(durations) / len(durations), 1) if durations else 0.0

    def _spark_int(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _spark_float(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
