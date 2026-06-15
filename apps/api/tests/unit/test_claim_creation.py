import unittest
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.models.claim import Claim
from app.services.claims_service import ClaimsService


class TestClaimCreation(unittest.TestCase):
    def _svc(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.filter.return_value.first.return_value = None
        return ClaimsService(db), db

    @patch.object(ClaimsService, '_auto_escalate')
    def test_create_claim_generates_number_and_ai_summary(self, mock_esc):
        svc, db = self._svc()
        actor = uuid.uuid4()
        claim = svc.create_claim({"title": "Retard livraison", "description": "Commande en retard de 3h", "type": "delivery", "priority": "high"}, actor)
        self.assertTrue(claim.claim_number.startswith("CLM-"))
        self.assertIsNotNone(claim.ai_summary)
        self.assertGreaterEqual(claim.risk_score, 0)
        db.commit.assert_called()

    def test_sync_from_disputes_skips_when_claims_exist(self):
        svc, db = self._svc()
        db.query.return_value.count.return_value = 5
        self.assertEqual(svc.sync_from_disputes(), 0)


if __name__ == "__main__":
    unittest.main()
