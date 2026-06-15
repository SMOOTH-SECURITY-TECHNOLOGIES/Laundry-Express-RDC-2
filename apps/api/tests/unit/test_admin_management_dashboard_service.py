import unittest
from unittest.mock import MagicMock, patch

from app.services.admin_management_dashboard_service import AdminManagementDashboardService


class TestAdminManagementDashboardService(unittest.TestCase):
    @patch("app.services.admin_management_dashboard_service.AdminManagementOpsService.seed_if_empty")
    def test_get_dashboard_returns_backend_source(self, _seed):
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        result = AdminManagementDashboardService(db).get_dashboard()
        self.assertEqual(result.source, "backend")
        self.assertEqual(result.kpis.total_admins, 24)
        self.assertEqual(result.kpis.super_admins, 4)
        self.assertTrue(result.read_only)
        self.assertGreater(len(result.rbac_resources), 0)


if __name__ == "__main__":
    unittest.main()
