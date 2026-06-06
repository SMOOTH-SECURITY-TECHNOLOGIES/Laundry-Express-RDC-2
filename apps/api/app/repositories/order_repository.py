from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.order import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderEvent,
    OrderAttachment,
    OrderStatus,
    PaymentStatus,
)


class OrderRepository:
    """Repository pour les opérations CRUD sur les commandes"""

    def __init__(self, db: Session):
        self.db = db

    # === CRUD de base ===

    def create(self, order: Order) -> Order:
        """Créer une nouvelle commande"""
        self.db.add(order)
        self.db.flush()
        return order

    def get_by_id(self, order_id: UUID) -> Optional[Order]:
        """Récupérer une commande par son ID avec ses relations"""
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.delivery_address),
                joinedload(Order.items),
                joinedload(Order.status_history),
                joinedload(Order.events),
                joinedload(Order.attachments),
            )
            .filter(Order.id == order_id)
            .first()
        )

    def get_order_by_id(self, order_id: UUID) -> Optional[Order]:
        """Alias legacy conservé pour les services non encore migrés."""
        return self.get_by_id(order_id)

    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """Récupérer une commande par son numéro"""
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.items),
                joinedload(Order.status_history),
            )
            .filter(Order.order_number == order_number)
            .first()
        )

    def get_by_customer_and_idempotency_key(
        self,
        customer_id: UUID,
        idempotency_key: str,
    ) -> Optional[Order]:
        """Récupérer une commande par clé d'idempotence pour un client."""
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.delivery_address),
                joinedload(Order.items),
                joinedload(Order.status_history),
                joinedload(Order.events),
                joinedload(Order.attachments),
            )
            .filter(
                Order.customer_id == customer_id,
                Order.idempotency_key == idempotency_key,
            )
            .first()
        )

    def update(self, order: Order) -> Order:
        """Mettre à jour une commande"""
        self.db.add(order)
        self.db.flush()
        return order

    def update_order(self, order: Order) -> Order:
        """Alias legacy conservé pour les services non encore migrés."""
        return self.update(order)

    def delete(self, order_id: UUID) -> bool:
        """Supprimer une commande (soft delete via BaseModel)"""
        order = self.get_by_id(order_id)
        if order:
            self.db.delete(order)
            self.db.flush()
            return True
        return False

    # === Recherche et filtrage ===

    def list_for_customer(
        self,
        customer_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        partner_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister les commandes d'un client avec pagination"""
        query = self.db.query(Order).filter(Order.customer_id == customer_id)

        if status:
            query = query.filter(Order.status == status)
        if partner_id:
            query = query.filter(Order.partner_id == partner_id)

        # Compter le total
        total = query.count()

        # Paginer
        orders = (
            query.options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.items),
            )
            .order_by(desc(Order.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return orders, total

    def list_for_partner(
        self,
        partner_id: UUID,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister les commandes d'un partenaire avec pagination"""
        query = self.db.query(Order).filter(Order.partner_id == partner_id)

        if status:
            query = query.filter(Order.status == status)
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)

        # Compter le total
        total = query.count()

        # Paginer
        orders = (
            query.options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.items),
            )
            .order_by(desc(Order.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return orders, total

    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        partner_id: Optional[UUID] = None,
    ) -> Tuple[List[Order], int]:
        """Lister toutes les commandes (pour admin)"""
        query = self.db.query(Order)

        if status:
            query = query.filter(Order.status == status)
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        if partner_id:
            query = query.filter(Order.partner_id == partner_id)

        # Compter le total
        total = query.count()

        # Paginer
        orders = (
            query.options(
                joinedload(Order.customer),
                joinedload(Order.partner),
                joinedload(Order.pickup_address),
                joinedload(Order.items),
            )
            .order_by(desc(Order.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return orders, total

    # === Opérations sur les items ===

    def create_item(self, item: OrderItem) -> OrderItem:
        """Créer un article de commande"""
        self.db.add(item)
        self.db.flush()
        return item

    def get_items_by_order_id(self, order_id: UUID) -> List[OrderItem]:
        """Récupérer tous les articles d'une commande"""
        return (
            self.db.query(OrderItem)
            .filter(OrderItem.order_id == order_id)
            .order_by(OrderItem.created_at)
            .all()
        )

    # === Historique des statuts ===

    def create_status_history(self, history: OrderStatusHistory) -> OrderStatusHistory:
        """Créer une entrée d'historique de statut"""
        self.db.add(history)
        self.db.flush()
        return history

    def get_status_history_by_order_id(self, order_id: UUID) -> List[OrderStatusHistory]:
        """Récupérer l'historique des statuts d'une commande"""
        return (
            self.db.query(OrderStatusHistory)
            .filter(OrderStatusHistory.order_id == order_id)
            .order_by(desc(OrderStatusHistory.created_at))
            .all()
        )

    # === Événements ===

    def create_event(self, event: OrderEvent) -> OrderEvent:
        """Créer un événement de commande"""
        self.db.add(event)
        self.db.flush()
        return event

    def get_events_by_order_id(self, order_id: UUID) -> List[OrderEvent]:
        """Récupérer tous les événements d'une commande"""
        return (
            self.db.query(OrderEvent)
            .filter(OrderEvent.order_id == order_id)
            .order_by(desc(OrderEvent.created_at))
            .all()
        )

    # === Pièces jointes ===

    def create_attachment(self, attachment: OrderAttachment) -> OrderAttachment:
        """Créer une pièce jointe"""
        self.db.add(attachment)
        self.db.flush()
        return attachment

    def get_attachments_by_order_id(self, order_id: UUID) -> List[OrderAttachment]:
        """Récupérer toutes les pièces jointes d'une commande"""
        return (
            self.db.query(OrderAttachment)
            .filter(OrderAttachment.order_id == order_id)
            .order_by(desc(OrderAttachment.created_at))
            .all()
        )

    # === Statistiques et agrégations ===

    def count_by_status(self, customer_id: Optional[UUID] = None, partner_id: Optional[UUID] = None) -> dict:
        """Compter les commandes par statut"""
        query = self.db.query(Order.status, func.count(Order.id))

        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        if partner_id:
            query = query.filter(Order.partner_id == partner_id)

        results = query.group_by(Order.status).all()
        return {status: count for status, count in results}

    def get_total_revenue(
        self,
        customer_id: Optional[UUID] = None,
        partner_id: Optional[UUID] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> float:
        """Calculer le revenu total"""
        query = self.db.query(func.sum(Order.total_amount))

        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        if partner_id:
            query = query.filter(Order.partner_id == partner_id)
        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        result = query.scalar()
        return result or 0.0

    # === Utilitaires ===

    def generate_order_number(self) -> str:
        """Générer un numéro de commande unique"""
        # Format: ORD-YYYYMMDD-XXXXX
        from datetime import datetime
        import random
        import string

        date_part = datetime.now().strftime("%Y%m%d")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        return f"ORD-{date_part}-{random_part}"

    def list_recent_public_social_proof(self, limit: int = 10) -> List[Order]:
        """Lister des commandes récentes utilisables pour un social proof public."""
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.pickup_address),
            )
            .filter(
                Order.status.notin_(
                    [
                        OrderStatus.CANCELLED,
                        OrderStatus.FAILED,
                    ]
                ),
                Order.customer_id.isnot(None),
            )
            .order_by(desc(Order.created_at))
            .limit(limit)
            .all()
        )

    def order_exists(self, order_id: UUID) -> bool:
        """Vérifier si une commande existe"""
        return self.db.query(Order.id).filter(Order.id == order_id).first() is not None

    def can_cancel(self, order_id: UUID) -> bool:
        """Vérifier si une commande peut être annulée"""
        order = self.get_by_id(order_id)
        if not order:
            return False

        # Les commandes peuvent être annulées seulement dans certains statuts
        cancellable_statuses = {
            OrderStatus.DRAFT.value,
            OrderStatus.PENDING_CONFIRMATION.value,
            OrderStatus.CONFIRMED.value,
            OrderStatus.PICKUP_SCHEDULED.value,
        }

        current_status = order.status.value if hasattr(order.status, "value") else order.status
        return current_status in cancellable_statuses
