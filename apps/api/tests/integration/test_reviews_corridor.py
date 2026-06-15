import os
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-reviews-corridor")
os.environ.setdefault("ADMIN_PASSWORD", "test-admin-password")

from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user, get_sync_db
from app.main import app
from app.models.support import Review, ReviewStatus
from app.models.user import UserRole


class TestReviewsCorridor(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides.clear()
        self.customer_id = uuid.uuid4()
        self.order_id = uuid.uuid4()

    def tearDown(self):
        app.dependency_overrides.clear()

    def _as_customer(self):
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(
            id=self.customer_id,
            role=UserRole.CUSTOMER,
            name="Client Test",
        )
        app.dependency_overrides[get_sync_db] = lambda: iter([MagicMock()])

    def test_create_review_requires_auth(self):
        response = self.client.post("/api/v1/reviews", json={
            "order_id": str(self.order_id),
            "rating": 5,
        })
        self.assertEqual(response.status_code, 403)

    @patch("app.api.routes.reviews.ReviewService")
    def test_customer_creates_review(self, mock_service_cls):
        self._as_customer()
        review = Review(
            id=uuid.uuid4(),
            order_id=self.order_id,
            user_id=self.customer_id,
            partner_id=uuid.uuid4(),
            rating=5,
            status=ReviewStatus.PUBLISHED.value,
            comment="Super",
        )
        service = mock_service_cls.return_value
        service.create_review.return_value = review
        service.build_review_response.return_value = {
            "id": review.id,
            "order_id": self.order_id,
            "user_id": self.customer_id,
            "partner_id": review.partner_id,
            "rating": 5,
            "title": None,
            "comment": "Super",
            "status": "published",
            "is_verified": True,
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "order_number": "ORD-1",
            "partner_name": "Pressing",
            "customer_first_name": "Client",
        }

        response = self.client.post("/api/v1/reviews", json={
            "order_id": str(self.order_id),
            "rating": 5,
            "comment": "Super",
        })
        self.assertEqual(response.status_code, 201)
        service.create_review.assert_called_once()

    @patch("app.api.routes.reviews.ReviewService")
    def test_public_reviews_only_published(self, mock_service_cls):
        published = Review(
            id=uuid.uuid4(),
            order_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            partner_id=uuid.uuid4(),
            rating=5,
            status=ReviewStatus.PUBLISHED.value,
            comment="Public",
        )
        service = mock_service_cls.return_value
        service.list_public_reviews.return_value = [published]
        service.build_review_response.return_value = {
            "id": published.id,
            "order_id": published.order_id,
            "user_id": published.user_id,
            "partner_id": published.partner_id,
            "rating": 5,
            "title": None,
            "comment": "Public",
            "status": "published",
            "is_verified": True,
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "order_number": None,
            "partner_name": "Pressing",
            "customer_first_name": "Jean",
        }

        response = self.client.get("/api/v1/reviews/public")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        service.list_public_reviews.assert_called_once()

    @patch("app.api.routes.reviews.ReviewService")
    def test_my_reviews_returns_customer_reviews(self, mock_service_cls):
        self._as_customer()
        review = Review(
            id=uuid.uuid4(),
            order_id=self.order_id,
            user_id=self.customer_id,
            partner_id=uuid.uuid4(),
            rating=4,
            status=ReviewStatus.PUBLISHED.value,
        )
        service = mock_service_cls.return_value
        service.list_reviews_for_customer.return_value = [review]
        service.build_review_response.return_value = {
            "id": review.id,
            "order_id": self.order_id,
            "user_id": self.customer_id,
            "partner_id": review.partner_id,
            "rating": 4,
            "title": None,
            "comment": None,
            "status": "published",
            "is_verified": True,
            "created_at": "2026-06-10T10:00:00Z",
            "updated_at": "2026-06-10T10:00:00Z",
            "order_number": "ORD-2",
            "partner_name": "Pressing",
            "customer_first_name": "Client Test",
        }

        response = self.client.get("/api/v1/reviews/me")
        self.assertEqual(response.status_code, 200)
        service.list_reviews_for_customer.assert_called_with(self.customer_id)


if __name__ == "__main__":
    unittest.main()
