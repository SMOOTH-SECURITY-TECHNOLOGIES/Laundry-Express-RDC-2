import hashlib
import secrets
import logging
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID

from jose import JWTError, jwt

from app.core.config import settings
from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, LoginRequest, TokenResponse


# Logger
logger = logging.getLogger(__name__)


class AuthService:
    """Service d'authentification"""
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def _generate_unique_referral_code(self) -> str:
        for _ in range(20):
            candidate = secrets.token_hex(4).upper()
            existing = await self.user_repo.get_by_referral_code(candidate)
            if not existing:
                return candidate
        raise ValueError("Impossible de générer un code de parrainage unique")

    @staticmethod
    def _is_referral_review_blocking(review_status: Optional[str]) -> bool:
        return (review_status or "").strip().lower() in {
            "reviewed_high_risk",
            "high_risk",
            "blocked",
        }
    
    # Password utilities
    def hash_password(self, password: str) -> str:
        """Hash un mot de passe avec bcrypt"""
        # Bcrypt a une limite de 72 bytes pour les mots de passe
        # On tronque à 72 bytes si nécessaire
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        # Utilise bcrypt directement
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Vérifie un mot de passe avec bcrypt"""
        try:
            plain_bytes = plain_password.encode('utf-8')
            if len(plain_bytes) > 72:
                plain_bytes = plain_bytes[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except Exception:
            return False
    
    # Token hash utilities (SHA256 pour les tokens, plus rapide que bcrypt)
    def hash_token(self, token: str) -> str:
        """Hash un token avec SHA256"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def verify_token(self, token: str, token_hash: str) -> bool:
        """Vérifie un token avec SHA256"""
        return self.hash_token(token) == token_hash
    
    # Token utilities
    def create_access_token(self, user_id: UUID, role: UserRole) -> str:
        """Crée un access token JWT"""
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expire,
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self) -> Tuple[str, datetime]:
        """Crée un refresh token et sa date d'expiration"""
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta
        
        # Génère un token aléatoire sécurisé
        token = secrets.token_urlsafe(64)
        return token, expire
    
    def verify_access_token(self, token: str) -> Optional[dict]:
        """Vérifie et décode un access token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            
            # Vérifie le type de token
            if payload.get("type") != "access":
                return None
            
            # Vérifie l'expiration
            if datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
                return None
            
            return payload
        except JWTError:
            return None
    
    # Auth operations
    async def register(self, user_data: UserCreate) -> Tuple[User, Optional[str]]:
        """Enregistre un nouvel utilisateur"""
        try:
            logger.info(f"Tentative d'enregistrement pour l'email: {user_data.email}")
            
            # Vérifie si l'email existe déjà
            existing_user = await self.user_repo.get_by_email(user_data.email)
            if existing_user:
                logger.warning(f"Email déjà existant: {user_data.email}")
                raise ValueError("Un utilisateur avec cet email existe déjà")
            
            # Vérifie si le téléphone existe déjà
            existing_phone = await self.user_repo.get_by_phone(user_data.phone)
            if existing_phone:
                logger.warning(f"Téléphone déjà existant: {user_data.phone}")
                raise ValueError("Un utilisateur avec ce numéro de téléphone existe déjà")

            referred_by_user_id = None
            if user_data.referral_code:
                referring_user = await self.user_repo.get_by_referral_code(user_data.referral_code.strip().upper())
                if not referring_user:
                    raise ValueError("Code de parrainage invalide")
                referral_review = await self.user_repo.get_referral_review_status(referring_user.id)
                if self._is_referral_review_blocking(getattr(referral_review, "review_status", None)):
                    raise ValueError("Ce code de parrainage est temporairement indisponible")
                referred_by_user_id = referring_user.id
            
            # Hash le mot de passe
            password_hash = self.hash_password(user_data.password)
            logger.info("Mot de passe hashé avec succès")

            referral_code = await self._generate_unique_referral_code()
            
            # Crée l'utilisateur
            user = await self.user_repo.create(
                user_data,
                password_hash,
                extra_fields={
                    "referral_code": referral_code,
                    "referred_by_user_id": referred_by_user_id,
                },
            )
            logger.info(f"Utilisateur créé avec ID: {user.id}")
            
            # Crée un profil par défaut avec découpage intelligent du nom
            name_parts = user_data.name.strip().split() if user_data.name else []
            if len(name_parts) == 1:
                first_name = name_parts[0]
                last_name = None
            elif len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = " ".join(name_parts[1:])
            else:
                first_name = None
                last_name = None
                
            profile_data = {
                "first_name": first_name,
                "last_name": last_name,
                "preferred_language": "fr",
                "theme_preference": "light"
            }
            
            await self.user_repo.create_profile(user.id, profile_data)
            logger.info(f"Profil créé pour l'utilisateur ID: {user.id}")
            
            return user, None
            
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement: {str(e)}", exc_info=True)
            raise
    
    async def login(self, login_data: LoginRequest) -> Tuple[User, TokenResponse]:
        """Authentifie un utilisateur"""
        # Récupère l'utilisateur par email
        user = await self.user_repo.get_by_email(login_data.email)
        if not user:
            raise ValueError("Email ou mot de passe incorrect")
        
        # Vérifie le statut de l'utilisateur
        if user.status != "active":
            raise ValueError("Votre compte n'est pas actif")
        
        # Vérifie le mot de passe
        if not self.verify_password(login_data.password, user.password_hash):
            raise ValueError("Email ou mot de passe incorrect")
        
        # Met à jour la date de dernière connexion
        await self.user_repo.update_last_login(user.id)
        
        # Crée les tokens
        access_token = self.create_access_token(user.id, user.role)
        refresh_token, refresh_expires_at = self.create_refresh_token()
        
        # Hash et stocke le refresh token (SHA256 pour les tokens)
        refresh_token_hash = self.hash_token(refresh_token)
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=refresh_expires_at
        )
        
        # Crée la réponse
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return user, token_response
    
    async def refresh_tokens(self, refresh_token: str) -> Tuple[User, TokenResponse]:
        """Rafraîchit les tokens d'authentification"""
        # Hash le token pour la recherche (SHA256 pour les tokens)
        refresh_token_hash = self.hash_token(refresh_token)
        
        # Récupère le token stocké
        stored_token = await self.user_repo.get_refresh_token(refresh_token_hash)
        if not stored_token:
            raise ValueError("Token de rafraîchissement invalide")
        
        # Vérifie l'expiration avec timezone aware
        if stored_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise ValueError("Token de rafraîchissement expiré")
        
        # Vérifie si le token est révoqué
        if stored_token.revoked_at:
            raise ValueError("Token de rafraîchissement révoqué")
        
        # Récupère l'utilisateur
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Révoque l'ancien token
        await self.user_repo.revoke_refresh_token(refresh_token_hash)
        
        # Crée de nouveaux tokens
        access_token = self.create_access_token(user.id, user.role)
        new_refresh_token, new_refresh_expires_at = self.create_refresh_token()
        
        # Stocke le nouveau refresh token (SHA256 pour les tokens)
        new_refresh_token_hash = self.hash_token(new_refresh_token)
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=new_refresh_token_hash,
            expires_at=new_refresh_expires_at
        )
        
        # Crée la réponse
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return user, token_response
    
    async def logout(self, refresh_token: str) -> bool:
        """Déconnecte un utilisateur en révoquant son refresh token"""
        refresh_token_hash = self.hash_token(refresh_token)
        return await self.user_repo.revoke_refresh_token(refresh_token_hash)
    
    async def logout_all(self, user_id: UUID) -> bool:
        """Déconnecte un utilisateur de tous les appareils"""
        # Cette implémentation nécessiterait une méthode supplémentaire dans le repository
        # Pour l'instant, on retourne True (à implémenter plus tard)
        return True
    
    async def request_password_reset(self, email: str) -> Tuple[str, datetime]:
        """Demande une réinitialisation de mot de passe"""
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe
            raise ValueError("Si cet email existe, un lien de réinitialisation a été envoyé")
        
        # Vérifie si l'utilisateur est actif
        if user.status != UserStatus.ACTIVE:
            raise ValueError("Votre compte n'est pas actif")
        
        # Crée un token de réinitialisation
        token = secrets.token_urlsafe(64)
        expires_delta = timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta
        
        # Hash et stocke le token (SHA256 pour les tokens)
        token_hash = self.hash_token(token)
        await self.user_repo.create_password_reset_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expire
        )
        
        return token, expire
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Réinitialise le mot de passe d'un utilisateur"""
        # Hash le token pour la recherche (SHA256 pour les tokens)
        token_hash = self.hash_token(token)
        
        # Récupère le token stocké
        stored_token = await self.user_repo.get_password_reset_token(token_hash)
        if not stored_token:
            raise ValueError("Token de réinitialisation invalide")
        
        # Vérifie l'expiration avec timezone aware
        if stored_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise ValueError("Token de réinitialisation expiré")
        
        # Vérifie si le token a déjà été utilisé
        if stored_token.used_at:
            raise ValueError("Token de réinitialisation déjà utilisé")
        
        # Récupère l'utilisateur
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Vérifie si l'utilisateur est actif
        if user.status != UserStatus.ACTIVE:
            raise ValueError("Votre compte n'est pas actif")
        
        # Hash le nouveau mot de passe
        new_password_hash = self.hash_password(new_password)
        
        # Met à jour le mot de passe de l'utilisateur
        await self.user_repo.update(user.id, {"password_hash": new_password_hash})
        
        # Marque le token comme utilisé
        await self.user_repo.mark_password_reset_token_used(token_hash)
        
        # Révoque tous les refresh tokens de l'utilisateur
        await self.logout_all(user.id)
        
        return True
    
    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> bool:
        """Change le mot de passe d'un utilisateur"""
        # Récupère l'utilisateur
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Vérifie l'ancien mot de passe
        if not self.verify_password(current_password, user.password_hash):
            raise ValueError("Mot de passe actuel incorrect")
        
        # Hash le nouveau mot de passe
        new_password_hash = self.hash_password(new_password)
        
        # Met à jour le mot de passe
        await self.user_repo.update(user.id, {"password_hash": new_password_hash})
        
        # Révoque tous les refresh tokens de l'utilisateur
        await self.logout_all(user.id)
        
        return True
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Récupère l'utilisateur courant à partir du token"""
        payload = self.verify_access_token(token)
        if not payload:
            return None
        
        user_id = UUID(payload["sub"])
        user = await self.user_repo.get_by_id(user_id)
        
        if not user or user.status != "active":
            return None
        
        return user


# Factory pour créer le service
def get_auth_service(db) -> AuthService:
    """Factory pour créer le service d'authentification"""
    user_repo = UserRepository(db)
    return AuthService(user_repo)
