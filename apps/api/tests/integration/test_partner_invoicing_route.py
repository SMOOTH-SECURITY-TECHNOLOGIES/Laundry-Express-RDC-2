from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerInvoicingRoute:
    def setup_method(self):
        self.client = TestClient(app)
        self.partner_id = uuid4()
        self.order_id = uuid4()

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_returns_403_when_user_has_no_partner_access(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: False
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/invoice-eligible-orders")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_invoice_eligible_orders(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True
        )
        monkeypatch.setattr(
            dashboard_route.PartnerInvoicingService,
            "list_invoice_eligible_orders",
            lambda self, partner_id: {
                "items": [
                    {
                        "order_id": str(uuid4()),
                        "order_number": "ORD-001",
                        "completed_at": "2026-03-20T10:00:00+01:00",
                        "customer_name": "Alice",
                        "amount": "50.00",
                        "currency": "CDF",
                        "proforma_generated_at": None,
                        "invoice_generated_at": None,
                        "can_generate_proforma": True,
                        "can_generate_invoice": True,
                    }
                ]
            },
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/invoice-eligible-orders")

        assert response.status_code == 200
        body = response.json()
        assert body["items"][0]["order_number"] == "ORD-001"

    def test_generates_proforma_document(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(
            dashboard_route,
            "user_has_partner_access_sync",
            lambda db, user, partner_id: True,
        )
        monkeypatch.setattr(
            dashboard_route.PartnerInvoicingService,
            "_get_order_or_raise",
            lambda self, order_id: SimpleNamespace(partner_id=self_partner_id),
        )
        monkeypatch.setattr(
            dashboard_route.PartnerInvoicingService,
            "generate_document",
            lambda self, order_id, document_type: {
                "document_type": "proforma",
                "generated_at": "2026-03-20T10:00:00+01:00",
                "payload": {
                    "order_id": str(order_id),
                    "order_number": "ORD-001",
                    "currency": "CDF",
                    "partner_name": "Laundry Pro",
                    "partner_address": "Gombe, Kinshasa",
                    "customer_name": "Alice",
                    "customer_phone": "+243000000000",
                    "customer_address": "Limete, Kinshasa",
                    "completed_at": "2026-03-20T09:00:00+01:00",
                    "generated_at": "2026-03-20T10:00:00+01:00",
                    "document_reference": "PROFORMA-ORD-001",
                    "line_items": [],
                    "subtotal_amount": "50.00",
                    "discount_amount": "0.00",
                    "total_amount": "50.00",
                },
            },
        )

        response = self.client.post(f"/api/v1/partners/orders/{self.order_id}/proforma")

        assert response.status_code == 200
        assert response.json()["document_type"] == "proforma"


self_partner_id = uuid4()
