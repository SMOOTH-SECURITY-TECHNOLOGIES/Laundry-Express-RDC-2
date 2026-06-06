from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, Column, Enum as SQLEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class PricingMode(str, Enum):
    """Mode de tarification"""
    UNIT = "unit"  # Prix par unité
    KG = "kg"      # Prix par kilogramme
    FIXED = "fixed"  # Prix fixe


class RuleType(str, Enum):
    """Type de règle de tarification"""
    EXPRESS_SURCHARGE = "express_surcharge"
    FRAGILE_FABRIC_SURCHARGE = "fragile_fabric_surcharge"
    BULK_DISCOUNT = "bulk_discount"
    MINIMUM_ORDER_FEE = "minimum_order_fee"
    PICKUP_FEE = "pickup_fee"
    DELIVERY_FEE = "delivery_fee"


class PriceAdjustmentType(str, Enum):
    """Type d'ajustement de prix"""
    FIXED = "fixed"       # Montant fixe
    PERCENTAGE = "percentage"  # Pourcentage


class ServiceCategory(BaseModel):
    """Catégorie de service (ex: chemise, pantalon, costume)"""
    __tablename__ = "service_categories"

    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relations
    partner_services = relationship("PartnerService", back_populates="service_category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ServiceCategory(id={self.id}, name={self.name})>"


class ServiceType(BaseModel):
    """Type de service (ex: lavage, pressing, repassage)"""
    __tablename__ = "service_types"

    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relations
    partner_services = relationship("PartnerService", back_populates="service_type", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ServiceType(id={self.id}, name={self.name})>"


class PartnerService(BaseModel):
    """Service proposé par un partenaire"""
    __tablename__ = "partner_services"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    service_category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id"), nullable=False, index=True)
    service_type_id = Column(UUID(as_uuid=True), ForeignKey("service_types.id"), nullable=False, index=True)

    # Tarification
    base_price = Column(Numeric(10, 2), nullable=False)  # Decimal avec 2 décimales
    pricing_mode = Column(SQLEnum(PricingMode), default=PricingMode.UNIT, nullable=False)

    # Délai et disponibilité
    estimated_turnaround_hours = Column(Integer, nullable=False, default=24)
    is_available = Column(Boolean, default=True, nullable=False)

    # Relations
    partner = relationship("Partner")
    service_category = relationship("ServiceCategory", back_populates="partner_services")
    service_type = relationship("ServiceType", back_populates="partner_services")

    def __repr__(self):
        return f"<PartnerService(id={self.id}, partner_id={self.partner_id}, base_price={self.base_price})>"


class PricingRule(BaseModel):
    """Règle de tarification pour un partenaire"""
    __tablename__ = "pricing_rules"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Filtrage de la règle
    rule_type = Column(SQLEnum(RuleType), nullable=False)
    service_category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id"), nullable=True)
    service_type_id = Column(UUID(as_uuid=True), ForeignKey("service_types.id"), nullable=True)
    
    # Conditions d'application
    min_quantity = Column(Integer, nullable=True)  # Quantité minimum pour appliquer la règle
    max_quantity = Column(Integer, nullable=True)  # Quantité maximum pour appliquer la règle
    
    # Ajustement de prix
    price_adjustment_type = Column(SQLEnum(PriceAdjustmentType), nullable=False)
    price_adjustment_value = Column(Numeric(10, 2), nullable=False)  # Montant ou pourcentage
    
    # Activation
    is_active = Column(Boolean, default=True, nullable=False)

    # Relations
    partner = relationship("Partner")
    service_category = relationship("ServiceCategory")
    service_type = relationship("ServiceType")

    def __repr__(self):
        return f"<PricingRule(id={self.id}, partner_id={self.partner_id}, rule_type={self.rule_type})>"