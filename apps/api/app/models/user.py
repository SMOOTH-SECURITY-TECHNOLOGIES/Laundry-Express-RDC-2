import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class UserRole(str, Enum):
    """Roles utilisateur"""
    CUSTOMER = "customer"
    PARTNER_OWNER = "partner_owner"
    PARTNER_STAFF = "partner_staff"
    DRIVER = "driver"
    LOGISTICS_MANAGER = "logistics_manager"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    """Statuts utilisateur"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(BaseModel):
    """Modèle utilisateur"""
    __tablename__ = "users"

    # Identifiants
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Informations personnelles
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    status = Column(SQLEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # Vérifications
    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    is_2fa_enabled = Column(Boolean, default=False, nullable=False)
    loyalty_points = Column(Integer, default=0, nullable=False)
    referral_code = Column(String(32), unique=True, nullable=True, index=True)
    referred_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    delivery_company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("delivery_companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    referral_discount_used_at = Column(DateTime(timezone=True), nullable=True)
    referral_bonus_awarded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    phone_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    customer_addresses = relationship("CustomerAddress", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class UserProfile(BaseModel):
    """Profil utilisateur"""
    __tablename__ = "user_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Informations personnelles
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)
    
    # Préférences
    preferred_language = Column(String(10), default="fr", nullable=False)
    theme_preference = Column(String(20), default="light", nullable=False)  # light, dark, system
    
    # Métadonnées
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    gender = Column(String(20), nullable=True)  # male, female, other, prefer_not_to_say
    
    # Relations
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, name={self.first_name} {self.last_name})>"


class RefreshToken(BaseModel):
    """Token de rafraîchissement"""
    __tablename__ = "refresh_tokens"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    device_info = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


class PasswordResetToken(BaseModel):
    """Token de réinitialisation de mot de passe"""
    __tablename__ = "password_reset_tokens"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    
    # Expiration et utilisation
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    user = relationship("User", back_populates="password_reset_tokens")
    
    def __repr__(self):
        return f"<PasswordResetToken(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


# Fonctions utilitaires
def create_user(
    email: str,
    phone: str,
    password_hash: str,
    name: str,
    role: UserRole = UserRole.CUSTOMER,
    status: UserStatus = UserStatus.ACTIVE,
    is_email_verified: bool = False,
    is_phone_verified: bool = False,
    referral_code: Optional[str] = None,
    referred_by_user_id: Optional[uuid.UUID] = None,
) -> User:
    """Crée un nouvel utilisateur"""
    return User(
        email=email,
        phone=phone,
        password_hash=password_hash,
        name=name,
        role=role,
        status=status,
        is_email_verified=is_email_verified,
        is_phone_verified=is_phone_verified,
        referral_code=referral_code,
        referred_by_user_id=referred_by_user_id,
    )


def create_user_profile(
    user_id: uuid.UUID,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    preferred_language: str = "fr",
    theme_preference: str = "light",
) -> UserProfile:
    """Crée un profil utilisateur"""
    return UserProfile(
        user_id=user_id,
        first_name=first_name,
        last_name=last_name,
        preferred_language=preferred_language,
        theme_preference=theme_preference,
    )
