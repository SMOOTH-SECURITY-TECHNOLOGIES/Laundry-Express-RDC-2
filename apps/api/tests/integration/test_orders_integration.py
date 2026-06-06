import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from app.main import app
from app.models.user import User
from app.models.partner import Partner
from app.models.order import OrderStatus, PaymentStatus


pytestmark = pytest.mark.skip(
    reason="Quarantined during MVP stabilization: fixture `db()` returns None and assertions only prove route presence."
)


class TestOrdersIntegration:
    """Tests d'intégration pour le module Orders"""

    def test_create_order_integration(self, db: Session, test_user: User, test_partner: Partner):
        """Test d'intégration: Création d'une commande"""
        # Arrange
        client = TestClient(app)
        
        # Authentifier l'utilisateur (simulé)
        # TODO: Implémenter l'authentification réelle pour les tests
        
        order_data = {
            "partner_id": str(test_partner.id),
            "items": [
                {
                    "service_id": str(uuid4()),  # Service fictif pour le test
                    "item_name": "Chemise de test",
                    "quantity": 2,
                    "unit_price": 1500,
                    "notes": "À repasser",
                    "detected_by_ai": False
                }
            ],
            "currency": "CDF",
            "special_instructions": "Sonner 2 fois"
        }

        # Act
        # TODO: Ajouter l'authentification dans les headers
        response = client.post("/api/v1/orders", json=order_data)

        # Assert
        # Pour le moment, vérifier que l'endpoint existe
        # Le test réel nécessitera une configuration complète de l'authentification
        assert response.status_code in [201, 401, 403]  # 201 créé ou erreur d'authentification

    def test_list_orders_integration(self, db: Session, test_user: User):
        """Test d'intégration: Liste des commandes"""
        # Arrange
        client = TestClient(app)
        
        # TODO: Créer des commandes de test dans la base de données
        # TODO: Configurer l'authentification

        # Act
        response = client.get("/api/v1/orders")

        # Assert
        # Pour le moment, vérifier que l'endpoint existe
        assert response.status_code in [200, 401, 403]

    def test_get_order_integration(self, db: Session, test_user: User):
        """Test d'intégration: Récupération d'une commande"""
        # Arrange
        client = TestClient(app)
        order_id = uuid4()  # ID fictif
        
        # TODO: Créer une commande de test dans la base de données
        # TODO: Configurer l'authentification

        # Act
        response = client.get(f"/api/v1/orders/{order_id}")

        # Assert
        # Pour le moment, vérifier que l'endpoint existe
        assert response.status_code in [200, 404, 401, 403]

    def test_estimate_order_price_integration(self, db: Session, test_user: User, test_partner: Partner):
        """Test d'intégration: Estimation du prix"""
        # Arrange
        client = TestClient(app)
        
        estimate_data = {
            "partner_id": str(test_partner.id),
            "items": [
                {
                    "service_id": str(uuid4()),
                    "item_name": "Chemise",
                    "quantity": 2,
                    "unit_price": 1500,
                    "notes": None,
                    "detected_by_ai": False
                },
                {
                    "service_id": str(uuid4()),
                    "item_name": "Pantalon",
                    "quantity": 1,
                    "unit_price": 2000,
                    "notes": None,
                    "detected_by_ai": False
                }
            ],
            "currency": "CDF"
        }

        # Act
        response = client.post("/api/v1/orders/estimate", json=estimate_data)

        # Assert
        # L'estimation devrait être accessible sans authentification (ou avec)
        assert response.status_code in [200, 401, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert "subtotal_amount" in data
            assert "total_amount" in data
            assert "currency" in data
            assert data["currency"] == "CDF"

    def test_cancel_order_integration(self, db: Session, test_user: User):
        """Test d'intégration: Annulation d'une commande"""
        # Arrange
        client = TestClient(app)
        order_id = uuid4()  # ID fictif
        
        cancel_data = {
            "reason": "Changement de plan"
        }

        # TODO: Créer une commande annulable dans la base de données
        # TODO: Configurer l'authentification

        # Act
        response = client.post(f"/api/v1/orders/{order_id}/cancel", json=cancel_data)

        # Assert
        # Pour le moment, vérifier que l'endpoint existe
        assert response.status_code in [200, 404, 400, 401, 403]

    # === Fixtures ===

    @pytest.fixture
    def test_user(self, db: Session):
        """Fixture: Créer un utilisateur de test"""
        # TODO: Implémenter la création d'un utilisateur de test
        user = User(
            id=uuid4(),
            email="test@example.com",
            name="Test User",
            phone="+243810000000",
            role="customer",
            status="active",
            is_email_verified=True,
            is_phone_verified=True,
            is_2fa_enabled=False,
        )
        db.add(user)
        db.commit()
        return user

    @pytest.fixture
    def test_partner(self, db: Session):
        """Fixture: Créer un partenaire de test"""
        # TODO: Implémenter la création d'un partenaire de test
        partner = Partner(
            id=uuid4(),
            business_name="Test Partner",
            contact_email="partner@example.com",
            contact_phone="+243820000000",
            is_active=True,
        )
        db.add(partner)
        db.commit()
        return partner

    @pytest.fixture
    def db(self):
        """Fixture: Session de base de données de test"""
        # TODO: Implémenter une session de test propre
        # Pour le moment, retourner None
        return None
