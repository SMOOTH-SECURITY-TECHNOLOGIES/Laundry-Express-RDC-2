"""
Tests d'intégration pour l'authentification.
Ces tests nécessitent une base de données de test.
"""

import pytest
pytest_asyncio = pytest.importorskip("pytest_asyncio")
import asyncio
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime, timedelta

from app.main import app
from app.core.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

TEST_PASSWORD = "SpecimenKey-A1!"
WRONG_PASSWORD = "SpecimenKey-B2!"


pytestmark = pytest.mark.skip(
    reason="Quarantined during MVP stabilization: depends on pytest_asyncio and environment-coupled async DB setup."
)


@pytest.fixture(scope="module")
def event_loop():
    """Création d'une event loop pour les tests asynchrones"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def test_client():
    """Client HTTP de test"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_db():
    """Base de données de test"""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(test_db):
    """Création d'un utilisateur de test"""
    user_repo = UserRepository(test_db)
    auth_service = AuthService(user_repo)
    
    # Données de test
    email = f"test_{uuid4().hex[:8]}@example.com"
    import random
    phone = f"+24381{random.randint(100000, 999999)}"
    
    from app.schemas.user import UserCreate
    user_data = UserCreate(
        email=email,
        phone=phone,
        name="Test User",
        password=TEST_PASSWORD
    )
    
    # Crée l'utilisateur
    user, error = await auth_service.register(user_data)
    assert error is None
    
    yield user
    
    # Nettoyage
    await test_db.delete(user)
    await test_db.commit()


class TestAuthIntegration:
    """Tests d'intégration pour l'authentification"""
    
    @pytest.mark.asyncio
    async def test_register_endpoint(self, test_client):
        """Test du endpoint d'inscription"""
        # Arrange
        email = f"register_{uuid4().hex[:8]}@example.com"
        # Générer un numéro de téléphone valide: +24381 suivi de 6 chiffres
        import random
        phone = f"+24382{random.randint(100000, 999999)}"
        
        register_data = {
            "email": email,
            "phone": phone,
            "name": "Integration Test User",
            "password": "Integration123!"
        }
        
        # Act
        response = await test_client.post("/api/v1/auth/register", json=register_data)
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == email
        assert data["phone"] == phone
        assert "password_hash" not in data  # Sécurité: ne pas exposer le hash
    
    @pytest.mark.asyncio
    async def test_login_endpoint(self, test_client, test_user):
        """Test du endpoint de connexion"""
        # Arrange
        login_data = {
            "email": test_user.email,
            "password": TEST_PASSWORD
        }
        
        # Act
        response = await test_client.post("/api/v1/auth/login", json=login_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "expires_in" in data
        assert data["expires_in"] > 0
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, test_client, test_user):
        """Test de connexion avec mauvais mot de passe"""
        # Arrange
        login_data = {
            "email": test_user.email,
            "password": WRONG_PASSWORD
        }
        
        # Act
        response = await test_client.post("/api/v1/auth/login", json=login_data)
        
        # Assert
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_refresh_token_endpoint(self, test_client, test_user):
        """Test du rafraîchissement de token"""
        # Arrange - d'abord login pour obtenir un refresh token
        login_data = {
            "email": test_user.email,
            "password": TEST_PASSWORD
        }
        
        login_response = await test_client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_data = login_response.json()
        refresh_token = login_data["refresh_token"]
        
        # Act - rafraîchir le token
        refresh_data = {
            "refresh_token": refresh_token
        }
        
        response = await test_client.post("/api/v1/auth/refresh", json=refresh_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["refresh_token"] != refresh_token  # Nouveau token
    
    @pytest.mark.asyncio
    async def test_logout_endpoint(self, test_client, test_user):
        """Test de déconnexion"""
        # Arrange - d'abord login
        login_data = {
            "email": test_user.email,
            "password": TEST_PASSWORD
        }
        
        login_response = await test_client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_data = login_response.json()
        refresh_token = login_data["refresh_token"]
        
        # Act - logout
        logout_data = {
            "refresh_token": refresh_token
        }
        
        response = await test_client.post("/api/v1/auth/logout", json=logout_data)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Déconnexion réussie"
    
    @pytest.mark.asyncio
    async def test_request_password_reset_endpoint(self, test_client, test_user):
        """Test de demande de réinitialisation de mot de passe"""
        # Arrange
        reset_data = {
            "email": test_user.email
        }
        
        # Act
        response = await test_client.post("/api/v1/auth/password-reset/request", json=reset_data)
        
        # Assert
        # Pour des raisons de sécurité, on retourne toujours 200 même si l'email n'existe pas
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    @pytest.mark.asyncio
    async def test_get_current_user_endpoint(self, test_client, test_user):
        """Test de récupération de l'utilisateur courant"""
        # Arrange - d'abord login
        login_data = {
            "email": test_user.email,
            "password": TEST_PASSWORD
        }
        
        login_response = await test_client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_data = login_response.json()
        access_token = login_data["access_token"]
        
        # Act - récupérer l'utilisateur courant
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await test_client.get("/api/v1/auth/me", headers=headers)
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        # La route /me retourne un objet avec structure {user: {...}, profile: {...}, addresses: [...]}
        assert "user" in data
        assert data["user"]["email"] == test_user.email
        assert data["user"]["name"] == test_user.name
        assert "password_hash" not in data["user"]
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token(self, test_client):
        """Test d'accès à un endpoint protégé sans token"""
        # Act
        response = await test_client.get("/api/v1/auth/me")
        
        # Assert
        # Accepte 401 (Unauthorized) ou 403 (Forbidden) - les deux sont valides
        assert response.status_code in [401, 403]
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_invalid_token(self, test_client):
        """Test d'accès à un endpoint protégé avec token invalide"""
        # Arrange
        headers = {"Authorization": "Bearer invalid_token"}
        
        # Act
        response = await test_client.get("/api/v1/auth/me", headers=headers)
        
        # Assert
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
