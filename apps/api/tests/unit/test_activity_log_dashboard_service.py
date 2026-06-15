import unittest
from unittest.mock import MagicMock

from app.services.activity_log_dashboard_service import ActivityLogDashboardService


class TestActivityLogDashboardService(unittest.TestCase):
    def test_get_dashboard_returns_kpis(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []

        with unittest.mock.patch.object(ActivityLogDashboardService, '__init__', lambda self, db: setattr(self, 'db', db)):
            with unittest.mock.patch('app.services.activity_log_dashboard_service.ActivityLogOpsService.seed_if_empty'):
                result = ActivityLogDashboardService(db).get_dashboard()

        self.assertEqual(result.kpis.total_activities, 4840)
        self.assertEqual(result.source, "backend")


if __name__ == "__main__":
    unittest.main()
