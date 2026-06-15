import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.models.claim import Claim, ClaimStatus
from app.services.claims_service import ClaimsService


class TestClaimWorkflow(unittest.TestCase):
    def _claim(self):
        c = Claim(id=uuid.uuid4(), claim_number="CLM-2026-0001", customer_id=uuid.uuid4(),
                  title="Test", description="Desc", type="delivery", priority="medium",
                  status=ClaimStatus.NEW.value)
        return c

    @patch.object(ClaimsService, '_log_event')
    def test_assign_opens_claim(self, _log):
        db = MagicMock()
        claim = self._claim()
        db.query.return_value.filter.return_value.first.return_value = claim
        svc = ClaimsService(db)
        assignee = uuid.uuid4()
        actor = uuid.uuid4()
        result = svc.assign(claim.id, assignee, actor)
        self.assertEqual(result.status, ClaimStatus.OPEN.value)
        self.assertEqual(result.assigned_to, assignee)

    @patch.object(ClaimsService, '_auto_escalate')
    @patch.object(ClaimsService, '_log_event')
    def test_update_status_to_resolved(self, _log, _esc):
        db = MagicMock()
        claim = self._claim()
        claim.status = ClaimStatus.OPEN.value
        db.query.return_value.filter.return_value.first.return_value = claim
        svc = ClaimsService(db)
        svc.sla.sla_state = MagicMock(return_value=("in_sla", 120))
        result = svc.update_status(claim.id, ClaimStatus.RESOLVED.value, uuid.uuid4())
        self.assertEqual(result.status, ClaimStatus.RESOLVED.value)
        self.assertIsNotNone(result.resolved_at)


if __name__ == "__main__":
    unittest.main()
