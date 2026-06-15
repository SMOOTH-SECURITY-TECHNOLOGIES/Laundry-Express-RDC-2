import unittest
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.ads_dashboard_service import AdsDashboardService


class TestAdsDashboardService(unittest.TestCase):
    def test_pct_change(self):
        db = MagicMock()
        service = AdsDashboardService(db)
        self.assertEqual(service._pct_change(110, 100), 10.0)
        self.assertEqual(service._pct_change(0, 0), 0)

    def test_build_funnel_rates(self):
        db = MagicMock()
        service = AdsDashboardService(db)
        funnel = service._build_funnel(10000, 3200, 840)
        self.assertEqual(funnel[0].stage, "Impressions")
        self.assertEqual(funnel[0].count, 10000)
        self.assertEqual(funnel[1].stage, "Clics")
        self.assertGreater(funnel[1].rate, 0)

    def test_detect_truth_anomalies_budget_exhausted(self):
        db = MagicMock()
        service = AdsDashboardService(db)
        ad = MagicMock()
        ad.id = "test-id"
        ad.title = "Test Ad"
        ad.status = "active"
        ad.budget_total = Decimal("100")
        ad.budget_spent = Decimal("100")
        ad.end_date = None
        anomalies = service._detect_truth_anomalies([ad], clicks=10, conversions=0)
        self.assertTrue(any("sans budget" in a.message for a in anomalies))
