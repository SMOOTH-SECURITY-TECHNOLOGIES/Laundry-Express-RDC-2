from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from app.models.logistics import (
    Driver,
    DriverLocation,
    DeliveryTask,
    DriverStatus,
    TaskType,
    DeliveryTaskStatus,
    LocationType,
)
from app.models.customer import CustomerAddress
from app.models.marketplace import CompanyDriver
from app.models.order import Order


class LogisticsRepository:
    """Repository pour les opérations logistiques (chauffeurs et tâches)"""

    def __init__(self, db: Session):
        self.db = db

    # ===== Driver Operations =====

    def create_driver(self, driver: Driver) -> Driver:
        """Créer un nouveau chauffeur"""
        self.db.add(driver)
        self.db.commit()
        self.db.refresh(driver)
        return driver

    def get_driver_by_id(self, driver_id: UUID) -> Optional[Driver]:
        """Obtenir un chauffeur par son ID"""
        return self.db.query(Driver).filter(Driver.id == driver_id).first()

    def get_driver_by_user_id(self, user_id: UUID) -> Optional[Driver]:
        """Obtenir un chauffeur par son ID utilisateur"""
        return self.db.query(Driver).filter(Driver.user_id == user_id).first()

    def list_drivers(
        self,
        status: Optional[DriverStatus] = None,
        is_available: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Driver], int]:
        """Lister les chauffeurs avec filtres"""
        query = self.db.query(Driver)

        if status:
            query = query.filter(Driver.status == status)
        if is_available is not None:
            query = query.filter(Driver.is_available == is_available)

        total = query.count()
        drivers = query.order_by(desc(Driver.created_at)).offset(skip).limit(limit).all()

        return drivers, total

    def list_available_drivers(self) -> List[Driver]:
        """Lister les chauffeurs actifs et disponibles"""
        return self.db.query(Driver).filter(
            Driver.status == DriverStatus.ACTIVE,
            Driver.is_available == True
        ).order_by(desc(Driver.rating_avg)).all()

    def update_driver(self, driver: Driver) -> Driver:
        """Mettre à jour un chauffeur"""
        driver.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(driver)
        return driver

    # ===== Driver Location Operations =====

    def create_driver_location(self, location: DriverLocation) -> DriverLocation:
        """Créer une localisation de chauffeur"""
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def get_driver_latest_location(self, driver_id: UUID) -> Optional[DriverLocation]:
        """Obtenir la dernière localisation d'un chauffeur"""
        return self.db.query(DriverLocation).filter(
            DriverLocation.driver_id == driver_id
        ).order_by(desc(DriverLocation.recorded_at)).first()

    def list_driver_locations(
        self,
        driver_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DriverLocation], int]:
        """Lister les localisations d'un chauffeur"""
        query = self.db.query(DriverLocation).filter(
            DriverLocation.driver_id == driver_id
        )

        total = query.count()
        locations = query.order_by(desc(DriverLocation.recorded_at)).offset(skip).limit(limit).all()

        return locations, total

    # ===== Delivery Task Operations =====

    def create_delivery_task(self, task: DeliveryTask) -> DeliveryTask:
        """Créer une nouvelle tâche de livraison"""
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def create_delivery_task_no_commit(self, task: DeliveryTask) -> DeliveryTask:
        """Créer une tâche sans commit (transaction parente)."""
        self.db.add(task)
        self.db.flush()
        return task

    def get_delivery_task_by_id(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Obtenir une tâche par son ID"""
        return self.db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()

    def get_delivery_task_by_order_id(self, order_id: UUID) -> Optional[DeliveryTask]:
        """Obtenir une tâche par l'ID de commande"""
        return self.db.query(DeliveryTask).filter(DeliveryTask.order_id == order_id).first()

    def get_delivery_task_by_order_and_type(
        self,
        order_id: UUID,
        task_type: TaskType,
    ) -> Optional[DeliveryTask]:
        """Obtenir une tâche par commande et type."""
        return (
            self.db.query(DeliveryTask)
            .filter(
                DeliveryTask.order_id == order_id,
                DeliveryTask.task_type == task_type,
            )
            .first()
        )

    def list_delivery_tasks(
        self,
        driver_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        status: Optional[DeliveryTaskStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryTask], int]:
        """Lister les tâches avec filtres"""
        query = self.db.query(DeliveryTask)

        if driver_id:
            query = query.filter(DeliveryTask.driver_id == driver_id)
        if order_id:
            query = query.filter(DeliveryTask.order_id == order_id)
        if task_type:
            query = query.filter(DeliveryTask.task_type == task_type)
        if status:
            query = query.filter(DeliveryTask.status == status)

        total = query.count()
        tasks = query.order_by(desc(DeliveryTask.created_at)).offset(skip).limit(limit).all()

        return tasks, total

    def list_delivery_tasks_for_operator(
        self,
        *,
        company_id: Optional[UUID] = None,
        service_communes: Optional[List[str]] = None,
        driver_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        status: Optional[DeliveryTaskStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DeliveryTask], int]:
        """Lister les tâches visibles pour un opérateur logistique."""
        query = (
            self.db.query(DeliveryTask)
            .outerjoin(Order, DeliveryTask.order_id == Order.id)
            .outerjoin(CustomerAddress, Order.pickup_address_id == CustomerAddress.id)
        )

        if driver_id:
            query = query.filter(DeliveryTask.driver_id == driver_id)
        if order_id:
            query = query.filter(DeliveryTask.order_id == order_id)
        if task_type:
            query = query.filter(DeliveryTask.task_type == task_type)
        if status:
            query = query.filter(DeliveryTask.status == status)

        if company_id is not None:
            company_driver_ids = [
                row[0]
                for row in self.db.query(CompanyDriver.driver_id)
                .filter(CompanyDriver.company_id == company_id, CompanyDriver.is_active == True)
                .all()
            ]
            communes = service_communes or []
            open_market_filter = and_(
                DeliveryTask.status == DeliveryTaskStatus.OPEN_MARKET,
                DeliveryTask.market_visible == True,
            )
            if communes:
                open_market_filter = and_(
                    open_market_filter,
                    or_(
                        CustomerAddress.commune.in_(communes),
                        CustomerAddress.commune.is_(None),
                    ),
                )

            visibility_filters = [
                DeliveryTask.claimed_by_company_id == company_id,
                open_market_filter,
            ]
            if company_driver_ids:
                visibility_filters.append(DeliveryTask.driver_id.in_(company_driver_ids))

            query = query.filter(or_(*visibility_filters))
        else:
            query = query.filter(
                or_(
                    DeliveryTask.claimed_by_company_id.is_(None),
                    DeliveryTask.status != DeliveryTaskStatus.OPEN_MARKET,
                    DeliveryTask.market_visible == True,
                )
            )

        total = query.count()
        tasks = query.order_by(desc(DeliveryTask.created_at)).offset(skip).limit(limit).all()
        return tasks, total

    def list_pending_tasks(self) -> List[DeliveryTask]:
        """Lister les tâches en attente d'assignation"""
        return self.db.query(DeliveryTask).filter(
            DeliveryTask.status == DeliveryTaskStatus.PENDING
        ).order_by(DeliveryTask.created_at).all()

    def list_driver_tasks(
        self,
        driver_id: UUID,
        status: Optional[DeliveryTaskStatus] = None
    ) -> List[DeliveryTask]:
        """Lister les tâches d'un chauffeur"""
        query = self.db.query(DeliveryTask).filter(DeliveryTask.driver_id == driver_id)

        if status:
            query = query.filter(DeliveryTask.status == status)

        return query.order_by(desc(DeliveryTask.created_at)).all()

    def update_delivery_task(self, task: DeliveryTask) -> DeliveryTask:
        """Mettre à jour une tâche"""
        task.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(task)
        return task

    def assign_driver_to_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Assigner un chauffeur à une tâche"""
        task = self.get_delivery_task_by_id(task_id)
        if not task:
            return None

        task.driver_id = driver_id
        task.status = DeliveryTaskStatus.DRIVER_ASSIGNED
        task.assigned_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task

    def accept_task(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Accepter une tâche assignée"""
        task = self.get_delivery_task_by_id(task_id)
        if not task or task.status != DeliveryTaskStatus.DRIVER_ASSIGNED:
            return None

        task.status = DeliveryTaskStatus.ACCEPTED
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task

    def start_task(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Démarrer une tâche acceptée"""
        task = self.get_delivery_task_by_id(task_id)
        if not task or task.status != DeliveryTaskStatus.ACCEPTED:
            return None

        task.status = DeliveryTaskStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task

    def complete_task(
        self,
        task_id: UUID,
        proof_note: Optional[str] = None,
        proof_photo_url: Optional[str] = None
    ) -> Optional[DeliveryTask]:
        """Compléter une tâche en cours"""
        task = self.get_delivery_task_by_id(task_id)
        if not task or task.status != DeliveryTaskStatus.IN_PROGRESS:
            return None

        task.status = DeliveryTaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        task.proof_note = proof_note
        task.proof_photo_url = proof_photo_url
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task

    def fail_task(self, task_id: UUID, reason: str) -> Optional[DeliveryTask]:
        """Marquer une tâche comme échouée"""
        task = self.get_delivery_task_by_id(task_id)
        if not task or task.status not in [
            DeliveryTaskStatus.DRIVER_ASSIGNED,
            DeliveryTaskStatus.ACCEPTED,
            DeliveryTaskStatus.IN_PROGRESS
        ]:
            return None

        task.status = DeliveryTaskStatus.FAILED
        task.proof_note = reason
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task

    def cancel_task(self, task_id: UUID, reason: Optional[str] = None) -> Optional[DeliveryTask]:
        """Annuler une tâche"""
        task = self.get_delivery_task_by_id(task_id)
        if not task or task.status not in [
            DeliveryTaskStatus.PENDING,
            DeliveryTaskStatus.DRIVER_ASSIGNED,
            DeliveryTaskStatus.ACCEPTED
        ]:
            return None

        task.status = DeliveryTaskStatus.CANCELLED
        task.proof_note = reason
        task.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)
        return task
