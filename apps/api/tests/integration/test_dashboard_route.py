from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerDashboardSummaryRoute:
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

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/dashboard-summary")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_when_summary_is_available(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)

        expected = {
            "partner": {
                "id": str(self.partner_id),
                "name": "Pressing Alpha",
                "is_featured": True,
                "currency": "CDF",
                "onboarding": {
                    "has_working_hours": True,
                    "has_services": True,
                    "has_video": False,
                    "has_promotion": True,
                    "completed_steps": 3,
                    "total_steps": 4,
                },
            },
            "orders": {
                "pending_new_orders": 4,
                "active_orders": 6,
                "completed_orders_this_month": 2,
                "revenue_this_month": "42.50",
                "average_order_value": "21.25",
            },
            "pricing": {
                "services_count": 3,
                "rules_count": 2,
                "average_price": "10.00",
                "min_price": "7.50",
                "max_price": "12.50",
                "has_express": True,
                "has_pickup_fee": False,
                "has_delivery_fee": True,
                "has_bulk_discount": False,
            },
            "operational_state": {
                "order_intake_status": "featured",
                "accepting_orders": True,
                "has_data_gaps": True,
            },
            "meta": {
                "generated_at": "2026-03-20T10:00:00+01:00",
                "timezone": "Africa/Kinshasa",
                "source_version": "partner-dashboard-summary-v1",
            },
        }

        monkeypatch.setattr(
            dashboard_route.DashboardService,
            "get_partner_dashboard_summary",
            lambda self, partner_id: expected,
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/dashboard-summary")

        assert response.status_code == 200
        assert response.json()["partner"]["name"] == "Pressing Alpha"
        assert response.json()["orders"]["pending_new_orders"] == 4
        assert response.json()["pricing"]["services_count"] == 3

    def test_returns_404_when_partner_is_missing(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="admin",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)
        monkeypatch.setattr(
            dashboard_route.DashboardService,
            "get_partner_dashboard_summary",
            lambda self, partner_id: (_ for _ in ()).throw(ValueError("Partenaire introuvable")),
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/dashboard-summary")

        assert response.status_code == 404
        assert response.json()["detail"] == "Partenaire introuvable"
