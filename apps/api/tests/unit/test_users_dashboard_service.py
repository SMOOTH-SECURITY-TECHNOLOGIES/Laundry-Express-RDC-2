import unittest
from unittest.mock import MagicMock, patch

from app.services.users_dashboard_service import UsersDashboardService


class TestUsersDashboardService(unittest.TestCase):
    def _mock_db(self):
        db = MagicMock()
        db.query.return_value.scalar.return_value = 5
        db.query.return_value.filter.return_value.scalar.return_value = 2
        db.query.return_value.filter.return_value.count.return_value = 2
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.group_by.return_value.having.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.outerjoin.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        return db

    def test_get_dashboard_returns_backend_source(self):
        result = UsersDashboardService(self._mock_db()).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.total_users, 0)

    def test_sparkline_length(self):
        svc = UsersDashboardService(MagicMock())
        spark = svc._spark(25, 7)
        self.assertEqual(len(spark), 7)


if __name__ == "__main__":
    unittest.main()
