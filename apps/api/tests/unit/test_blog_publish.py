import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.models.blog import BlogPost, BlogPostStatus
from app.services.blog_service import BlogService


class TestBlogPublish(unittest.TestCase):
    @patch.object(BlogService, '_revision')
    def test_publish(self, _rev):
        db = MagicMock()
        post = BlogPost(id=uuid.uuid4(), slug="t", title="T", content="c", status=BlogPostStatus.DRAFT.value)
        db.query.return_value.filter.return_value.first.return_value = post
        result = BlogService(db).publish(post.id, uuid.uuid4())
        self.assertEqual(result.status, BlogPostStatus.PUBLISHED.value)


if __name__ == "__main__":
    unittest.main()
