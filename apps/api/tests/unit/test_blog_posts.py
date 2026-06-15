import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.services.blog_service import BlogService


class TestBlogPosts(unittest.TestCase):
    def test_seed_skips_when_exists(self):
        db = MagicMock()
        db.query.return_value.count.return_value = 5
        self.assertEqual(BlogService(db).seed_if_empty(), 0)

    @patch.object(BlogService, '_revision')
    def test_create_post(self, _rev):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        post = BlogService(db).create_post({"title": "Test Article", "slug": "test-article", "content": "Hello world " * 50}, uuid.uuid4())
        self.assertEqual(post.slug, "test-article")
        db.commit.assert_called()


if __name__ == "__main__":
    unittest.main()
