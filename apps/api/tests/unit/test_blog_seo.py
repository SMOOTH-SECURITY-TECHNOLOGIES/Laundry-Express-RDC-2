import unittest
import uuid

from app.models.blog import BlogPost, BlogSEO
from app.services.blog_seo_service import BlogSEOService


class TestBlogSeo(unittest.TestCase):
    def test_calc_score(self):
        post = BlogPost(id=uuid.uuid4(), slug="s", title="Short title", content="## Intro\n\n" + "word " * 500, excerpt="desc " * 20, featured_image="img.jpg")
        seo = BlogSEO(focus_keyword="word", seo_description="x" * 80, canonical_url="/blog/s")
        score = BlogSEOService().calc_score(post, seo)
        self.assertGreater(score, 40)

    def test_audit_recommendations(self):
        post = BlogPost(id=uuid.uuid4(), slug="s", title="T", content="short")
        result = BlogSEOService().audit(post, None)
        self.assertIn("recommendations", result)


if __name__ == "__main__":
    unittest.main()
