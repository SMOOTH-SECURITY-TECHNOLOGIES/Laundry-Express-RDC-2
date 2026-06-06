from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class OrderStatus(str, Enum):
    """Statuts métier des commandes"""
    DRAFT = "draft"
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKUP_DRIVER_ASSIGNED = "pickup_driver_assigned"
    PICKUP_IN_PROGRESS = "pickup_in_progress"
    PICKED_UP = "picked_up"
    RECEIVED_BY_PARTNER = "received_by_partner"
    CLEANING_IN_PROGRESS = "cleaning_in_progress"
    QUALITY_CHECK = "quality_check"
    READY_FOR_DELIVERY = "ready_for_delivery"
    DELIVERY_DRIVER_ASSIGNED = "delivery_driver_assigned"
    DELIVERY_IN_PROGRESS = "delivery_in_progress"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    DISPUTED = "disputed"


class PaymentStatus(str, Enum):
    """Statuts de paiement"""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CASH_PENDING = "cash_pending"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class OrderItemCreate(BaseModel):
    """Schéma pour créer un article de commande"""
    service_id: UUID
    item_name: str = Field(..., min_length=1, max_length=255)
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    notes: Optional[str] = None
    detected_by_ai: bool = False

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('La quantité doit être positive')
        return v

    @validator('unit_price')
    def validate_unit_price(cls, v):
        if v < 0:
            raise ValueError('Le prix unitaire ne peut pas être négatif')
        return v


class OrderCreate(BaseModel):
    """Schéma pour créer une commande"""
    partner_id: UUID
    pickup_address_id: Optional[UUID] = None
    delivery_address_id: Optional[UUID] = None
    items: List[OrderItemCreate] = Field(..., min_items=1)
    currency: str = Field(default="CDF", min_length=3, max_length=3)
    special_instructions: Optional[str] = None
    pickup_date: Optional[datetime] = None
    pickup_time_slot: Optional[str] = None
    delivery_date: Optional[datetime] = None
    delivery_time_slot: Optional[str] = None
    express: bool = False
    pickup_requested: bool = True
    delivery_requested: bool = True
    promo_code: Optional[str] = Field(default=None, max_length=50)
    loyalty_points_to_redeem: int = Field(default=0, ge=0)
    idempotency_key: Optional[str] = Field(default=None, min_length=8, max_length=128)

    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('Une commande doit contenir au moins un article')
        return v


class OrderEstimateRequest(BaseModel):
    """Schéma pour estimer le prix d'une commande"""
    partner_id: UUID
    items: List[OrderItemCreate] = Field(..., min_items=1)
    currency: str = Field(default="CDF", min_length=3, max_length=3)
    express: bool = False
    pickup_requested: bool = True
    delivery_requested: bool = True
    promo_code: Optional[str] = Field(default=None, max_length=50)
    loyalty_points_to_redeem: int = Field(default=0, ge=0)
    customer_id: Optional[UUID] = None


class OrderEstimateResponse(BaseModel):
    """Réponse d'estimation de prix"""
    subtotal_amount: Decimal
    discount_amount: Decimal = Decimal("0.00")
    pickup_fee: Decimal = Decimal("0.00")
    delivery_fee: Decimal = Decimal("0.00")
    total_amount: Decimal
    currency: str
    calculation_breakdown: Optional[dict[str, Any]] = None


class OrderStatusUpdateRequest(BaseModel):
    """Schéma pour mettre à jour le statut d'une commande"""
    new_status: OrderStatus
    change_reason: Optional[str] = None
    proof_photo_url: Optional[str] = None
    proof_note: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None


class OrderItemResponse(BaseModel):
    """Réponse pour un article de commande"""
    id: UUID
    order_id: UUID
    service_id: UUID
    item_name: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal
    notes: Optional[str]
    detected_by_ai: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusHistoryResponse(BaseModel):
    """Réponse pour l'historique des statuts"""
    id: UUID
    order_id: UUID
    old_status: Optional[str]
    new_status: str
    changed_by_user_id: Optional[UUID]
    change_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Réponse pour une commande"""
    id: UUID
    order_number: str
    customer_id: UUID
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    partner_id: UUID
    partner_name: Optional[str] = None
    pickup_address_id: Optional[UUID]
    delivery_address_id: Optional[UUID]
    idempotency_key: Optional[str]
    status: OrderStatus
    payment_status: PaymentStatus
    currency: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    pickup_fee: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    refunded_amount: Decimal
    special_instructions: Optional[str]
    calculation_breakdown: Optional[dict[str, Any]]
    express: bool
    pickup_requested: bool
    delivery_requested: bool
    pickup_date: Optional[datetime]
    pickup_time_slot: Optional[str]
    delivery_date: Optional[datetime]
    delivery_time_slot: Optional[str]
    pickup_contact_name: Optional[str]
    pickup_contact_phone: Optional[str]
    pickup_commune: Optional[str]
    confirmed_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Réponse pour la liste des commandes"""
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int


class PublicOrderSocialProofResponse(BaseModel):
    """Réponse publique anonymisée pour le social proof."""
    order_id: UUID
    order_number: str
    customer_first_name: str
    commune: str
    created_at: datetime


class OrderCancelRequest(BaseModel):
    """Schéma pour annuler une commande"""
    reason: Optional[str] = None
