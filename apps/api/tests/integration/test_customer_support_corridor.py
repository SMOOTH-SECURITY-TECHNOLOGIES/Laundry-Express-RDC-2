import os
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-customer-support-corridor")
os.environ.setdefault("ADMIN_PASSWORD", "test-admin-password")

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app
from app.models.support import SupportTicket, TicketStatus
from app.models.user import UserRole


class TestCustomerSupportCorridor(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides.clear()
        self.customer_id = uuid.uuid4()
        self.other_customer_id = uuid.uuid4()
        self.admin_id = uuid.uuid4()
        self.ticket_id = uuid.uuid4()
        self.order_id = uuid.uuid4()

    def tearDown(self):
        app.dependency_overrides.clear()

    def _as_customer(self):
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=self.customer_id,
            role=UserRole.CUSTOMER,
            name="Client Test",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([MagicMock()])

    def _as_admin(self):
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=self.admin_id,
            role=UserRole.ADMIN,
            name="Admin Test",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([MagicMock()])

    def test_create_ticket_requires_auth(self):
        response = self.client.post("/api/v1/support/tickets", json={
            "title": "Problème",
            "description": "Besoin d'aide",
        })
        self.assertEqual(response.status_code, 403)

    @patch("app.api.routes.support.CustomerSupportService")
    def test_customer_creates_ticket(self, mock_service_cls):
        self._as_customer()
        ticket = SupportTicket(
            id=self.ticket_id,
            user_id=self.customer_id,
            title="Problème",
            description="Besoin d'aide",
            status=TicketStatus.OPEN.value,
            priority="medium",
            order_id=self.order_id,
        )
        service = mock_service_cls.return_value
        service.create_ticket.return_value = ticket
        service.build_ticket_response.return_value = {
            "id": self.ticket_id,
            "user_id": self.customer_id,
            "title": "Problème",
            "description": "Besoin d'aide",
            "status": "open",
            "priority": "medium",
            "category": None,
            "order_id": self.order_id,
            "partner_id": None,
            "order_number": "ORD-123",
            "payment_status": "paid",
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "messages": [],
            "attachments": [],
        }

        response = self.client.post("/api/v1/support/tickets", json={
            "title": "Problème",
            "description": "Besoin d'aide",
            "order_id": str(self.order_id),
        })
        self.assertEqual(response.status_code, 201)
        service.create_ticket.assert_called_once()

    @patch("app.api.routes.support.CustomerSupportService")
    def test_customer_lists_only_own_tickets(self, mock_service_cls):
        self._as_customer()
        service = mock_service_cls.return_value
        service.list_tickets_for_user.return_value = []
        service.build_ticket_response.side_effect = lambda ticket: {"id": str(ticket.id)}

        response = self.client.get("/api/v1/support/tickets")
        self.assertEqual(response.status_code, 200)
        service.list_tickets_for_user.assert_called_with(self.customer_id, is_admin=False)

    @patch("app.api.routes.support.CustomerSupportService")
    def test_customer_cannot_read_other_ticket(self, mock_service_cls):
        self._as_customer()
        service = mock_service_cls.return_value
        service.get_ticket.return_value = None

        response = self.client.get(f"/api/v1/support/tickets/{self.ticket_id}")
        self.assertEqual(response.status_code, 404)

    @patch("app.api.routes.support.CustomerSupportService")
    def test_admin_can_read_customer_ticket(self, mock_service_cls):
        self._as_admin()
        ticket = SupportTicket(
            id=self.ticket_id,
            user_id=self.customer_id,
            title="Ticket client",
            description="Détails",
            status=TicketStatus.OPEN.value,
            priority="medium",
        )
        service = mock_service_cls.return_value
        service.get_ticket.return_value = ticket
        service.build_ticket_response.return_value = {
            "id": self.ticket_id,
            "user_id": self.customer_id,
            "title": "Ticket client",
            "description": "Détails",
            "status": "open",
            "priority": "medium",
            "category": None,
            "order_id": None,
            "partner_id": None,
            "order_number": None,
            "payment_status": None,
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "messages": [],
            "attachments": [],
        }

        response = self.client.get(f"/api/v1/support/tickets/{self.ticket_id}")
        self.assertEqual(response.status_code, 200)
        service.get_ticket.assert_called_with(self.ticket_id, self.admin_id, is_admin=True)

    @patch("app.api.routes.support.CustomerSupportService")
    def test_customer_replies_to_ticket(self, mock_service_cls):
        self._as_customer()
        ticket = SupportTicket(
            id=self.ticket_id,
            user_id=self.customer_id,
            title="Ticket",
            description="Détails",
            status=TicketStatus.IN_PROGRESS.value,
            priority="medium",
        )
        service = mock_service_cls.return_value
        service.get_ticket.return_value = ticket
        service.build_ticket_response.return_value = {
            "id": self.ticket_id,
            "user_id": self.customer_id,
            "title": "Ticket",
            "description": "Détails",
            "status": "in_progress",
            "priority": "medium",
            "category": None,
            "order_id": None,
            "partner_id": None,
            "order_number": None,
            "payment_status": None,
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "messages": [{
                "id": str(uuid.uuid4()),
                "ticket_id": str(self.ticket_id),
                "user_id": str(self.customer_id),
                "content": "Merci",
                "is_internal": False,
                "created_at": "2026-06-10T10:00:00Z",
            }],
            "attachments": [],
        }

        response = self.client.post(
            f"/api/v1/support/tickets/{self.ticket_id}/messages",
            json={"content": "Voici des précisions"},
        )
        self.assertEqual(response.status_code, 200)
        service.add_message.assert_called_once()

    @patch("app.api.routes.support.CustomerSupportService")
    def test_customer_attaches_proof(self, mock_service_cls):
        self._as_customer()
        service = mock_service_cls.return_value
        attachment = SimpleNamespace(
            id=uuid.uuid4(),
            ticket_id=self.ticket_id,
            uploaded_by=self.customer_id,
            file_url="https://cdn.example.com/proof.jpg",
            file_name="proof.jpg",
            mime_type="image/jpeg",
            size=2048,
            created_at="2026-06-10T10:00:00Z",
        )
        service.add_attachment.return_value = attachment

        response = self.client.post(
            f"/api/v1/support/tickets/{self.ticket_id}/attachments",
            json={
                "file_url": "https://cdn.example.com/proof.jpg",
                "file_name": "proof.jpg",
                "mime_type": "image/jpeg",
                "size": 2048,
            },
        )
        self.assertEqual(response.status_code, 201)
        service.add_attachment.assert_called_once()


if __name__ == "__main__":
    unittest.main()
