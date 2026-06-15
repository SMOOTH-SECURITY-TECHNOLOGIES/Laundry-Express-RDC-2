import unittest
import uuid
from unittest.mock import MagicMock

from app.models.claim import Claim, ClaimRefund, ClaimRefundStatus
from app.services.claims_service import ClaimsService


class TestClaimRefund(unittest.TestCase):
    def test_approve_refund(self):
        db = MagicMock()
        claim_id = uuid.uuid4()
        refund = ClaimRefund(claim_id=claim_id, requested_amount=150.0, status=ClaimRefundStatus.PENDING.value)
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = refund
        svc = ClaimsService(db)
        actor = uuid.uuid4()
        result = svc.process_refund(claim_id, "approve", actor, 150.0)
        self.assertEqual(result.status, ClaimRefundStatus.APPROVED.value)
        self.assertEqual(result.approved_amount, 150.0)

    def test_reject_refund(self):
        db = MagicMock()
        claim_id = uuid.uuid4()
        refund = ClaimRefund(claim_id=claim_id, requested_amount=50.0, status=ClaimRefundStatus.PENDING.value)
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = refund
        svc = ClaimsService(db)
        result = svc.process_refund(claim_id, "reject", uuid.uuid4())
        self.assertEqual(result.status, ClaimRefundStatus.REJECTED.value)


if __name__ == "__main__":
    unittest.main()
