import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.claim import (
    Claim, ClaimAssignment, ClaimEscalation, ClaimEvent, ClaimNote,
    ClaimRefund, ClaimRefundStatus, ClaimStatus, ClaimStatusHistory, ClaimAttachment,
)
from app.models.dispute import Dispute
from app.services.claim_ai_summary_service import ClaimAISummaryService
from app.services.claim_sla_service import ClaimSlaService

TYPE_MAP = {
    "quality_issue": "quality", "delivery_issue": "delivery", "late_delivery": "delivery",
    "pricing_issue": "payment", "item_missing": "delivery", "damaged_item": "quality",
    "wrong_item": "quality", "service_issue": "partner", "other": "other",
}
PRIORITY_MAP = {"low": "low", "medium": "medium", "high": "high", "urgent": "critical"}
STATUS_MAP = {
    "open": "open", "under_review": "investigating", "resolved": "resolved",
    "rejected": "rejected", "closed": "closed",
}
ZONES = ["Gombe", "Limete", "Ngaliema", "Kintambo", "Kalamu", "Masina", "Lemba"]


class ClaimsService:
    def __init__(self, db: Session):
        self.db = db
        self.sla = ClaimSlaService(db)
        self.ai = ClaimAISummaryService()

    def sync_from_disputes(self) -> int:
        if self.db.query(Claim).count() > 0:
            return 0
        disputes = self.db.query(Dispute).limit(200).all()
        count = 0
        for d in disputes:
            ctype = TYPE_MAP.get(d.category, "other")
            opened = d.created_at or datetime.now(timezone.utc)
            claim = Claim(
                id=uuid.uuid4(),
                claim_number=self._next_number(),
                customer_id=d.customer_id,
                order_id=d.order_id,
                partner_id=d.partner_id,
                type=ctype,
                priority=PRIORITY_MAP.get(d.priority, "medium"),
                status=STATUS_MAP.get(d.status, "open"),
                title=d.title,
                description=d.description,
                opened_at=opened,
                sla_deadline=self.sla.compute_deadline(ctype, opened),
                zone=ZONES[count % len(ZONES)],
            )
            claim.ai_summary = self.ai.generate(claim)
            claim.risk_score = self.ai.risk_score(claim)
            self.db.add(claim)
            self._log_event(claim, "imported", None, claim.status, None, {"source": "dispute", "dispute_id": str(d.id)})
            count += 1
        if count:
            self.db.commit()
        return count

    def create_claim(self, data: dict, actor_id: uuid.UUID) -> Claim:
        now = datetime.now(timezone.utc)
        ctype = data.get("type", "other")
        claim = Claim(
            id=uuid.uuid4(),
            claim_number=self._next_number(),
            customer_id=data.get("customer_id") or actor_id,
            order_id=data.get("order_id"),
            partner_id=data.get("partner_id"),
            driver_id=data.get("driver_id"),
            type=ctype,
            priority=data.get("priority", "medium"),
            status=ClaimStatus.NEW.value,
            title=data["title"],
            description=data["description"],
            opened_at=now,
            sla_deadline=self.sla.compute_deadline(ctype, now),
            zone=data.get("zone"),
        )
        claim.ai_summary = self.ai.generate(claim)
        claim.risk_score = self.ai.risk_score(claim)
        self.db.add(claim)
        self._log_event(claim, "created", None, claim.status, actor_id)
        self.db.flush()
        if claim.priority == "critical":
            self._auto_escalate(claim, actor_id, "Priorité critique à la création")
        self.db.commit()
        return claim

    def update_status(self, claim_id: uuid.UUID, status: str, actor_id: uuid.UUID, note: str | None = None) -> Claim:
        claim = self.db.query(Claim).filter(Claim.id == claim_id).first()
        if not claim:
            raise ValueError("Réclamation introuvable")
        old = claim.status
        claim.status = status
        if status == ClaimStatus.RESOLVED.value:
            claim.resolved_at = datetime.now(timezone.utc)
        if status in (ClaimStatus.CLOSED.value, ClaimStatus.REJECTED.value):
            claim.closed_at = datetime.now(timezone.utc)
        self.db.add(ClaimStatusHistory(claim_id=claim.id, old_status=old, new_status=status, changed_by=actor_id))
        self._log_event(claim, "status_changed", old, status, actor_id)
        if note:
            self.db.add(ClaimNote(claim_id=claim.id, author_id=actor_id, content=note))
        self.db.flush()
        state, _ = self.sla.sla_state(claim)
        if state == "breached" or claim.priority == "critical":
            self._auto_escalate(claim, actor_id, "SLA dépassé ou critique")
        self.db.commit()
        return claim

    def assign(self, claim_id: uuid.UUID, assignee_id: uuid.UUID, actor_id: uuid.UUID) -> Claim:
        claim = self.db.query(Claim).filter(Claim.id == claim_id).first()
        if not claim:
            raise ValueError("Réclamation introuvable")
        claim.assigned_to = assignee_id
        if claim.status == ClaimStatus.NEW.value:
            claim.status = ClaimStatus.OPEN.value
        self.db.add(ClaimAssignment(claim_id=claim.id, assignee_id=assignee_id, assigned_by=actor_id))
        self._log_event(claim, "assigned", claim.status, claim.status, actor_id, {"assignee_id": str(assignee_id)})
        self.db.commit()
        return claim

    def add_note(self, claim_id: uuid.UUID, author_id: uuid.UUID, content: str, internal: bool = True) -> ClaimNote:
        note = ClaimNote(claim_id=claim_id, author_id=author_id, content=content, is_internal="true" if internal else "false")
        self.db.add(note)
        self._log_event(self.db.query(Claim).filter(Claim.id == claim_id).first(), "note_added", None, None, author_id)
        self.db.commit()
        return note

    def add_attachment(self, claim_id: uuid.UUID, uploaded_by: uuid.UUID, file_url: str, mime: str | None, size: int | None) -> ClaimAttachment:
        att = ClaimAttachment(claim_id=claim_id, file_url=file_url, mime_type=mime, size=size, uploaded_by=uploaded_by)
        self.db.add(att)
        self.db.commit()
        return att

    def escalate(self, claim_id: uuid.UUID, actor_id: uuid.UUID, reason: str) -> Claim:
        claim = self.db.query(Claim).filter(Claim.id == claim_id).first()
        if not claim:
            raise ValueError("Réclamation introuvable")
        return self._auto_escalate(claim, actor_id, reason)

    def process_refund(self, claim_id: uuid.UUID, action: str, actor_id: uuid.UUID, amount: float | None = None) -> ClaimRefund:
        refund = self.db.query(ClaimRefund).filter(ClaimRefund.claim_id == claim_id).order_by(ClaimRefund.created_at.desc()).first()
        if not refund:
            claim = self.db.query(Claim).filter(Claim.id == claim_id).first()
            refund = ClaimRefund(claim_id=claim_id, order_id=claim.order_id if claim else None, requested_amount=amount or 0)
            self.db.add(refund)
        if action == "approve":
            refund.status = ClaimRefundStatus.APPROVED.value
            refund.approved_amount = amount or refund.requested_amount
            refund.approved_by = actor_id
        elif action == "reject":
            refund.status = ClaimRefundStatus.REJECTED.value
        elif action == "pay":
            refund.status = ClaimRefundStatus.PAID.value
            refund.paid_at = datetime.now(timezone.utc)
        self.db.commit()
        return refund

    def _auto_escalate(self, claim: Claim, actor_id: uuid.UUID | None, reason: str) -> Claim:
        if claim.status == ClaimStatus.ESCALATED.value:
            return claim
        old = claim.status
        claim.status = ClaimStatus.ESCALATED.value
        self.db.add(ClaimEscalation(claim_id=claim.id, reason=reason, escalated_by=actor_id, severity="critical" if claim.priority == "critical" else "high"))
        self._log_event(claim, "escalated", old, claim.status, actor_id, {"reason": reason})
        self.db.commit()
        return claim

    def _log_event(self, claim: Claim | None, event_type: str, old_status: str | None, new_status: str | None, actor_id: uuid.UUID | None, payload: dict | None = None) -> None:
        if not claim:
            return
        self.db.add(ClaimEvent(
            claim_id=claim.id, event_type=event_type,
            old_status=old_status, new_status=new_status or claim.status,
            actor_id=actor_id, payload=payload,
        ))

    def _next_number(self) -> str:
        year = datetime.now(timezone.utc).year
        count = self.db.query(Claim).count() + 1
        return f"CLM-{year}-{count:04d}"
