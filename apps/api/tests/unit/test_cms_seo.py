import unittest
import uuid
from unittest.mock import MagicMock

from app.models.cms import CMSSEO
from app.services.cms_service import CMSService


class TestCmsSeo(unittest.TestCase):
    def test_upsert_seo_score(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.side_effect = [None, None]
        svc = CMSService(db)
        pid = str(uuid.uuid4())
        seo = svc.upsert_seo({"page_id": pid, "seo_title": "Short title", "seo_description": "A" * 80, "keywords": "test"})
        self.assertGreater(seo.score, 0)
        db.commit.assert_called()

    def test_calc_seo_score_full(self):
        seo = CMSSEO(seo_title="Title", seo_description="x" * 100, keywords="a,b", og_title="OG", og_image="img", canonical_url="/x")
        score = CMSService(MagicMock())._calc_seo_score(seo)
        self.assertGreaterEqual(score, 60)


if __name__ == "__main__":
    unittest.main()
