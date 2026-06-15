import unittest
from unittest.mock import MagicMock, patch

from app.services.campaigns_dashboard_service import CampaignsDashboardService


class TestCampaignsDashboardService(unittest.TestCase):
    @patch.object(CampaignsDashboardService, "_ensure_seed_data")
    @patch.object(CampaignsDashboardService, "_delivery_count", return_value=0)
    def test_get_dashboard_returns_backend_source(self, *_mocks):
        db = MagicMock()
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.count.return_value = 0
        db.query.return_value.scalar.return_value = 0
        result = CampaignsDashboardService(db).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertGreaterEqual(result.kpis.active_campaigns, 0)

    def test_build_funnel_has_stages(self):
        svc = CampaignsDashboardService(MagicMock())
        funnel = svc._build_funnel(1000, 500, 200, 50)
        self.assertEqual(len(funnel), 5)
        self.assertEqual(funnel[0].stage, "Envoyés")


if __name__ == "__main__":
    unittest.main()
