from typing import Any, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.database import get_db as get_async_db, get_sync_db as get_sync_db_session
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.models.partner import PartnerStaff
from app.models.user import UserRole

security = HTTPBearer()

ADMIN_ROLES = {UserRole.ADMIN, UserRole.SUPER_ADMIN}
PARTNER_ROLES = {UserRole.PARTNER_OWNER, UserRole.PARTNER_STAFF}
MARKETPLACE_OPERATOR_ROLES = ADMIN_ROLES | {UserRole.LOGISTICS_MANAGER}


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dépendance pour obtenir une session de base de données async"""
    async for session in get_async_db():
        yield session


def get_sync_db():
    """Dépendance pour obtenir une session de base de données sync."""
    yield from get_sync_db_session()


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Dépendance pour obtenir le service d'authentification"""
    from app.repositories.user_repository import UserRepository
    user_repo = UserRepository(db)
    return AuthService(user_repo)


async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Dépendance pour obtenir le service utilisateur"""
    from app.repositories.user_repository import UserRepository
    user_repo = UserRepository(db)
    return UserService(user_repo)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Dépendance pour récupérer l'utilisateur courant"""
    token = credentials.credentials
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Dépendance pour récupérer l'utilisateur courant avec vérification du rôle admin"""
    token = credentials.credentials
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Vérifier que l'utilisateur est un admin
    if user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    
    return user


async def get_current_marketplace_operator(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> Any:
    """Dépendance pour récupérer un opérateur marketplace supporté."""
    token = credentials.credentials
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token d'authentification invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.role not in MARKETPLACE_OPERATOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux opérateurs marketplace"
        )
    
    return user


def is_admin_user(user: Any) -> bool:
    return getattr(user, "role", None) in ADMIN_ROLES


def is_partner_user(user: Any) -> bool:
    return getattr(user, "role", None) in PARTNER_ROLES


def get_user_partner_ids_sync(db: Session, user_id) -> set:
    rows = db.query(PartnerStaff.partner_id).filter(PartnerStaff.user_id == user_id).all()
    return {row[0] for row in rows}


def user_has_partner_access_sync(db: Session, user: Any, partner_id) -> bool:
    if is_admin_user(user):
        return True
    if not is_partner_user(user):
        return False
    return partner_id in get_user_partner_ids_sync(db, user.id)
