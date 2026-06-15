import unittest
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app


class TestAdminAdsRoute(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_dashboard_requires_admin(self):
        response = self.client.get("/api/v1/admin/ads/dashboard")
        assert response.status_code in (401, 403)
