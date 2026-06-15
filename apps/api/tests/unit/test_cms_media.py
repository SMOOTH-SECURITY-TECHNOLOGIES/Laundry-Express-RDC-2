import unittest
import uuid
from unittest.mock import MagicMock

from app.services.cms_service import CMSService


class TestCmsMedia(unittest.TestCase):
    def test_create_media_variants(self):
        db = MagicMock()
        svc = CMSService(db)
        media = svc.create_media({"filename": "hero.jpg", "file_url": "https://cdn/hero.jpg", "size": 102400}, uuid.uuid4())
        self.assertEqual(media.thumbnail_url, media.file_url)
        self.assertEqual(media.webp_url, media.file_url)
        db.commit.assert_called()


if __name__ == "__main__":
    unittest.main()
