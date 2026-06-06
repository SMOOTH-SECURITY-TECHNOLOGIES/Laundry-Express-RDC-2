import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID, uuid4

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.order import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderEvent,
    OrderStatus,
    PaymentStatus,
)
from app.models.user import User
from app.models.operational import (
    OperationalProof,
    OperationalTimeline,
    ProofType,
    ActorType,
    TimelineEventType,
    VerificationStatus,
)
from app.repositories.order_repository import OrderRepository
from app.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderEstimateRequest,
    OrderEstimateResponse,
    OrderStatusUpdateRequest,
    OrderCancelRequest,
)
from app.schemas.pricing import PriceCalculationInput
from app.services.loyalty_service import LoyaltyService
from app.services.pricing_service import PricingService
from app.models.promotion import PromoCode


class OrderService:
    """Service métier pour les commandes"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = OrderRepository(db)

    # === State Machine ===

    VALID_TRANSITIONS = {
        # De DRAFT
        OrderStatus.DRAFT: {
            OrderStatus.PENDING_CONFIRMATION,
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        },
        # De PENDING_CONFIRMATION
        OrderStatus.PENDING_CONFIRMATION: {
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        },
        # De CONFIRMED
        OrderStatus.CONFIRMED: {
            OrderStatus.PICKUP_SCHEDULED,
            OrderStatus.CANCELLED,
        },
        # De PICKUP_SCHEDULED
        OrderStatus.PICKUP_SCHEDULED: {
            OrderStatus.PICKUP_DRIVER_ASSIGNED,
            OrderStatus.CANCELLED,
        },
        # De PICKUP_DRIVER_ASSIGNED
        OrderStatus.PICKUP_DRIVER_ASSIGNED: {
            OrderStatus.PICKUP_IN_PROGRESS,
            OrderStatus.CANCELLED,
        },
        # De PICKUP_IN_PROGRESS
        OrderStatus.PICKUP_IN_PROGRESS: {
            OrderStatus.PICKED_UP,
            OrderStatus.FAILED,
        },
        # De PICKED_UP
        OrderStatus.PICKED_UP: {
            OrderStatus.RECEIVED_BY_PARTNER,
            OrderStatus.FAILED,
        },
        # De RECEIVED_BY_PARTNER
        OrderStatus.RECEIVED_BY_PARTNER: {
            OrderStatus.CLEANING_IN_PROGRESS,
            OrderStatus.FAILED,
        },
        # De CLEANING_IN_PROGRESS
        OrderStatus.CLEANING_IN_PROGRESS: {
            OrderStatus.QUALITY_CHECK,
            OrderStatus.FAILED,
        },
        # De QUALITY_CHECK
        OrderStatus.QUALITY_CHECK: {
            OrderStatus.READY_FOR_DELIVERY,
            OrderStatus.FAILED,
        },
        # De READY_FOR_DELIVERY
        OrderStatus.READY_FOR_DELIVERY: {
            OrderStatus.DELIVERY_DRIVER_ASSIGNED,
        },
        # De DELIVERY_DRIVER_ASSIGNED
        OrderStatus.DELIVERY_DRIVER_ASSIGNED: {
            OrderStatus.DELIVERY_IN_PROGRESS,
        },
        # De DELIVERY_IN_PROGRESS
        OrderStatus.DELIVERY_IN_PROGRESS: {
            OrderStatus.DELIVERED,
            OrderStatus.FAILED,
        },
        # De DELIVERED
        OrderStatus.DELIVERED: {
            OrderStatus.COMPLETED,
            OrderStatus.DISPUTED,
        },
        # Statuts terminaux
        OrderStatus.COMPLETED: set(),
        OrderStatus.CANCELLED: set(),
        OrderStatus.FAILED: set(),
        OrderStatus.DISPUTED: set(),
    }

    def is_valid_transition(self, old_status: OrderStatus, new_status: OrderStatus) -> bool:
        """Vérifier si une transition de statut est valide"""
        if old_status not in self.VALID_TRANSITIONS:
            return False
        return new_status in self.VALID_TRANSITIONS[old_status]

    @staticmethod
    def _to_decimal(value: Decimal | int | float | str) -> Decimal:
        return Decimal(str(value)).quantize(Decimal("0.01"))

    @staticmethod
    def _coerce_order_status(value: OrderStatus | str) -> OrderStatus:
        return value if isinstance(value, OrderStatus) else OrderStatus(value)

    @staticmethod
    def _coerce_payment_status(value: PaymentStatus | str) -> PaymentStatus:
        return value if isinstance(value, PaymentStatus) else PaymentStatus(value)

    # === Services métier ===

    def create_order(
        self,
        customer_id: UUID,
        order_data: OrderCreate,
        current_user_id: UUID,
    ) -> Tuple[Order, bool]:
        """Créer une nouvelle commande"""
        if order_data.idempotency_key:
            existing_order = self.repository.get_by_customer_and_idempotency_key(
                customer_id=customer_id,
                idempotency_key=order_data.idempotency_key,
            )
            if existing_order:
                return existing_order, False

        try:
            # Générer le numéro de commande
            order_number = self.repository.generate_order_number()

            pricing_service = PricingService(self.db)
            calculation_input = PriceCalculationInput(
                partner_id=order_data.partner_id,
                items=order_data.items,
                express=order_data.express,
                pickup_requested=order_data.pickup_requested,
                delivery_requested=order_data.delivery_requested,
                promo_code=order_data.promo_code,
                loyalty_points_to_redeem=order_data.loyalty_points_to_redeem,
                customer_id=customer_id,
            )
            price_result = pricing_service.calculate_order_price(calculation_input)

            loyalty_points_redeemed = int(
                (price_result.calculation_breakdown or {}).get("loyalty_points_redeemed", 0)
            )
            referral_discount_applied = Decimal(
                str((price_result.calculation_breakdown or {}).get("referral_discount", 0))
            )
            customer = None
            if loyalty_points_redeemed > 0:
                customer = self.db.query(User).filter(User.id == customer_id).first()
                if not customer:
                    raise ValueError("Client introuvable pour la deduction des points fidelite")
                available_points = int(getattr(customer, "loyalty_points", 0) or 0)
                if loyalty_points_redeemed > available_points:
                    raise ValueError("Solde de points fidelite insuffisant")
                customer.loyalty_points = available_points - loyalty_points_redeemed
                self.db.add(customer)
            if referral_discount_applied > 0:
                if customer is None:
                    customer = self.db.query(User).filter(User.id == customer_id).first()
                if not customer:
                    raise ValueError("Client introuvable pour la remise parrainage")
                customer.referral_discount_used_at = datetime.now(timezone.utc)
                self.db.add(customer)

            order = Order(
                id=uuid4(),
                order_number=order_number,
                customer_id=customer_id,
                partner_id=order_data.partner_id,
                pickup_address_id=order_data.pickup_address_id,
                delivery_address_id=order_data.delivery_address_id,
                idempotency_key=order_data.idempotency_key,
                status=OrderStatus.DRAFT,
                payment_status=PaymentStatus.PENDING,
                currency=price_result.currency,
                subtotal_amount=self._to_decimal(price_result.subtotal_amount),
                discount_amount=self._to_decimal(price_result.discount_amount),
                pickup_fee=self._to_decimal(price_result.pickup_fee),
                delivery_fee=self._to_decimal(price_result.delivery_fee),
                total_amount=self._to_decimal(price_result.total_amount),
                amount_paid=Decimal("0.00"),
                refunded_amount=Decimal("0.00"),
                special_instructions=order_data.special_instructions,
                pickup_date=order_data.pickup_date,
                pickup_time_slot=order_data.pickup_time_slot,
                delivery_date=order_data.delivery_date,
                delivery_time_slot=order_data.delivery_time_slot,
                express=order_data.express,
                pickup_requested=order_data.pickup_requested,
                delivery_requested=order_data.delivery_requested,
                calculation_breakdown=price_result.calculation_breakdown,
            )

            self.repository.create(order)

            if loyalty_points_redeemed > 0:
                LoyaltyService(self.db).record_entry(
                    user_id=customer_id,
                    order_id=order.id,
                    entry_type="redeem",
                    points_delta=-loyalty_points_redeemed,
                    balance_after=int(getattr(customer, "loyalty_points", 0) or 0),
                    description=f"Redeemed {loyalty_points_redeemed} loyalty points on order {order_number}",
                )

            for item_data in order_data.items:
                line_total = self._to_decimal(item_data.quantity * item_data.unit_price)
                item = OrderItem(
                    id=uuid4(),
                    order_id=order.id,
                    service_id=item_data.service_id,
                    item_name=item_data.item_name,
                    quantity=self._to_decimal(item_data.quantity),
                    unit_price=self._to_decimal(item_data.unit_price),
                    line_total=line_total,
                    notes=item_data.notes,
                    detected_by_ai=item_data.detected_by_ai,
                )
                self.repository.create_item(item)

            history = OrderStatusHistory(
                id=uuid4(),
                order_id=order.id,
                old_status=None,
                new_status=OrderStatus.DRAFT.value,
                changed_by_user_id=current_user_id,
                change_reason="Création de la commande",
            )
            self.repository.create_status_history(history)

            event = OrderEvent(
                id=uuid4(),
                order_id=order.id,
                event_type="ORDER_CREATED",
                event_data=json.dumps(
                    {
                        "order_number": order_number,
                        "customer_id": str(customer_id),
                        "total_amount": str(self._to_decimal(price_result.total_amount)),
                        "idempotency_key": order_data.idempotency_key,
                    }
                ),
                notes="Commande créée avec succès",
            )
            self.repository.create_event(event)

            if order_data.promo_code:
                promo = (
                    self.db.query(PromoCode)
                    .filter(PromoCode.code == order_data.promo_code.upper())
                    .first()
                )
                if promo:
                    promo.usage_count = int(promo.usage_count or 0) + 1
                    self.db.add(promo)

            self.db.commit()
            refreshed_order = self.repository.get_by_id(order.id)
            return refreshed_order or order, True
        except IntegrityError:
            self.db.rollback()
            if order_data.idempotency_key:
                existing_order = self.repository.get_by_customer_and_idempotency_key(
                    customer_id=customer_id,
                    idempotency_key=order_data.idempotency_key,
                )
                if existing_order:
                    return existing_order, False
            raise
        except Exception:
            self.db.rollback()
            raise

    def get_order(self, order_id: UUID, user_id: UUID, is_admin: bool = False) -> Optional[Order]:
        """Récupérer une commande avec vérification d'accès"""
        order = self.repository.get_by_id(order_id)
        if not order:
            return None

        # Vérifier les permissions
        if is_admin:
            return order
        if order.customer_id == user_id:
            return order

        # Le partenaire peut voir ses commandes
        # TODO: Vérifier si l'utilisateur est le partenaire
        return None

    def list_orders_for_customer(
        self,
        customer_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        partner_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister les commandes d'un client"""
        return self.repository.list_for_customer(
            customer_id=customer_id,
            page=page,
            page_size=page_size,
            status=status,
            partner_id=partner_id,
        )

    def list_orders_for_partner(
        self,
        partner_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister les commandes d'un partenaire."""
        return self.repository.list_for_partner(
            partner_id=partner_id,
            page=page,
            page_size=page_size,
            status=status,
            customer_id=customer_id,
        )

    def list_all_orders(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        partner_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister toutes les commandes pour l'admin."""
        return self.repository.list_all(
            page=page,
            page_size=page_size,
            status=status,
            customer_id=customer_id,
            partner_id=partner_id,
        )

    def estimate_order_price(
        self,
        estimate_data: OrderEstimateRequest,
        customer_id: Optional[UUID] = None,
    ) -> OrderEstimateResponse:
        """Estimer le prix d'une commande"""
        # Utiliser le PricingService pour l'estimation
        pricing_service = PricingService(self.db)
        
        # Créer l'input pour le calcul de prix
        calculation_input = PriceCalculationInput(
            partner_id=estimate_data.partner_id,
            items=estimate_data.items,
            express=estimate_data.express,
            pickup_requested=estimate_data.pickup_requested,
            delivery_requested=estimate_data.delivery_requested,
            promo_code=estimate_data.promo_code,
            loyalty_points_to_redeem=estimate_data.loyalty_points_to_redeem,
            customer_id=customer_id,
        )
        
        # Obtenir le calcul de prix
        price_result = pricing_service.calculate_order_price(calculation_input)

        return OrderEstimateResponse(
            subtotal_amount=price_result.subtotal_amount,
            discount_amount=price_result.discount_amount,
            pickup_fee=price_result.pickup_fee,
            delivery_fee=price_result.delivery_fee,
            total_amount=price_result.total_amount,
            currency=price_result.currency,
            calculation_breakdown=price_result.calculation_breakdown,
        )

    # === Proof Requirements ===
    PROOF_REQUIRED_TRANSITIONS = {
        OrderStatus.PICKED_UP: {
            "proof_types": [ProofType.PHOTO, ProofType.GEOLOCATION],
            "min_proofs": 1,
            "actor_types": [ActorType.DRIVER],
        },
        OrderStatus.DELIVERED: {
            "proof_types": [ProofType.PHOTO, ProofType.SIGNATURE],
            "min_proofs": 1,
            "actor_types": [ActorType.DRIVER, ActorType.CUSTOMER],
        },
    }

    def _validate_proof_for_transition(
        self,
        order_id: UUID,
        new_status: OrderStatus,
        status_data: OrderStatusUpdateRequest,
        actor_type: ActorType,
    ) -> Optional[OperationalProof]:
        """Valider qu'une preuve est fournie pour les transitions critiques"""
        requirements = self.PROOF_REQUIRED_TRANSITIONS.get(new_status)
        if not requirements:
            return None

        has_proof = bool(status_data.proof_photo_url) or bool(status_data.proof_note)
        if not has_proof:
            raise ValueError(
                f"Preuve obligatoire manquante pour la transition vers {new_status.value}. "
                f"Fournissez une photo ou une note."
            )

        # Créer la preuve opérationnelle
        proof = OperationalProof(
            order_id=order_id,
            proof_type=ProofType.PHOTO if status_data.proof_photo_url else ProofType.MANUAL,
            proof_data={
                "photo_url": status_data.proof_photo_url,
                "note": status_data.proof_note,
            },
            actor_type=actor_type.value,
            actor_id=changed_by_user_id,  # sera défini par l'appelant
            actor_name="system",  # sera défini par l'appelant
            recorded_at=datetime.now(timezone.utc),
            verification_status=VerificationStatus.VERIFIED.value,
            verification_method="auto",
            location_lat=status_data.location_lat,
            location_lng=status_data.location_lng,
        )
        return proof

    def transition_order_status(
        self,
        order_id: UUID,
        status_data: OrderStatusUpdateRequest,
        changed_by_user_id: UUID,
        actor_type: ActorType = ActorType.SYSTEM,
        actor_name: str = "system",
    ) -> Optional[Order]:
        """Changer le statut d'une commande — avec verrouillage, preuve et timeline"""
        with self.db.begin_nested():
            # 1. VERROU : SELECT FOR UPDATE NOWAIT
            try:
                order = (
                    self.db.query(Order)
                    .filter(Order.id == order_id)
                    .with_for_update(of=Order, nowait=True)
                    .one_or_none()
                )
            except Exception:
                raise ValueError(f"Commande {order_id} non trouvée ou déjà verrouillée")

            if not order:
                return None

            old_status = self._coerce_order_status(order.status)
            new_status = status_data.new_status

            # 2. VALIDATION : transition autorisée ?
            if not self.is_valid_transition(old_status, new_status):
                raise ValueError(f"Transition invalide de {old_status} à {new_status}")

            # 3. VALIDATION : preuve requise ?
            proof = None
            if new_status in self.PROOF_REQUIRED_TRANSITIONS:
                if not status_data.proof_photo_url and not status_data.proof_note:
                    raise ValueError(
                        f"Preuve obligatoire manquante pour la transition vers {new_status.value}. "
                        f"Fournissez proof_photo_url ou proof_note."
                    )
                proof = OperationalProof(
                    order_id=order_id,
                    proof_type=ProofType.PHOTO if status_data.proof_photo_url else ProofType.MANUAL,
                    proof_data={
                        "photo_url": status_data.proof_photo_url,
                        "note": status_data.proof_note,
                    },
                    actor_type=actor_type.value,
                    actor_id=changed_by_user_id,
                    actor_name=actor_name,
                    recorded_at=datetime.now(timezone.utc),
                    verification_status=VerificationStatus.VERIFIED.value,
                    verification_method="auto",
                    location_lat=status_data.location_lat,
                    location_lng=status_data.location_lng,
                )
                self.db.add(proof)

            # 4. MISE À JOUR STATUT
            order.status = new_status
            order.version += 1  # Optimistic locking

            now = datetime.now(timezone.utc)
            if new_status == OrderStatus.CONFIRMED:
                order.confirmed_at = now
            elif new_status == OrderStatus.COMPLETED:
                order.completed_at = now
            elif new_status == OrderStatus.CANCELLED:
                order.cancelled_at = now

            # 5. HISTORIQUE (legacy)
            history = OrderStatusHistory(
                id=uuid4(),
                order_id=order.id,
                old_status=old_status.value,
                new_status=new_status.value,
                changed_by_user_id=changed_by_user_id,
                change_reason=status_data.change_reason,
            )
            self.db.add(history)

            # 6. ÉVÉNEMENT (legacy)
            event = OrderEvent(
                id=uuid4(),
                order_id=order.id,
                event_type="STATUS_CHANGED",
                event_data=json.dumps(
                    {"old_status": old_status.value, "new_status": new_status.value}
                ),
                notes=f"Statut changé de {old_status.value} à {new_status.value}",
            )
            self.db.add(event)

            # 7. TIMELINE OPÉRATIONNELLE
            timeline = OperationalTimeline(
                order_id=order_id,
                event_type=TimelineEventType.STATUS_CHANGE.value,
                event_subtype=f"{old_status.value}_to_{new_status.value}",
                from_status=old_status.value,
                to_status=new_status.value,
                payload={
                    "actor_id": str(changed_by_user_id),
                    "actor_type": actor_type.value,
                    "actor_name": actor_name,
                    "change_reason": status_data.change_reason,
                    "proof_id": str(proof.id) if proof else None,
                    "version": order.version,
                },
                occurred_at=now,
                source="api",
            )
            self.db.add(timeline)

            self.db.flush()
            return order

    def cancel_order(
        self,
        order_id: UUID,
        cancel_data: OrderCancelRequest,
        user_id: UUID,
    ) -> Optional[Order]:
        """Annuler une commande"""
        # Vérifier si la commande peut être annulée
        if not self.repository.can_cancel(order_id):
            raise ValueError("Cette commande ne peut pas être annulée")

        # Changer le statut
        status_update = OrderStatusUpdateRequest(
            new_status=OrderStatus.CANCELLED,
            change_reason=cancel_data.reason or "Annulée par le client",
        )

        return self.transition_order_status(
            order_id=order_id,
            status_data=status_update,
            changed_by_user_id=user_id,
        )

    def update_payment_status(
        self,
        order_id: UUID,
        payment_status: PaymentStatus,
        notes: Optional[str] = None,
    ) -> Optional[Order]:
        """Mettre à jour le statut de paiement"""
        order = self.repository.get_by_id(order_id)
        if not order:
            return None

        old_status = self._coerce_payment_status(order.payment_status)
        order.payment_status = payment_status
        self.repository.update(order)

        # Créer un événement
        event = OrderEvent(
            id=uuid4(),
            order_id=order.id,
            event_type="PAYMENT_STATUS_CHANGED",
            event_data=json.dumps(
                {
                    "old_status": old_status.value,
                    "new_status": payment_status.value,
                }
            ),
            notes=notes or f"Statut de paiement changé à {payment_status.value}",
        )
        self.repository.create_event(event)

        return order

    # === Utilitaires ===

    def get_order_statistics(self, customer_id: Optional[UUID] = None) -> dict:
        """Obtenir des statistiques sur les commandes"""
        stats = self.repository.count_by_status(customer_id=customer_id)

        # Ajouter le revenu total
        revenue = self.repository.get_total_revenue(customer_id=customer_id)

        return {
            "status_counts": stats,
            "total_revenue": revenue,
            "total_orders": sum(stats.values()),
        }

    def validate_order_items(self, items: List[OrderItemCreate]) -> List[str]:
        """Valider les articles d'une commande (validation basique)"""
        errors = []

        for i, item in enumerate(items):
            if item.quantity <= 0:
                errors.append(f"Article {i+1}: La quantité doit être positive")
            if item.unit_price < 0:
                errors.append(f"Article {i+1}: Le prix unitaire ne peut pas être négatif")
            if not item.item_name or len(item.item_name.strip()) == 0:
                errors.append(f"Article {i+1}: Le nom de l'article est requis")

        return errors

    def validate_order_items_with_pricing(
        self, partner_id: UUID, items: List[OrderItemCreate]
    ) -> List[str]:
        """Valider les articles d'une commande avec vérification des services"""
        pricing_service = PricingService(self.db)
        return pricing_service.validate_order_items(partner_id, items)
