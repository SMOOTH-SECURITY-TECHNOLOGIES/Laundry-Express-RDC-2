import unittest
from unittest.mock import MagicMock, patch

from app.services.cms_dashboard_service import CMSDashboardService


class TestCmsPermissions(unittest.TestCase):
    @patch("app.services.cms_dashboard_service.CMSService.sync_from_site_content", return_value=0)
    def test_dashboard_backend_source(self, _sync):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.scalar.return_value = 0
        db.query.return_value.filter.return_value.count.return_value = 0
        db.query.return_value.filter.return_value.scalar.return_value = 0
        result = CMSDashboardService(db).get_dashboard()
        self.assertEqual(result.source, "backend")


if __name__ == "__main__":
    unittest.main()
