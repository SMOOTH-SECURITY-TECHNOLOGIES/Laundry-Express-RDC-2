from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.models.marketplace import (
    DeliveryCompanyStatus,
    DispatchStrategy,
    DispatchMode,
    DispatchScopeType
)
from app.models.logistics import DeliveryTaskStatus, TaskType, LocationType


# ===== Delivery Company Schemas =====

class DeliveryCompanyBase(BaseModel):
    """Schéma de base pour une compagnie de livraison"""
    name: str = Field(..., min_length=2, max_length=200, description="Nom de la compagnie")
    slug: str = Field(..., min_length=2, max_length=200, description="Slug unique")
    phone: Optional[str] = Field(None, max_length=50, description="Numéro de téléphone")
    email: Optional[str] = Field(None, max_length=255, description="Email")
    status: DeliveryCompanyStatus = Field(DeliveryCompanyStatus.ACTIVE, description="Statut")
    is_active: bool = Field(True, description="Actif")
    supports_pickup: bool = Field(True, description="Supporte les pickups")
    supports_delivery: bool = Field(True, description="Supporte les deliveries")


class DeliveryCompanyCreate(DeliveryCompanyBase):
    """Schéma pour créer une compagnie"""
    pass


class DeliveryCompanyUpdate(BaseModel):
    """Schéma pour mettre à jour une compagnie"""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    slug: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    status: Optional[DeliveryCompanyStatus] = None
    is_active: Optional[bool] = None
    supports_pickup: Optional[bool] = None
    supports_delivery: Optional[bool] = None


class DeliveryCompanyResponse(DeliveryCompanyBase):
    """Schéma de réponse pour une compagnie"""
    id: UUID
    rating_avg: float = Field(..., ge=0.0, le=5.0, description="Note moyenne")
    rating_count: int = Field(..., ge=0, description="Nombre d'évaluations")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== Company Driver Schemas =====

class CompanyDriverBase(BaseModel):
    """Schéma de base pour un chauffeur de compagnie"""
    driver_id: UUID = Field(..., description="ID du chauffeur")
    is_active: bool = Field(True, description="Actif")


class CompanyDriverCreate(CompanyDriverBase):
    """Schéma pour créer un chauffeur de compagnie"""
    pass


class CompanyDriverResponse(CompanyDriverBase):
    """Schéma de réponse pour un chauffeur de compagnie"""
    id: UUID
    company_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Company Service Zone Schemas =====

class CompanyServiceZoneBase(BaseModel):
    """Schéma de base pour une zone de service"""
    city: str = Field(..., min_length=2, max_length=100, description="Ville")
    commune: Optional[str] = Field(None, max_length=100, description="Commune")
    zone: Optional[str] = Field(None, max_length=100, description="Zone")
    is_active: bool = Field(True, description="Actif")


class CompanyServiceZoneCreate(CompanyServiceZoneBase):
    """Schéma pour créer une zone de service"""
    pass


class CompanyServiceZoneResponse(CompanyServiceZoneBase):
    """Schéma de réponse pour une zone de service"""
    id: UUID
    company_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== Dispatch Setting Schemas =====

class DispatchSettingBase(BaseModel):
    """Schéma de base pour un paramètre de dispatch"""
    scope_type: DispatchScopeType = Field(..., description="Type de scope")
    scope_id: Optional[UUID] = Field(None, description="ID du scope (partenaire, ville, etc.)")
    dispatch_strategy: DispatchStrategy = Field(..., description="Stratégie de dispatch")
    marketplace_timeout_minutes: int = Field(30, ge=1, le=1440, description="Timeout marketplace en minutes")
    driver_assignment_timeout_minutes: int = Field(15, ge=1, le=1440, description="Timeout assignation chauffeur en minutes")
    is_active: bool = Field(True, description="Actif")
    
    @validator("scope_id")
    def validate_scope_id(cls, v, values):
        scope_type = values.get("scope_type")
        if scope_type != DispatchScopeType.GLOBAL and v is None:
            raise ValueError(f"scope_id est requis pour scope_type={scope_type}")
        if scope_type == DispatchScopeType.GLOBAL and v is not None:
            raise ValueError("scope_id ne doit pas être défini pour scope_type=GLOBAL")
        return v


class DispatchSettingCreate(DispatchSettingBase):
    """Schéma pour créer un paramètre de dispatch"""
    pass


class DispatchSettingUpdate(BaseModel):
    """Schéma pour mettre à jour un paramètre de dispatch"""
    dispatch_strategy: Optional[DispatchStrategy] = None
    marketplace_timeout_minutes: Optional[int] = Field(None, ge=1, le=1440)
    driver_assignment_timeout_minutes: Optional[int] = Field(None, ge=1, le=1440)
    is_active: Optional[bool] = None


class DispatchSettingResponse(DispatchSettingBase):
    """Schéma de réponse pour un paramètre de dispatch"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== Marketplace Task Schemas =====

class MarketTaskPublicResponse(BaseModel):
    """Schéma de réponse publique pour une tâche marketplace (avant claim)"""
    id: UUID
    task_type: TaskType
    status: DeliveryTaskStatus
    pickup_location_type: Optional[LocationType]
    dropoff_location_type: Optional[LocationType]
    scheduled_at: Optional[datetime]
    market_opened_at: Optional[datetime]
    market_expires_at: Optional[datetime]
    
    # Informations non sensibles
    pickup_city: Optional[str] = Field(None, description="Ville de pickup")
    dropoff_city: Optional[str] = Field(None, description="Ville de dropoff")
    estimated_weight_kg: Optional[float] = Field(None, ge=0, description="Poids estimé en kg")
    estimated_volume_m3: Optional[float] = Field(None, ge=0, description="Volume estimé en m3")
    proposed_price: Optional[float] = Field(None, ge=0, description="Prix proposé")
    special_instructions: Optional[str] = Field(None, description="Instructions non sensibles")
    
    class Config:
        from_attributes = True


class MarketTaskClaimedResponse(BaseModel):
    """Schéma de réponse pour une tâche marketplace après claim"""
    id: UUID
    task_type: TaskType
    status: DeliveryTaskStatus
    claimed_by_company_id: UUID
    claimed_at: datetime
    
    # Informations complètes
    order_id: UUID
    pickup_address: str = Field(..., description="Adresse complète de pickup")
    dropoff_address: str = Field(..., description="Adresse complète de dropoff")
    customer_name: str = Field(..., description="Nom du client")
    customer_phone: str = Field(..., description="Téléphone du client")
    customer_notes: Optional[str] = Field(None, description="Notes du client")
    
    # Détails de la commande
    order_items_count: int = Field(..., ge=0, description="Nombre d'articles")
    total_weight_kg: Optional[float] = Field(None, ge=0, description="Poids total en kg")
    total_volume_m3: Optional[float] = Field(None, ge=0, description="Volume total en m3")
    
    class Config:
        from_attributes = True


# ===== Request Schemas =====

class DispatchTaskRequest(BaseModel):
    """Requête pour dispatcher une tâche"""
    task_id: UUID = Field(..., description="ID de la tâche à dispatcher")


class TaskClaimRequest(BaseModel):
    """Requête pour claimer une tâche marketplace"""
    company_id: UUID = Field(..., description="ID de la compagnie qui claim")


class AssignInternalDriverRequest(BaseModel):
    """Requête pour assigner un chauffeur interne"""
    driver_id: UUID = Field(..., description="ID du chauffeur interne")


class AssignCompanyDriverRequest(BaseModel):
    """Requête pour assigner un chauffeur de compagnie"""
    company_id: UUID = Field(..., description="ID de la compagnie propriétaire du chauffeur")
    driver_id: UUID = Field(..., description="ID du chauffeur de la compagnie")


class TaskExpireRequest(BaseModel):
    """Requête pour expirer une tâche marketplace"""
    reason: Optional[str] = Field(None, description="Raison de l'expiration")


class TaskFallbackRequest(BaseModel):
    """Requête pour fallback d'une tâche"""
    fallback_strategy: Optional[DispatchStrategy] = Field(None, description="Stratégie de fallback")


# ===== Response Schemas =====

class DispatchResultResponse(BaseModel):
    """Résultat d'un dispatch"""
    task_id: UUID
    status: DeliveryTaskStatus
    dispatch_mode: Optional[DispatchMode]
    assigned_company_id: Optional[UUID]
    assigned_driver_id: Optional[UUID]
    market_opened_at: Optional[datetime]
    market_expires_at: Optional[datetime]
    message: str = Field(..., description="Message descriptif")


class ClaimResultResponse(BaseModel):
    """Résultat d'un claim"""
    task_id: UUID
    claimed_by_company_id: UUID
    claimed_at: datetime
    status: DeliveryTaskStatus
    message: str = Field(..., description="Message descriptif")


class MarketTaskListResponse(BaseModel):
    """Liste des tâches marketplace"""
    tasks: List[MarketTaskPublicResponse]
    total: int = Field(..., ge=0, description="Nombre total de tâches")
    page: int = Field(..., ge=1, description="Page actuelle")
    page_size: int = Field(..., ge=1, le=100, description="Taille de page")


class DeliveryCompanyListResponse(BaseModel):
    """Liste des compagnies de livraison"""
    companies: List[DeliveryCompanyResponse]
    total: int = Field(..., ge=0, description="Nombre total de compagnies")
    page: int = Field(..., ge=1, description="Page actuelle")
    page_size: int = Field(..., ge=1, le=100, description="Taille de page")


class DispatchSettingListResponse(BaseModel):
    """Liste des paramètres de dispatch"""
    settings: List[DispatchSettingResponse]
    total: int = Field(..., ge=0, description="Nombre total de paramètres")
    page: int = Field(..., ge=1, description="Page actuelle")
    page_size: int = Field(..., ge=1, le=100, description="Taille de page")
