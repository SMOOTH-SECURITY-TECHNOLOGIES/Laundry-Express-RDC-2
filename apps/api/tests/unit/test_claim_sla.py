import unittest
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from app.models.claim import Claim, ClaimSlaRule
from app.services.claim_sla_service import ClaimSlaService, DEFAULT_RULES


class TestClaimSla(unittest.TestCase):
    def _svc(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        return ClaimSlaService(db), db

    def test_compute_deadline_delivery_24h(self):
        svc, _ = self._svc()
        opened = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
        deadline = svc.compute_deadline("delivery", opened)
        self.assertEqual(deadline, opened + timedelta(hours=24))

    def test_sla_state_breached(self):
        svc, db = self._svc()
        rule = ClaimSlaRule(claim_type="payment", hours=12, at_risk_pct=0.75)
        db.query.return_value.filter.return_value.first.return_value = rule
        claim = Claim(
            id=uuid.uuid4(), claim_number="CLM-1", customer_id=uuid.uuid4(),
            title="T", description="D", type="payment", status="open",
            sla_deadline=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        state, remaining = svc.sla_state(claim)
        self.assertEqual(state, "breached")
        self.assertLessEqual(remaining or 0, 0)

    def test_default_rules_cover_types(self):
        self.assertIn("delivery", DEFAULT_RULES)
        self.assertEqual(DEFAULT_RULES["payment"], 12)


if __name__ == "__main__":
    unittest.main()
