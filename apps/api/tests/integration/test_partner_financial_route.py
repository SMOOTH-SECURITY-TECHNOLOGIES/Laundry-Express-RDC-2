from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerFinancialSummaryRoute:
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

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/financial-summary")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_financial_summary_payload(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)

        expected = {
            "totals": {
                "revenue_total": "125.50",
                "revenue_last_30_days": "80.00",
                "completed_orders": 4,
                "average_order_value": "31.38",
            },
            "daily_revenue": [
                {"date": "2026-03-19", "amount": "30.00"},
                {"date": "2026-03-20", "amount": "50.00"},
            ],
            "transactions": [
                {
                    "order_id": str(uuid4()),
                    "order_number": "ORD-001",
                    "completed_at": "2026-03-20T10:00:00+01:00",
                    "service_label": "Wash & Fold",
                    "amount": "50.00",
                    "payment_status": "paid",
                    "payout_status": "pending",
                }
            ],
        }

        monkeypatch.setattr(
            dashboard_route.PartnerFinancialService,
            "get_partner_financial_summary",
            lambda self, partner_id: expected,
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/financial-summary")

        assert response.status_code == 200
        body = response.json()
        assert body["totals"]["completed_orders"] == 4
        assert body["transactions"][0]["order_number"] == "ORD-001"
        assert body["daily_revenue"][1]["amount"] == "50.00"
