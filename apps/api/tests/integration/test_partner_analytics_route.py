from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerAnalyticsSummaryRoute:
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

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: False
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/analytics-summary")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_analytics_summary_payload(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True
        )

        expected = {
            "range": "month",
            "overview": {
                "total_revenue": "120.00",
                "average_order_value": "40.00",
                "orders_in_range": 3,
            },
            "revenue_series": [
                {"label": "2026-03-19", "value": "20.00"},
                {"label": "2026-03-20", "value": "100.00"},
            ],
            "popular_services": [
                {"name": "Wash & Fold", "count": 4},
            ],
            "customer_insights": {
                "new_customers": 1,
                "returning_customers": 2,
            },
            "top_clients": [
                {"name": "Alice", "orders": 3},
            ],
            "promo_performance": {
                "top_by_usage": [
                    {"code": "WELCOME10", "usage_count": 7},
                ],
                "top_by_revenue": [
                    {"code": "WELCOME10", "revenue": "90.00"},
                ],
            },
        }

        monkeypatch.setattr(
            dashboard_route.PartnerAnalyticsService,
            "get_partner_analytics_summary",
            lambda self, partner_id, range_value: expected,
        )

        response = self.client.get(
            f"/api/v1/partners/{self.partner_id}/analytics-summary?range=month"
        )

        assert response.status_code == 200
        body = response.json()
        assert body["overview"]["orders_in_range"] == 3
        assert body["popular_services"][0]["name"] == "Wash & Fold"
        assert body["promo_performance"]["top_by_usage"][0]["code"] == "WELCOME10"
