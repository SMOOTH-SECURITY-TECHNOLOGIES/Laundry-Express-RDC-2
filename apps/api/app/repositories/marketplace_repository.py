from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.orm import Session, selectinload

from app.models.marketplace import (
    DeliveryCompany,
    CompanyDriver,
    CompanyServiceZone,
    DispatchSetting,
    DeliveryCompanyStatus,
    DispatchStrategy,
    DispatchScopeType
)
from app.models.logistics import DeliveryTask, DeliveryTaskStatus, TaskType
from app.models.order import Order, OrderStatus
from app.models.partner import Partner


class MarketplaceRepository:
    """Repository pour les opérations marketplace"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ===== Delivery Company Operations =====
    
    def get_company(self, company_id: UUID) -> Optional[DeliveryCompany]:
        """Obtenir une compagnie par son ID"""
        return self.db.query(DeliveryCompany).filter(DeliveryCompany.id == company_id).first()
    
    def get_company_by_slug(self, slug: str) -> Optional[DeliveryCompany]:
        """Obtenir une compagnie par son slug"""
        return self.db.query(DeliveryCompany).filter(DeliveryCompany.slug == slug).first()
    
    def list_companies(
        self,
        status: Optional[DeliveryCompanyStatus] = None,
        is_active: Optional[bool] = None,
        supports_pickup: Optional[bool] = None,
        supports_delivery: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryCompany], int]:
        """Lister les compagnies avec filtres"""
        query = self.db.query(DeliveryCompany)
        
        if status is not None:
            query = query.filter(DeliveryCompany.status == status)
        if is_active is not None:
            query = query.filter(DeliveryCompany.is_active == is_active)
        if supports_pickup is not None:
            query = query.filter(DeliveryCompany.supports_pickup == supports_pickup)
        if supports_delivery is not None:
            query = query.filter(DeliveryCompany.supports_delivery == supports_delivery)
        
        total = query.count()
        companies = query.order_by(DeliveryCompany.name).offset(skip).limit(limit).all()
        
        return companies, total
    
    def create_company(self, company_data: dict) -> DeliveryCompany:
        """Créer une nouvelle compagnie"""
        company = DeliveryCompany(**company_data)
        self.db.add(company)
        self.db.flush()
        return company
    
    def update_company(self, company_id: UUID, update_data: dict) -> Optional[DeliveryCompany]:
        """Mettre à jour une compagnie"""
        company = self.get_company(company_id)
        if not company:
            return None
        
        for key, value in update_data.items():
            setattr(company, key, value)
        
        company.updated_at = datetime.utcnow()
        self.db.flush()
        return company
    
    # ===== Company Driver Operations =====
    
    def get_company_driver(self, company_id: UUID, driver_id: UUID) -> Optional[CompanyDriver]:
        """Obtenir un chauffeur de compagnie"""
        return self.db.query(CompanyDriver).filter(
            and_(
                CompanyDriver.company_id == company_id,
                CompanyDriver.driver_id == driver_id
            )
        ).first()
    
    def list_company_drivers(
        self,
        company_id: UUID,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[CompanyDriver], int]:
        """Lister les chauffeurs d'une compagnie"""
        query = self.db.query(CompanyDriver).filter(CompanyDriver.company_id == company_id)
        
        if is_active is not None:
            query = query.filter(CompanyDriver.is_active == is_active)
        
        total = query.count()
        drivers = query.order_by(CompanyDriver.created_at.desc()).offset(skip).limit(limit).all()
        
        return drivers, total
    
    def add_company_driver(self, company_id: UUID, driver_id: UUID) -> CompanyDriver:
        """Ajouter un chauffeur à une compagnie"""
        company_driver = CompanyDriver(
            company_id=company_id,
            driver_id=driver_id,
            is_active=True
        )
        self.db.add(company_driver)
        self.db.flush()
        return company_driver
    
    def update_company_driver_status(self, company_id: UUID, driver_id: UUID, is_active: bool) -> Optional[CompanyDriver]:
        """Mettre à jour le statut d'un chauffeur de compagnie"""
        company_driver = self.get_company_driver(company_id, driver_id)
        if not company_driver:
            return None
        
        company_driver.is_active = is_active
        self.db.flush()
        return company_driver
    
    # ===== Company Service Zone Operations =====
    
    def get_service_zone(self, zone_id: UUID) -> Optional[CompanyServiceZone]:
        """Obtenir une zone de service par son ID"""
        return self.db.query(CompanyServiceZone).filter(CompanyServiceZone.id == zone_id).first()
    
    def list_company_service_zones(
        self,
        company_id: UUID,
        city: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[CompanyServiceZone], int]:
        """Lister les zones de service d'une compagnie"""
        query = self.db.query(CompanyServiceZone).filter(CompanyServiceZone.company_id == company_id)
        
        if city is not None:
            query = query.filter(CompanyServiceZone.city == city)
        if is_active is not None:
            query = query.filter(CompanyServiceZone.is_active == is_active)
        
        total = query.count()
        zones = query.order_by(CompanyServiceZone.city, CompanyServiceZone.commune).offset(skip).limit(limit).all()
        
        return zones, total
    
    def add_service_zone(self, zone_data: dict) -> CompanyServiceZone:
        """Ajouter une zone de service"""
        zone = CompanyServiceZone(**zone_data)
        self.db.add(zone)
        self.db.flush()
        return zone
    
    def update_service_zone(self, zone_id: UUID, update_data: dict) -> Optional[CompanyServiceZone]:
        """Mettre à jour une zone de service"""
        zone = self.get_service_zone(zone_id)
        if not zone:
            return None
        
        for key, value in update_data.items():
            setattr(zone, key, value)
        
        self.db.flush()
        return zone
    
    # ===== Dispatch Setting Operations =====
    
    def get_dispatch_setting(self, setting_id: UUID) -> Optional[DispatchSetting]:
        """Obtenir un paramètre de dispatch par son ID"""
        return self.db.query(DispatchSetting).filter(DispatchSetting.id == setting_id).first()
    
    def get_dispatch_settings_by_scope(
        self,
        scope_type: DispatchScopeType,
        scope_id: Optional[UUID] = None
    ) -> List[DispatchSetting]:
        """Obtenir les paramètres de dispatch par scope"""
        query = self.db.query(DispatchSetting).filter(
            and_(
                DispatchSetting.scope_type == scope_type,
                DispatchSetting.is_active == True
            )
        )
        
        if scope_id is not None:
            query = query.filter(DispatchSetting.scope_id == scope_id)
        else:
            query = query.filter(DispatchSetting.scope_id.is_(None))
        
        return query.order_by(DispatchSetting.created_at.desc()).all()
    
    def list_dispatch_settings(
        self,
        scope_type: Optional[DispatchScopeType] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DispatchSetting], int]:
        """Lister les paramètres de dispatch"""
        query = self.db.query(DispatchSetting)
        
        if scope_type is not None:
            query = query.filter(DispatchSetting.scope_type == scope_type)
        if is_active is not None:
            query = query.filter(DispatchSetting.is_active == is_active)
        
        total = query.count()
        settings = query.order_by(DispatchSetting.scope_type, DispatchSetting.created_at.desc()).offset(skip).limit(limit).all()
        
        return settings, total
    
    def create_dispatch_setting(self, setting_data: dict) -> DispatchSetting:
        """Créer un paramètre de dispatch"""
        setting = DispatchSetting(**setting_data)
        self.db.add(setting)
        self.db.flush()
        return setting
    
    def update_dispatch_setting(self, setting_id: UUID, update_data: dict) -> Optional[DispatchSetting]:
        """Mettre à jour un paramètre de dispatch"""
        setting = self.get_dispatch_setting(setting_id)
        if not setting:
            return None
        
        for key, value in update_data.items():
            setattr(setting, key, value)
        
        setting.updated_at = datetime.utcnow()
        self.db.flush()
        return setting
    
    # ===== Marketplace Task Operations =====
    
    def get_market_task(self, task_id: UUID) -> Optional[DeliveryTask]:
        """Obtenir une tâche marketplace"""
        return self.db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
    
    def list_market_tasks(
        self,
        company_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        city: Optional[str] = None,
        status: Optional[DeliveryTaskStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DeliveryTask], int]:
        """Lister les tâches marketplace"""
        query = self.db.query(DeliveryTask).filter(
            DeliveryTask.market_visible == True
        )
        
        if company_id is not None:
            # Filtrer par compagnie (basé sur les zones de service)
            subquery = self.db.query(CompanyServiceZone.company_id).filter(
                and_(
                    CompanyServiceZone.is_active == True,
                    CompanyServiceZone.city == city if city else True
                )
            ).subquery()
            query = query.filter(DeliveryTask.assigned_company_id.is_(None))
        
        if task_type is not None:
            query = query.filter(DeliveryTask.task_type == task_type)
        
        if status is not None:
            query = query.filter(DeliveryTask.status == status)
        else:
            # Par défaut, seulement les tâches ouvertes au marché
            query = query.filter(DeliveryTask.status == DeliveryTaskStatus.OPEN_MARKET)
        
        # Filtrer les tâches non expirées
        now = datetime.utcnow()
        query = query.filter(
            or_(
                DeliveryTask.market_expires_at.is_(None),
                DeliveryTask.market_expires_at > now
            )
        )
        
        total = query.count()
        tasks = query.order_by(DeliveryTask.market_expires_at.asc()).offset(skip).limit(limit).all()
        
        return tasks, total
    
    def claim_market_task(self, task_id: UUID, company_id: UUID) -> Optional[DeliveryTask]:
        """Claimer une tâche marketplace (atomique)"""
        # Utiliser une transaction avec verrou de ligne
        task = self.db.query(DeliveryTask).filter(
            and_(
                DeliveryTask.id == task_id,
                DeliveryTask.status == DeliveryTaskStatus.OPEN_MARKET,
                DeliveryTask.market_visible == True,
                or_(
                    DeliveryTask.market_expires_at.is_(None),
                    DeliveryTask.market_expires_at > datetime.utcnow()
                )
            )
        ).with_for_update().first()
        
        if not task:
            return None
        
        # Mettre à jour la tâche
        task.status = DeliveryTaskStatus.CLAIMED
        task.claimed_by_company_id = company_id
        task.claimed_at = datetime.utcnow()
        task.market_visible = False
        task.dispatch_mode = "marketplace"
        
        self.db.flush()
        return task
    
    def open_task_to_market(self, task_id: UUID, timeout_minutes: int) -> Optional[DeliveryTask]:
        """Ouvrir une tâche au marketplace"""
        task = self.get_market_task(task_id)
        if not task:
            return None
        
        task.status = DeliveryTaskStatus.OPEN_MARKET
        task.market_visible = True
        task.market_opened_at = datetime.utcnow()
        task.market_expires_at = datetime.utcnow() + timedelta(minutes=timeout_minutes)
        
        self.db.flush()
        return task
    
    def expire_market_tasks(self) -> List[DeliveryTask]:
        """Expirer les tâches marketplace dépassées"""
        now = datetime.utcnow()
        
        # Trouver les tâches à expirer
        tasks_to_expire = self.db.query(DeliveryTask).filter(
            and_(
                DeliveryTask.status == DeliveryTaskStatus.OPEN_MARKET,
                DeliveryTask.market_expires_at <= now
            )
        ).all()
        
        # Marquer comme expirées
        for task in tasks_to_expire:
            task.status = DeliveryTaskStatus.EXPIRED
            task.market_visible = False
        
        self.db.flush()
        return tasks_to_expire
    
    def assign_company_driver_to_task(self, task_id: UUID, company_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Assigner un chauffeur de compagnie à une tâche"""
        # Vérifier que le chauffeur appartient à la compagnie
        company_driver = self.get_company_driver(company_id, driver_id)
        if not company_driver or not company_driver.is_active:
            return None
        
        task = self.get_market_task(task_id)
        if not task or task.claimed_by_company_id != company_id:
            return None
        
        task.driver_id = driver_id
        task.status = DeliveryTaskStatus.DRIVER_ASSIGNED
        task.assigned_at = datetime.utcnow()
        
        self.db.flush()
        return task
    
    def assign_internal_driver_to_task(self, task_id: UUID, driver_id: UUID) -> Optional[DeliveryTask]:
        """Assigner un chauffeur interne à une tâche"""
        task = self.get_market_task(task_id)
        if not task:
            return None
        
        task.driver_id = driver_id
        task.status = DeliveryTaskStatus.DRIVER_ASSIGNED
        task.dispatch_mode = "internal"
        task.assigned_at = datetime.utcnow()
        
        self.db.flush()
        return task
    
    def get_task_with_order_details(self, task_id: UUID) -> Optional[Tuple[DeliveryTask, Order]]:
        """Obtenir une tâche avec les détails de la commande"""
        task = self.db.query(DeliveryTask).filter(DeliveryTask.id == task_id).first()
        if not task:
            return None
        
        order = self.db.query(Order).filter(Order.id == task.order_id).first()
        if not order:
            return None
        
        return task, order

    def list_company_service_zones(self, company_id: UUID) -> List[CompanyServiceZone]:
        """Zones de service actives d'une compagnie."""
        return (
            self.db.query(CompanyServiceZone)
            .filter(
                CompanyServiceZone.company_id == company_id,
                CompanyServiceZone.is_active == True,
            )
            .all()
        )

    def get_companies_for_commune(
        self,
        city: str,
        commune: Optional[str],
        task_type: TaskType,
    ) -> List[DeliveryCompany]:
        """Compagnies actives couvrant une commune."""
        query = self.db.query(DeliveryCompany).join(
            CompanyServiceZone,
            and_(
                CompanyServiceZone.company_id == DeliveryCompany.id,
                CompanyServiceZone.city == city,
                CompanyServiceZone.is_active == True,
            ),
        ).filter(
            DeliveryCompany.status == DeliveryCompanyStatus.ACTIVE,
            DeliveryCompany.is_active == True,
        )

        if commune:
            query = query.filter(
                or_(
                    CompanyServiceZone.commune == commune,
                    CompanyServiceZone.commune.is_(None),
                )
            )

        if task_type == TaskType.PICKUP:
            query = query.filter(DeliveryCompany.supports_pickup == True)
        else:
            query = query.filter(DeliveryCompany.supports_delivery == True)

        return query.distinct().all()
    
    def get_companies_for_city(self, city: str, task_type: TaskType) -> List[DeliveryCompany]:
        """Obtenir les compagnies actives pour une ville et un type de tâche"""
        query = self.db.query(DeliveryCompany).join(
            CompanyServiceZone,
            and_(
                CompanyServiceZone.company_id == DeliveryCompany.id,
                CompanyServiceZone.city == city,
                CompanyServiceZone.is_active == True
            )
        ).filter(
            and_(
                DeliveryCompany.status == DeliveryCompanyStatus.ACTIVE,
                DeliveryCompany.is_active == True
            )
        )
        
        if task_type == TaskType.PICKUP:
            query = query.filter(DeliveryCompany.supports_pickup == True)
        else:  # DELIVERY
            query = query.filter(DeliveryCompany.supports_delivery == True)
        
        return query.all()