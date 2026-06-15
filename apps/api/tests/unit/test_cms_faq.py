import unittest
from unittest.mock import MagicMock

from app.services.cms_service import CMSService


class TestCmsFaq(unittest.TestCase):
    def test_create_faq(self):
        db = MagicMock()
        svc = CMSService(db)
        faq = svc.create_faq({"question": "Q?", "answer": "A.", "position": 0})
        self.assertEqual(faq.question, "Q?")
        db.commit.assert_called()


if __name__ == "__main__":
    unittest.main()
