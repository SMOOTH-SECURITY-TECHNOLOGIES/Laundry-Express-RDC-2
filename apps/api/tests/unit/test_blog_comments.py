import unittest
from app.services.comment_moderation_service import CommentModerationService


class TestBlogComments(unittest.TestCase):
    def test_spam_detection(self):
        status = CommentModerationService().moderate("Buy viagra at http://spam.com http://x.com http://y.com")
        self.assertEqual(status, "spam")

    def test_clean_comment(self):
        status = CommentModerationService().moderate("Merci pour cet article très utile!")
        self.assertEqual(status, "pending")


if __name__ == "__main__":
    unittest.main()
