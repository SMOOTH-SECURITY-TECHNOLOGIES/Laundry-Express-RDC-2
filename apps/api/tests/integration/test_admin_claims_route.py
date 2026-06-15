import unittest

from fastapi.testclient import TestClient

from app.main import app


class TestAdminClaimsRoute(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_dashboard_requires_admin(self):
        response = self.client.get("/api/v1/admin/claims/dashboard")
        self.assertIn(response.status_code, (401, 403))

    def test_list_requires_admin(self):
        response = self.client.get("/api/v1/admin/claims")
        self.assertIn(response.status_code, (401, 403))


if __name__ == "__main__":
    unittest.main()
