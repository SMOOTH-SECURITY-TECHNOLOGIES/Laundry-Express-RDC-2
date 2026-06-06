"""
Tests unitaires pour le service d'authentification.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timedelta, timezone

from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, LoginRequest
from app.services.auth_service import AuthService

TEST_PASSWORD = "SpecimenKey-A1!"
ALT_PASSWORD = "SpecimenKey-B2!"
NEW_PASSWORD = "SpecimenKey-C3!"
CURRENT_PASSWORD = "SpecimenKey-D4!"
WRONG_PASSWORD = "SpecimenKey-E5!"


@pytest.fixture
def mock_user_repo():
    """Mock du repository utilisateur"""
    return AsyncMock()


@pytest.fixture
def auth_service(mock_user_repo):
    """Service d'authentification avec mock"""
    return AuthService(mock_user_repo)


@pytest.fixture
def sample_user():
    """Utilisateur de test"""
    user_id = uuid4()
    return User(
        id=user_id,
        email="test@example.com",
        phone="+243810000001",
        name="Test User",
        password_hash="$2b$12$hashedpassword",  # bcrypt hash fictif
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
        is_phone_verified=True,
        is_2fa_enabled=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )


class TestAuthService:
    """Tests pour le service d'authentification"""
    
    @pytest.mark.anyio
    async def test_hash_password(self, auth_service):
        """Test du hashage de mot de passe"""
        password = TEST_PASSWORD
        hashed = auth_service.hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert auth_service.verify_password(password, hashed)
    
    @pytest.mark.anyio
    async def test_hash_token(self, auth_service):
        """Test du hashage de token"""
        token = "test_token_123"
        hashed = auth_service.hash_token(token)
        
        assert hashed != token
        assert len(hashed) == 64  # SHA256 hex digest length
        assert auth_service.verify_token(token, hashed)
    
    @pytest.mark.anyio
    async def test_register_success(self, auth_service, mock_user_repo):
        """Test d'inscription réussie"""
        # Arrange
        user_data = UserCreate(
            email="new@example.com",
            phone="+243810000002",
            name="New User",
            password=ALT_PASSWORD
        )
        
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_phone.return_value = None
        mock_user_repo.get_by_referral_code.return_value = None
        
        created_user = MagicMock()
        created_user.id = uuid4()
        created_user.email = user_data.email
        created_user.phone = user_data.phone
        created_user.name = user_data.name
        mock_user_repo.create.return_value = created_user
        
        # Act
        user, error = await auth_service.register(user_data)
        
        # Assert
        assert error is None
        assert user.email == user_data.email
        mock_user_repo.get_by_email.assert_called_once_with(user_data.email)
        mock_user_repo.get_by_phone.assert_called_once_with(user_data.phone)
        mock_user_repo.create.assert_called_once()
        mock_user_repo.create_profile.assert_called_once()
    
    @pytest.mark.anyio
    async def test_register_email_exists(self, auth_service, mock_user_repo, sample_user):
        """Test d'inscription avec email existant"""
        # Arrange
        user_data = UserCreate(
            email=sample_user.email,
            phone="+243810000003",
            name="New User",
            password=ALT_PASSWORD
        )
        
        mock_user_repo.get_by_email.return_value = sample_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Un utilisateur avec cet email existe déjà"):
            await auth_service.register(user_data)
    
    @pytest.mark.anyio
    async def test_login_success(self, auth_service, mock_user_repo, sample_user):
        """Test de connexion réussie"""
        # Arrange
        login_data = LoginRequest(
            email=sample_user.email,
            password="correct_password"
        )
        
        mock_user_repo.get_by_email.return_value = sample_user
        auth_service.verify_password = MagicMock(return_value=True)
        mock_user_repo.update_last_login = AsyncMock()
        mock_user_repo.create_refresh_token = AsyncMock()
        
        # Act
        user, tokens = await auth_service.login(login_data)
        
        # Assert
        assert user.email == sample_user.email
        assert tokens.access_token is not None
        assert tokens.refresh_token is not None
        assert tokens.expires_in > 0
        mock_user_repo.update_last_login.assert_called_once_with(sample_user.id)
        mock_user_repo.create_refresh_token.assert_called_once()
    
    @pytest.mark.anyio
    async def test_login_wrong_password(self, auth_service, mock_user_repo, sample_user):
        """Test de connexion avec mauvais mot de passe"""
        # Arrange
        login_data = LoginRequest(
            email=sample_user.email,
            password="wrong_password"
        )
        
        mock_user_repo.get_by_email.return_value = sample_user
        auth_service.verify_password = MagicMock(return_value=False)
        
        # Act & Assert
        with pytest.raises(ValueError, match="Email ou mot de passe incorrect"):
            await auth_service.login(login_data)
    
    @pytest.mark.anyio
    async def test_login_inactive_user(self, auth_service, mock_user_repo):
        """Test de connexion avec utilisateur inactif"""
        # Arrange
        inactive_user = MagicMock()
        inactive_user.status = UserStatus.INACTIVE
        
        login_data = LoginRequest(email="inactive@example.com", password="inactive-specimen")
        
        mock_user_repo.get_by_email.return_value = inactive_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Votre compte n'est pas actif"):
            await auth_service.login(login_data)
    
    @pytest.mark.anyio
    async def test_request_password_reset_success(self, auth_service, mock_user_repo, sample_user):
        """Test de demande de réinitialisation de mot de passe réussie"""
        # Arrange
        email = sample_user.email
        mock_user_repo.get_by_email.return_value = sample_user
        mock_user_repo.create_password_reset_token = AsyncMock()
        
        # Act
        token, expire = await auth_service.request_password_reset(email)
        
        # Assert
        assert token is not None
        assert expire > datetime.utcnow()
        mock_user_repo.create_password_reset_token.assert_called_once()
    
    @pytest.mark.anyio
    async def test_request_password_reset_inactive_user(self, auth_service, mock_user_repo):
        """Test de demande de réinitialisation pour utilisateur inactif"""
        # Arrange
        inactive_user = MagicMock()
        inactive_user.status = UserStatus.SUSPENDED
        inactive_user.email = "inactive@example.com"
        
        mock_user_repo.get_by_email.return_value = inactive_user
        
        # Act & Assert
        with pytest.raises(ValueError, match="Votre compte n'est pas actif"):
            await auth_service.request_password_reset(inactive_user.email)
    
    @pytest.mark.anyio
    async def test_reset_password_success(self, auth_service, mock_user_repo, sample_user):
        """Test de réinitialisation de mot de passe réussie"""
        # Arrange
        token = "reset_token_123"
        new_password = NEW_PASSWORD
        
        stored_token = MagicMock()
        stored_token.user_id = sample_user.id
        stored_token.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        stored_token.used_at = None
        
        mock_user_repo.get_password_reset_token.return_value = stored_token
        mock_user_repo.get_by_id.return_value = sample_user
        mock_user_repo.update = AsyncMock()
        mock_user_repo.mark_password_reset_token_used = AsyncMock()
        auth_service.logout_all = AsyncMock(return_value=True)
        
        # Act
        result = await auth_service.reset_password(token, new_password)
        
        # Assert
        assert result is True
        mock_user_repo.update.assert_called_once()
        mock_user_repo.mark_password_reset_token_used.assert_called_once()
        auth_service.logout_all.assert_called_once_with(sample_user.id)
    
    @pytest.mark.anyio
    async def test_change_password_success(self, auth_service, mock_user_repo, sample_user):
        """Test de changement de mot de passe réussi"""
        # Arrange
        user_id = sample_user.id
        current_password = CURRENT_PASSWORD
        new_password = NEW_PASSWORD
        
        mock_user_repo.get_by_id.return_value = sample_user
        auth_service.verify_password = MagicMock(return_value=True)
        mock_user_repo.update = AsyncMock()
        auth_service.logout_all = AsyncMock(return_value=True)
        
        # Act
        result = await auth_service.change_password(user_id, current_password, new_password)
        
        # Assert
        assert result is True
        mock_user_repo.update.assert_called_once()
        auth_service.logout_all.assert_called_once_with(user_id)
    
    @pytest.mark.anyio
    async def test_change_password_wrong_current(self, auth_service, mock_user_repo, sample_user):
        """Test de changement de mot de passe avec mauvais mot de passe actuel"""
        # Arrange
        user_id = sample_user.id
        current_password = WRONG_PASSWORD
        new_password = NEW_PASSWORD
        
        mock_user_repo.get_by_id.return_value = sample_user
        auth_service.verify_password = MagicMock(return_value=False)
        
        # Act & Assert
        with pytest.raises(ValueError, match="Mot de passe actuel incorrect"):
            await auth_service.change_password(user_id, current_password, new_password)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
