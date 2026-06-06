from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import CustomerAddress
from app.models.partner import PartnerStaff
from app.models.referral import ReferralReviewStatus
from app.models.user import User, UserProfile, RefreshToken, PasswordResetToken
from app.schemas.user import UserCreate, UserUpdate, CustomerAddressCreate, CustomerAddressUpdate


class UserRepository:
    """Repository pour les opérations utilisateur"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # User operations
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Récupère un utilisateur par ID"""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par email"""
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_referral_code(self, referral_code: str) -> Optional[User]:
        stmt = select(User).where(User.referral_code == referral_code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_referral_review_status(self, referrer_user_id: UUID) -> Optional[ReferralReviewStatus]:
        stmt = select(ReferralReviewStatus).where(ReferralReviewStatus.referrer_user_id == referrer_user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_users(self, limit: int = 200) -> list[User]:
        """Liste les utilisateurs pour le backoffice admin."""
        stmt = select(User).order_by(User.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_phone(self, phone: str) -> Optional[User]:
        """Récupère un utilisateur par téléphone"""
        stmt = select(User).where(User.phone == phone)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create(self, user_data: UserCreate, password_hash: str, extra_fields: Optional[dict] = None) -> User:
        """Crée un nouvel utilisateur"""
        from app.models.user import create_user
        
        user = create_user(
            email=user_data.email,
            phone=user_data.phone,
            password_hash=password_hash,
            name=user_data.name,
            role=user_data.role,
            referral_code=(extra_fields or {}).get("referral_code"),
            referred_by_user_id=(extra_fields or {}).get("referred_by_user_id"),
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update(self, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Met à jour un utilisateur"""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**user_data.dict(exclude_unset=True))
            .returning(User)
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()
    
    async def update_last_login(self, user_id: UUID) -> None:
        """Met à jour la date de dernière connexion"""
        from datetime import datetime
        
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
        
        await self.db.execute(stmt)
        await self.db.commit()
    
    async def delete(self, user_id: UUID) -> bool:
        """Supprime un utilisateur (soft delete)"""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        
        await self.db.delete(user)
        await self.db.commit()
        return True
    
    # Profile operations
    async def get_profile(self, user_id: UUID) -> Optional[UserProfile]:
        """Récupère le profil d'un utilisateur"""
        stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_profile(self, user_id: UUID, profile_data: dict) -> UserProfile:
        """Crée un profil utilisateur"""
        from app.models.user import create_user_profile
        
        profile = create_user_profile(
            user_id=user_id,
            **profile_data
        )
        
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile
    
    async def update_profile(self, user_id: UUID, profile_data: dict) -> Optional[UserProfile]:
        """Met à jour un profil utilisateur"""
        stmt = (
            update(UserProfile)
            .where(UserProfile.user_id == user_id)
            .values(**profile_data)
            .returning(UserProfile)
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()
    
    # Address operations
    async def get_address(self, address_id: UUID) -> Optional[CustomerAddress]:
        """Récupère une adresse par ID"""
        stmt = select(CustomerAddress).where(CustomerAddress.id == address_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_user_addresses(self, user_id: UUID) -> list[CustomerAddress]:
        """Récupère toutes les adresses d'un utilisateur"""
        stmt = select(CustomerAddress).where(CustomerAddress.user_id == user_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_partner_ids_for_user(self, user_id: UUID) -> list[UUID]:
        """Récupère les IDs partenaires liés à un utilisateur via PartnerStaff."""
        stmt = (
            select(PartnerStaff.partner_id)
            .where(
                PartnerStaff.user_id == user_id,
                PartnerStaff.is_active == True,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_default_address(self, user_id: UUID) -> Optional[CustomerAddress]:
        """Récupère l'adresse par défaut d'un utilisateur"""
        stmt = select(CustomerAddress).where(
            CustomerAddress.user_id == user_id,
            CustomerAddress.is_default == True
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_address(self, address_data: CustomerAddressCreate) -> CustomerAddress:
        """Crée une nouvelle adresse"""
        from app.models.customer import create_customer_address
        
        # Si c'est l'adresse par défaut, désactiver les autres adresses par défaut
        if address_data.is_default:
            await self._unset_default_addresses(address_data.user_id)
        
        address = create_customer_address(**address_data.dict())
        
        self.db.add(address)
        await self.db.commit()
        await self.db.refresh(address)
        return address
    
    async def update_address(self, address_id: UUID, address_data: CustomerAddressUpdate) -> Optional[CustomerAddress]:
        """Met à jour une adresse"""
        # Si on définit cette adresse comme par défaut, désactiver les autres
        if address_data.is_default is True:
            address = await self.get_address(address_id)
            if address:
                await self._unset_default_addresses(address.user_id)
        
        stmt = (
            update(CustomerAddress)
            .where(CustomerAddress.id == address_id)
            .values(**address_data.dict(exclude_unset=True))
            .returning(CustomerAddress)
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()
    
    async def delete_address(self, address_id: UUID) -> bool:
        """Supprime une adresse"""
        address = await self.get_address(address_id)
        if not address:
            return False
        
        await self.db.delete(address)
        await self.db.commit()
        return True
    
    async def _unset_default_addresses(self, user_id: UUID) -> None:
        """Désactive toutes les adresses par défaut d'un utilisateur"""
        stmt = (
            update(CustomerAddress)
            .where(
                CustomerAddress.user_id == user_id,
                CustomerAddress.is_default == True
            )
            .values(is_default=False)
        )
        
        await self.db.execute(stmt)
    
    # Token operations
    async def create_refresh_token(self, user_id: UUID, token_hash: str, expires_at, **kwargs) -> RefreshToken:
        """Crée un token de rafraîchissement"""
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            **kwargs
        )
        
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token
    
    async def get_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        """Récupère un token de rafraîchissement"""
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def revoke_refresh_token(self, token_hash: str) -> bool:
        """Révoque un token de rafraîchissement"""
        from datetime import datetime
        
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(revoked_at=datetime.utcnow())
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
    
    async def create_password_reset_token(self, user_id: UUID, token_hash: str, expires_at) -> PasswordResetToken:
        """Crée un token de réinitialisation de mot de passe"""
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token
    
    async def get_password_reset_token(self, token_hash: str) -> Optional[PasswordResetToken]:
        """Récupère un token de réinitialisation de mot de passe"""
        stmt = select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def mark_password_reset_token_used(self, token_hash: str) -> bool:
        """Marque un token de réinitialisation comme utilisé"""
        from datetime import datetime
        
        stmt = (
            update(PasswordResetToken)
            .where(PasswordResetToken.token_hash == token_hash)
            .values(used_at=datetime.utcnow())
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
