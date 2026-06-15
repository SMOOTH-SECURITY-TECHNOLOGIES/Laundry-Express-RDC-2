import unittest
from app.services.blog_ai_service import BlogAIService


class TestBlogAI(unittest.TestCase):
    def test_generate_full(self):
        result = BlogAIService().generate("Marketplace Kinshasa")
        self.assertIn("title", result)
        self.assertIn("outline", result)
        self.assertIn("faq", result)
        self.assertIn("seo", result)


if __name__ == "__main__":
    unittest.main()
