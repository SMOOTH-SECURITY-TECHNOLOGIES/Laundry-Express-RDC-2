import unittest
import uuid
from unittest.mock import MagicMock

from app.models.cms import CMSPage, CMSRevision
from app.services.cms_service import CMSService


class TestCmsRevisions(unittest.TestCase):
    def test_rollback_restores_snapshot(self):
        db = MagicMock()
        page = CMSPage(id=uuid.uuid4(), slug="/x", title="Old", page_type="custom", status="draft")
        rev = CMSRevision(id=uuid.uuid4(), page_id=page.id, snapshot={"title": "Restored", "status": "published"})
        db.query.return_value.filter.return_value.first.side_effect = [page, rev]
        svc = CMSService(db)
        result = svc.rollback(page.id, rev.id, uuid.uuid4())
        self.assertEqual(result.title, "Restored")
        db.commit.assert_called()


if __name__ == "__main__":
    unittest.main()
