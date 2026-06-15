from datetime import datetime, timedelta
from decimal import Decimal
import json
from typing import Optional, List, Tuple, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.order import Order, PaymentStatus as OrderPaymentStatus
from app.models.payment import (
    PaymentIntent,
    PaymentTransaction,
    PaymentIntentStatus,
    PaymentTransactionStatus,
    PaymentTransactionType,
    PaymentMethod,
    PaymentProvider,
    RefundRequest,
    RefundStatus,
    RefundTransaction,
)
from app.models.dispute import Dispute, DisputeStatus, DisputeResolutionType
from app.models.commission import CommissionRecord, CommissionStatus
from app.models.loyalty import LoyaltySettingsConfig
from app.models.referral import ReferralReviewStatus, ReferralSettingsConfig
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.refund_repository import RefundRepository
from app.repositories.dispute_repository import DisputeRepository
from app.repositories.commission_repository import CommissionRepository
from app.schemas.payment import (
    PaymentIntentCreate,
    CashPaymentConfirmRequest,
    ProviderWebhookRequest,
)
from app.schemas.refund import (
    RefundRequestCreate,
    RefundRequestApprove,
    RefundRequestReject,
)
from app.schemas.dispute import DisputeCreate, DisputeResolveRequest
from app.schemas.commission import CommissionComputeRequest
from app.models.admin import AuditLog
from app.models.notification import Notification
from app.services.audit_service import AuditService
from app.services.loyalty_service import LoyaltyService
from app.services.notification_service import NotificationService
from app.services.promotion_service import PromotionService
from app.exceptions import (
    PaymentError,
    RefundError,
    DisputeError,
    CommissionError,
    ValidationError,
)


class PaymentService:
    """Service principal pour la gestion des paiements et finances"""

    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.refund_repo = RefundRepository(db)
        self.dispute_repo = DisputeRepository(db)
        self.commission_repo = CommissionRepository(db)

    def _get_loyalty_settings(self) -> tuple[bool, int, int]:
        config = (
            self.db.query(LoyaltySettingsConfig)
            .filter(LoyaltySettingsConfig.key == "site")
            .first()
        )
        if config is None:
            return True, 10, 100
        return bool(config.is_enabled), int(config.points_per_dollar), int(config.points_to_dollar)

    def _get_referral_settings(self) -> tuple[bool, int, Decimal]:
        config = (
            self.db.query(ReferralSettingsConfig)
            .filter(ReferralSettingsConfig.key == "site")
            .first()
        )
        if config is None:
            return True, 500, Decimal("5.00")
        return (
            bool(config.is_enabled),
            int(config.referrer_bonus_points),
            Decimal(str(config.referee_discount_amount)),
        )

    @staticmethod
    def _is_referral_review_blocking(review_status: str | None) -> bool:
        return (review_status or "").strip().lower() in {
            "reviewed_high_risk",
            "high_risk",
            "blocked",
        }

    def _is_referrer_blocked(self, referrer_user_id: UUID | None) -> bool:
        if referrer_user_id is None:
            return False
        review = (
            self.db.query(ReferralReviewStatus)
            .filter(ReferralReviewStatus.referrer_user_id == referrer_user_id)
            .first()
        )
        return self._is_referral_review_blocking(getattr(review, "review_status", None))

    def _loyalty_earn_idempotency_key(self, order_id: UUID) -> str:
        return f"loyalty_earn:{order_id}"

    def _referral_bonus_idempotency_key(self, order_id: UUID, referrer_id: UUID) -> str:
        return f"referral_bonus:{order_id}:{referrer_id}"

    def _loyalty_notification_already_sent(self, user_id: UUID, idempotency_key: str) -> bool:
        notifications = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id)
            .all()
        )
        for notification in notifications:
            metadata = self._parse_notification_metadata(notification.notification_metadata)
            if metadata.get("idempotencyKey") == idempotency_key:
                return True
        return False

    def _loyalty_audit_already_logged(self, order_id: UUID, action: str) -> bool:
        return (
            self.db.query(AuditLog.id)
            .filter(
                AuditLog.resource_id == order_id,
                AuditLog.resource_type == "loyalty_ledger",
                AuditLog.action == action,
            )
            .first()
            is not None
        )

    def _emit_loyalty_earn_events(self, order: Order, customer: User, awarded_points: int) -> None:
        idempotency_key = self._loyalty_earn_idempotency_key(order.id)
        if awarded_points > 0 and not self._loyalty_notification_already_sent(customer.id, idempotency_key):
            NotificationService(self.db).create(
                user_id=customer.id,
                title="Points fidelite gagnes",
                message=f"Vous avez gagne {awarded_points} points sur la commande {order.order_number}.",
                notification_type="loyalty_points_earned",
                metadata={
                    "orderId": str(order.id),
                    "orderNumber": order.order_number,
                    "pointsEarned": awarded_points,
                    "page": "profile",
                    "idempotencyKey": idempotency_key,
                },
            )
        if not self._loyalty_audit_already_logged(order.id, "loyalty_points_earned"):
            AuditService(self.db).log_event(
                user_id=customer.id,
                action="loyalty_points_earned",
                resource_type="loyalty_ledger",
                resource_id=order.id,
                details={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "points_earned": awarded_points,
                    "balance_after": int(getattr(customer, "loyalty_points", 0) or 0),
                },
            )

    def _emit_referral_bonus_events(
        self,
        order: Order,
        referrer: User,
        referee: User,
        bonus_points: int,
    ) -> None:
        idempotency_key = self._referral_bonus_idempotency_key(order.id, referrer.id)
        if bonus_points > 0 and not self._loyalty_notification_already_sent(referrer.id, idempotency_key):
            NotificationService(self.db).create(
                user_id=referrer.id,
                title="Bonus parrainage",
                message=f"Bonus de {bonus_points} points pour le parrainage de {referee.name}.",
                notification_type="referral_bonus_awarded",
                metadata={
                    "orderId": str(order.id),
                    "refereeUserId": str(referee.id),
                    "bonusPoints": bonus_points,
                    "page": "profile",
                    "idempotencyKey": idempotency_key,
                },
            )
        if not self._loyalty_audit_already_logged(order.id, "referral_bonus_awarded"):
            AuditService(self.db).log_event(
                user_id=referrer.id,
                action="referral_bonus_awarded",
                resource_type="loyalty_ledger",
                resource_id=order.id,
                details={
                    "order_id": str(order.id),
                    "referee_user_id": str(referee.id),
                    "referrer_user_id": str(referrer.id),
                    "bonus_points": bonus_points,
                    "balance_after": int(getattr(referrer, "loyalty_points", 0) or 0),
                },
            )

    def _consume_promotion_if_needed(self, order: Order) -> None:
        PromotionService(self.db).consume_for_paid_order(order)

    def _award_loyalty_points_if_needed(self, order: Order) -> None:
        breakdown = dict(order.calculation_breakdown or {})
        loyalty_service = LoyaltyService(self.db)
        if breakdown.get("loyalty_points_awarded") or loyalty_service.has_order_entry(
            order.id, "earn", user_id=order.customer_id
        ):
            return

        is_enabled, points_per_dollar, _ = self._get_loyalty_settings()
        if not is_enabled or points_per_dollar <= 0:
            return

        customer = self.db.query(User).filter(User.id == order.customer_id).first()
        if customer is None:
            return

        awarded_points = int(Decimal(str(order.amount_paid)) * Decimal(points_per_dollar))
        breakdown["loyalty_points_awarded"] = True
        breakdown["loyalty_points_earned"] = awarded_points
        order.calculation_breakdown = breakdown

        if awarded_points > 0:
            customer.loyalty_points = int(getattr(customer, "loyalty_points", 0) or 0) + awarded_points
            self.db.add(customer)
            loyalty_service.record_entry(
                user_id=customer.id,
                order_id=order.id,
                entry_type="earn",
                points_delta=awarded_points,
                balance_after=customer.loyalty_points,
                description=f"Earned {awarded_points} loyalty points from paid order {order.order_number}",
            )
            self._emit_loyalty_earn_events(order, customer, awarded_points)

    def _award_referral_bonus_if_needed(self, order: Order) -> None:
        customer = self.db.query(User).filter(User.id == order.customer_id).first()
        if customer is None:
            return
        referrer_id = getattr(customer, "referred_by_user_id", None)
        if not referrer_id:
            return
        if getattr(customer, "referral_bonus_awarded_at", None):
            return
        if self._is_referrer_blocked(referrer_id):
            return

        loyalty_service = LoyaltyService(self.db)
        if loyalty_service.has_order_entry(order.id, "referral_bonus", user_id=referrer_id):
            return

        is_enabled, referrer_bonus_points, _ = self._get_referral_settings()
        if not is_enabled or referrer_bonus_points <= 0:
            return

        referrer = self.db.query(User).filter(User.id == referrer_id).first()
        if referrer is None:
            return

        referrer.loyalty_points = int(getattr(referrer, "loyalty_points", 0) or 0) + referrer_bonus_points
        customer.referral_bonus_awarded_at = datetime.utcnow()
        self.db.add(referrer)
        self.db.add(customer)
        loyalty_service.record_entry(
            user_id=referrer.id,
            order_id=order.id,
            entry_type="referral_bonus",
            points_delta=referrer_bonus_points,
            balance_after=referrer.loyalty_points,
            description=f"Referral bonus from first paid order {order.order_number}",
        )
        self._emit_referral_bonus_events(order, referrer, customer, referrer_bonus_points)

    # ========== PAYMENT INTENTS ==========

    def create_payment_intent(self, data: PaymentIntentCreate, customer_id: UUID) -> PaymentIntent:
        """Créer une intention de paiement"""
        expected_amount = Decimal(str(data.amount_expected))
        provider_name = data.provider_name
        if provider_name is None:
            if data.payment_method == PaymentMethod.CASH_ON_DELIVERY:
                provider_name = PaymentProvider.CASH
            elif data.payment_method == PaymentMethod.MOBILE_MONEY:
                provider_name = PaymentProvider.ORANGE_MONEY_RDC

        # Vérifier que la commande existe
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise ValidationError(f"Commande {data.order_id} non trouvée")

        # Vérifier que le client est bien le propriétaire de la commande
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Le client n'est pas propriétaire de cette commande")

        # Vérifier qu'il n'y a pas déjà une intention de paiement active
        existing_intent = self.payment_repo.get_active_intent_for_order(data.order_id)
        if existing_intent:
            raise PaymentError(f"Une intention de paiement existe déjà pour cette commande: {existing_intent.id}")

        if order.payment_status in {
            OrderPaymentStatus.PAID,
            OrderPaymentStatus.REFUNDED,
            OrderPaymentStatus.PARTIALLY_REFUNDED,
        }:
            raise PaymentError(
                f"Impossible de créer une nouvelle intention pour une commande déjà soldée: {order.payment_status}"
            )

        # Calculer le montant attendu (doit correspondre au total de la commande)
        order_total = Decimal(str(order.total_amount))
        if abs(expected_amount - order_total) > Decimal("0.01"):
            raise ValidationError(
                f"Le montant attendu ({data.amount_expected}) ne correspond pas au total de la commande ({order.total_amount})"
            )

        # Créer l'intention de paiement
        intent = PaymentIntent(
            order_id=data.order_id,
            customer_id=customer_id,
            payment_method=data.payment_method,
            currency=data.currency or "CDF",
            amount=float(expected_amount),
            amount_expected=float(expected_amount),
            amount_paid=0.0,
            status=PaymentIntentStatus.CREATED,
            provider=provider_name.value if provider_name else None,
            provider_name=provider_name,
            expires_at=data.expires_at or (datetime.utcnow() + timedelta(hours=24)),
            payment_metadata=json.dumps(data.payment_metadata) if data.payment_metadata is not None else None,
        )

        self.db.add(intent)
        self.db.commit()
        self.db.refresh(intent)

        return intent

    def initiate_payment(self, intent_id: UUID) -> PaymentTransaction:
        """Initier un paiement (créer une transaction)"""
        intent = self.payment_repo.get_intent_by_id(intent_id)
        if not intent:
            raise PaymentError(f"Intention de paiement {intent_id} non trouvée")

        if intent.status not in [PaymentIntentStatus.CREATED, PaymentIntentStatus.PENDING]:
            raise PaymentError(f"Intention de paiement dans un état invalide: {intent.status}")

        # Créer une transaction
        transaction = PaymentTransaction(
            payment_intent_id=intent.id,
            order_id=intent.order_id,
            transaction_type=PaymentTransactionType.PAYMENT,
            provider_name=intent.provider_name,
            status=PaymentTransactionStatus.INITIATED,
            amount=intent.amount_expected,
            currency=intent.currency,
        )

        # Mettre à jour le statut de l'intention
        intent.status = PaymentIntentStatus.PENDING
        intent.updated_at = datetime.utcnow()

        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)

        # TODO: Intégration avec le fournisseur de paiement réel
        # Pour le MVP, on simule un paiement immédiat pour mobile money
        if intent.payment_method == PaymentMethod.MOBILE_MONEY:
            self._simulate_mobile_money_payment(intent, transaction)

        return transaction

    def confirm_cash_payment(self, intent_id: UUID, data: CashPaymentConfirmRequest) -> Tuple[PaymentIntent, PaymentTransaction]:
        """Confirmer un paiement cash"""
        intent = self.payment_repo.get_intent_by_id(intent_id)
        if not intent:
            raise PaymentError(f"Intention de paiement {intent_id} non trouvée")

        if intent.payment_method != PaymentMethod.CASH_ON_DELIVERY:
            raise PaymentError("Cette méthode ne s'applique qu'aux paiements cash")

        # Vérifier que le montant payé ne dépasse pas le montant attendu
        if data.amount_paid > intent.amount_expected:
            raise ValidationError(
                f"Le montant payé ({data.amount_paid}) dépasse le montant attendu ({intent.amount_expected})"
            )

        # Créer une transaction de paiement cash
        transaction = PaymentTransaction(
            payment_intent_id=intent.id,
            order_id=intent.order_id,
            transaction_type=PaymentTransactionType.PAYMENT,
            provider_name=PaymentProvider.CASH,
            status=PaymentTransactionStatus.SUCCESS,
            amount=data.amount_paid,
            currency=intent.currency,
            processed_at=datetime.utcnow(),
        )

        # Mettre à jour l'intention
        intent.amount_paid = data.amount_paid
        intent.status = PaymentIntentStatus.SUCCEEDED
        intent.paid_at = datetime.utcnow()
        intent.updated_at = datetime.utcnow()

        self.db.add(transaction)
        self.db.commit()

        # Recalculer le statut de paiement de la commande
        self.recalculate_order_payment_status(intent.order_id)

        return intent, transaction

    def record_provider_callback(self, provider: PaymentProvider, data: ProviderWebhookRequest) -> Tuple[PaymentIntent, PaymentTransaction]:
        """Enregistrer un callback d'un fournisseur de paiement"""
        # TODO: Implémenter la logique de validation de signature
        # TODO: Extraire les IDs de transaction et d'intention du payload

        # Pour le MVP, on simule un traitement basique
        payload = data.payload
        transaction_id = payload.get("transaction_id")
        intent_id = payload.get("payment_intent_id")

        if not intent_id:
            raise PaymentError("ID d'intention de paiement manquant dans le payload")

        intent = self.payment_repo.get_intent_by_id(UUID(intent_id))
        if not intent:
            raise PaymentError(f"Intention de paiement {intent_id} non trouvée")

        # Mettre à jour la transaction existante ou en créer une nouvelle
        transaction = self.payment_repo.get_transaction_by_provider_id(transaction_id)
        if not transaction:
            transaction = PaymentTransaction(
                payment_intent_id=intent.id,
                order_id=intent.order_id,
                transaction_type=PaymentTransactionType.PAYMENT,
                provider_name=provider,
                provider_transaction_id=transaction_id,
                raw_provider_payload=str(payload),
            )

        # Mettre à jour le statut basé sur l'événement
        event_type = data.event_type.lower()
        if "succeeded" in event_type or "completed" in event_type:
            transaction.status = PaymentTransactionStatus.SUCCESS
            intent.status = PaymentIntentStatus.SUCCEEDED
            intent.amount_paid = intent.amount_expected
            intent.paid_at = datetime.utcnow()
        elif "failed" in event_type or "rejected" in event_type:
            transaction.status = PaymentTransactionStatus.FAILED
            intent.status = PaymentIntentStatus.FAILED
            transaction.failure_reason = payload.get("failure_reason", "Raison inconnue")
        elif "pending" in event_type:
            transaction.status = PaymentTransactionStatus.PENDING
            intent.status = PaymentIntentStatus.PROCESSING

        transaction.processed_at = datetime.utcnow()
        intent.updated_at = datetime.utcnow()

        self.db.add(transaction)
        self.db.commit()

        # Recalculer le statut de paiement de la commande
        self.recalculate_order_payment_status(intent.order_id)

        return intent, transaction

    def recalculate_order_payment_status(self, order_id: UUID) -> Order:
        """Recalculer le statut de paiement d'une commande"""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValidationError(f"Commande {order_id} non trouvée")

        # Récupérer toutes les intentions de paiement pour cette commande
        intents = self.payment_repo.get_intents_for_order(order_id)

        # Calculer le total payé et remboursé
        total_paid = sum(intent.amount_paid for intent in intents if intent.status == PaymentIntentStatus.SUCCEEDED)
        total_refunded = self.refund_repo.get_total_refunded_for_order(order_id)

        # Mettre à jour les champs de la commande
        order.amount_paid = total_paid
        order.refunded_amount = total_refunded

        previous_payment_status = order.payment_status

        # Déterminer le statut de paiement
        if total_paid >= order.total_amount:
            order.payment_status = OrderPaymentStatus.PAID
        elif total_paid > 0:
            order.payment_status = OrderPaymentStatus.PARTIALLY_PAID
        elif any(intent.status == PaymentIntentStatus.PENDING for intent in intents):
            order.payment_status = OrderPaymentStatus.PENDING
        else:
            order.payment_status = OrderPaymentStatus.PENDING

        # Si des remboursements ont été effectués
        if total_refunded > 0:
            if total_refunded >= total_paid:
                order.payment_status = OrderPaymentStatus.REFUNDED
            else:
                order.payment_status = OrderPaymentStatus.PARTIALLY_REFUNDED

        if previous_payment_status != OrderPaymentStatus.PAID and order.payment_status == OrderPaymentStatus.PAID:
            self._consume_promotion_if_needed(order)
            self._award_loyalty_points_if_needed(order)
            self._award_referral_bonus_if_needed(order)
            self._emit_payment_paid_corridor_events(order, previous_payment_status)

        order.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(order)

        return order

    # ========== REFUNDS ==========

    def create_refund_request(self, data: RefundRequestCreate, customer_id: UUID) -> RefundRequest:
        """Créer une demande de remboursement"""
        # Vérifier que la commande existe
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise ValidationError(f"Commande {data.order_id} non trouvée")

        # Vérifier que le client est bien le propriétaire
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Le client n'est pas propriétaire de cette commande")

        # Vérifier qu'il y a un paiement réussi
        intents = self.payment_repo.get_successful_intents_for_order(data.order_id)
        if not intents:
            raise RefundError("Aucun paiement réussi pour cette commande")

        # Utiliser la première intention réussie
        intent = intents[0]

        # Vérifier que le montant demandé ne dépasse pas le montant payé
        if data.requested_amount > intent.amount_paid:
            raise ValidationError(
                f"Le montant demandé ({data.requested_amount}) dépasse le montant payé ({intent.amount_paid})"
            )

        # Vérifier s'il y a déjà une demande de remboursement en cours
        existing_request = self.refund_repo.get_active_request_for_order(data.order_id)
        if existing_request:
            raise RefundError(f"Une demande de remboursement existe déjà pour cette commande: {existing_request.id}")

        # Créer la demande
        refund_request = RefundRequest(
            order_id=data.order_id,
            payment_intent_id=intent.id,
            customer_id=customer_id,
            dispute_id=data.dispute_id,
            reason_code=data.reason_code,
            reason_text=data.reason_text,
            requested_amount=data.requested_amount,
            status=RefundStatus.REQUESTED,
        )

        self.db.add(refund_request)
        self.db.commit()
        self.db.refresh(refund_request)

        return refund_request

    def approve_refund_request(self, refund_request_id: UUID, admin_user_id: UUID, data: RefundRequestApprove) -> RefundRequest:
        """Approuver une demande de remboursement"""
        refund_request = self.refund_repo.get_by_id(refund_request_id)
        if not refund_request:
            raise RefundError(f"Demande de remboursement {refund_request_id} non trouvée")

        if refund_request.status != RefundStatus.REQUESTED:
            raise RefundError(f"La demande n'est pas dans l'état REQUESTED: {refund_request.status}")

        # Vérifier que le montant approuvé ne dépasse pas le montant payé
        intent = refund_request.payment_intent
        if data.approved_amount > intent.amount_paid:
            raise ValidationError(
                f"Le montant approuvé ({data.approved_amount}) dépasse le montant payé ({intent.amount_paid})"
            )

        # Vérifier que le montant approuvé ne dépasse pas le montant demandé
        if data.approved_amount > refund_request.requested_amount:
            raise ValidationError(
                f"Le montant approuvé ({data.approved_amount}) dépasse le montant demandé ({refund_request.requested_amount})"
            )

        # Approuver la demande
        refund_request.approved_amount = data.approved_amount
        refund_request.status = RefundStatus.APPROVED
        refund_request.reviewed_by_user_id = admin_user_id
        refund_request.reviewed_at = datetime.utcnow()
        refund_request.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(refund_request)

        return refund_request

    def reject_refund_request(self, refund_request_id: UUID, admin_user_id: UUID, data: RefundRequestReject) -> RefundRequest:
        """Rejeter une demande de remboursement"""
        refund_request = self.refund_repo.get_by_id(refund_request_id)
        if not refund_request:
            raise RefundError(f"Demande de remboursement {refund_request_id} non trouvée")

        if refund_request.status != RefundStatus.REQUESTED:
            raise RefundError(f"La demande n'est pas dans l'état REQUESTED: {refund_request.status}")

        # Rejeter la demande
        refund_request.status = RefundStatus.REJECTED
        refund_request.reviewed_by_user_id = admin_user_id
        refund_request.reviewed_at = datetime.utcnow()
        refund_request.updated_at = datetime.utcnow()
        if refund_request.reason_text:
            refund_request.reason_text += f"\n[REJET]: {data.reason}"
        else:
            refund_request.reason_text = f"[REJET]: {data.reason}"

        self.db.commit()
        self.db.refresh(refund_request)

        return refund_request

    def process_refund(self, refund_request_id: UUID) -> RefundTransaction:
        """Traiter un remboursement approuvé"""
        refund_request = self.refund_repo.get_by_id(refund_request_id)
        if not refund_request:
            raise RefundError(f"Demande de remboursement {refund_request_id} non trouvée")

        if refund_request.status != RefundStatus.APPROVED:
            raise RefundError(f"La demande n'est pas dans l'état APPROVED: {refund_request.status}")

        if not refund_request.approved_amount:
            raise RefundError("Montant approuvé manquant")

        # Créer une transaction de remboursement
        refund_transaction = RefundTransaction(
            refund_request_id=refund_request.id,
            payment_intent_id=refund_request.payment_intent_id,
            provider_name=refund_request.payment_intent.provider_name,
            status=PaymentTransactionStatus.PENDING,
            amount=refund_request.approved_amount,
        )

        # Pour le MVP, on simule un remboursement immédiat
        # TODO: Intégration avec le fournisseur de paiement réel
        refund_transaction.status = PaymentTransactionStatus.SUCCESS
        refund_transaction.processed_at = datetime.utcnow()

        # Mettre à jour le statut de la demande
        refund_request.status = RefundStatus.COMPLETED
        refund_request.updated_at = datetime.utcnow()

        self.db.add(refund_transaction)
        self.db.commit()
        self.db.refresh(refund_transaction)

        # Recalculer le statut de paiement de la commande
        self.recalculate_order_payment_status(refund_request.order_id)

        return refund_transaction

    # ========== DISPUTES ==========

    def create_dispute(self, data: DisputeCreate, customer_id: UUID) -> Dispute:
        """Créer un litige"""
        # Vérifier que la commande existe
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise ValidationError(f"Commande {data.order_id} non trouvée")

        # Vérifier que le client est bien le propriétaire
        if str(order.customer_id) != str(customer_id):
            raise ValidationError("Le client n'est pas propriétaire de cette commande")

        # Vérifier qu'il n'y a pas déjà un litige en cours
        existing_dispute = self.dispute_repo.get_active_dispute_for_order(data.order_id)
        if existing_dispute:
            raise DisputeError(f"Un litige existe déjà pour cette commande: {existing_dispute.id}")

        # Créer le litige
        dispute = Dispute(
            order_id=data.order_id,
            customer_id=customer_id,
            partner_id=order.partner_id,
            category=data.category,
            title=data.title,
            description=data.description,
            status=DisputeStatus.OPEN,
        )

        self.db.add(dispute)
        self.db.commit()
        self.db.refresh(dispute)

        # Si un remboursement est demandé, créer une demande de remboursement
        if data.refund_requested and data.requested_amount:
            refund_data = RefundRequestCreate(
                order_id=data.order_id,
                reason_code="dispute",
                reason_text=f"Litige: {data.title}",
                requested_amount=data.requested_amount,
                dispute_id=dispute.id,
            )
            self.create_refund_request(refund_data, customer_id)

        return dispute

    def resolve_dispute(self, dispute_id: UUID, admin_user_id: UUID, data: DisputeResolveRequest) -> Dispute:
        """Résoudre un litige"""
        dispute = self.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise DisputeError(f"Litige {dispute_id} non trouvé")

        if dispute.status != DisputeStatus.OPEN and dispute.status != DisputeStatus.UNDER_REVIEW:
            raise DisputeError(f"Le litige n'est pas dans un état résoluble: {dispute.status}")

        # Résoudre le litige
        dispute.resolution_type = data.resolution_type
        dispute.resolution_notes = data.resolution_notes
        dispute.resolved_by_user_id = admin_user_id
        dispute.resolved_at = datetime.utcnow()
        dispute.status = DisputeStatus.RESOLVED
        dispute.updated_at = datetime.utcnow()

        # Si la résolution implique un remboursement, traiter les demandes de remboursement associées
        if data.resolution_type in [DisputeResolutionType.FULL_REFUND, DisputeResolutionType.PARTIAL_REFUND]:
            refund_requests = self.refund_repo.get_requests_for_dispute(dispute_id)
            for refund_request in refund_requests:
                if refund_request.status == RefundStatus.REQUESTED:
                    # Approuver le remboursement
                    approve_data = RefundRequestApprove(
                        approved_amount=data.refund_amount or refund_request.requested_amount,
                        notes=f"Approuvé via résolution de litige: {data.resolution_notes}"
                    )
                    self.approve_refund_request(refund_request.id, admin_user_id, approve_data)
                    # Traiter le remboursement
                    self.process_refund(refund_request.id)

        self.db.commit()
        self.db.refresh(dispute)

        return dispute

    def reject_dispute(self, dispute_id: UUID, admin_user_id: UUID, reason: str) -> Dispute:
        """Rejeter un litige"""
        dispute = self.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise DisputeError(f"Litige {dispute_id} non trouvé")

        if dispute.status != DisputeStatus.OPEN and dispute.status != DisputeStatus.UNDER_REVIEW:
            raise DisputeError(f"Le litige n'est pas dans un état rejetable: {dispute.status}")

        # Rejeter le litige
        dispute.status = DisputeStatus.REJECTED
        dispute.resolved_by_user_id = admin_user_id
        dispute.resolved_at = datetime.utcnow()
        dispute.resolution_notes = f"Rejeté: {reason}"
        dispute.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(dispute)

        return dispute

    # ========== COMMISSIONS ==========

    def compute_commission(self, order_id: UUID, data: CommissionComputeRequest) -> CommissionRecord:
        """Calculer la commission pour une commande"""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValidationError(f"Commande {order_id} non trouvée")

        # Vérifier si une commission existe déjà
        existing_commission = self.commission_repo.get_commission_for_order(order_id)
        if existing_commission and not data.force_recompute:
            raise CommissionError(f"Une commission existe déjà pour cette commande: {existing_commission.id}")

        # Vérifier que la commande est payée
        if order.payment_status != OrderPaymentStatus.PAID:
            raise CommissionError(f"La commande n'est pas payée: {order.payment_status}")

        # Calculer les montants
        gross_amount = Decimal(str(order.total_amount))
        discount_amount = Decimal(str(order.discount_amount))
        net_paid_amount = Decimal(str(order.amount_paid)) - Decimal(str(order.refunded_amount))
        platform_commission_rate = Decimal(str(data.platform_commission_rate))

        # Calculer la commission de la plateforme
        platform_commission_amount = (net_paid_amount * platform_commission_rate) / Decimal("100")

        # Calculer le montant net du partenaire
        partner_net_amount = net_paid_amount - platform_commission_amount

        # Créer ou mettre à jour l'enregistrement de commission
        if existing_commission:
            commission = existing_commission
            commission.gross_amount = float(gross_amount)
            commission.discount_amount = float(discount_amount)
            commission.net_paid_amount = float(net_paid_amount)
            commission.platform_commission_amount = float(platform_commission_amount)
            commission.partner_net_amount = float(partner_net_amount)
            commission.status = CommissionStatus.COMPUTED
            commission.computed_at = datetime.utcnow()
            commission.updated_at = datetime.utcnow()
        else:
            commission = CommissionRecord(
                order_id=order_id,
                partner_id=order.partner_id,
                gross_amount=float(gross_amount),
                discount_amount=float(discount_amount),
                net_paid_amount=float(net_paid_amount),
                platform_commission_amount=float(platform_commission_amount),
                partner_net_amount=float(partner_net_amount),
                currency=order.currency,
                status=CommissionStatus.COMPUTED,
                computed_at=datetime.utcnow(),
            )
            self.db.add(commission)

        self.db.commit()
        self.db.refresh(commission)

        return commission

    def settle_commission(self, commission_id: UUID, settlement_notes: Optional[str] = None) -> CommissionRecord:
        """Marquer une commission comme réglée"""
        commission = self.commission_repo.get_by_id(commission_id)
        if not commission:
            raise CommissionError(f"Commission {commission_id} non trouvée")

        if commission.status != CommissionStatus.COMPUTED:
            raise CommissionError(f"La commission n'est pas dans l'état COMPUTED: {commission.status}")

        # Marquer comme réglée
        commission.status = CommissionStatus.SETTLED
        commission.notes = settlement_notes
        commission.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(commission)

        return commission

    # ========== HELPER METHODS ==========

    @staticmethod
    def _parse_notification_metadata(raw_metadata: Any) -> Dict[str, Any]:
        if not raw_metadata:
            return {}
        if isinstance(raw_metadata, dict):
            return raw_metadata
        try:
            return json.loads(raw_metadata)
        except (TypeError, json.JSONDecodeError):
            return {}

    def _payment_confirmation_idempotency_key(self, order_id: UUID) -> str:
        return f"payment_confirmation:{order_id}"

    def _payment_confirmation_already_sent(self, customer_id: UUID, order_id: UUID) -> bool:
        idempotency_key = self._payment_confirmation_idempotency_key(order_id)
        notifications = (
            self.db.query(Notification)
            .filter(
                Notification.user_id == customer_id,
                Notification.notification_type == "payment_confirmation",
            )
            .all()
        )
        for notification in notifications:
            metadata = self._parse_notification_metadata(notification.notification_metadata)
            if metadata.get("idempotencyKey") == idempotency_key:
                return True
            if str(metadata.get("orderId")) == str(order_id):
                return True
        return False

    def _payment_paid_audit_already_logged(self, order_id: UUID) -> bool:
        return (
            self.db.query(AuditLog.id)
            .filter(
                AuditLog.resource_id == order_id,
                AuditLog.resource_type == "payment_status_changed",
                AuditLog.action == "payment_paid",
            )
            .first()
            is not None
        )

    def _emit_payment_paid_corridor_events(self, order: Order, previous_payment_status: OrderPaymentStatus) -> None:
        """Notification + audit sur transition réelle vers PAID (idempotent)."""
        if previous_payment_status == OrderPaymentStatus.PAID:
            return
        if order.payment_status != OrderPaymentStatus.PAID:
            return

        intents = self.payment_repo.get_intents_for_order(order.id)
        succeeded_intent = next(
            (intent for intent in reversed(intents) if intent.status == PaymentIntentStatus.SUCCEEDED),
            None,
        )

        if not self._payment_confirmation_already_sent(order.customer_id, order.id):
            NotificationService(self.db).create(
                user_id=order.customer_id,
                title="Paiement confirme",
                message=f"Votre paiement pour la commande {order.order_number} a ete confirme.",
                notification_type="payment_confirmation",
                metadata={
                    "orderId": str(order.id),
                    "orderNumber": order.order_number,
                    "partnerId": str(order.partner_id),
                    "page": "tracking",
                    "idempotencyKey": self._payment_confirmation_idempotency_key(order.id),
                    "amountPaid": float(order.amount_paid or 0),
                    "currency": order.currency,
                },
            )

        if not self._payment_paid_audit_already_logged(order.id):
            AuditService(self.db).log_event(
                user_id=order.customer_id,
                action="payment_paid",
                resource_type="payment_status_changed",
                resource_id=order.id,
                details={
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "previous_payment_status": (
                        previous_payment_status.value
                        if hasattr(previous_payment_status, "value")
                        else str(previous_payment_status)
                    ),
                    "new_payment_status": OrderPaymentStatus.PAID.value,
                    "amount_paid": float(order.amount_paid or 0),
                    "payment_intent_id": str(succeeded_intent.id) if succeeded_intent else None,
                },
            )

    def _simulate_mobile_money_payment(self, intent: PaymentIntent, transaction: PaymentTransaction):
        """Simuler un paiement mobile money (pour le MVP)"""
        # Simuler un délai de traitement
        import time
        time.sleep(1)

        # Simuler un paiement réussi
        transaction.status = PaymentTransactionStatus.SUCCESS
        transaction.processed_at = datetime.utcnow()
        transaction.provider_transaction_id = f"SIM_{intent.id}_{datetime.utcnow().timestamp()}"

        intent.amount_paid = intent.amount_expected
        intent.status = PaymentIntentStatus.SUCCEEDED
        intent.paid_at = datetime.utcnow()
        intent.updated_at = datetime.utcnow()

        self.db.commit()

        # Recalculer le statut de paiement de la commande
        self.recalculate_order_payment_status(intent.order_id)

    def get_order_payment_summary(self, order_id: UUID) -> Dict[str, Any]:
        """Obtenir un résumé des paiements d'une commande"""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValidationError(f"Commande {order_id} non trouvée")

        intents = self.payment_repo.get_intents_for_order(order_id)
        transactions = self.payment_repo.get_transactions_for_order(order_id)
        refund_requests = self.refund_repo.get_requests_for_order(order_id)

        return {
            "order": order,
            "payment_intents": intents,
            "transactions": transactions,
            "refund_requests": refund_requests,
            "total_paid": order.amount_paid,
            "total_refunded": order.refunded_amount,
            "amount_due": order.total_amount - order.amount_paid,
            "payment_status": order.payment_status,
        }
