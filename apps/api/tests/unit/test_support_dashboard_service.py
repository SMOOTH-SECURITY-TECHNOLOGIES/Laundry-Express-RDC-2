import unittest
from unittest.mock import MagicMock

from app.services.support_dashboard_service import SupportDashboardService


class TestSupportDashboardService(unittest.TestCase):
    def _mock_db(self):
        db = MagicMock()
        db.query.return_value.scalar.return_value = 8
        db.query.return_value.filter.return_value.scalar.return_value = 2
        db.query.return_value.filter.return_value.first.return_value = None
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.first.return_value = None
        db.query.return_value.all.return_value = []
        return db

    def test_get_dashboard_backend_source(self):
        result = SupportDashboardService(self._mock_db()).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.open_tickets, 0)

    def test_sparkline(self):
        svc = SupportDashboardService(MagicMock())
        self.assertEqual(len(svc._spark_int(24, 7)), 7)


if __name__ == "__main__":
    unittest.main()
