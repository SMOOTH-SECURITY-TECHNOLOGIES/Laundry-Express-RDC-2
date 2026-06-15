import unittest
import uuid
from unittest.mock import MagicMock, patch

from app.exceptions import ValidationError
from app.models.order import OrderStatus
from app.models.support import Review, ReviewStatus
from app.services.review_service import ReviewService


class TestReviewService(unittest.TestCase):
    def _service(self):
        db = MagicMock()
        return ReviewService(db), db

    def _completed_order(self, customer_id, order_id=None):
        return MagicMock(
            id=order_id or uuid.uuid4(),
            customer_id=customer_id,
            partner_id=uuid.uuid4(),
            order_number="ORD-1001",
            status=OrderStatus.COMPLETED.value,
        )

    def test_create_review_on_completed_order(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        order_id = uuid.uuid4()
        order = self._completed_order(customer_id, order_id)

        db.query.return_value.filter.return_value.first.side_effect = [order, None]

        with patch("app.services.review_service.NotificationService"):
            review = svc.create_review(customer_id, order_id=order_id, rating=5, comment="Excellent")

        self.assertEqual(review.status, ReviewStatus.PUBLISHED.value)
        db.commit.assert_called()

    def test_reject_foreign_order(self):
        svc, _ = self._service()
        with patch.object(svc, "_get_order_for_customer", side_effect=ValidationError("Vous n'êtes pas propriétaire de cette commande")):
            with self.assertRaises(ValidationError):
                svc.create_review(uuid.uuid4(), order_id=uuid.uuid4(), rating=4)

    def test_reject_non_completed_order(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        order = self._completed_order(customer_id)
        order.status = OrderStatus.CLEANING_IN_PROGRESS.value
        db.query.return_value.filter.return_value.first.return_value = order

        with self.assertRaises(ValidationError):
            svc.create_review(customer_id, order_id=order.id, rating=4)

    def test_reject_duplicate_review(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        order = self._completed_order(customer_id)
        existing = Review(id=uuid.uuid4(), order_id=order.id, user_id=customer_id, partner_id=order.partner_id, rating=4, status="published")
        db.query.return_value.filter.return_value.first.side_effect = [order, existing]

        with self.assertRaises(ValidationError):
            svc.create_review(customer_id, order_id=order.id, rating=5)

    def test_low_rating_is_pending_and_notifies_admin(self):
        svc, db = self._service()
        customer_id = uuid.uuid4()
        order = self._completed_order(customer_id)
        db.query.return_value.filter.return_value.first.side_effect = [order, None]

        with patch("app.services.review_service.NotificationService") as notification_cls:
            notification_cls.return_value.admin_user_ids.return_value = [uuid.uuid4()]
            review = svc.create_review(customer_id, order_id=order.id, rating=2, comment="Retard")

        self.assertEqual(review.status, ReviewStatus.PENDING.value)
        notification_cls.return_value.create_many.assert_called_once()

    def test_list_public_only_published(self):
        svc, db = self._service()
        published = Review(id=uuid.uuid4(), order_id=uuid.uuid4(), user_id=uuid.uuid4(), partner_id=uuid.uuid4(), rating=5, status=ReviewStatus.PUBLISHED.value)
        db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [published]

        reviews = svc.list_public_reviews()
        self.assertEqual(len(reviews), 1)
        db.query.return_value.filter.assert_called()


if __name__ == "__main__":
    unittest.main()
