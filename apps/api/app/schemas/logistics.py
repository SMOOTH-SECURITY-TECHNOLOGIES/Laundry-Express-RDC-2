from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator, HttpUrl

from app.models.logistics import (
    DriverStatus,
    TaskType,
    DeliveryTaskStatus,
    LocationType,
    VehicleType,
    VehicleStatus,
    VehicleMaintenanceStatus
)


def _to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


# ===== Driver Schemas =====

class DriverCreate(BaseModel):
    """Schéma pour créer un chauffeur (compte + profil + rattachement compagnie)."""
    user_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=9, max_length=20)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    delivery_company_id: Optional[UUID] = None
    vehicle_type: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=100)
    status: DriverStatus = DriverStatus.ACTIVE
    is_available: bool = True

    @validator("phone")
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.replace("+", "").isdigit():
            raise ValueError("Le numéro de téléphone doit contenir uniquement des chiffres")
        return value


class DriverUpdate(BaseModel):
    """Schéma pour mettre à jour un chauffeur"""
    vehicle_type: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=100)
    status: Optional[DriverStatus] = None
    is_available: Optional[bool] = None
    rating_avg: Optional[Decimal] = Field(None, ge=0, le=5)
    rating_count: Optional[int] = Field(None, ge=0)


class DriverResponse(BaseModel):
    """Schéma de réponse pour un chauffeur"""
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    avatar_url: Optional[str] = None
    vehicle_type: Optional[str]
    license_number: Optional[str]
    status: DriverStatus
    is_available: bool
    rating_avg: Decimal
    rating_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Driver Location Schemas =====

class DriverLocationCreate(BaseModel):
    """Schéma pour créer une localisation de chauffeur"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    @validator('latitude')
    def validate_latitude(cls, v):
        if v < -90 or v > 90:
            raise ValueError('La latitude doit être entre -90 et 90')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v < -180 or v > 180:
            raise ValueError('La longitude doit être entre -180 et 180')
        return v


class DriverLocationResponse(BaseModel):
    """Schéma de réponse pour une localisation de chauffeur"""
    id: UUID
    driver_id: UUID
    latitude: float
    longitude: float
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Delivery Task Schemas =====

class DeliveryTaskCreate(BaseModel):
    """Schéma pour créer une tâche de livraison"""
    order_id: UUID
    task_type: TaskType
    pickup_location_type: Optional[LocationType] = None
    dropoff_location_type: Optional[LocationType] = None
    scheduled_at: Optional[datetime] = None


class DeliveryTaskResponse(BaseModel):
    """Schéma de réponse pour une tâche de livraison"""
    id: UUID
    order_id: UUID
    order_number: Optional[str] = None
    driver_id: Optional[UUID]
    task_type: TaskType
    status: DeliveryTaskStatus
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_address_label: Optional[str] = None
    pickup_address_line: Optional[str] = None
    pickup_commune: Optional[str] = None
    delivery_address_label: Optional[str] = None
    delivery_address_line: Optional[str] = None
    delivery_commune: Optional[str] = None
    partner_name: Optional[str] = None
    pickup_location_type: Optional[LocationType]
    dropoff_location_type: Optional[LocationType]
    scheduled_at: Optional[datetime]
    assigned_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    proof_photo_url: Optional[str]
    proof_note: Optional[str]
    claimed_by_company_id: Optional[UUID] = None
    market_visible: bool = False
    market_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Task Action Schemas =====

class TaskAssignRequest(BaseModel):
    """Schéma pour assigner une tâche à un chauffeur"""
    driver_id: UUID


class TaskAcceptRequest(BaseModel):
    """Schéma pour accepter une tâche"""
    pass  # Aucun champ supplémentaire nécessaire


class TaskStartRequest(BaseModel):
    """Schéma pour démarrer une tâche"""
    pass  # Aucun champ supplémentaire nécessaire


class TaskCompleteRequest(BaseModel):
    """Schéma pour compléter une tâche"""
    proof_note: Optional[str] = Field(None, max_length=1000)
    proof_photo_url: Optional[str] = Field(None, max_length=500)


class TaskFailRequest(BaseModel):
    """Schéma pour marquer une tâche comme échouée"""
    reason: str = Field(..., min_length=1, max_length=500)


class TaskCancelRequest(BaseModel):
    """Schéma pour annuler une tâche"""
    reason: Optional[str] = Field(None, max_length=500)


# ===== List Response Schemas =====

class TaskListResponse(BaseModel):
    """Schéma de réponse pour la liste des tâches"""
    tasks: List[DeliveryTaskResponse]
    total: int
    page: int
    page_size: int


class DriverListResponse(BaseModel):
    """Schéma de réponse pour la liste des chauffeurs"""
    drivers: List[DriverResponse]
    total: int
    page: int
    page_size: int


# ===== Integration Schemas =====

class AvailableDriverResponse(BaseModel):
    """Schéma pour un chauffeur disponible"""
    driver: DriverResponse
    last_location: Optional[DriverLocationResponse] = None


class TaskAssignmentResult(BaseModel):
    """Résultat d'une assignation de tâche"""
    task: DeliveryTaskResponse
    driver: DriverResponse
    success: bool
    message: Optional[str] = None


# ===== Vehicle Schemas =====

class VehicleCreate(BaseModel):
    """Schéma pour créer un véhicule"""
    delivery_company_id: Optional[UUID] = None
    plate: str = Field(..., max_length=50)
    type: VehicleType
    status: VehicleStatus = VehicleStatus.PENDING
    driver_id: Optional[UUID] = None
    assigned_driver_name: Optional[str] = Field(None, max_length=200)
    zone: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    last_known_location: Optional[str] = Field(None, max_length=200)
    mileage_km: int = Field(0, ge=0)
    insurance_expires_at: Optional[datetime] = None
    maintenance_status: VehicleMaintenanceStatus = VehicleMaintenanceStatus.OK
    maintenance_next_service_km: int = Field(0, ge=0)
    maintenance_notes: Optional[str] = None


class VehicleUpdate(BaseModel):
    """Schéma pour mettre à jour un véhicule"""
    delivery_company_id: Optional[UUID] = None
    plate: Optional[str] = Field(None, max_length=50)
    type: Optional[VehicleType] = None
    status: Optional[VehicleStatus] = None
    driver_id: Optional[UUID] = None
    assigned_driver_name: Optional[str] = Field(None, max_length=200)
    zone: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    last_known_location: Optional[str] = Field(None, max_length=200)
    mileage_km: Optional[int] = Field(None, ge=0)
    insurance_expires_at: Optional[datetime] = None
    maintenance_status: Optional[VehicleMaintenanceStatus] = None
    maintenance_next_service_km: Optional[int] = Field(None, ge=0)
    maintenance_notes: Optional[str] = None


class VehicleMaintenanceResponse(BaseModel):
    """Schéma de réponse pour la maintenance d'un véhicule"""
    status: VehicleMaintenanceStatus
    next_service_at_km: int = Field(alias="nextServiceAtKm")
    notes: Optional[str] = None

    model_config = {"alias_generator": _to_camel, "populate_by_name": True}


class VehicleResponse(BaseModel):
    """Schéma de réponse pour un véhicule"""
    id: UUID
    delivery_company_id: Optional[UUID] = Field(None, alias="deliveryCompanyId")
    plate: str
    type: VehicleType
    status: VehicleStatus
    driver_id: Optional[UUID] = Field(None, alias="driverId")
    assigned_driver_name: Optional[str] = Field(None, alias="assignedDriverName")
    zone: str = ""
    location: str = ""
    last_known_location: Optional[str] = Field(None, alias="lastKnownLocation")
    mileage_km: int = Field(0, alias="mileageKm")
    insurance_expires_at: Optional[datetime] = Field(None, alias="insuranceExpiresAt")
    maintenance: VehicleMaintenanceResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "alias_generator": _to_camel, "populate_by_name": True}


class VehicleListResponse(BaseModel):
    """Schéma de réponse pour la liste des véhicules"""
    vehicles: List[VehicleResponse]


# ===== Trip Schemas =====

class TripResponse(BaseModel):
    """Schéma de réponse pour un trajet"""
    id: UUID
    taskId: UUID = Field(alias="taskId")
    status: str
    origin: str = ""
    destination: str = ""
    customerName: Optional[str] = Field(None, alias="customerName")
    driverName: Optional[str] = Field(None, alias="driverName")
    vehiclePlate: Optional[str] = Field(None, alias="vehiclePlate")
    estimatedDurationMinutes: Optional[int] = Field(None, alias="estimatedDurationMinutes")
    etaMinutes: Optional[int] = Field(None, alias="etaMinutes")
    distanceKm: Optional[float] = Field(None, alias="distanceKm")

    model_config = {"from_attributes": True, "alias_generator": _to_camel, "populate_by_name": True}


class TripListResponse(BaseModel):
    """Schéma de réponse pour la liste des trajets"""
    trips: List[TripResponse]


# ===== Tracking Point Schemas =====

class TrackingPointResponse(BaseModel):
    """Schéma de réponse pour un point de suivi"""
    id: UUID
    tripId: UUID = Field(alias="tripId")
    kind: str
    label: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    recordedAt: str = Field(alias="recordedAt")
    status: str
    driverName: Optional[str] = Field(None, alias="driverName")
    vehiclePlate: Optional[str] = Field(None, alias="vehiclePlate")

    model_config = {"from_attributes": True, "alias_generator": _to_camel, "populate_by_name": True}


class TrackingPointListResponse(BaseModel):
    """Schéma de réponse pour la liste des points de suivi"""
    tracking_points: List[TrackingPointResponse]


# ===== Maintenance Event Schemas =====

class MaintenanceEventResponse(BaseModel):
    """Schéma de réponse pour un événement de maintenance"""
    id: UUID
    vehicleId: UUID = Field(alias="vehicleId")
    vehiclePlate: Optional[str] = Field(None, alias="vehiclePlate")
    title: str = ""
    type: str
    status: str
    dueDate: str = Field(alias="dueDate")
    cost: float = 0.0
    nextControlAt: str = Field(alias="nextControlAt")
    alert: Optional[str] = None
    vehicleAvailable: bool = Field(True, alias="vehicleAvailable")
    costEstimate: Optional[float] = Field(None, alias="costEstimate")

    model_config = {"from_attributes": True, "alias_generator": _to_camel, "populate_by_name": True}


class MaintenanceEventListResponse(BaseModel):
    """Schéma de réponse pour la liste des événements de maintenance"""
    maintenance_events: List[MaintenanceEventResponse]


# ===== Advanced TMS Capability Schemas =====

class DriverBehaviorTopDriver(BaseModel):
    driverId: UUID
    driverName: str
    score: int
    completedMissions: int
    punctualityRate: int


class DriverBehaviorSummaryResponse(BaseModel):
    scoredDrivers: int
    averageScore: int
    punctualityRate: int
    delayedMissions: int
    cancellationRate: int
    incidentCount: int
    topDrivers: List[DriverBehaviorTopDriver]


class FuelUsageVehicleResponse(BaseModel):
    vehicleId: UUID
    vehiclePlate: str
    estimatedCost: float
    distanceKm: float
    anomaly: Optional[str] = None


class FuelUsageSummaryResponse(BaseModel):
    trackedVehicles: int
    estimatedCost: float
    costPerMission: float
    costPerKm: float
    anomalyCount: int
    budgetUsedPercent: int
    byVehicle: List[FuelUsageVehicleResponse]


class StockLevelItemResponse(BaseModel):
    id: str
    label: str
    location: str
    quantity: int
    threshold: int
    unit: str


class StockLevelSummaryResponse(BaseModel):
    depotStock: int
    driverKitStock: int
    projectedNeed: int
    lowStockItems: int
    coverageDays: int
    items: List[StockLevelItemResponse]


class ConnectivityAppVersionResponse(BaseModel):
    version: str
    driverCount: int


class ConnectivityHealthSummaryResponse(BaseModel):
    activeDrivers: int
    driversWithRecentSignal: int
    driversWithoutSignal: int
    staleSignals: int
    syncPending: int
    coverageRate: int
    lastPingAt: Optional[str] = None
    appVersions: List[ConnectivityAppVersionResponse] = Field(default_factory=list)
