import unittest
from unittest.mock import MagicMock, patch

from app.services.blog_dashboard_service import BlogDashboardService


class TestBlogCategories(unittest.TestCase):
    @patch("app.services.blog_dashboard_service.BlogService.seed_if_empty", return_value=0)
    def test_dashboard_has_categories(self, _seed):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.order_by.return_value.all.return_value = []
        db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
        db.query.return_value.scalar.return_value = 0
        db.query.return_value.filter.return_value.scalar.return_value = 0
        result = BlogDashboardService(db).get_dashboard()
        self.assertIsInstance(result.categories, list)


if __name__ == "__main__":
    unittest.main()
