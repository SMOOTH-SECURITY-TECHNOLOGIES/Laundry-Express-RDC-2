import unittest
from unittest.mock import MagicMock, patch

from app.services.notifications_dashboard_service import NotificationsDashboardService


class TestNotificationsDashboardService(unittest.TestCase):
    @patch("app.services.notifications_dashboard_service.NotificationsOpsService.seed_if_empty")
    def test_get_dashboard_returns_backend_source(self, _seed):
        db = MagicMock()
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.all.return_value = []
        result = NotificationsDashboardService(db).get_dashboard(days=30)
        self.assertEqual(result.source, "backend")
        self.assertGreater(result.kpis.total_sent, 0)
        self.assertGreater(result.kpis.delivery_rate, 90)
        self.assertEqual(len(result.channel_performance), 4)


if __name__ == "__main__":
    unittest.main()
