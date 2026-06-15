import unittest
from unittest.mock import MagicMock, patch

from app.services.referral_dashboard_service import ReferralDashboardService


class TestReferralDashboardService(unittest.TestCase):
    @patch.object(ReferralDashboardService, "_get_config", return_value=None)
    @patch.object(ReferralDashboardService, "_count_users_with_code", return_value=10)
    @patch.object(ReferralDashboardService, "_count_referred", return_value=5)
    @patch.object(ReferralDashboardService, "_count_discounts_used", return_value=3)
    @patch.object(ReferralDashboardService, "_count_completed_conversions", return_value=2)
    @patch.object(ReferralDashboardService, "_referral_revenue", return_value=1000.0)
    @patch.object(ReferralDashboardService, "_build_sparklines", return_value={
        "code": [8, 9, 10], "referred": [3, 4, 5], "discounts": [2, 2, 3],
        "bonus": [100, 200, 300], "conversions": [1, 1, 2], "revenue": [800, 900, 1000],
    })
    @patch.object(ReferralDashboardService, "_build_channels")
    @patch.object(ReferralDashboardService, "_build_top_referrers", return_value=[])
    @patch.object(ReferralDashboardService, "_build_recent_conversions", return_value=[])
    @patch.object(ReferralDashboardService, "_build_watchlist", return_value=[])
    @patch.object(ReferralDashboardService, "_build_trends", return_value=[])
    @patch.object(ReferralDashboardService, "_build_impact", return_value=[])
    @patch.object(ReferralDashboardService, "_build_popular_codes", return_value=[])
    def test_get_dashboard_returns_backend_source(self, *_mocks):
        db = MagicMock()
        db.query.return_value.filter.return_value.scalar.return_value = 0
        result = ReferralDashboardService(db).get_dashboard(days=7)
        self.assertEqual(result.source, "backend")
        self.assertEqual(result.kpis.users_with_code, 10)
        self.assertEqual(result.total_revenue, 1000.0)

    def test_build_settings_defaults_when_no_config(self):
        svc = ReferralDashboardService(MagicMock())
        settings = svc._build_settings(None)
        self.assertTrue(settings.is_enabled)
        self.assertEqual(settings.referrer_bonus_points, 500)


if __name__ == "__main__":
    unittest.main()
