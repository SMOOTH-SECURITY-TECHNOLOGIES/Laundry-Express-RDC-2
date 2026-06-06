from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.models.catalog import PricingMode, RuleType, PriceAdjustmentType


class ServiceCategoryBase(BaseModel):
    """Schéma de base pour une catégorie de service"""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class ServiceCategoryCreate(ServiceCategoryBase):
    """Schéma pour créer une catégorie de service"""
    pass


class ServiceCategoryUpdate(BaseModel):
    """Schéma pour mettre à jour une catégorie de service"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceCategoryResponse(ServiceCategoryBase):
    """Réponse pour une catégorie de service"""
    id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ServiceTypeBase(BaseModel):
    """Schéma de base pour un type de service"""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True


class ServiceTypeCreate(ServiceTypeBase):
    """Schéma pour créer un type de service"""
    pass


class ServiceTypeUpdate(BaseModel):
    """Schéma pour mettre à jour un type de service"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceTypeResponse(ServiceTypeBase):
    """Réponse pour un type de service"""
    id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PartnerServiceBase(BaseModel):
    """Schéma de base pour un service partenaire"""
    service_category_id: UUID
    service_type_id: UUID
    base_price: Decimal = Field(..., ge=0)
    pricing_mode: PricingMode = PricingMode.UNIT
    estimated_turnaround_hours: int = Field(24, ge=1, le=720)  # 1h à 30 jours
    is_available: bool = True

    @validator('base_price')
    def validate_base_price(cls, v):
        if v < 0:
            raise ValueError('Le prix de base ne peut pas être négatif')
        return v


class PartnerServiceCreate(PartnerServiceBase):
    """Schéma pour créer un service partenaire"""
    pass


class PartnerServiceUpdate(BaseModel):
    """Schéma pour mettre à jour un service partenaire"""
    service_category_id: Optional[UUID] = None
    service_type_id: Optional[UUID] = None
    base_price: Optional[Decimal] = Field(None, ge=0)
    pricing_mode: Optional[PricingMode] = None
    estimated_turnaround_hours: Optional[int] = Field(None, ge=1, le=720)
    is_available: Optional[bool] = None


class PartnerServiceResponse(PartnerServiceBase):
    """Réponse pour un service partenaire"""
    id: UUID
    partner_id: UUID
    service_category_name: Optional[str] = None
    service_type_name: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PricingRuleBase(BaseModel):
    """Schéma de base pour une règle de tarification"""
    rule_type: RuleType
    service_category_id: Optional[UUID] = None
    service_type_id: Optional[UUID] = None
    min_quantity: Optional[int] = Field(None, ge=1)
    max_quantity: Optional[int] = Field(None, ge=1)
    price_adjustment_type: PriceAdjustmentType
    price_adjustment_value: Decimal = Field(...)
    is_active: bool = True

    @validator('price_adjustment_value')
    def validate_adjustment_value(cls, v, values):
        if 'price_adjustment_type' in values:
            if values['price_adjustment_type'] == PriceAdjustmentType.PERCENTAGE:
                if v < 0 or v > 100:
                    raise ValueError('Le pourcentage doit être entre 0 et 100')
            else:  # FIXED
                if v < 0:
                    raise ValueError('Le montant fixe ne peut pas être négatif')
        return v

    @validator('max_quantity')
    def validate_max_quantity(cls, v, values):
        if v is not None and 'min_quantity' in values and values['min_quantity'] is not None:
            if v <= values['min_quantity']:
                raise ValueError('La quantité maximum doit être supérieure à la quantité minimum')
        return v


class PricingRuleCreate(PricingRuleBase):
    """Schéma pour créer une règle de tarification"""
    pass


class PricingRuleUpdate(BaseModel):
    """Schéma pour mettre à jour une règle de tarification"""
    rule_type: Optional[RuleType] = None
    service_category_id: Optional[UUID] = None
    service_type_id: Optional[UUID] = None
    min_quantity: Optional[int] = Field(None, ge=1)
    max_quantity: Optional[int] = Field(None, ge=1)
    price_adjustment_type: Optional[PriceAdjustmentType] = None
    price_adjustment_value: Optional[Decimal] = Field(None)
    is_active: Optional[bool] = None


class PricingRuleResponse(PricingRuleBase):
    """Réponse pour une règle de tarification"""
    id: UUID
    partner_id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CatalogListResponse(BaseModel):
    """Réponse pour la liste du catalogue"""
    service_categories: List[ServiceCategoryResponse]
    service_types: List[ServiceTypeResponse]


class CatalogPartnerSummaryResponse(BaseModel):
    """Résumé public d'un partenaire pour le MVP frontend"""
    id: UUID
    name: str
    business_name: str
    partner_type: str
    status: str
    is_verified: bool
    is_featured: bool
    is_accepting_orders: bool
    rating: float
    total_reviews: int
    city: Optional[str] = None
    commune: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_service_count: int = 0
