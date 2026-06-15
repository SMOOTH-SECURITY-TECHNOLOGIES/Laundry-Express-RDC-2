import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.exceptions import ValidationError
from app.models.support import SupportTicket, TicketStatus
from app.models.user import UserRole
from app.services.customer_support_service import CustomerSupportService


class TestCustomerSupportService(unittest.TestCase):
    def _service(self):
        db = MagicMock()
        return CustomerSupportService(db), db

    def test_create_ticket_without_order(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()

        with patch.object(svc, "_resolve_order_context", return_value=(None, None, None)):
            ticket = svc.create_ticket(customer_id, {
                "title": "Problème livraison",
                "description": "Ma commande est en retard",
                "category": "delivery",
            })

        self.assertEqual(ticket.status, TicketStatus.OPEN.value)
        db.add.assert_called()
        db.commit.assert_called()

    def test_create_ticket_rejects_foreign_order(self):
        svc, _ = self._service()
        customer_id = uuid.uuid4()
        foreign_order_id = uuid.uuid4()

        with patch.object(
            svc,
            "_resolve_order_context",
            side_effect=ValidationError("Vous n'êtes pas propriétaire de cette commande"),
        ):
            with self.assertRaises(ValidationError):
                svc.create_ticket(customer_id, {
                    "title": "Litige",
                    "description": "Commande d'un autre client",
                    "order_id": foreign_order_id,
                })

    def test_get_ticket_denies_other_customer(self):
        svc, db = self._service()
        owner_id = uuid.uuid4()
        other_id = uuid.uuid4()
        ticket_id = uuid.uuid4()

        ticket = SupportTicket(
            id=ticket_id,
            user_id=owner_id,
            title="Privé",
            description="Détails",
            status=TicketStatus.OPEN.value,
            priority="medium",
        )
        db.query.return_value.options.return_value.filter.return_value.first.return_value = ticket

        result = svc.get_ticket(ticket_id, other_id, is_admin=False)
        self.assertIsNone(result)

    def test_get_ticket_allows_admin(self):
        svc, db = self._service()
        owner_id = uuid.uuid4()
        admin_id = uuid.uuid4()
        ticket_id = uuid.uuid4()

        ticket = SupportTicket(
            id=ticket_id,
            user_id=owner_id,
            title="Visible admin",
            description="Détails",
            status=TicketStatus.OPEN.value,
            priority="medium",
        )
        db.query.return_value.options.return_value.filter.return_value.first.return_value = ticket

        result = svc.get_ticket(ticket_id, admin_id, is_admin=True)
        self.assertIsNotNone(result)
        self.assertEqual(result.id, ticket_id)

    def test_list_tickets_scoped_to_customer(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        scoped_query = db.query.return_value.options.return_value.order_by.return_value
        scoped_query.filter.return_value.limit.return_value.all.return_value = []

        tickets = svc.list_tickets_for_user(customer_id, is_admin=False)
        self.assertEqual(tickets, [])
        scoped_query.filter.assert_called_once()

    def test_add_attachment_creates_proof_message(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        ticket_id = uuid.uuid4()
        ticket = SupportTicket(
            id=ticket_id,
            user_id=customer_id,
            title="Preuve",
            description="Besoin d'aide",
            status=TicketStatus.OPEN.value,
            priority="medium",
        )

        with patch.object(svc, "get_ticket", return_value=ticket):
            attachment = svc.add_attachment(
                ticket_id,
                customer_id,
                file_url="https://cdn.example.com/proof.jpg",
                file_name="proof.jpg",
                mime_type="image/jpeg",
                size=1024,
            )

        self.assertEqual(attachment.file_url, "https://cdn.example.com/proof.jpg")
        self.assertGreaterEqual(db.add.call_count, 2)
        db.commit.assert_called()

    def test_ensure_customer_role_blocks_partner(self):
        user = MagicMock()
        user.role = UserRole.PARTNER_OWNER
        with self.assertRaises(ValidationError):
            CustomerSupportService.ensure_customer_role(user)


if __name__ == "__main__":
    unittest.main()
