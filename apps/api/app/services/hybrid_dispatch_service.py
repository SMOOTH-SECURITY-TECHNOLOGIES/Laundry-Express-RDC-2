from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.marketplace import (
    DispatchStrategy,
    DispatchMode,
    DispatchScopeType
)
from app.models.logistics import DeliveryTask, DeliveryTaskStatus, TaskType
from app.models.order import Order
from app.models.partner import Partner
from app.repositories.marketplace_repository import MarketplaceRepository
from app.repositories.logistics_repository import LogisticsRepository
from app.repositories.order_repository import OrderRepository
from app.services.dispatch_service import DispatchService


class HybridDispatchService:
    """Service de dispatch hybride avec marketplace"""
    
    def __init__(self, db: Session):
        self.db = db
        self.marketplace_repo = MarketplaceRepository(db)
        self.logistics_repo = LogisticsRepository(db)
        self.order_repo = OrderRepository(db)
        self.dispatch_service = DispatchService(db)
    
    # ===== Strategy Resolution =====
    
    def resolve_dispatch_strategy(
        self,
        order_id: UUID,
        task_type: TaskType,
        partner_id: Optional[UUID] = None,
        city: Optional[str] = None,
        zone: Optional[str] = None
    ) -> Tuple[DispatchStrategy, Optional[int]]:
        """
        Résoudre la stratégie de dispatch selon la priorité:
        1. Scope partenaire
        2. Scope zone
        3. Scope ville
        4. Scope type de tâche
        5. Scope global
        
        Retourne la stratégie et le timeout marketplace
        """
        # 1. Scope partenaire
        if partner_id:
            settings = self.marketplace_repo.get_dispatch_settings_by_scope(
                DispatchScopeType.PARTNER, partner_id
            )
            if settings:
                setting = settings[0]  # Prendre le plus récent
                return setting.dispatch_strategy, setting.marketplace_timeout_minutes
        
        # 2. Scope zone
        if zone and city:
            # Chercher un setting pour cette zone spécifique
            # Note: Dans l'implémentation actuelle, on n'a pas de scope_id pour les zones
            # On pourrait utiliser un identifiant de zone, mais pour simplifier, on passe à la ville
            pass
        
        # 3. Scope ville
        if city:
            # Chercher un setting pour cette ville
            # Pour simplifier, on considère que le scope_id est l'ID d'une entité ville
            # Dans une implémentation réelle, on aurait une table des villes
            pass
        
        # 4. Scope type de tâche
        settings = self.marketplace_repo.get_dispatch_settings_by_scope(
            DispatchScopeType.TASK_TYPE
        )
        for setting in settings:
            # Vérifier si le setting correspond au type de tâche
            # Pour simplifier, on prend le premier setting actif pour le type de tâche
            return setting.dispatch_strategy, setting.marketplace_timeout_minutes
        
        # 5. Scope global
        settings = self.marketplace_repo.get_dispatch_settings_by_scope(
            DispatchScopeType.GLOBAL
        )
        if settings:
            setting = settings[0]
            return setting.dispatch_strategy, setting.marketplace_timeout_minutes
        
        # Par défaut: marketplace multi-compagnies
        return DispatchStrategy.MARKETPLACE_ONLY, 30
    
    # ===== Dispatch Logic =====
    
    def dispatch_task(self, task_id: UUID) -> DeliveryTask:
        """
        Dispatcher une tâche selon la stratégie résolue
        """
        task = self.marketplace_repo.get_market_task(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        # Obtenir les détails de la commande pour résoudre la stratégie
        task_with_order = self.marketplace_repo.get_task_with_order_details(task_id)
        if not task_with_order:
            raise ValueError(f"Détails de commande non trouvés pour la tâche {task_id}")
        
        task_obj, order = task_with_order
        
        # Résoudre la stratégie
        strategy, marketplace_timeout = self.resolve_dispatch_strategy(
            order_id=order.id,
            task_type=task_obj.task_type,
            partner_id=order.partner_id,
            city=order.delivery_city if hasattr(order, 'delivery_city') else None,
            zone=order.delivery_zone if hasattr(order, 'delivery_zone') else None
        )
        
        # Appliquer la stratégie
        task.dispatch_strategy = strategy
        
        if strategy == DispatchStrategy.INTERNAL_FIRST:
            return self._dispatch_internal_first(task, marketplace_timeout)
        elif strategy == DispatchStrategy.MARKETPLACE_FIRST:
            return self._dispatch_marketplace_first(task, marketplace_timeout)
        elif strategy == DispatchStrategy.MANUAL_ONLY:
            return self._dispatch_manual_only(task)
        elif strategy == DispatchStrategy.INTERNAL_ONLY:
            return self._dispatch_internal_only(task)
        elif strategy == DispatchStrategy.MARKETPLACE_ONLY:
            return self._dispatch_marketplace_only(task, marketplace_timeout)
        else:
            raise ValueError(f"Stratégie inconnue: {strategy}")
    
    def _dispatch_internal_first(self, task: DeliveryTask, marketplace_timeout: int) -> DeliveryTask:
        """Stratégie: tenter interne d'abord, puis marketplace"""
        # Tenter d'assigner un chauffeur interne
        available_drivers = self.logistics_repo.list_available_drivers()
        
        if available_drivers:
            # Assigner le premier chauffeur disponible
            driver = available_drivers[0]
            task = self.marketplace_repo.assign_internal_driver_to_task(task.id, driver.id)
            if task:
                task.dispatch_mode = DispatchMode.INTERNAL
                return task
        
        # Aucun chauffeur interne disponible, ouvrir au marketplace
        return self._open_task_to_market(task, marketplace_timeout)
    
    def _dispatch_marketplace_first(self, task: DeliveryTask, marketplace_timeout: int) -> DeliveryTask:
        """Stratégie: ouvrir au marketplace d'abord, fallback interne"""
        # Ouvrir au marketplace
        market_task = self._open_task_to_market(task, marketplace_timeout)
        
        # Planifier un fallback automatique après expiration
        # (à implémenter avec Celery ou un worker)
        
        return market_task
    
    def _dispatch_manual_only(self, task: DeliveryTask) -> DeliveryTask:
        """Stratégie: dispatch manuel uniquement"""
        task.status = DeliveryTaskStatus.PENDING
        task.dispatch_mode = None
        self.db.flush()
        return task
    
    def _dispatch_internal_only(self, task: DeliveryTask) -> DeliveryTask:
        """Stratégie: interne uniquement"""
        available_drivers = self.logistics_repo.list_available_drivers()
        
        if not available_drivers:
            raise ValueError("Aucun chauffeur interne disponible (stratégie internal_only)")
        
        driver = available_drivers[0]
        task = self.marketplace_repo.assign_internal_driver_to_task(task.id, driver.id)
        if task:
            task.dispatch_mode = DispatchMode.INTERNAL
            return task
        
        raise ValueError("Échec de l'assignation interne")
    
    def _dispatch_marketplace_only(self, task: DeliveryTask, marketplace_timeout: int) -> DeliveryTask:
        """Stratégie: marketplace uniquement"""
        return self._open_task_to_market(task, marketplace_timeout)
    
    def _open_task_to_market(self, task: DeliveryTask, timeout_minutes: int) -> DeliveryTask:
        """Ouvrir une tâche au marketplace"""
        market_task = self.marketplace_repo.open_task_to_market(task.id, timeout_minutes)
        if not market_task:
            raise ValueError(f"Échec de l'ouverture au marketplace pour la tâche {task.id}")
        
        market_task.dispatch_mode = DispatchMode.MARKETPLACE
        return market_task
    
    # ===== Marketplace Operations =====
    
    def claim_market_task(self, task_id: UUID, company_id: UUID) -> DeliveryTask:
        """
        Claimer une tâche marketplace (atomique)
        """
        task = self.marketplace_repo.claim_market_task(task_id, company_id)
        if not task:
            raise ValueError(
                f"Impossible de claimer la tâche {task_id}. "
                "Elle n'est peut-être plus disponible, expirée ou déjà claimée."
            )
        
        return task
    
    def assign_company_driver(self, task_id: UUID, company_id: UUID, driver_id: UUID) -> DeliveryTask:
        """
        Assigner un chauffeur de compagnie à une tâche
        """
        task = self.marketplace_repo.assign_company_driver_to_task(task_id, company_id, driver_id)
        if not task:
            raise ValueError(
                f"Impossible d'assigner le chauffeur {driver_id} à la tâche {task_id}. "
                "Vérifiez que le chauffeur appartient à la compagnie et que la tâche est claimée par cette compagnie."
            )
        
        return task
    
    def assign_internal_driver(self, task_id: UUID, driver_id: UUID) -> DeliveryTask:
        """
        Assigner un chauffeur interne à une tâche
        """
        task = self.marketplace_repo.assign_internal_driver_to_task(task_id, driver_id)
        if not task:
            raise ValueError(f"Impossible d'assigner le chauffeur {driver_id} à la tâche {task_id}")
        
        task.dispatch_mode = DispatchMode.INTERNAL
        return task
    
    # ===== Task Management =====
    
    def expire_market_tasks(self) -> List[DeliveryTask]:
        """
        Expirer les tâches marketplace dépassées
        """
        expired_tasks = self.marketplace_repo.expire_market_tasks()
        
        # Pour chaque tâche expirée, appliquer le fallback selon la stratégie
        for task in expired_tasks:
            self._handle_expired_task_fallback(task)
        
        return expired_tasks
    
    def _handle_expired_task_fallback(self, task: DeliveryTask):
        """Gérer le fallback d'une tâche expirée"""
        if task.dispatch_strategy == DispatchStrategy.MARKETPLACE_FIRST:
            # Fallback vers interne
            try:
                self._dispatch_internal_only(task)
            except ValueError:
                # Aucun chauffeur disponible, laisser en pending pour review manuelle
                task.status = DeliveryTaskStatus.PENDING
                task.dispatch_mode = DispatchMode.MANUAL_COMPANY
        elif task.dispatch_strategy == DispatchStrategy.MARKETPLACE_ONLY:
            # Marketplace only, laisser expirée
            pass
        else:
            # Pour les autres stratégies, laisser expirée
            pass
        
        self.db.flush()
    
    def fallback_dispatch(self, task_id: UUID, fallback_strategy: Optional[DispatchStrategy] = None) -> DeliveryTask:
        """
        Fallback d'une tâche (après expiration ou échec)
        """
        task = self.marketplace_repo.get_market_task(task_id)
        if not task:
            raise ValueError(f"Tâche {task_id} non trouvée")
        
        # Déterminer la stratégie de fallback
        if fallback_strategy:
            strategy = fallback_strategy
        elif task.dispatch_strategy == DispatchStrategy.MARKETPLACE_FIRST:
            strategy = DispatchStrategy.INTERNAL_ONLY
        elif task.dispatch_strategy == DispatchStrategy.INTERNAL_FIRST:
            strategy = DispatchStrategy.MARKETPLACE_ONLY
        else:
            strategy = DispatchStrategy.MANUAL_ONLY
        
        # Réinitialiser la tâche
        task.status = DeliveryTaskStatus.PENDING
        task.market_visible = False
        task.market_opened_at = None
        task.market_expires_at = None
        task.claimed_by_company_id = None
        task.claimed_at = None
        task.assigned_company_id = None
        task.driver_id = None
        task.assigned_at = None
        
        # Réappliquer le dispatch avec la nouvelle stratégie
        task.dispatch_strategy = strategy
        
        if strategy == DispatchStrategy.INTERNAL_ONLY:
            return self._dispatch_internal_only(task)
        elif strategy == DispatchStrategy.MARKETPLACE_ONLY:
            # Utiliser le timeout par défaut
            return self._open_task_to_market(task, 30)
        else:
            return self._dispatch_manual_only(task)
    
    # ===== Task Completion =====
    
    def complete_task(
        self,
        task_id: UUID,
        driver_id: UUID,
        proof_photo_url: Optional[str] = None,
        proof_note: Optional[str] = None
    ) -> DeliveryTask:
        """
        Compléter une tâche
        """
        # Utiliser le service de dispatch existant pour la complétion
        task = self.dispatch_service.complete_task(
            task_id=task_id,
            driver_id=driver_id,
            proof_photo_url=proof_photo_url,
            proof_note=proof_note
        )
        
        # Mettre à jour le mode de dispatch si nécessaire
        if not task.dispatch_mode:
            # Déterminer le mode basé sur la compagnie assignée
            if task.assigned_company_id:
                task.dispatch_mode = DispatchMode.MARKETPLACE
            elif task.driver_id:
                task.dispatch_mode = DispatchMode.INTERNAL
        
        return task
    
    # ===== Utility Methods =====
    
    def get_market_tasks_for_company(
        self,
        company_id: UUID,
        task_type: Optional[TaskType] = None,
        city: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryTask], int]:
        """
        Obtenir les tâches marketplace disponibles pour une compagnie
        """
        return self.marketplace_repo.list_market_tasks(
            company_id=company_id,
            task_type=task_type,
            city=city,
            skip=skip,
            limit=limit
        )
    
    def get_claimed_tasks_for_company(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryTask], int]:
        """
        Obtenir les tâches claimées par une compagnie
        """
        query = self.db.query(DeliveryTask).filter(
            DeliveryTask.claimed_by_company_id == company_id
        )
        
        total = query.count()
        tasks = query.order_by(DeliveryTask.claimed_at.desc()).offset(skip).limit(limit).all()
        
        return tasks, total
    
    def get_company_drivers_for_task(
        self,
        task_id: UUID,
        company_id: UUID
    ) -> List[Tuple[UUID, str]]:
        """
        Obtenir les chauffeurs disponibles d'une compagnie pour une tâche
        """
        # Obtenir les chauffeurs actifs de la compagnie
        company_drivers, _ = self.marketplace_repo.list_company_drivers(
            company_id=company_id,
            is_active=True
        )
        
        # Filtrer les chauffeurs disponibles
        available_drivers = []
        for company_driver in company_drivers:
            driver = self.logistics_repo.get_driver(company_driver.driver_id)
            if driver and driver.is_available and driver.status == "active":
                available_drivers.append((driver.id, f"{driver.user_id}"))
        
        return available_drivers