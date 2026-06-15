import unittest
from unittest.mock import MagicMock, patch

from app.services.payment_gateways_dashboard_service import PaymentGatewaysDashboardService


class TestPaymentGatewaysDashboardService(unittest.TestCase):
    @patch("app.services.payment_gateways_dashboard_service.PaymentGatewaysOpsService.seed_if_empty")
    def test_get_dashboard_returns_backend_source(self, _seed):
        db = MagicMock()
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        db.query.return_value.filter.return_value.first.return_value = None
        result = PaymentGatewaysDashboardService(db).get_dashboard(days=30)
        self.assertEqual(result.source, "backend")
        self.assertGreater(result.kpis.revenue_month, 0)
        self.assertEqual(len(result.channel_performance), 4)


if __name__ == "__main__":
    unittest.main()
