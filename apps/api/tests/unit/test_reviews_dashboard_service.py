import unittest
from unittest.mock import MagicMock

from app.services.reviews_dashboard_service import ReviewsDashboardService


class TestReviewsDashboardService(unittest.TestCase):
    def _mock_db(self):
        db = MagicMock()
        db.query.return_value.scalar.return_value = 10
        db.query.return_value.filter.return_value.scalar.return_value = 2
        db.query.return_value.filter.return_value.first.return_value = None
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.join.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.first.return_value = None
        return db

    def test_dashboard_backend_source(self):
        result = ReviewsDashboardService(self._mock_db()).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.avg_rating, 0)

    def test_sparkline(self):
        svc = ReviewsDashboardService(MagicMock())
        self.assertEqual(len(svc._spark_int(1284, 7)), 7)


if __name__ == "__main__":
    unittest.main()
