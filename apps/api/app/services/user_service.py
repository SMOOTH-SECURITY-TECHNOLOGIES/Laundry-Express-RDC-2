from typing import Optional
from uuid import UUID

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    AdminUserListResponse,
    UserUpdate,
    UserProfileUpdate,
    CustomerAddressCreate,
    CustomerAddressUpdate,
    UserWithProfileResponse,
    user_to_response,
)


class UserService:
    """Service pour les opérations utilisateur"""
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    async def get_user(self, user_id: UUID) -> Optional[User]:
        """Récupère un utilisateur par ID"""
        return await self.user_repo.get_by_id(user_id)
    
    async def get_user_with_profile(self, user_id: UUID) -> UserWithProfileResponse:
        """Récupère un utilisateur avec son profil et adresses"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        profile = await self.user_repo.get_profile(user_id)
        addresses = await self.user_repo.get_user_addresses(user_id)
        partner_ids = await self.user_repo.get_partner_ids_for_user(user_id)
        
        return UserWithProfileResponse(
            user=user_to_response(user),
            profile=profile,
            addresses=addresses,
            partner_ids=partner_ids,
            primary_partner_id=partner_ids[0] if partner_ids else None,
        )

    async def list_users_for_admin(self, limit: int = 200) -> list[AdminUserListResponse]:
        """Liste les utilisateurs pour l'admin avec lien partenaire principal."""
        users = await self.user_repo.list_users(limit=limit)
        results: list[AdminUserListResponse] = []

        for user in users:
            partner_ids = await self.user_repo.get_partner_ids_for_user(user.id)
            results.append(
                AdminUserListResponse(
                    **user_to_response(user).dict(),
                    partner_ids=partner_ids,
                    primary_partner_id=partner_ids[0] if partner_ids else None,
                )
            )

        return results
    
    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Met à jour un utilisateur"""
        return await self.user_repo.update(user_id, user_data)
    
    async def update_profile(self, user_id: UUID, profile_data: UserProfileUpdate) -> Optional[dict]:
        """Met à jour le profil d'un utilisateur"""
        # Vérifie si le profil existe
        existing_profile = await self.user_repo.get_profile(user_id)
        
        if existing_profile:
            # Met à jour le profil existant
            return await self.user_repo.update_profile(user_id, profile_data.dict(exclude_unset=True))
        else:
            # Crée un nouveau profil
            profile_data_dict = profile_data.dict(exclude_unset=True)
            profile_data_dict["user_id"] = user_id
            return await self.user_repo.create_profile(user_id, profile_data_dict)
    
    async def get_addresses(self, user_id: UUID) -> list:
        """Récupère toutes les adresses d'un utilisateur"""
        return await self.user_repo.get_user_addresses(user_id)
    
    async def get_address(self, address_id: UUID) -> Optional[dict]:
        """Récupère une adresse par ID"""
        address = await self.user_repo.get_address(address_id)
        if address:
            return address
        return None
    
    async def create_address(self, user_id: UUID, address_data: CustomerAddressCreate) -> dict:
        """Crée une nouvelle adresse pour un utilisateur"""
        address_data.user_id = user_id
        return await self.user_repo.create_address(address_data)
    
    async def update_address(self, address_id: UUID, address_data: CustomerAddressUpdate) -> Optional[dict]:
        """Met à jour une adresse"""
        return await self.user_repo.update_address(address_id, address_data)
    
    async def delete_address(self, address_id: UUID) -> bool:
        """Supprime une adresse"""
        return await self.user_repo.delete_address(address_id)
    
    async def set_default_address(self, user_id: UUID, address_id: UUID) -> bool:
        """Définit une adresse comme adresse par défaut"""
        # Récupère l'adresse
        address = await self.user_repo.get_address(address_id)
        if not address or address.user_id != user_id:
            return False
        
        # Désactive toutes les autres adresses par défaut
        await self.user_repo._unset_default_addresses(user_id)
        
        # Définit cette adresse comme par défaut
        update_data = CustomerAddressUpdate(is_default=True)
        updated = await self.user_repo.update_address(address_id, update_data)
        
        return updated is not None


# Factory pour créer le service
def get_user_service(db) -> UserService:
    """Factory pour créer le service utilisateur"""
    user_repo = UserRepository(db)
    return UserService(user_repo)
