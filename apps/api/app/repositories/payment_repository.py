from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc

from app.models.payment import (
    PaymentIntent,
    PaymentTransaction,
    PaymentProviderEvent,
    PaymentIntentStatus,
    PaymentTransactionStatus,
)


class PaymentRepository:
    """Repository pour la gestion des paiements"""

    def __init__(self, db: Session):
        self.db = db

    # ========== PAYMENT INTENTS ==========

    def get_intent_by_id(self, intent_id: UUID) -> Optional[PaymentIntent]:
        """Obtenir une intention de paiement par son ID"""
        return self.db.query(PaymentIntent).filter(PaymentIntent.id == intent_id).first()

    def get_intent_by_provider_reference(self, provider_reference: str) -> Optional[PaymentIntent]:
        """Obtenir une intention de paiement par référence du fournisseur"""
        return self.db.query(PaymentIntent).filter(
            PaymentIntent.provider_reference == provider_reference
        ).first()

    def get_active_intent_for_order(self, order_id: UUID) -> Optional[PaymentIntent]:
        """Obtenir l'intention de paiement active pour une commande"""
        return self.db.query(PaymentIntent).filter(
            and_(
                PaymentIntent.order_id == order_id,
                PaymentIntent.status.in_([
                    PaymentIntentStatus.CREATED,
                    PaymentIntentStatus.PENDING,
                    PaymentIntentStatus.PROCESSING,
                ])
            )
        ).first()

    def get_intents_for_order(self, order_id: UUID) -> List[PaymentIntent]:
        """Obtenir toutes les intentions de paiement pour une commande"""
        return self.db.query(PaymentIntent).filter(
            PaymentIntent.order_id == order_id
        ).order_by(desc(PaymentIntent.created_at)).all()

    def get_successful_intents_for_order(self, order_id: UUID) -> List[PaymentIntent]:
        """Obtenir les intentions de paiement réussies pour une commande"""
        return self.db.query(PaymentIntent).filter(
            and_(
                PaymentIntent.order_id == order_id,
                PaymentIntent.status == PaymentIntentStatus.SUCCEEDED
            )
        ).order_by(desc(PaymentIntent.paid_at)).all()

    def get_intents_for_customer(self, customer_id: UUID, limit: int = 100) -> List[PaymentIntent]:
        """Obtenir les intentions de paiement d'un client"""
        return self.db.query(PaymentIntent).filter(
            PaymentIntent.customer_id == customer_id
        ).order_by(desc(PaymentIntent.created_at)).limit(limit).all()

    def create_intent(self, intent: PaymentIntent) -> PaymentIntent:
        """Créer une intention de paiement"""
        self.db.add(intent)
        self.db.commit()
        self.db.refresh(intent)
        return intent

    def update_intent(self, intent: PaymentIntent) -> PaymentIntent:
        """Mettre à jour une intention de paiement"""
        intent.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(intent)
        return intent

    # ========== PAYMENT TRANSACTIONS ==========

    def get_transaction_by_id(self, transaction_id: UUID) -> Optional[PaymentTransaction]:
        """Obtenir une transaction par son ID"""
        return self.db.query(PaymentTransaction).filter(
            PaymentTransaction.id == transaction_id
        ).first()

    def get_transaction_by_provider_id(self, provider_transaction_id: str) -> Optional[PaymentTransaction]:
        """Obtenir une transaction par ID du fournisseur"""
        return self.db.query(PaymentTransaction).filter(
            PaymentTransaction.provider_transaction_id == provider_transaction_id
        ).first()

    def get_transactions_for_intent(self, intent_id: UUID) -> List[PaymentTransaction]:
        """Obtenir toutes les transactions pour une intention de paiement"""
        return self.db.query(PaymentTransaction).filter(
            PaymentTransaction.payment_intent_id == intent_id
        ).order_by(desc(PaymentTransaction.created_at)).all()

    def get_transactions_for_order(self, order_id: UUID) -> List[PaymentTransaction]:
        """Obtenir toutes les transactions pour une commande"""
        return self.db.query(PaymentTransaction).filter(
            PaymentTransaction.order_id == order_id
        ).order_by(desc(PaymentTransaction.created_at)).all()

    def get_successful_transactions_for_order(self, order_id: UUID) -> List[PaymentTransaction]:
        """Obtenir les transactions réussies pour une commande"""
        return self.db.query(PaymentTransaction).filter(
            and_(
                PaymentTransaction.order_id == order_id,
                PaymentTransaction.status == PaymentTransactionStatus.SUCCESS
            )
        ).order_by(desc(PaymentTransaction.processed_at)).all()

    def create_transaction(self, transaction: PaymentTransaction) -> PaymentTransaction:
        """Créer une transaction"""
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def update_transaction(self, transaction: PaymentTransaction) -> PaymentTransaction:
        """Mettre à jour une transaction"""
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    # ========== PAYMENT PROVIDER EVENTS ==========

    def create_provider_event(self, event: PaymentProviderEvent) -> PaymentProviderEvent:
        """Créer un événement de fournisseur"""
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_events_for_intent(self, intent_id: UUID, limit: int = 50) -> List[PaymentProviderEvent]:
        """Obtenir les événements pour une intention de paiement"""
        return self.db.query(PaymentProviderEvent).filter(
            PaymentProviderEvent.payment_intent_id == intent_id
        ).order_by(desc(PaymentProviderEvent.created_at)).limit(limit).all()

    # ========== STATISTIQUES ==========

    def get_total_paid_for_order(self, order_id: UUID) -> float:
        """Obtenir le total payé pour une commande"""
        result = self.db.query(PaymentTransaction).filter(
            and_(
                PaymentTransaction.order_id == order_id,
                PaymentTransaction.status == PaymentTransactionStatus.SUCCESS
            )
        ).with_entities(PaymentTransaction.amount).all()
        
        return sum([r[0] for r in result]) if result else 0.0

    def get_payment_stats_for_period(self, start_date: datetime, end_date: datetime) -> dict:
        """Obtenir des statistiques de paiement pour une période"""
        # Transactions réussies
        successful_transactions = self.db.query(PaymentTransaction).filter(
            and_(
                PaymentTransaction.status == PaymentTransactionStatus.SUCCESS,
                PaymentTransaction.processed_at >= start_date,
                PaymentTransaction.processed_at <= end_date
            )
        ).all()

        total_amount = sum(t.amount for t in successful_transactions)
        transaction_count = len(successful_transactions)

        # Intentions créées
        created_intents = self.db.query(PaymentIntent).filter(
            and_(
                PaymentIntent.created_at >= start_date,
                PaymentIntent.created_at <= end_date
            )
        ).count()

        # Intentions réussies
        successful_intents = self.db.query(PaymentIntent).filter(
            and_(
                PaymentIntent.status == PaymentIntentStatus.SUCCEEDED,
                PaymentIntent.paid_at >= start_date,
                PaymentIntent.paid_at <= end_date
            )
        ).count()

        return {
            "total_amount": total_amount,
            "transaction_count": transaction_count,
            "created_intents": created_intents,
            "successful_intents": successful_intents,
            "success_rate": (successful_intents / created_intents * 100) if created_intents > 0 else 0,
            "average_transaction_amount": total_amount / transaction_count if transaction_count > 0 else 0,
        }