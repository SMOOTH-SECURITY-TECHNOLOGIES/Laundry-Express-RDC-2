import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.marketplace import DispatchStrategy, DispatchMode


class DriverStatus(str, Enum):
    """Statuts du chauffeur"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TaskType(str, Enum):
    """Type de tâche"""
    PICKUP = "pickup"
    DELIVERY = "delivery"


class DeliveryTaskStatus(str, Enum):
    """Statuts de la tâche de livraison"""
    PENDING = "pending"
    OPEN_MARKET = "open_market"
    CLAIMED = "claimed"
    DRIVER_ASSIGNED = "driver_assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class LocationType(str, Enum):
    """Type de localisation"""
    CUSTOMER = "customer"
    PARTNER = "partner"


class VehicleType(str, Enum):
    """Type de véhicule"""
    MOTO = "moto"
    CAR = "car"
    VAN = "van"


class VehicleStatus(str, Enum):
    """Statut du véhicule"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    DELAYED = "delayed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VehicleMaintenanceStatus(str, Enum):
    """Statut de maintenance du véhicule"""
    OK = "ok"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    OVERDUE = "overdue"


class Driver(BaseModel):
    """Chauffeur"""
    __tablename__ = "drivers"

    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    
    # Statut
    status = Column(SQLEnum(DriverStatus), default=DriverStatus.ACTIVE, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    
    # Informations professionnelles
    vehicle_type = Column(String(100), nullable=True)
    license_number = Column(String(100), nullable=True)
    
    # Évaluation
    rating_avg = Column(Numeric(3, 2), default=0.0, nullable=False)  # 0.00 à 5.00
    rating_count = Column(Integer, default=0, nullable=False)
    
    # Relations
    locations = relationship("DriverLocation", back_populates="driver", cascade="all, delete-orphan")
    delivery_tasks = relationship("DeliveryTask", back_populates="driver", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Driver(id={self.id}, user_id={self.user_id}, status={self.status})>"


class DriverLocation(BaseModel):
    """Localisation du chauffeur"""
    __tablename__ = "driver_locations"

    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False, index=True)
    
    # Coordonnées
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Métadonnées
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relations
    driver = relationship("Driver", back_populates="locations")
    
    def __repr__(self):
        return f"<DriverLocation(id={self.id}, driver_id={self.driver_id})>"


class DeliveryTask(BaseModel):
    """Tâche de livraison"""
    __tablename__ = "delivery_tasks"
    __table_args__ = (
        UniqueConstraint('order_id', 'task_type', name='uniq_delivery_tasks_order_task_type'),
        Index('idx_delivery_tasks_driver_status', 'driver_id', 'status'),
    )

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True, index=True)
    
    # Type de tâche
    task_type = Column(SQLEnum(TaskType), nullable=False)
    
    # Statut
    status = Column(SQLEnum(DeliveryTaskStatus), default=DeliveryTaskStatus.PENDING, nullable=False)
    
    # Stratégie et mode de dispatch
    dispatch_strategy = Column(SQLEnum(DispatchStrategy), nullable=True)
    dispatch_mode = Column(SQLEnum(DispatchMode), nullable=True)
    
    # Compagnies
    assigned_company_id = Column(UUID(as_uuid=True), ForeignKey("delivery_companies.id"), nullable=True, index=True)
    claimed_by_company_id = Column(UUID(as_uuid=True), ForeignKey("delivery_companies.id"), nullable=True, index=True)
    
    # Marketplace
    market_visible = Column(Boolean, default=False, nullable=False)
    market_opened_at = Column(DateTime(timezone=True), nullable=True)
    market_expires_at = Column(DateTime(timezone=True), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Localisations
    pickup_location_type = Column(SQLEnum(LocationType), nullable=True)
    dropoff_location_type = Column(SQLEnum(LocationType), nullable=True)
    
    # Dates
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Preuve d'exécution
    proof_photo_url = Column(String(500), nullable=True)
    proof_note = Column(Text, nullable=True)
    
    # Raisons d'échec/annulation
    failure_reason = Column(Text, nullable=True)
    cancel_reason = Column(Text, nullable=True)
    
    # Relations
    driver = relationship("Driver", back_populates="delivery_tasks")
    assigned_company = relationship("DeliveryCompany", foreign_keys=[assigned_company_id], back_populates="assigned_tasks")
    claimed_by_company = relationship("DeliveryCompany", foreign_keys=[claimed_by_company_id], back_populates="claimed_tasks")
    proofs = relationship("OperationalProof", back_populates="task")
    timeline_events = relationship("OperationalTimeline", back_populates="task")
    
    def __repr__(self):
        return f"<DeliveryTask(id={self.id}, order_id={self.order_id}, task_type={self.task_type}, status={self.status})>"


class Vehicle(BaseModel):
    """Véhicule de la flotte"""
    __tablename__ = "vehicles"

    plate = Column(String(50), nullable=False, unique=True, index=True)
    type = Column(SQLEnum(VehicleType), nullable=False)
    status = Column(SQLEnum(VehicleStatus), default=VehicleStatus.PENDING, nullable=False)

    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True, index=True)
    assigned_driver_name = Column(String(200), nullable=True)

    zone = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    last_known_location = Column(String(200), nullable=True)

    mileage_km = Column(Integer, default=0, nullable=False)
    insurance_expires_at = Column(DateTime(timezone=True), nullable=True)

    maintenance_status = Column(SQLEnum(VehicleMaintenanceStatus), default=VehicleMaintenanceStatus.OK, nullable=False)
    maintenance_next_service_km = Column(Integer, default=0, nullable=False)
    maintenance_notes = Column(Text, nullable=True)

    driver = relationship("Driver", backref="vehicles")

    def __repr__(self):
        return f"<Vehicle(id={self.id}, plate={self.plate}, type={self.type}, status={self.status})>"
