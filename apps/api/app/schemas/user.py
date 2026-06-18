from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from app.models.user import UserRole, UserStatus


# Base schemas
class UserBase(BaseModel):
    """Schéma de base utilisateur"""
    email: EmailStr
    phone: str = Field(..., min_length=9, max_length=20)
    name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = UserRole.CUSTOMER


class UserCreate(BaseModel):
    """Schéma pour création d'utilisateur"""
    email: EmailStr
    phone: str = Field(..., min_length=9, max_length=20)
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.CUSTOMER
    referral_code: Optional[str] = Field(None, min_length=4, max_length=32)
    
    @validator('phone')
    def validate_phone(cls, v):
        """Valide le format du téléphone"""
        # Format basique pour la RDC
        if not v.replace('+', '').isdigit():
            raise ValueError('Le numéro de téléphone doit contenir uniquement des chiffres')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        """Force le rôle à CUSTOMER pour les inscriptions publiques"""
        if v != UserRole.CUSTOMER:
            raise ValueError('Le rôle ne peut pas être modifié lors de l\'inscription')
        return UserRole.CUSTOMER


class UserUpdate(BaseModel):
    """Schéma pour mise à jour d'utilisateur"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=9, max_length=20)
    status: Optional[UserStatus] = None
    is_email_verified: Optional[bool] = None
    is_phone_verified: Optional[bool] = None


class UserResponse(UserBase):
    """Schéma de réponse utilisateur"""
    id: UUID
    status: UserStatus
    is_email_verified: bool
    is_phone_verified: bool
    is_2fa_enabled: bool
    loyalty_points: int = 0
    referral_code: Optional[str] = None
    referred_by_user_id: Optional[UUID] = None
    delivery_company_id: Optional[UUID] = None
    last_login_at: Optional[datetime] = None
    email_verified_at: Optional[datetime] = None
    phone_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Profile schemas
class UserProfileBase(BaseModel):
    """Schéma de base profil utilisateur"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    preferred_language: str = Field("fr", min_length=2, max_length=10)
    theme_preference: str = Field("light", pattern="^(light|dark|system)$")


class UserProfileCreate(UserProfileBase):
    """Schéma pour création de profil"""
    user_id: UUID


class UserProfileUpdate(UserProfileBase):
    """Schéma pour mise à jour de profil"""
    pass


class UserProfileResponse(UserProfileBase):
    """Schéma de réponse profil"""
    id: UUID
    user_id: UUID
    avatar_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Address schemas
class CustomerAddressBase(BaseModel):
    """Schéma de base adresse client"""
    label: str = Field(..., min_length=1, max_length=100)
    contact_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_phone: Optional[str] = Field(None, min_length=9, max_length=20)
    address_line_1: str = Field(..., min_length=1, max_length=255)
    address_line_2: Optional[str] = Field(None, min_length=1, max_length=255)
    city: str = Field("Kinshasa", min_length=1, max_length=100)
    commune: str = Field(..., min_length=1, max_length=100)
    zone: Optional[str] = Field(None, min_length=1, max_length=100)
    reference_point: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    instructions: Optional[str] = None
    is_default: bool = False

    @validator('contact_name', 'contact_phone', 'address_line_2', 'zone', pre=True)
    def empty_str_to_none(cls, v):
        if v is not None and isinstance(v, str) and v.strip() == '':
            return None
        return v


class CustomerAddressCreate(CustomerAddressBase):
    """Schéma pour création d'adresse"""
    user_id: UUID


class CustomerAddressUpdate(BaseModel):
    """Schéma pour mise à jour d'adresse"""
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_phone: Optional[str] = Field(None, min_length=9, max_length=20)
    address_line_1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line_2: Optional[str] = Field(None, min_length=1, max_length=255)
    commune: Optional[str] = Field(None, min_length=1, max_length=100)
    zone: Optional[str] = Field(None, min_length=1, max_length=100)
    reference_point: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    instructions: Optional[str] = None
    is_default: Optional[bool] = None

    @validator('label', 'contact_name', 'contact_phone', 'address_line_1', 'address_line_2', 'commune', 'zone', pre=True)
    def empty_str_to_none(cls, v):
        if v is not None and isinstance(v, str) and v.strip() == '':
            return None
        return v


class CustomerAddressResponse(CustomerAddressBase):
    """Schéma de réponse adresse"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Auth schemas
class LoginRequest(BaseModel):
    """Schéma pour login"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class TokenResponse(BaseModel):
    """Schéma de réponse token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # en secondes


class RefreshTokenRequest(BaseModel):
    """Schéma pour refresh token"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Schéma pour demande de réinitialisation de mot de passe"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schéma pour confirmation de réinitialisation"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class ChangePasswordRequest(BaseModel):
    """Schéma pour changement de mot de passe"""
    current_password: str = Field(..., min_length=8, max_length=100)
    new_password: str = Field(..., min_length=8, max_length=100)


# Combined response
class UserWithProfileResponse(BaseModel):
    """Schéma combiné utilisateur + profil"""
    user: UserResponse
    profile: Optional[UserProfileResponse] = None
    addresses: list[CustomerAddressResponse] = []
    partner_ids: list[UUID] = []
    primary_partner_id: Optional[UUID] = None


class AdminUserListResponse(UserResponse):
    """Schéma léger pour la liste admin des utilisateurs"""
    partner_ids: list[UUID] = []
    primary_partner_id: Optional[UUID] = None


# Utility functions
def user_to_response(user) -> UserResponse:
    """Convertit un modèle User en UserResponse"""
    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role=user.role,
        status=user.status,
        is_email_verified=user.is_email_verified,
        is_phone_verified=user.is_phone_verified,
        is_2fa_enabled=user.is_2fa_enabled,
        loyalty_points=getattr(user, "loyalty_points", 0) or 0,
        referral_code=getattr(user, "referral_code", None),
        referred_by_user_id=getattr(user, "referred_by_user_id", None),
        delivery_company_id=getattr(user, "delivery_company_id", None),
        last_login_at=user.last_login_at,
        email_verified_at=user.email_verified_at,
        phone_verified_at=user.phone_verified_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
