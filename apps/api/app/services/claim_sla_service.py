from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.claim import Claim, ClaimSlaRule

DEFAULT_RULES = {
    "delivery": 24, "payment": 12, "refund": 48, "quality": 72,
    "driver": 24, "partner": 48, "account": 72, "fraud": 12, "sla": 6, "other": 48,
}


class ClaimSlaService:
    def __init__(self, db: Session):
        self.db = db
        self._ensure_rules()

    def _ensure_rules(self) -> None:
        for ctype, hours in DEFAULT_RULES.items():
            if not self.db.query(ClaimSlaRule).filter(ClaimSlaRule.claim_type == ctype).first():
                self.db.add(ClaimSlaRule(claim_type=ctype, hours=hours, at_risk_pct=0.75))
        self.db.flush()

    def compute_deadline(self, claim_type: str, opened_at: datetime | None = None) -> datetime:
        rule = self.db.query(ClaimSlaRule).filter(ClaimSlaRule.claim_type == claim_type).first()
        hours = rule.hours if rule else DEFAULT_RULES.get(claim_type, 48)
        base = opened_at or datetime.now(timezone.utc)
        return base + timedelta(hours=hours)

    def sla_state(self, claim: Claim) -> tuple[str, int | None]:
        if claim.status in ("resolved", "closed", "rejected"):
            return "in_sla", None
        if not claim.sla_deadline:
            return "in_sla", None
        now = datetime.now(timezone.utc)
        remaining = int((claim.sla_deadline - now).total_seconds() / 60)
        if remaining <= 0:
            return "breached", remaining
        rule = self.db.query(ClaimSlaRule).filter(ClaimSlaRule.claim_type == claim.type).first()
        total_mins = (rule.hours if rule else 48) * 60
        if remaining < total_mins * (rule.at_risk_pct if rule else 0.75):
            return "at_risk", remaining
        return "in_sla", remaining
