from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.schemas.order import OrderItemCreate


class PricingEstimateItemInput(BaseModel):
    """Article pour l'estimation de prix"""
    service_id: UUID
    quantity: float = Field(..., gt=0)
    item_name: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None

    @validator("quantity")
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("La quantité doit être positive")
        return v


class PricingEstimateRequest(BaseModel):
    """Requête d'estimation de prix"""
    partner_id: UUID
    items: List[PricingEstimateItemInput] = Field(..., min_items=1)
    express: bool = False
    pickup_requested: bool = True
    delivery_requested: bool = True
    promo_code: Optional[str] = Field(None, max_length=50)
    loyalty_points_to_redeem: int = Field(default=0, ge=0)
    customer_id: Optional[UUID] = None

    @validator("items")
    def validate_items(cls, v):
        if not v:
            raise ValueError("Au moins un article est requis")
        return v


class PricingBreakdownItem(BaseModel):
    """Détail d'un article dans le breakdown"""
    item_name: str
    service_id: UUID
    quantity: float
    unit_price: Decimal
    line_total: Decimal
    pricing_mode: str
    notes: Optional[str] = None


class PricingAdjustmentLine(BaseModel):
    """Ligne d'ajustement dans le breakdown"""
    name: str
    description: Optional[str] = None
    adjustment_type: str
    amount: Decimal
    rule_type: Optional[str] = None


class PricingEstimateResponse(BaseModel):
    """Réponse d'estimation de prix avec breakdown"""
    subtotal: Decimal
    surcharge_total: Decimal
    discount_total: Decimal
    fee_total: Decimal
    total: Decimal
    currency: str = "CDF"
    items: List[PricingBreakdownItem]
    adjustments: List[PricingAdjustmentLine]
    partner_id: UUID
    express_applied: bool
    pickup_fee_applied: bool
    delivery_fee_applied: bool
    minimum_order_fee_applied: bool
    explanation: Optional[str] = None


class PriceCalculationInput(BaseModel):
    """Entrée pour le calcul de prix (utilisé par OrderService)"""
    partner_id: UUID
    items: List[OrderItemCreate]
    express: bool = False
    pickup_requested: bool = True
    delivery_requested: bool = True
    promo_code: Optional[str] = Field(None, max_length=50)
    loyalty_points_to_redeem: int = Field(default=0, ge=0)
    customer_id: Optional[UUID] = None

    @validator("items")
    def validate_items(cls, v):
        if not v:
            raise ValueError("Au moins un article est requis")
        return v


class PriceCalculationResult(BaseModel):
    """Résultat du calcul de prix (utilisé par OrderService)"""
    subtotal_amount: Decimal
    discount_amount: Decimal
    pickup_fee: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    currency: str = "CDF"
    calculation_breakdown: Optional[dict] = None
