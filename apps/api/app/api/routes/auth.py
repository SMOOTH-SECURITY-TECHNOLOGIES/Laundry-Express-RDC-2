from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user, get_auth_service, get_sync_db, get_user_service
from app.models.user import User
from app.schemas.partner_security import TwoFactorToggleRequest, TwoFactorToggleResponse
from app.schemas.user import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    UserWithProfileResponse,
)
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


# Routes publiques
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Enregistre un nouvel utilisateur"""
    try:
        user, error = await auth_service.register(user_data)
        if error:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
        
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de l'inscription",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Authentifie un utilisateur"""
    try:
        user, tokens = await auth_service.login(login_data)
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la connexion",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    token_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Rafraîchit les tokens d'authentification"""
    try:
        user, tokens = await auth_service.refresh_tokens(token_data.refresh_token)
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors du rafraîchissement des tokens",
        )


@router.post("/password-reset/request")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Demande une réinitialisation de mot de passe"""
    try:
        token, expires_at = await auth_service.request_password_reset(reset_data.email)
        
        # En production, on enverrait un email ici
        # Pour le développement, on retourne le token
        return {
            "message": "Si cet email existe, un lien de réinitialisation a été envoyé",
            "token": token,  # À retirer en production
            "expires_at": expires_at.isoformat(),
        }
    except ValueError as e:
        # Pour des raisons de sécurité, on ne révèle pas si l'email existe
        return {
            "message": "Si cet email existe, un lien de réinitialisation a été envoyé",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la demande de réinitialisation",
        )


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    confirm_data: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Confirme la réinitialisation de mot de passe"""
    try:
        success = await auth_service.reset_password(confirm_data.token, confirm_data.new_password)
        
        if success:
            return {"message": "Mot de passe réinitialisé avec succès"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Échec de la réinitialisation du mot de passe",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la réinitialisation du mot de passe",
        )


# Routes protégées
@router.post("/logout")
async def logout(
    token_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Déconnecte un utilisateur"""
    try:
        success = await auth_service.logout(token_data.refresh_token)
        
        if success:
            return {"message": "Déconnexion réussie"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Échec de la déconnexion",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la déconnexion",
        )


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Any = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    """Change le mot de passe de l'utilisateur courant"""
    try:
        success = await auth_service.change_password(
            current_user.id,
            password_data.current_password,
            password_data.new_password
        )
        
        if success:
            return {"message": "Mot de passe changé avec succès"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Échec du changement de mot de passe",
            )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors du changement de mot de passe",
        )


@router.get("/me", response_model=UserWithProfileResponse)
async def get_current_user_info(
    current_user: Any = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db),
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
            detail="Une erreur est survenue lors de la récupération des informations utilisateur",
        )


@router.post("/me/2fa/enable", response_model=TwoFactorToggleResponse)
def enable_current_user_2fa(
    payload: TwoFactorToggleRequest,
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Active la 2FA au niveau du compte utilisateur courant."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    code = (payload.code or "").strip()
    if len(code) != 6 or not code.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code de confirmation invalide")

    user.is_2fa_enabled = True
    db.add(user)
    AuditService(db).log_event(
        user_id=user.id,
        action="USER_2FA_ENABLED",
        resource_type="user_security",
        resource_id=user.id,
        details={"email": user.email},
    )
    db.commit()

    return TwoFactorToggleResponse(
        success=True,
        message="Authentification à deux facteurs activée",
    )


@router.post("/me/2fa/disable", response_model=TwoFactorToggleResponse)
def disable_current_user_2fa(
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Désactive la 2FA au niveau du compte utilisateur courant."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

    user.is_2fa_enabled = False
    db.add(user)
    AuditService(db).log_event(
        user_id=user.id,
        action="USER_2FA_DISABLED",
        resource_type="user_security",
        resource_id=user.id,
        details={"email": user.email},
    )
    db.commit()

    return TwoFactorToggleResponse(
        success=True,
        message="Authentification à deux facteurs désactivée",
    )
