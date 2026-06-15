import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.exceptions import ValidationError
from app.models.claim import Claim
from app.services.customer_claims_service import CustomerClaimsService


class TestCustomerClaimsService(unittest.TestCase):
    def _service(self):
        db = MagicMock()
        return CustomerClaimsService(db), db

    def test_create_claim_with_valid_order(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        order_id = uuid.uuid4()
        partner_id = uuid.uuid4()
        claim = Claim(
            id=uuid.uuid4(),
            claim_number="CLM-2026-0001",
            customer_id=customer_id,
            order_id=order_id,
            partner_id=partner_id,
            type="delivery",
            priority="medium",
            status="new",
            title="Retard",
            description="3h de retard",
        )

        with patch.object(svc, "_validate_order", return_value=(order_id, partner_id)):
            with patch.object(svc.claims, "create_claim", return_value=claim):
                result = svc.create_claim(customer_id, {
                    "title": "Retard",
                    "description": "3h de retard",
                    "type": "delivery",
                    "order_id": order_id,
                })

        self.assertEqual(result.claim_number, "CLM-2026-0001")
        db.commit.assert_called()

    def test_create_claim_rejects_foreign_order(self):
        svc, _ = self._service()
        customer_id = uuid.uuid4()

        with patch.object(
            svc,
            "_validate_order",
            side_effect=ValidationError("Vous n'êtes pas propriétaire de cette commande"),
        ):
            with self.assertRaises(ValidationError):
                svc.create_claim(customer_id, {
                    "title": "Litige",
                    "description": "Pas ma commande",
                    "order_id": uuid.uuid4(),
                })

    def test_get_claim_for_customer_filters_owner(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        claim_id = uuid.uuid4()
        claim = Claim(
            id=claim_id,
            claim_number="CLM-2026-0002",
            customer_id=customer_id,
            type="payment",
            priority="high",
            status="open",
            title="Paiement",
            description="Double débit",
        )
        db.query.return_value.filter.return_value.first.return_value = claim

        result = svc.get_claim_for_customer(claim_id, customer_id)
        self.assertEqual(result.id, claim_id)

    def test_list_claims_for_customer(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []

        claims = svc.list_claims_for_customer(customer_id)
        self.assertEqual(claims, [])


if __name__ == "__main__":
    unittest.main()
