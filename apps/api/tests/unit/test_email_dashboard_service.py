import unittest
from unittest.mock import MagicMock, patch

from app.services.email_dashboard_service import EmailDashboardService


class TestEmailDashboardService(unittest.TestCase):
    @patch("app.services.email_dashboard_service.EmailOpsService.seed_if_empty")
    def test_get_dashboard_returns_backend_source(self, _seed):
        db = MagicMock()
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        db.query.return_value.filter.return_value.first.return_value = None
        result = EmailDashboardService(db).get_dashboard()
        self.assertEqual(result.source, "backend")
        self.assertEqual(result.kpis.sent_today, 18420)
        self.assertEqual(result.kpis.delivery_rate, 99.1)
        self.assertEqual(result.invoice_summary.sent, 12400)
        self.assertGreater(len(result.type_distribution), 0)


if __name__ == "__main__":
    unittest.main()
