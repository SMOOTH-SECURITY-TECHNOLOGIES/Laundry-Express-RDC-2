"""Orchestration marketplace logistique multi-compagnies."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.logistics import (
    DeliveryTask,
    DeliveryTaskStatus,
    LocationType,
    TaskType,
)
from app.models.marketplace import DispatchStrategy
from app.models.order import Order, OrderStatus, PaymentStatus
from app.repositories.logistics_repository import LogisticsRepository
from app.repositories.marketplace_repository import MarketplaceRepository
from app.repositories.order_repository import OrderRepository
from app.services.hybrid_dispatch_service import HybridDispatchService
from app.services.notification_service import NotificationService


PAID_OR_COLLECTABLE_STATUSES = {
    PaymentStatus.PAID,
    PaymentStatus.AUTHORIZED,
    PaymentStatus.PARTIALLY_PAID,
    PaymentStatus.CASH_PENDING,
}


class LogisticsMarketplaceService:
    def __init__(self, db: Session):
        self.db = db
        self.logistics_repo = LogisticsRepository(db)
        self.marketplace_repo = MarketplaceRepository(db)
        self.order_repo = OrderRepository(db)
        self.hybrid_dispatch = HybridDispatchService(db)
        self.notifications = NotificationService(db)

    @staticmethod
    def is_order_eligible_for_logistics(order: Order) -> bool:
        payment = order.payment_status
        if isinstance(payment, str):
            try:
                payment = PaymentStatus(payment)
            except ValueError:
                return False
        return payment in PAID_OR_COLLECTABLE_STATUSES

    @staticmethod
    def order_city(order: Order) -> str:
        pickup_address = getattr(order, "pickup_address", None)
        if pickup_address and getattr(pickup_address, "city", None):
            return pickup_address.city
        return "Kinshasa"

    @staticmethod
    def order_pickup_commune(order: Order) -> Optional[str]:
        if getattr(order, "pickup_commune", None):
            return order.pickup_commune
        pickup_address = getattr(order, "pickup_address", None)
        return getattr(pickup_address, "commune", None)

    def ensure_pickup_mission_for_order(self, order_id: UUID) -> Optional[DeliveryTask]:
        return self._ensure_mission_for_order(order_id, TaskType.PICKUP)

    def ensure_delivery_mission_for_order(self, order_id: UUID) -> Optional[DeliveryTask]:
        return self._ensure_mission_for_order(order_id, TaskType.DELIVERY)

    def _ensure_mission_for_order(self, order_id: UUID, task_type: TaskType) -> Optional[DeliveryTask]:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            return None

        if not self.is_order_eligible_for_logistics(order):
            return None

        existing = self.logistics_repo.get_delivery_task_by_order_and_type(order_id, task_type)
        if existing:
            if existing.status == DeliveryTaskStatus.PENDING:
                return self._open_task_to_marketplace(existing, order)
            return existing

        task = DeliveryTask(
            order_id=order_id,
            task_type=task_type,
            pickup_location_type=LocationType.CUSTOMER if task_type == TaskType.PICKUP else LocationType.PARTNER,
            dropoff_location_type=LocationType.PARTNER if task_type == TaskType.PICKUP else LocationType.CUSTOMER,
            status=DeliveryTaskStatus.PENDING,
        )
        created = self.logistics_repo.create_delivery_task_no_commit(task)
        opened = self._open_task_to_marketplace(created, order)
        self._notify_companies_for_market_task(opened, order)
        return opened

    def _open_task_to_marketplace(self, task: DeliveryTask, order: Order) -> DeliveryTask:
        strategy, timeout = self.hybrid_dispatch.resolve_dispatch_strategy(
            order_id=order.id,
            task_type=task.task_type,
            partner_id=order.partner_id,
            city=self.order_city(order),
            zone=self.order_pickup_commune(order),
        )

        if strategy in {DispatchStrategy.MARKETPLACE_FIRST, DispatchStrategy.MARKETPLACE_ONLY}:
            task.dispatch_strategy = strategy
            return self.hybrid_dispatch._dispatch_marketplace_only(task, timeout or 30)

        if strategy == DispatchStrategy.INTERNAL_FIRST:
            try:
                task.dispatch_strategy = strategy
                return self.hybrid_dispatch._dispatch_internal_first(task, timeout or 30)
            except ValueError:
                pass

        task.dispatch_strategy = DispatchStrategy.MARKETPLACE_ONLY
        return self.hybrid_dispatch._dispatch_marketplace_only(task, timeout or 30)

    def _notify_companies_for_market_task(self, task: DeliveryTask, order: Order) -> None:
        commune = self.order_pickup_commune(order)
        city = self.order_city(order)
        companies = self.marketplace_repo.get_companies_for_commune(
            city=city,
            commune=commune,
            task_type=task.task_type,
        )
        if not companies:
            companies = self.marketplace_repo.get_companies_for_city(city, task.task_type)

        company_ids = [company.id for company in companies]
        manager_ids = self.notifications.logistics_manager_user_ids_for_companies(company_ids)
        if not manager_ids:
            manager_ids = self.notifications.logistics_manager_user_ids()

        order_number = getattr(order, "order_number", str(order.id))
        task_type = task.task_type.value if hasattr(task.task_type, "value") else str(task.task_type)
        metadata = {
            "orderId": str(order.id),
            "taskId": str(task.id),
            "taskType": task_type,
            "page": "logistics-dashboard",
            "section": "missions",
        }

        self.notifications.create_many(
            user_ids=manager_ids,
            title="Nouvelle mission disponible",
            message=f"Mission {task_type} ouverte au marche pour la commande {order_number}.",
            notification_type="logisticsMarketMission",
            metadata=metadata,
        )

    def handle_order_status_change(self, order: Order, new_status: OrderStatus) -> Optional[DeliveryTask]:
        if new_status == OrderStatus.CONFIRMED:
            return self.ensure_pickup_mission_for_order(order.id)
        if new_status == OrderStatus.READY_FOR_DELIVERY:
            return self.ensure_delivery_mission_for_order(order.id)
        return None

    def get_company_service_communes(self, company_id: UUID) -> List[str]:
        zones = self.marketplace_repo.list_company_service_zones(company_id)
        return [zone.commune for zone in zones if zone.commune and zone.is_active]

    def list_tasks_for_operator(
        self,
        *,
        company_id: Optional[UUID],
        service_communes: Optional[List[str]],
        driver_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        status: Optional[DeliveryTaskStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ):
        return self.logistics_repo.list_delivery_tasks_for_operator(
            company_id=company_id,
            service_communes=service_communes,
            driver_id=driver_id,
            order_id=order_id,
            task_type=task_type,
            status=status,
            skip=skip,
            limit=limit,
        )
