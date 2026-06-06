from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, Enum as SQLEnum, ForeignKey, Integer, Numeric, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class DeliveryCompanyStatus(str, Enum):
    """Statuts d'une compagnie de livraison"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class DispatchStrategy(str, Enum):
    """Stratégies de dispatch"""
    INTERNAL_FIRST = "internal_first"
    MARKETPLACE_FIRST = "marketplace_first"
    MANUAL_ONLY = "manual_only"
    INTERNAL_ONLY = "internal_only"
    MARKETPLACE_ONLY = "marketplace_only"


class DispatchMode(str, Enum):
    """Mode de dispatch effectivement utilisé"""
    INTERNAL = "internal"
    MARKETPLACE = "marketplace"
    MANUAL_COMPANY = "manual_company"
    MANUAL_DRIVER = "manual_driver"


class DispatchScopeType(str, Enum):
    """Types de scope pour les paramètres de dispatch"""
    GLOBAL = "global"
    CITY = "city"
    ZONE = "zone"
    PARTNER = "partner"
    TASK_TYPE = "task_type"


class DeliveryCompany(BaseModel):
    """Compagnie de livraison partenaire"""
    __tablename__ = "delivery_companies"

    # Informations de base
    name = Column(String(200), nullable=False, unique=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Statut
    status = Column(SQLEnum(DeliveryCompanyStatus), default=DeliveryCompanyStatus.ACTIVE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Capacités
    supports_pickup = Column(Boolean, default=True, nullable=False)
    supports_delivery = Column(Boolean, default=True, nullable=False)
    
    # Évaluation
    rating_avg = Column(Numeric(3, 2), default=0.0, nullable=False)  # 0.00 à 5.00
    rating_count = Column(Integer, default=0, nullable=False)
    
    # Relations
    drivers = relationship("CompanyDriver", back_populates="company", cascade="all, delete-orphan")
    service_zones = relationship("CompanyServiceZone", back_populates="company", cascade="all, delete-orphan")
    claimed_tasks = relationship("DeliveryTask", foreign_keys="DeliveryTask.claimed_by_company_id", back_populates="claimed_by_company")
    assigned_tasks = relationship("DeliveryTask", foreign_keys="DeliveryTask.assigned_company_id", back_populates="assigned_company")
    
    def __repr__(self):
        return f"<DeliveryCompany(id={self.id}, name={self.name}, status={self.status})>"


class CompanyDriver(BaseModel):
    """Chauffeur appartenant à une compagnie"""
    __tablename__ = "company_drivers"

    company_id = Column(UUID(as_uuid=True), ForeignKey("delivery_companies.id"), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relations
    company = relationship("DeliveryCompany", back_populates="drivers")
    driver = relationship("Driver")
    
    def __repr__(self):
        return f"<CompanyDriver(id={self.id}, company_id={self.company_id}, driver_id={self.driver_id})>"


class CompanyServiceZone(BaseModel):
    """Zone de service d'une compagnie"""
    __tablename__ = "company_service_zones"

    company_id = Column(UUID(as_uuid=True), ForeignKey("delivery_companies.id"), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    commune = Column(String(100), nullable=True, index=True)
    zone = Column(String(100), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relations
    company = relationship("DeliveryCompany", back_populates="service_zones")
    
    def __repr__(self):
        return f"<CompanyServiceZone(id={self.id}, company_id={self.company_id}, city={self.city})>"


class DispatchSetting(BaseModel):
    """Paramètres de dispatch par scope"""
    __tablename__ = "dispatch_settings"

    # Scope
    scope_type = Column(SQLEnum(DispatchScopeType), nullable=False, index=True)
    scope_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # ID du partenaire, ville, etc.
    
    # Stratégie
    dispatch_strategy = Column(SQLEnum(DispatchStrategy), nullable=False)
    
    # Timeouts
    marketplace_timeout_minutes = Column(Integer, default=30, nullable=False)  # 30 minutes par défaut
    driver_assignment_timeout_minutes = Column(Integer, default=15, nullable=False)  # 15 minutes par défaut
    
    # Activation
    is_active = Column(Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f"<DispatchSetting(id={self.id}, scope_type={self.scope_type}, strategy={self.dispatch_strategy})>"