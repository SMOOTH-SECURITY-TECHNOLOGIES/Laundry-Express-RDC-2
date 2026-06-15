import unittest
from unittest.mock import MagicMock

from app.services.loyalty_dashboard_service import LoyaltyDashboardService


class TestLoyaltyDashboardService(unittest.TestCase):
    def test_pct_change(self):
        db = MagicMock()
        service = LoyaltyDashboardService(db)
        self.assertEqual(service._pct_change(110, 100), 10.0)
        self.assertEqual(service._pct_change(0, 0), 0)

    def test_build_health_score_bounds(self):
        db = MagicMock()
        service = LoyaltyDashboardService(db)
        service._member_retention = MagicMock(return_value=50.0)
        service._non_member_retention = MagicMock(return_value=30.0)
        service._fraud_score = MagicMock(return_value=5)
        health = service._build_health(None, 35.0, 500.0, 10000, 3000, 8000)
        self.assertGreaterEqual(health.score, 0)
        self.assertLessEqual(health.score, 100)
        self.assertIn(health.status, ("healthy", "warning", "critical"))
