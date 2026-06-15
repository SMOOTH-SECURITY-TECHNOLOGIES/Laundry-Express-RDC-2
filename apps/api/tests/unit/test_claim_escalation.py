import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.models.claim import Claim, ClaimStatus
from app.services.claims_service import ClaimsService


class TestClaimEscalation(unittest.TestCase):
    @patch.object(ClaimsService, '_log_event')
    def test_auto_escalate_changes_status(self, _log):
        db = MagicMock()
        claim = Claim(
            id=uuid.uuid4(), claim_number="CLM-2026-0099", customer_id=uuid.uuid4(),
            title="Critique", description="Urgent", type="payment",
            priority="critical", status=ClaimStatus.OPEN.value,
        )
        svc = ClaimsService(db)
        actor = uuid.uuid4()
        result = svc._auto_escalate(claim, actor, "Priorité critique")
        self.assertEqual(result.status, ClaimStatus.ESCALATED.value)
        db.add.assert_called()
        db.commit.assert_called()

    def test_escalate_raises_when_missing(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        svc = ClaimsService(db)
        with self.assertRaises(ValueError):
            svc.escalate(uuid.uuid4(), uuid.uuid4(), "Test")


if __name__ == "__main__":
    unittest.main()
