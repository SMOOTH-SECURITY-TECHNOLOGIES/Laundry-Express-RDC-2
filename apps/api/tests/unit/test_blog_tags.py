import unittest
from app.services.blog_ai_service import BlogAIService


class TestBlogTags(unittest.TestCase):
    def test_suggestions_not_empty_without_posts(self):
        out = BlogAIService().suggestions([])
        self.assertGreater(len(out), 0)


if __name__ == "__main__":
    unittest.main()
