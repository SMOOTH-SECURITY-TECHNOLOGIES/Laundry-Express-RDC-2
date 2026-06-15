import unittest
from unittest.mock import MagicMock, patch

from app.services.integrations_dashboard_service import IntegrationsDashboardService


class TestIntegrationsDashboardService(unittest.TestCase):
    @patch("app.services.integrations_dashboard_service.IntegrationsOpsService.seed_if_empty")
    def test_get_dashboard_returns_backend_source(self, _seed):
        db = MagicMock()
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        result = IntegrationsDashboardService(db).get_dashboard()
        self.assertEqual(result.source, "backend")
        self.assertEqual(result.kpis.api_calls_today, 254820)
        self.assertEqual(result.kpis.success_rate, 99.2)
        self.assertGreater(len(result.event_distribution), 0)


if __name__ == "__main__":
    unittest.main()
