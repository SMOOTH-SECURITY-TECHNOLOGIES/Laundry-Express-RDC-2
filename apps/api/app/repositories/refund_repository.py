from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, or_, desc

from app.models.payment import RefundRequest, RefundTransaction, RefundStatus


class RefundRepository:
    """Repository pour la gestion des remboursements"""

    def __init__(self, db: Session):
        self.db = db

    # ========== REFUND REQUESTS ==========

    def get_by_id(self, refund_request_id: UUID) -> Optional[RefundRequest]:
        """Obtenir une demande de remboursement par son ID"""
        return self.db.query(RefundRequest).filter(
            RefundRequest.id == refund_request_id
        ).options(
            joinedload(RefundRequest.payment_intent),
            joinedload(RefundRequest.dispute),
            joinedload(RefundRequest.refund_transactions)
        ).first()

    def get_active_request_for_order(self, order_id: UUID) -> Optional[RefundRequest]:
        """Obtenir la demande de remboursement active pour une commande"""
        return self.db.query(RefundRequest).filter(
            and_(
                RefundRequest.order_id == order_id,
                RefundRequest.status.in_([
                    RefundStatus.REQUESTED,
                    RefundStatus.UNDER_REVIEW,
                    RefundStatus.APPROVED,
                    RefundStatus.PROCESSING,
                ])
            )
        ).first()

    def get_requests_for_order(self, order_id: UUID) -> List[RefundRequest]:
        """Obtenir toutes les demandes de remboursement pour une commande"""
        return self.db.query(RefundRequest).filter(
            RefundRequest.order_id == order_id
        ).order_by(desc(RefundRequest.created_at)).all()

    def get_requests_for_dispute(self, dispute_id: UUID) -> List[RefundRequest]:
        """Obtenir les demandes de remboursement pour un litige"""
        return self.db.query(RefundRequest).filter(
            RefundRequest.dispute_id == dispute_id
        ).order_by(desc(RefundRequest.created_at)).all()

    def get_requests_for_customer(self, customer_id: UUID, limit: int = 100) -> List[RefundRequest]:
        """Obtenir les demandes de remboursement d'un client"""
        return self.db.query(RefundRequest).filter(
            RefundRequest.customer_id == customer_id
        ).order_by(desc(RefundRequest.created_at)).limit(limit).all()

    def get_pending_requests(self, limit: int = 50) -> List[RefundRequest]:
        """Obtenir les demandes de remboursement en attente"""
        return self.db.query(RefundRequest).filter(
            RefundRequest.status == RefundStatus.REQUESTED
        ).order_by(RefundRequest.created_at).limit(limit).all()

    def create_request(self, refund_request: RefundRequest) -> RefundRequest:
        """Créer une demande de remboursement"""
        self.db.add(refund_request)
        self.db.commit()
        self.db.refresh(refund_request)
        return refund_request

    def update_request(self, refund_request: RefundRequest) -> RefundRequest:
        """Mettre à jour une demande de remboursement"""
        refund_request.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(refund_request)
        return refund_request

    # ========== REFUND TRANSACTIONS ==========

    def get_transaction_by_id(self, transaction_id: UUID) -> Optional[RefundTransaction]:
        """Obtenir une transaction de remboursement par son ID"""
        return self.db.query(RefundTransaction).filter(
            RefundTransaction.id == transaction_id
        ).first()

    def get_transactions_for_request(self, refund_request_id: UUID) -> List[RefundTransaction]:
        """Obtenir les transactions pour une demande de remboursement"""
        return self.db.query(RefundTransaction).filter(
            RefundTransaction.refund_request_id == refund_request_id
        ).order_by(desc(RefundTransaction.created_at)).all()

    def get_transactions_for_intent(self, payment_intent_id: UUID) -> List[RefundTransaction]:
        """Obtenir les transactions de remboursement pour une intention de paiement"""
        return self.db.query(RefundTransaction).filter(
            RefundTransaction.payment_intent_id == payment_intent_id
        ).order_by(desc(RefundTransaction.created_at)).all()

    def create_transaction(self, transaction: RefundTransaction) -> RefundTransaction:
        """Créer une transaction de remboursement"""
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    # ========== STATISTIQUES ==========

    def get_total_refunded_for_order(self, order_id: UUID) -> float:
        """Obtenir le total remboursé pour une commande"""
        result = self.db.query(RefundTransaction).filter(
            and_(
                RefundTransaction.payment_intent_id.in_(
                    self.db.query(RefundRequest.payment_intent_id).filter(
                        RefundRequest.order_id == order_id
                    )
                ),
                RefundTransaction.status == "success"
            )
        ).with_entities(RefundTransaction.amount).all()
        
        return sum([r[0] for r in result]) if result else 0.0

    def get_refund_stats_for_period(self, start_date: datetime, end_date: datetime) -> dict:
        """Obtenir des statistiques de remboursement pour une période"""
        # Demandes créées
        created_requests = self.db.query(RefundRequest).filter(
            and_(
                RefundRequest.created_at >= start_date,
                RefundRequest.created_at <= end_date
            )
        ).count()

        # Demandes approuvées
        approved_requests = self.db.query(RefundRequest).filter(
            and_(
                RefundRequest.status == RefundStatus.APPROVED,
                RefundRequest.reviewed_at >= start_date,
                RefundRequest.reviewed_at <= end_date
            )
        ).count()

        # Demandes complétées
        completed_requests = self.db.query(RefundRequest).filter(
            and_(
                RefundRequest.status == RefundStatus.COMPLETED,
                RefundRequest.updated_at >= start_date,
                RefundRequest.updated_at <= end_date
            )
        ).count()

        # Montants
        completed_transactions = self.db.query(RefundTransaction).filter(
            and_(
                RefundTransaction.status == "success",
                RefundTransaction.processed_at >= start_date,
                RefundTransaction.processed_at <= end_date
            )
        ).all()

        total_refunded = sum(t.amount for t in completed_transactions)

        total_requested_amount = (
            self.db.query(func.coalesce(func.sum(RefundRequest.requested_amount), 0.0))
            .filter(
                and_(
                    RefundRequest.created_at >= start_date,
                    RefundRequest.created_at <= end_date,
                )
            )
            .scalar()
            or 0.0
        )

        total_approved_amount = (
            self.db.query(func.coalesce(func.sum(RefundRequest.approved_amount), 0.0))
            .filter(
                and_(
                    RefundRequest.reviewed_at >= start_date,
                    RefundRequest.reviewed_at <= end_date,
                    RefundRequest.approved_amount.isnot(None),
                )
            )
            .scalar()
            or 0.0
        )

        return {
            "created_requests": created_requests,
            "approved_requests": approved_requests,
            "completed_requests": completed_requests,
            "total_requested_amount": total_requested_amount,
            "total_approved_amount": total_approved_amount,
            "total_refunded": total_refunded,
            "approval_rate": (approved_requests / created_requests * 100) if created_requests > 0 else 0,
            "completion_rate": (completed_requests / approved_requests * 100) if approved_requests > 0 else 0,
            "average_refund_amount": total_refunded / completed_requests if completed_requests > 0 else 0,
        }
