from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.logistics import (
    Driver,
    DriverLocation,
    DeliveryTask,
    DriverStatus,
    TaskType,
    DeliveryTaskStatus,
    LocationType
)
from app.models.order import Order, OrderStatus
from app.models.operational import (
    OperationalProof,
    OperationalTimeline,
    ProofType,
    ActorType,
    TimelineEventType,
    VerificationStatus,
)
from app.repositories.logistics_repository import LogisticsRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.logistics import (
    DriverCreate,
    DriverUpdate,
    DriverLocationCreate,
    DeliveryTaskCreate,
    TaskCompleteRequest,
    TaskFailRequest,
    TaskCancelRequest,
    AvailableDriverResponse
)


class DispatchService:
    """Service de dispatch pour la gestion des chauffeurs et des tâches"""

    def __init__(self, db: Session):
        self.db = db
        self.logistics_repo = LogisticsRepository(db)
        self.order_repo = OrderRepository(db)

    # ===== Driver Operations =====

    def create_driver(self, driver_data: DriverCreate) -> Driver:
        """Créer un nouveau chauffeur"""
        # Vérifier si l'utilisateur est déjà un chauffeur
        existing_driver = self.logistics_repo.get_driver_by_user_id(driver_data.user_id)
        if existing_driver:
            raise ValueError(f"L'utilisateur {driver_data.user_id} est déjà un chauffeur")

        driver = Driver(
            user_id=driver_data.user_id,
            vehicle_type=driver_data.vehicle_type,
            license_number=driver_data.license_number,
            status=driver_data.status,
            is_available=driver_data.is_available
        )

        return self.logistics_repo.create_driver(driver)

    def get_driver(self, driver_id: UUID) -> Optional[Driver]:
        """Obtenir un chauffeur par son ID"""
        return self.logistics_repo.get_driver_by_id(driver_id)

    def get_driver_by_user_id(self, user_id: UUID) -> Optional[Driver]:
        """Obtenir un chauffeur par son user_id"""
        return self.logistics_repo.get_driver_by_user_id(user_id)

    def update_driver(self, driver_id: UUID, driver_data: DriverUpdate) -> Optional[Driver]:
        """Mettre à jour un chauffeur"""
        driver = self.logistics_repo.get_driver_by_id(driver_id)
        if not driver:
            return None

        update_data = driver_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(driver, field, value)

        return self.logistics_repo.update_driver(driver)

    def list_drivers(
        self,
        status: Optional[DriverStatus] = None,
        is_available: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Driver], int]:
        """Lister les chauffeurs avec filtres"""
        return self.logistics_repo.list_drivers(status, is_available, skip, limit)

    def list_available_drivers_with_locations(self) -> List[AvailableDriverResponse]:
        """Lister les chauffeurs disponibles avec leurs dernières localisations"""
        available_drivers = self.logistics_repo.list_available_drivers()
        
        result = []
        for driver in available_drivers:
            last_location = self.logistics_repo.get_driver_latest_location(driver.id)
            result.append(AvailableDriverResponse(
                driver=driver,
                last_location=last_location
            ))
        
        return result

    # ===== Driver Location Operations =====

    def update_driver_location(
        self,
        driver_id: UUID,
        location_data: DriverLocationCreate
    ) -> Optional[DriverLocation]:
        """Mettre à jour la localisation d'un chauffeur"""
        driver = self.logistics_repo.get_driver_by_id(driver_id)
        if not driver:
            return None

        location = DriverLocation(
            driver_id=driver_id,
            latitude=location_data.latitude,
            longitude=location_data.longitude
        )

        return self.logistics_repo.create_driver_location(location)

    # ===== Delivery Task Operations =====

    def create_pickup_task(self, order_id: UUID) -> Optional[DeliveryTask]:
        """Créer une tâche de pickup pour une commande"""
        # Vérifier si la commande existe
        order = self.order_repo.get_order_by_id(order_id)
        if not order:
            raise ValueError(f"Commande {order_id} non trouvée")

        # Vérifier si une tâche existe déjà pour cette commande
        existing_task = self.logistics_repo.get_delivery_task_by_order_id(order_id)
        if existing_task:
            raise ValueError(f"Une tâche existe déjà pour la commande {order_id}")

        # Créer la tâche de pickup
        task = DeliveryTask(
            order_id=order_id,
            task_type=TaskType.PICKUP,
            pickup_location_type=LocationType.CUSTOMER,
            dropoff_location_type=LocationType.PARTNER,
            status=DeliveryTaskStatus.PENDING
        )

        return self.logistics_repo.create_delivery_task(task)

    def create_delivery_task(self, order_id: UUID) -> Optional[DeliveryTask]:
        """Créer une tâche de delivery pour une commande"""
        # Vérifier si la commande existe
        order = self.order_repo.get_order_by_id(order_id)
        if not order:
            raise ValueError(f"Commande {order_id} non trouvée")

        # Vérifier si une tâche existe déjà pour cette commande
        existing_task = self.logistics_repo.get_delivery_task_by_order_id(order_id)
        if existing_task:
            raise ValueError(f"Une tâche existe déjà pour la commande {order_id}")

        # Créer la tâche de delivery
        task = DeliveryTask(
            order_id=order_id,
            task_type=TaskType.DELIVERY,
            pickup_location_type=LocationType.PARTNER,
            dropoff_location_type=LocationType.CUSTOMER,
            status=DeliveryTaskStatus.PENDING
        )

        return self.logistics_repo.create_delivery_task(task)

    def assign_driver_to_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Assigner un chauffeur à une tâche avec verrouillage atomique"""
        with self.db.begin_nested():
            # 1. VERROU : SELECT FOR UPDATE NOWAIT sur chauffeur ET tâche
            try:
                driver = (
                    self.db.query(Driver)
                    .filter(Driver.id == driver_id)
                    .with_for_update(of=Driver, nowait=True)
                    .one()
                )
            except Exception:
                raise ValueError(f"Chauffeur {driver_id} non trouvé ou déjà verrouillé")

            if driver.status != DriverStatus.ACTIVE:
                raise ValueError(f"Chauffeur {driver_id} n'est pas actif")

            if not driver.is_available:
                raise ValueError(f"Chauffeur {driver_id} n'est pas disponible")

            try:
                task = (
                    self.db.query(DeliveryTask)
                    .filter(DeliveryTask.id == task_id)
                    .with_for_update(of=DeliveryTask, nowait=True)
                    .one()
                )
            except Exception:
                raise ValueError(f"Tâche {task_id} non trouvée ou déjà verrouillée")

            if task.status != DeliveryTaskStatus.PENDING:
                raise ValueError(f"Tâche {task_id} n'est pas en attente d'assignation")

            # 2. ASSIGNATION
            task.driver_id = driver_id
            task.status = DeliveryTaskStatus.DRIVER_ASSIGNED
            task.assigned_at = datetime.utcnow()
            driver.is_available = False

            # 3. TIMELINE
            self._record_timeline(
                order_id=task.order_id,
                task_id=task.id,
                event_type=TimelineEventType.STATUS_CHANGE,
                event_subtype="driver_assigned",
                from_status="pending",
                to_status="driver_assigned",
                actor_type=ActorType.SYSTEM,
                actor_id=driver_id,
                actor_name=getattr(driver, "name", "system"),
                payload={"driver_id": str(driver_id)},
            )

            self.db.flush()
            return task

    def auto_assign_driver_to_task(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Assigner automatiquement un chauffeur disponible à une tâche"""
        # Vérifier la tâche
        task = self.logistics_repo.get_delivery_task_by_id(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        if task.status != DeliveryTaskStatus.PENDING:
            raise ValueError(f"Tâche {task_id} n'est pas en attente d'assignation")

        # Trouver un chauffeur disponible
        available_drivers = self.logistics_repo.list_available_drivers()
        if not available_drivers:
            raise ValueError("Aucun chauffeur disponible")

        # Prendre le premier chauffeur disponible (MVP simple)
        driver = available_drivers[0]

        # Assigner le chauffeur
        return self.assign_driver_to_task(task_id, driver.id)

    def accept_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Accepter une tâche assignée"""
        # Vérifier que le chauffeur est bien assigné à la tâche
        task = self.logistics_repo.get_delivery_task_by_id(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        if task.driver_id != driver_id:
            raise ValueError(f"Le chauffeur {driver_id} n'est pas assigné à cette tâche")

        return self.logistics_repo.accept_task(task_id)

    def start_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Démarrer une tâche acceptée"""
        # Vérifier que le chauffeur est bien assigné à la tâche
        task = self.logistics_repo.get_delivery_task_by_id(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        if task.driver_id != driver_id:
            raise ValueError(f"Le chauffeur {driver_id} n'est pas assigné à cette tâche")

        return self.logistics_repo.start_task(task_id)

    def complete_task(
        self,
        task_id: UUID,
        driver_id: UUID,
        complete_data: TaskCompleteRequest
    ) -> Optional[DeliveryTask]:
        """Compléter une tâche en cours — exige une preuve obligatoire"""
        with self.db.begin_nested():
            # Vérifier que le chauffeur est bien assigné à la tâche (verrouillé)
            try:
                task = (
                    self.db.query(DeliveryTask)
                    .filter(DeliveryTask.id == task_id)
                    .with_for_update(of=DeliveryTask, nowait=True)
                    .one()
                )
            except Exception:
                raise ValueError(f"Tâche {task_id} non trouvée ou déjà verrouillée")

            if task.driver_id != driver_id:
                raise ValueError(f"Le chauffeur {driver_id} n'est pas assigné à cette tâche")

            if task.status not in {DeliveryTaskStatus.IN_PROGRESS, DeliveryTaskStatus.ACCEPTED}:
                raise ValueError(f"Tâche {task_id} ne peut pas être complétée depuis le statut {task.status}")

            # VÉRIFICATION PREUVE OBLIGATOIRE
            has_proof = bool(complete_data.proof_photo_url) or bool(complete_data.proof_note)
            if not has_proof:
                raise ValueError("Preuve obligatoire manquante : photo ou note requise pour compléter la tâche")

            # Compléter la tâche
            task.status = DeliveryTaskStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            if complete_data.proof_photo_url:
                task.proof_photo_url = complete_data.proof_photo_url
            if complete_data.proof_note:
                task.proof_note = complete_data.proof_note

            # Créer OperationalProof
            self._create_operational_proof(
                order_id=task.order_id,
                task_id=task.id,
                proof_type=ProofType.PHOTO if complete_data.proof_photo_url else ProofType.MANUAL,
                proof_data={
                    "photo_url": complete_data.proof_photo_url,
                    "note": complete_data.proof_note,
                },
                actor_type=ActorType.DRIVER,
                actor_id=driver_id,
                actor_name=getattr(complete_data, "actor_name", "driver"),
            )

            # Libérer le chauffeur
            driver = (
                self.db.query(Driver)
                .filter(Driver.id == driver_id)
                .with_for_update(of=Driver, nowait=True)
                .one()
            )
            driver.is_available = True

            # Timeline
            self._record_timeline(
                order_id=task.order_id,
                task_id=task.id,
                event_type=TimelineEventType.STATUS_CHANGE,
                event_subtype="task_completed",
                from_status=task.status.value if isinstance(task.status, DeliveryTaskStatus) else str(task.status),
                to_status="completed",
                actor_type=ActorType.DRIVER,
                actor_id=driver_id,
                actor_name=getattr(driver, "name", "driver"),
                payload={"proof_photo_url": complete_data.proof_photo_url, "proof_note": complete_data.proof_note},
            )

            self.db.flush()

            # Mettre à jour le statut de la commande si nécessaire
            self._update_order_status_from_task(task)

            return task

    def fail_task(
        self,
        task_id: UUID,
        driver_id: UUID,
        fail_data: TaskFailRequest
    ) -> Optional[DeliveryTask]:
        """Marquer une tâche comme échouée — exige une raison documentée"""
        with self.db.begin_nested():
            # Vérifier que le chauffeur est bien assigné à la tâche (verrouillé)
            try:
                task = (
                    self.db.query(DeliveryTask)
                    .filter(DeliveryTask.id == task_id)
                    .with_for_update(of=DeliveryTask, nowait=True)
                    .one()
                )
            except Exception:
                raise ValueError(f"Tâche {task_id} non trouvée ou déjà verrouillée")

            if task.driver_id != driver_id:
                raise ValueError(f"Le chauffeur {driver_id} n'est pas assigné à cette tâche")

            # RAISON OBLIGATOIRE
            if not fail_data.reason or not str(fail_data.reason).strip():
                raise ValueError("Raison d'échec obligatoire : veuillez documenter pourquoi la tâche a échoué")

            # Marquer la tâche comme échouée
            task.status = DeliveryTaskStatus.FAILED
            task.failure_reason = str(fail_data.reason).strip()

            # Créer OperationalProof (raison documentée = preuve manuelle)
            self._create_operational_proof(
                order_id=task.order_id,
                task_id=task.id,
                proof_type=ProofType.MANUAL,
                proof_data={"failure_reason": task.failure_reason},
                actor_type=ActorType.DRIVER,
                actor_id=driver_id,
                actor_name=getattr(fail_data, "actor_name", "driver"),
            )

            # Libérer le chauffeur
            driver = (
                self.db.query(Driver)
                .filter(Driver.id == driver_id)
                .with_for_update(of=Driver, nowait=True)
                .one()
            )
            driver.is_available = True

            # Timeline
            self._record_timeline(
                order_id=task.order_id,
                task_id=task.id,
                event_type=TimelineEventType.STATUS_CHANGE,
                event_subtype="task_failed",
                from_status=task.status.value if isinstance(task.status, DeliveryTaskStatus) else str(task.status),
                to_status="failed",
                actor_type=ActorType.DRIVER,
                actor_id=driver_id,
                actor_name=getattr(driver, "name", "driver"),
                payload={"failure_reason": task.failure_reason},
            )

            self.db.flush()
            return task

    def cancel_task(
        self,
        task_id: UUID,
        cancel_data: TaskCancelRequest
    ) -> Optional[DeliveryTask]:
        """Annuler une tâche"""
        task = self.logistics_repo.get_delivery_task_by_id(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")

        # Annuler la tâche
        cancelled_task = self.logistics_repo.cancel_task(task_id, cancel_data.reason)

        if cancelled_task and cancelled_task.driver_id:
            # Libérer le chauffeur si assigné
            driver = self.logistics_repo.get_driver_by_id(cancelled_task.driver_id)
            if driver:
                driver.is_available = True
                self.logistics_repo.update_driver(driver)

        return cancelled_task

    # ===== Helper Methods =====

    def _record_timeline(
        self,
        order_id: UUID,
        task_id: UUID,
        event_type: TimelineEventType,
        event_subtype: str,
        from_status: str,
        to_status: str,
        actor_type: ActorType,
        actor_id: UUID,
        actor_name: str,
        payload: dict,
    ) -> OperationalTimeline:
        """Enregistrer un événement dans la timeline opérationnelle"""
        event = OperationalTimeline(
            order_id=order_id,
            task_id=task_id,
            event_type=event_type.value,
            event_subtype=event_subtype,
            from_status=from_status,
            to_status=to_status,
            payload={
                **payload,
                "actor_type": actor_type.value,
                "actor_id": str(actor_id),
                "actor_name": actor_name,
            },
            occurred_at=datetime.utcnow(),
            source="api",
        )
        self.db.add(event)
        return event

    def _create_operational_proof(
        self,
        order_id: UUID,
        task_id: UUID,
        proof_type: ProofType,
        proof_data: dict,
        actor_type: ActorType,
        actor_id: UUID,
        actor_name: str,
        location_lat: Optional[float] = None,
        location_lng: Optional[float] = None,
        location_accuracy: Optional[float] = None,
    ) -> OperationalProof:
        """Créer une preuve opérationnelle immuable"""
        proof = OperationalProof(
            order_id=order_id,
            task_id=task_id,
            proof_type=proof_type.value,
            proof_data=proof_data,
            actor_type=actor_type.value,
            actor_id=actor_id,
            actor_name=actor_name,
            recorded_at=datetime.utcnow(),
            verification_status=VerificationStatus.VERIFIED.value,
            verification_method="auto",
            location_lat=location_lat,
            location_lng=location_lng,
            location_accuracy=location_accuracy,
        )
        self.db.add(proof)
        return proof

    def _update_order_status_from_task(self, task: DeliveryTask) -> None:
        """Mettre à jour le statut de la commande en fonction de la tâche"""
        order = self.order_repo.get_order_by_id(task.order_id)
        if not order:
            return

        if task.task_type == TaskType.PICKUP and task.status == DeliveryTaskStatus.COMPLETED:
            # Mettre à jour le statut de la commande après pickup
            if order.status == OrderStatus.CONFIRMED:
                order.status = OrderStatus.PICKED_UP
                self.order_repo.update_order(order)
        
        elif task.task_type == TaskType.DELIVERY and task.status == DeliveryTaskStatus.COMPLETED:
            # Mettre à jour le statut de la commande après delivery
            if order.status == OrderStatus.READY_FOR_DELIVERY:
                order.status = OrderStatus.DELIVERED
                self.order_repo.update_order(order)

    def list_tasks(
        self,
        driver_id: Optional[UUID] = None,
        order_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        status: Optional[DeliveryTaskStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryTask], int]:
        """Lister les tâches avec filtres"""
        return self.logistics_repo.list_delivery_tasks(
            driver_id, order_id, task_type, status, skip, limit
        )

    def get_task(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Obtenir une tâche par son ID"""
        return self.logistics_repo.get_delivery_task_by_id(task_id)
