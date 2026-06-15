from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.exceptions import ValidationError
from app.models.order import Order, OrderStatus
from app.models.partner import Partner
from app.models.support import Review, ReviewStatus
from app.models.user import User, UserRole
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

REVIEWABLE_ORDER_STATUSES = {
    OrderStatus.COMPLETED.value,
    OrderStatus.DELIVERED.value,
}


class ReviewService:
    """Avis post-commande : création, publication et modération légère."""

    def __init__(self, db: Session):
        self.db = db

    def _get_order_for_customer(self, order_id: UUID, customer_id: UUID) -> Order:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValidationError("Commande introuvable")
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Vous n'êtes pas propriétaire de cette commande")
        return order

    def _ensure_reviewable_order(self, order: Order) -> None:
        status = getattr(order.status, "value", order.status)
        if status not in REVIEWABLE_ORDER_STATUSES:
            raise ValidationError("Seules les commandes terminées peuvent être évaluées")

    def create_review(
        self,
        customer_id: UUID,
        *,
        order_id: UUID,
        rating: int,
        comment: Optional[str] = None,
        title: Optional[str] = None,
    ) -> Review:
        if rating < 1 or rating > 5:
            raise ValidationError("La note doit être comprise entre 1 et 5")

        order = self._get_order_for_customer(order_id, customer_id)
        self._ensure_reviewable_order(order)

        existing = self.db.query(Review).filter(Review.order_id == order_id).first()
        if existing:
            raise ValidationError("Un avis existe déjà pour cette commande")

        status = ReviewStatus.PENDING.value if rating <= 2 else ReviewStatus.PUBLISHED.value
        review = Review(
            order_id=order.id,
            user_id=customer_id,
            partner_id=order.partner_id,
            rating=rating,
            title=title,
            comment=comment,
            status=status,
            is_verified=True,
        )
        self.db.add(review)
        self.db.flush()

        AuditService(self.db).log_event(
            user_id=customer_id,
            action="create",
            resource_type="reviews",
            resource_id=review.id,
            details={"order_id": str(order.id), "rating": rating, "status": status},
        )

        if rating <= 2:
            NotificationService(self.db).create_many(
                user_ids=NotificationService(self.db).admin_user_ids(),
                title="Avis client à surveiller",
                message=f"Un avis {rating}/5 a été déposé sur la commande {order.order_number}.",
                notification_type="lowRatingReview",
                metadata={
                    "reviewId": str(review.id),
                    "orderId": str(order.id),
                    "page": "admin",
                    "section": "reviews",
                },
            )

        self.db.commit()
        self.db.refresh(review)
        return review

    def list_public_reviews(self, *, partner_id: Optional[UUID] = None, limit: int = 50) -> List[Review]:
        query = self.db.query(Review).filter(Review.status == ReviewStatus.PUBLISHED.value)
        if partner_id:
            query = query.filter(Review.partner_id == partner_id)
        return query.order_by(Review.created_at.desc()).limit(limit).all()

    def list_reviews_for_customer(self, customer_id: UUID, limit: int = 100) -> List[Review]:
        return (
            self.db.query(Review)
            .filter(Review.user_id == customer_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .all()
        )

    def build_review_response(self, review: Review, *, public: bool = False) -> dict:
        order = self.db.query(Order).filter(Order.id == review.order_id).first()
        partner = self.db.query(Partner).filter(Partner.id == review.partner_id).first()
        user = self.db.query(User).filter(User.id == review.user_id).first()

        customer_name = getattr(user, "name", None) or ""
        first_name = customer_name.split()[0] if customer_name else "Client"

        return {
            "id": review.id,
            "order_id": review.order_id,
            "user_id": review.user_id,
            "partner_id": review.partner_id,
            "rating": int(review.rating),
            "title": review.title,
            "comment": review.comment,
            "status": review.status,
            "is_verified": bool(review.is_verified),
            "created_at": review.created_at,
            "updated_at": review.updated_at,
            "order_number": order.order_number if order else None,
            "partner_name": partner.name if partner else None,
            "customer_first_name": first_name if public else customer_name or first_name,
        }

    @staticmethod
    def ensure_customer_role(user: User) -> None:
        if user.role not in {UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN}:
            raise ValidationError("Seuls les clients peuvent déposer un avis")
