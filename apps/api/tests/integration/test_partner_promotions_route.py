from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerPromotionsRoute:
    def setup_method(self):
        self.client = TestClient(app)
        self.partner_id = uuid4()
        self.promo_id = uuid4()

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_returns_403_when_user_has_no_partner_access(self, monkeypatch):
        from app.api.routes import promotions as promotions_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4(), role="partner_owner")
        app.dependency_overrides[get_sync_db] = lambda: iter([None])

        monkeypatch.setattr(
            promotions_route, "user_has_partner_access_sync", lambda db, user, partner_id: False
        )

        response = self.client.get(f"/api/v1/promotions/partners/{self.partner_id}")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_partner_promo_list(self, monkeypatch):
        from app.api.routes import promotions as promotions_route

        class FakeQuery:
            def filter(self, *args, **kwargs):
                return self
            def order_by(self, *args, **kwargs):
                return self
            def all(self):
                return [
                    SimpleNamespace(
                        id=self_promo_id,
                        code="WELCOME10",
                        discount_type="percentage",
                        discount_value=10,
                        min_order_value=20,
                        is_for_new_users_only=False,
                        is_active=True,
                        partner_id=self_partner_id,
                        created_by_user_id=uuid4(),
                        usage_count=5,
                        max_usage=100,
                        usage_limit_per_customer=1,
                        start_date="2026-03-01",
                        end_date="2026-03-31",
                        applicable_services_list=[],
                        description="Promo test",
                        geographic_restrictions_list=[],
                        created_at="2026-03-01T00:00:00Z",
                        updated_at="2026-03-02T00:00:00Z",
                    )
                ]

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4(), role="partner_owner")
        app.dependency_overrides[get_sync_db] = lambda: SimpleNamespace(query=lambda model: FakeQuery())

        monkeypatch.setattr(
            promotions_route, "user_has_partner_access_sync", lambda db, user, partner_id: True
        )

        response = self.client.get(f"/api/v1/promotions/partners/{self.partner_id}")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["promo_codes"][0]["code"] == "WELCOME10"


self_partner_id = uuid4()
self_promo_id = uuid4()
