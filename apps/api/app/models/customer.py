import uuid
from enum import Enum

from sqlalchemy import Boolean, Column, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AddressLabel(str, Enum):
    """Labels d'adresse"""
    HOME = "home"
    WORK = "work"
    OTHER = "other"


class CustomerAddress(BaseModel):
    """Adresse client"""
    __tablename__ = "customer_addresses"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Label et contact
    label = Column(String(100), nullable=False)
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    
    # Adresse détaillée (adaptée à la RDC)
    address_line_1 = Column(String(255), nullable=False)
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, default="Kinshasa")
    commune = Column(String(100), nullable=False)  # Ex: Gombe, Lingwala, etc.
    zone = Column(String(100), nullable=True)  # Quartier/zone spécifique
    reference_point = Column(Text, nullable=True)  # Point de repère local
    
    # Coordonnées géographiques
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Instructions spécifiques
    instructions = Column(Text, nullable=True)  # Instructions pour le livreur
    
    # Configuration
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Relations
    user = relationship("User", back_populates="customer_addresses")
    
    # Index composites pour performances
    __table_args__ = (
        # Index pour recherches par utilisateur et commune
        # {'postgresql_using': 'btree'},  # Commenté car non supporté par SQLAlchemy
    )
    
    def __repr__(self):
        return f"<CustomerAddress(id={self.id}, user_id={self.user_id}, label={self.label})>"
    
    def get_full_address(self) -> str:
        """Retourne l'adresse complète formatée"""
        parts = []
        if self.address_line_1:
            parts.append(self.address_line_1)
        if self.address_line_2:
            parts.append(self.address_line_2)
        if self.commune:
            parts.append(f"Commune {self.commune}")
        if self.city:
            parts.append(self.city)
        if self.zone:
            parts.append(f"Zone {self.zone}")
        
        return ", ".join(filter(None, parts))
    
    def has_coordinates(self) -> bool:
        """Vérifie si l'adresse a des coordonnées géographiques"""
        return self.latitude is not None and self.longitude is not None


# Fonctions utilitaires
def create_customer_address(
    user_id: uuid.UUID,
    label: str,
    address_line_1: str,
    commune: str,
    city: str = "Kinshasa",
    address_line_2: str = None,
    zone: str = None,
    contact_name: str = None,
    contact_phone: str = None,
    reference_point: str = None,
    latitude: float = None,
    longitude: float = None,
    instructions: str = None,
    is_default: bool = False,
) -> CustomerAddress:
    """Crée une nouvelle adresse client"""
    return CustomerAddress(
        user_id=user_id,
        label=label,
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        city=city,
        commune=commune,
        zone=zone,
        contact_name=contact_name,
        contact_phone=contact_phone,
        reference_point=reference_point,
        latitude=latitude,
        longitude=longitude,
        instructions=instructions,
        is_default=is_default,
    )
