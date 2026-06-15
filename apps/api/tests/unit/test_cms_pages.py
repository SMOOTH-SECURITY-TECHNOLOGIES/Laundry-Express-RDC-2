import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.services.cms_service import CMSService


class TestCmsPages(unittest.TestCase):
    def _svc(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 0
        db.query.return_value.filter.return_value.first.return_value = None
        return CMSService(db), db

    @patch.object(CMSService, '_save_revision')
    def test_create_page(self, _rev):
        svc, db = self._svc()
        page = svc.create_page({"title": "Test", "slug": "/test", "page_type": "landing"}, uuid.uuid4())
        self.assertEqual(page.slug, "/test")
        db.commit.assert_called()

    def test_sync_skips_when_pages_exist(self):
        svc, db = self._svc()
        db.query.return_value.count.return_value = 3
        self.assertEqual(svc.sync_from_site_content(), 0)


if __name__ == "__main__":
    unittest.main()
