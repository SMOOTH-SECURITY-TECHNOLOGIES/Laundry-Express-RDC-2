from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from app.api.dependencies import get_current_user
from app.schemas.user import (
    AdminUserListResponse,
    UserResponse,
    UserUpdate,
    UserProfileUpdate,
    CustomerAddressCreate,
    CustomerAddressUpdate,
    CustomerAddressResponse,
    UserWithProfileResponse,
    ChangePasswordRequest,
)
from app.api.dependencies import get_auth_service, get_user_service
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()
security = HTTPBearer()


# Routes pour l'utilisateur courant
@router.get("/me", response_model=UserWithProfileResponse)
async def get_current_user_info(
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Récupère les informations de l'utilisateur courant"""
    try:
        user_with_profile = await user_service.get_user_with_profile(current_user.id)
        return user_with_profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération des informations",
        )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Met à jour les informations de l'utilisateur courant"""
    try:
        updated_user = await user_service.update_user(current_user.id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé",
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la mise à jour",
        )


@router.put("/me/profile", response_model=UserWithProfileResponse)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Met à jour le profil de l'utilisateur courant"""
    try:
        updated_profile = await user_service.update_profile(current_user.id, profile_data)
        if not updated_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profil non trouvé",
            )
        
        # Récupère les informations mises à jour
        user_with_profile = await user_service.get_user_with_profile(current_user.id)
        return user_with_profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la mise à jour du profil",
        )


# Routes pour les adresses
@router.get("/me/addresses", response_model=List[CustomerAddressResponse])
async def get_current_user_addresses(
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Récupère toutes les adresses de l'utilisateur courant"""
    try:
        addresses = await user_service.get_addresses(current_user.id)
        return addresses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération des adresses",
        )


@router.post("/me/addresses", response_model=CustomerAddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: CustomerAddressCreate,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Crée une nouvelle adresse pour l'utilisateur courant"""
    try:
        address = await user_service.create_address(current_user.id, address_data)
        return address
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la création de l'adresse",
        )


@router.get("/me/addresses/{address_id}", response_model=CustomerAddressResponse)
async def get_address(
    address_id: UUID,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Récupère une adresse spécifique de l'utilisateur courant"""
    try:
        address = await user_service.get_address(address_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        # Vérifie que l'adresse appartient à l'utilisateur
        if address.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette adresse",
            )
        
        return address
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération de l'adresse",
        )


@router.put("/me/addresses/{address_id}", response_model=CustomerAddressResponse)
async def update_address(
    address_id: UUID,
    address_data: CustomerAddressUpdate,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Met à jour une adresse de l'utilisateur courant"""
    try:
        # Vérifie que l'adresse appartient à l'utilisateur
        address = await user_service.get_address(address_id)
        if not address or address.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        updated_address = await user_service.update_address(address_id, address_data)
        if not updated_address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        return updated_address
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la mise à jour de l'adresse",
        )


@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: UUID,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Supprime une adresse de l'utilisateur courant"""
    try:
        # Vérifie que l'adresse appartient à l'utilisateur
        address = await user_service.get_address(address_id)
        if not address or address.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        success = await user_service.delete_address(address_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        return {"message": "Adresse supprimée avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la suppression de l'adresse",
        )


@router.post("/me/addresses/{address_id}/set-default")
async def set_default_address(
    address_id: UUID,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Définit une adresse comme adresse par défaut"""
    try:
        # Vérifie que l'adresse appartient à l'utilisateur
        address = await user_service.get_address(address_id)
        if not address or address.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Adresse non trouvée",
            )
        
        success = await user_service.set_default_address(current_user.id, address_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de définir cette adresse comme adresse par défaut",
            )
        
        return {"message": "Adresse définie comme adresse par défaut avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la définition de l'adresse par défaut",
        )


# Routes admin (protégées par rôle)
@router.get("/{user_id}", response_model=UserWithProfileResponse)
async def get_user_by_id(
    user_id: UUID,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Récupère un utilisateur par ID (admin seulement)"""
    # Vérifie les permissions admin
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas les permissions nécessaires",
        )
    
    try:
        user_with_profile = await user_service.get_user_with_profile(user_id)
        return user_with_profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération de l'utilisateur",
        )


@router.get("", response_model=List[AdminUserListResponse])
async def list_users(
    limit: int = 200,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Liste les utilisateurs (admin seulement)."""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas les permissions nécessaires",
        )

    try:
        return await user_service.list_users_for_admin(limit=limit)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération des utilisateurs",
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_id(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Met à jour un utilisateur par ID (admin seulement)"""
    # Vérifie les permissions admin
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas les permissions nécessaires",
        )
    
    try:
        updated_user = await user_service.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé",
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la mise à jour de l'utilisateur",
        )
