import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class PartnerStatus(str, Enum):
    """Statuts du partenaire"""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    UNDER_REVIEW = "under_review"


class PartnerType(str, Enum):
    """Types de partenaires"""
    LAUNDRY = "laundry"
    PRESSING = "pressing"
    DRY_CLEANING = "dry_cleaning"
    MULTI_SERVICE = "multi_service"


class Partner(BaseModel):
    """Modèle partenaire"""
    __tablename__ = "partners"

    # Informations de base
    name = Column(String(255), nullable=False, index=True)
    business_name = Column(String(255), nullable=False)
    tax_id = Column(String(100), nullable=True, unique=True)
    partner_type = Column(String(50), default=PartnerType.LAUNDRY, nullable=False)
    status = Column(String(50), default=PartnerStatus.PENDING, nullable=False)
    
    # Contact
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=False, index=True)
    website = Column(String(255), nullable=True)
    
    # Configuration
    is_verified = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_accepting_orders = Column(Boolean, default=True, nullable=False)
    
    # Métriques
    rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    
    # Relations
    locations = relationship("PartnerLocation", back_populates="partner", cascade="all, delete-orphan")
    documents = relationship("PartnerDocument", back_populates="partner", cascade="all, delete-orphan")
    operating_hours = relationship("PartnerOperatingHours", back_populates="partner", cascade="all, delete-orphan")
    staff = relationship("PartnerStaff", back_populates="partner", cascade="all, delete-orphan")
    services = relationship("PartnerService", back_populates="partner", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Partner(id={self.id}, name={self.name}, status={self.status})>"


class PartnerLocation(BaseModel):
    """Localisation du partenaire"""
    __tablename__ = "partner_locations"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Adresse
    address_line_1 = Column(String(255), nullable=False)
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, default="Kinshasa")
    commune = Column(String(100), nullable=False)
    zone = Column(String(100), nullable=True)
    
    # Coordonnées
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Configuration
    is_primary = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relations
    partner = relationship("Partner", back_populates="locations")
    
    def __repr__(self):
        return f"<PartnerLocation(id={self.id}, partner_id={self.partner_id}, city={self.city})>"


class PartnerDocument(BaseModel):
    """Document du partenaire"""
    __tablename__ = "partner_documents"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Informations du document
    document_type = Column(String(100), nullable=False)  # business_license, tax_certificate, id_card, etc.
    document_url = Column(Text, nullable=False)
    document_name = Column(String(255), nullable=False)
    
    # Vérification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(UUID(as_uuid=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    partner = relationship("Partner", back_populates="documents")
    
    def __repr__(self):
        return f"<PartnerDocument(id={self.id}, partner_id={self.partner_id}, type={self.document_type})>"


class PartnerOperatingHours(BaseModel):
    """Heures d'ouverture du partenaire"""
    __tablename__ = "partner_operating_hours"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    
    # Jour et heures
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    opens_at = Column(String(10), nullable=False)  # Format: "09:00"
    closes_at = Column(String(10), nullable=False)  # Format: "18:00"
    
    # Configuration
    is_closed = Column(Boolean, default=False, nullable=False)
    
    # Relations
    partner = relationship("Partner", back_populates="operating_hours")
    
    def __repr__(self):
        return f"<PartnerOperatingHours(id={self.id}, partner_id={self.partner_id}, day={self.day_of_week})>"


class PartnerStaff(BaseModel):
    """Staff du partenaire"""
    __tablename__ = "partner_staff"

    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Rôle et permissions
    role = Column(String(100), nullable=False)  # manager, staff, driver, etc.
    permissions = Column(Text, nullable=True)  # JSON des permissions
    
    # Configuration
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relations
    partner = relationship("Partner", back_populates="staff")
    
    def __repr__(self):
        return f"<PartnerStaff(id={self.id}, partner_id={self.partner_id}, user_id={self.user_id})>"