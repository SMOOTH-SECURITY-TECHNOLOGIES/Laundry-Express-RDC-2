import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.models.cms import CMSPage, CMSPageStatus
from app.services.cms_service import CMSService


class TestCmsPublish(unittest.TestCase):
    @patch.object(CMSService, '_save_revision')
    def test_publish_sets_status(self, _rev):
        db = MagicMock()
        page = CMSPage(id=uuid.uuid4(), slug="/test", title="Test", page_type="custom", status=CMSPageStatus.DRAFT.value)
        db.query.return_value.filter.return_value.first.return_value = page
        svc = CMSService(db)
        result = svc.publish(page.id, uuid.uuid4())
        self.assertEqual(result.status, CMSPageStatus.PUBLISHED.value)
        self.assertIsNotNone(result.published_at)


if __name__ == "__main__":
    unittest.main()
