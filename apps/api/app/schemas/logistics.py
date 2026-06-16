from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator, HttpUrl

from app.models.logistics import (
    DriverStatus,
    TaskType,
    DeliveryTaskStatus,
    LocationType
)


# ===== Driver Schemas =====

class DriverCreate(BaseModel):
    """Schéma pour créer un chauffeur"""
    user_id: UUID
    vehicle_type: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=100)
    status: DriverStatus = DriverStatus.ACTIVE
    is_available: bool = True


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
