from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerOrdersRoute:
    def setup_method(self):
        self.client = TestClient(app)
        self.partner_id = uuid4()

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_returns_403_when_user_has_no_partner_access(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: False)

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/orders")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_partner_orders_payload(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)

        expected = {
            "items": [
                {
                    "id": str(uuid4()),
                    "order_number": "ORD-0001",
                    "status": "confirmed",
                    "customer_name": "Client Test",
                    "customer_phone": "+243810000000",
                    "created_at": "2026-03-20T10:00:00+01:00",
                    "completed_at": None,
                    "total_amount": "25.50",
                    "amount_paid": "0.00",
                    "payment_status": "pending",
                    "service_labels": ["Wash & Fold"],
                }
            ],
            "total": 1,
            "page": 1,
            "page_size": 20,
            "summary": {
                "total_orders": 1,
                "status_counts": {
                    "confirmed": 1,
                },
            },
        }

        monkeypatch.setattr(
            dashboard_route.PartnerOrdersService,
            "list_partner_orders",
            lambda self, partner_id, **kwargs: expected,
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/orders")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["order_number"] == "ORD-0001"
        assert body["summary"]["status_counts"]["confirmed"] == 1

    def test_forwards_filters_to_service(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)

        captured: dict = {}

        def fake_list(self, partner_id, **kwargs):
            captured["partner_id"] = partner_id
            captured.update(kwargs)
            return {
                "items": [],
                "total": 0,
                "page": kwargs["page"],
                "page_size": kwargs["page_size"],
                "summary": {
                    "total_orders": 0,
                    "status_counts": {},
                },
            }

        monkeypatch.setattr(dashboard_route.PartnerOrdersService, "list_partner_orders", fake_list)

        response = self.client.get(
            f"/api/v1/partners/{self.partner_id}/orders",
            params={
                "status": "completed",
                "page": 2,
                "page_size": 10,
                "date_from": "2026-03-01",
                "date_to": "2026-03-20",
                "search": "alice",
            },
        )

        assert response.status_code == 200
        assert str(captured["partner_id"]) == str(self.partner_id)
        assert captured["status"].value == "completed"
        assert captured["page"] == 2
        assert captured["page_size"] == 10
        assert str(captured["date_from"]) == "2026-03-01"
        assert str(captured["date_to"]) == "2026-03-20"
        assert captured["search"] == "alice"
