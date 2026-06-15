import unittest
from unittest.mock import MagicMock

from app.services.rbac_dashboard_service import RbacDashboardService


class TestRbacDashboardService(unittest.TestCase):
    def test_get_dashboard_seeds_and_returns_kpis(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.all.return_value = []
        db.query.return_value.filter.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []

        with unittest.mock.patch('app.services.rbac_dashboard_service.RbacOpsService') as mock_ops:
            mock_ops.return_value.seed_if_empty = MagicMock()
            svc = RbacDashboardService(db)
            result = svc.get_dashboard()

        self.assertEqual(result.kpis.roles_count, 12)
        self.assertEqual(result.kpis.permissions_count, 164)
        self.assertEqual(result.source, "backend")
        self.assertTrue(result.read_only)


if __name__ == "__main__":
    unittest.main()
