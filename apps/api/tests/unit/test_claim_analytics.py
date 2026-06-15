import unittest
from unittest.mock import MagicMock, patch

from app.services.claims_dashboard_service import ClaimsDashboardService


class TestClaimAnalytics(unittest.TestCase):
    def _mock_db(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.scalar.return_value = 0
        db.query.return_value.filter.return_value.scalar.return_value = 0
        db.query.return_value.filter.return_value.all.return_value = []
        db.query.return_value.filter.return_value.first.return_value = None
        db.query.return_value.limit.return_value.all.return_value = []
        db.query.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []
        return db

    @patch("app.services.claims_dashboard_service.ClaimsService.sync_from_disputes", return_value=0)
    def test_dashboard_backend_source(self, _sync):
        result = ClaimsDashboardService(self._mock_db()).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.open_claims, 0)

    @patch("app.services.claims_dashboard_service.ClaimsService.sync_from_disputes", return_value=0)
    def test_sparkline_length(self, _sync):
        svc = ClaimsDashboardService(self._mock_db())
        self.assertEqual(len(svc._spark_int(10, 7)), 7)


if __name__ == "__main__":
    unittest.main()
