from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app


class TestPartnerProfileRoute:
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

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/profile-detail")

        assert response.status_code == 403
        assert "Accès refusé" in response.json()["detail"]

    def test_returns_200_with_profile_payload(self, monkeypatch):
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
            dashboard_route.PartnerProfileService,
            "get_partner_profile_detail",
            lambda self, partner_id: {
                "id": str(partner_id),
                "name": "Laundry Pro",
                "business_name": "Laundry Pro SARL",
                "email": "owner@partner.com",
                "phone": "+243810000000",
                "status": "active",
                "is_featured": True,
                "is_accepting_orders": True,
                "address": "Gombe, Kinshasa",
                "city": "Kinshasa",
                "commune": "Gombe",
                "video_url": None,
                "service_count": 4,
                "working_hours": {
                    "monday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "tuesday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "wednesday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "thursday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "friday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "saturday": {"open": "10:00", "close": "16:00", "is_closed": False},
                    "sunday": {"open": "10:00", "close": "16:00", "is_closed": True},
                },
            },
        )

        response = self.client.get(f"/api/v1/partners/{self.partner_id}/profile-detail")

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Laundry Pro"
        assert body["working_hours"]["sunday"]["is_closed"] is True

    def test_updates_partner_profile_detail(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: SimpleNamespace()

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True
        )
        monkeypatch.setattr(
            dashboard_route.PartnerProfileService,
            "update_partner_profile_detail",
            lambda self, partner_id, payload: {
                "id": str(partner_id),
                "name": payload.name,
                "business_name": "Laundry Pro SARL",
                "email": "owner@partner.com",
                "phone": "+243810000000",
                "status": "active",
                "is_featured": True,
                "is_accepting_orders": True,
                "address": payload.address,
                "city": payload.city,
                "commune": payload.commune,
                "video_url": None,
                "service_count": 4,
                "working_hours": {
                    "monday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "tuesday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "wednesday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "thursday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "friday": {"open": "09:00", "close": "18:00", "is_closed": False},
                    "saturday": {"open": "10:00", "close": "16:00", "is_closed": False},
                    "sunday": {"open": "10:00", "close": "16:00", "is_closed": True},
                },
            },
        )

        response = self.client.put(
            f"/api/v1/partners/{self.partner_id}/profile-detail",
            json={
                "name": "Laundry Pro Updated",
                "address": "Gombe, Kinshasa",
                "city": "Kinshasa",
                "commune": "Gombe",
            },
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Laundry Pro Updated"

    def test_updates_partner_working_hours(self, monkeypatch):
        from app.api.routes import dashboard as dashboard_route

        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=uuid4(),
            role="partner_owner",
        )
        app.dependency_overrides[get_sync_db] = lambda: SimpleNamespace()

        monkeypatch.setattr(
            dashboard_route, "user_has_partner_access_sync", lambda db, user, partner_id: True
        )
        monkeypatch.setattr(
            dashboard_route.PartnerProfileService,
            "update_partner_working_hours",
            lambda self, partner_id, payload: {
                "id": str(partner_id),
                "name": "Laundry Pro",
                "business_name": "Laundry Pro SARL",
                "email": "owner@partner.com",
                "phone": "+243810000000",
                "status": "active",
                "is_featured": True,
                "is_accepting_orders": True,
                "address": "Gombe, Kinshasa",
                "city": "Kinshasa",
                "commune": "Gombe",
                "video_url": None,
                "service_count": 4,
                "working_hours": payload.working_hours.model_dump(),
            },
        )

        response = self.client.put(
            f"/api/v1/partners/{self.partner_id}/profile-detail/working-hours",
            json={
                "working_hours": {
                    "monday": {"open": "08:00", "close": "17:00", "is_closed": False},
                    "tuesday": {"open": "08:00", "close": "17:00", "is_closed": False},
                    "wednesday": {"open": "08:00", "close": "17:00", "is_closed": False},
                    "thursday": {"open": "08:00", "close": "17:00", "is_closed": False},
                    "friday": {"open": "08:00", "close": "17:00", "is_closed": False},
                    "saturday": {"open": "09:00", "close": "13:00", "is_closed": False},
                    "sunday": {"open": "09:00", "close": "13:00", "is_closed": True},
                }
            },
        )

        assert response.status_code == 200
        assert response.json()["working_hours"]["monday"]["open"] == "08:00"
