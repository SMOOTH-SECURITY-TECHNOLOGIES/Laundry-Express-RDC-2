from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.exceptions import ValidationError
from app.models.claim import Claim
from app.models.order import Order
from app.models.user import User, UserRole
from app.services.audit_service import AuditService
from app.services.claims_service import ClaimsService
from app.services.notification_service import NotificationService


class CustomerClaimsService:
    """Corridor client : réclamations liées commande avec audit et visibilité admin."""

    def __init__(self, db: Session):
        self.db = db
        self.claims = ClaimsService(db)

    def _validate_order(self, customer_id: UUID, order_id: Optional[UUID]) -> tuple[Optional[UUID], Optional[UUID]]:
        if order_id is None:
            return None, None

        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValidationError("Commande introuvable")
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Vous n'êtes pas propriétaire de cette commande")

        return order.id, order.partner_id

    def create_claim(self, customer_id: UUID, data: dict) -> Claim:
        order_id, partner_id = self._validate_order(customer_id, data.get("order_id"))
        claim = self.claims.create_claim(
            {
                "title": data["title"],
                "description": data["description"],
                "type": data.get("type", "other"),
                "priority": data.get("priority", "medium"),
                "customer_id": customer_id,
                "order_id": order_id,
                "partner_id": partner_id,
            },
            customer_id,
        )

        AuditService(self.db).log_event(
            user_id=customer_id,
            action="create",
            resource_type="claims",
            resource_id=claim.id,
            details={"order_id": str(order_id) if order_id else None, "claim_number": claim.claim_number},
        )

        NotificationService(self.db).create_many(
            user_ids=NotificationService(self.db).admin_user_ids(),
            title="Nouvelle réclamation client",
            message=f"Réclamation {claim.claim_number} : {claim.title}",
            notification_type="claimCreated",
            metadata={"claimId": str(claim.id), "page": "admin", "section": "claims"},
        )
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def list_claims_for_customer(self, customer_id: UUID) -> List[Claim]:
        return (
            self.db.query(Claim)
            .filter(Claim.customer_id == customer_id)
            .order_by(Claim.updated_at.desc())
            .limit(200)
            .all()
        )

    def get_claim_for_customer(self, claim_id: UUID, customer_id: UUID) -> Optional[Claim]:
        return (
            self.db.query(Claim)
            .filter(Claim.id == claim_id, Claim.customer_id == customer_id)
            .first()
        )

    def build_claim_response(self, claim: Claim) -> dict:
        order_number = None
        payment_status = None
        if claim.order_id:
            order = self.db.query(Order).filter(Order.id == claim.order_id).first()
            if order:
                order_number = order.order_number
                payment_status = getattr(order.payment_status, "value", order.payment_status)

        return {
            "id": claim.id,
            "claim_number": claim.claim_number,
            "customer_id": claim.customer_id,
            "order_id": claim.order_id,
            "partner_id": claim.partner_id,
            "order_number": order_number,
            "payment_status": payment_status,
            "type": claim.type,
            "priority": claim.priority,
            "status": claim.status,
            "title": claim.title,
            "description": claim.description,
            "created_at": claim.created_at,
            "updated_at": claim.updated_at,
        }

    @staticmethod
    def ensure_customer_role(user: User) -> None:
        if user.role not in {UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN}:
            raise ValidationError("Seuls les clients peuvent créer des réclamations")
