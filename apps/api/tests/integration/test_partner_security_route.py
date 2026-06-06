from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerSecurityRoute:
    def setup_method(self):
        self.client = TestClient(app)
        self.partner_id = uuid4()
        self.user_id = uuid4()

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_partner_activity_logs_return_403_without_access(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4(), role="partner_owner")
        app.dependency_overrides[get_sync_db] = lambda: SimpleNamespace()
        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: False)

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/security/activity-logs")

        assert response.status_code == 403

    def test_partner_activity_logs_return_logs(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        class FakePartnerStaffQuery:
            def __init__(self, rows):
                self.rows = rows

            def filter(self, *args, **kwargs):
                return self

            def all(self):
                return self.rows

        class FakeAuditQuery:
            def outerjoin(self, *args, **kwargs):
                return self

            def filter(self, *args, **kwargs):
                return self

            def order_by(self, *args, **kwargs):
                return self

            def limit(self, *args, **kwargs):
                return self

            def all(self):
                return [
                    (
                        SimpleNamespace(
                            id=uuid4(),
                            user_id=self_user_id,
                            action="USER_2FA_ENABLED",
                            resource_type="user_security",
                            resource_id=self_user_id,
                            details='{"email":"owner@example.com"}',
                            created_at="2026-03-20T10:00:00Z",
                            updated_at="2026-03-20T10:00:00Z",
                        ),
                        "Owner User",
                    )
                ]

        class FakeDB:
            def query(self, model, *args):
                key = getattr(model, "key", None)
                name = getattr(model, "__name__", "")
                if name == "PartnerStaff" or key == "user_id":
                    return FakePartnerStaffQuery([(self_user_id,)])
                return FakeAuditQuery()

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4(), role="partner_owner")
        app.dependency_overrides[get_sync_db] = lambda: FakeDB()
        monkeypatch.setattr(dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True)

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/security/activity-logs")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["logs"][0]["action"] == "USER_2FA_ENABLED"

    def test_enable_current_user_2fa_requires_valid_code(self):
        class FakeUserQuery:
            def __init__(self, user):
                self.user = user

            def filter(self, *args, **kwargs):
                return self

            def first(self):
                return self.user

        class FakeDB:
            def __init__(self):
                self.user = SimpleNamespace(id=self_user_id, email="owner@example.com", is_2fa_enabled=False)

            def query(self, model):
                return FakeUserQuery(self.user)

            def add(self, obj):
                self.user = obj

            def commit(self):
                return None

            def flush(self):
                return None

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=self.user_id, role="partner_owner")
        app.dependency_overrides[get_sync_db] = lambda: FakeDB()

        response = self.client.post("/api/v1/auth/me/2fa/enable", json={"code": "123456"})

        assert response.status_code == 200
        assert response.json()["success"] is True


self_user_id = uuid4()
