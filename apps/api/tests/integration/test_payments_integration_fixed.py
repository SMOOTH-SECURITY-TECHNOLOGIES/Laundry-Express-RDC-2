"""Tests d'intégration pour les routes de paiement - Version corrigée"""

import pytest
pytest_asyncio = pytest.importorskip("pytest_asyncio")
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.payment import PaymentIntent, PaymentIntentStatus, PaymentMethod
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.core.database import get_db
from app.core.config import settings


pytestmark = pytest.mark.skip(
    reason="Quarantined during MVP stabilization: still depends on outdated payment/user model assumptions and async test infra."
)


@pytest_asyncio.fixture
async def test_client():
    """Client HTTP pour les tests"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_db():
    """Session de base de données pour les tests"""
    async for session in get_db():
        yield session
        break


@pytest_asyncio.fixture
async def test_customer(test_db: AsyncSession):
    """Créer un client de test"""
    customer = User(
        email=f"customer_{uuid4().hex[:8]}@test.com",
        first_name="Test",
        last_name="Customer",
        role=UserRole.CUSTOMER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(customer)
    await test_db.commit()
    await test_db.refresh(customer)
    return customer


@pytest_asyncio.fixture
async def test_partner(test_db: AsyncSession):
    """Créer un partenaire de test"""
    partner = User(
        email=f"partner_{uuid4().hex[:8]}@test.com",
        first_name="Test",
        last_name="Partner",
        role=UserRole.PARTNER_OWNER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(partner)
    await test_db.commit()
    await test_db.refresh(partner)
    return partner


@pytest_asyncio.fixture
async def test_order(test_db: AsyncSession, test_customer: User, test_partner: User):
    """Créer une commande de test"""
    order = Order(
        customer_id=test_customer.id,
        partner_id=test_partner.id,
        total_amount=150.0,
        status=OrderStatus.PENDING,
        payment_status="pending",
        amount_paid=0.0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(order)
    await test_db.commit()
    await test_db.refresh(order)
    return order


@pytest_asyncio.fixture
async def test_payment_intent(test_db: AsyncSession, test_order: Order, test_customer: User):
    """Créer une intention de paiement de test"""
    payment_intent = PaymentIntent(
        order_id=test_order.id,
        customer_id=test_customer.id,
        payment_method=PaymentMethod.MOBILE_MONEY,
        currency="CDF",
        amount_expected=150.0,
        amount_paid=0.0,
        status=PaymentIntentStatus.CREATED,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(payment_intent)
    await test_db.commit()
    await test_db.refresh(payment_intent)
    return payment_intent


class TestPaymentRoutes:
    """Tests d'intégration pour les routes de paiement"""
    
    @pytest.mark.asyncio
    async def test_create_payment_intent_success(
        self,
        test_client: AsyncClient,
        test_order: Order,
        test_customer: User
    ):
        """Test de création d'une intention de paiement"""
        # Arrange
        payment_data = {
            "order_id": str(test_order.id),
            "payment_method": "mobile_money",
            "amount_expected": 150.0
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/payments/intents",
            json=payment_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == str(test_order.id)
        assert data["payment_method"] == "mobile_money"
        assert data["amount_expected"] == 150.0
        assert data["amount_paid"] == 0.0
        assert data["status"] == "created"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_create_payment_intent_order_not_found(
        self,
        test_client: AsyncClient
    ):
        """Test de création d'intention de paiement avec commande inexistante"""
        # Arrange
        payment_data = {
            "order_id": str(uuid4()),
            "payment_method": "mobile_money",
            "amount_expected": 150.0
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/payments/intents",
            json=payment_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_get_payment_intent_by_id_success(
        self,
        test_client: AsyncClient,
        test_payment_intent: PaymentIntent
    ):
        """Test de récupération d'une intention de paiement par ID"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/intents/{test_payment_intent.id}",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_payment_intent.id)
        assert data["order_id"] == str(test_payment_intent.order_id)
        assert data["customer_id"] == str(test_payment_intent.customer_id)
        assert data["payment_method"] == "mobile_money"
        assert data["amount_expected"] == 150.0
    
    @pytest.mark.asyncio
    async def test_get_payment_intent_by_id_not_found(
        self,
        test_client: AsyncClient
    ):
        """Test de récupération d'une intention de paiement inexistante"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/intents/{uuid4()}",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_get_order_payment_summary_success(
        self,
        test_client: AsyncClient,
        test_order: Order,
        test_payment_intent: PaymentIntent
    ):
        """Test de récupération du résumé des paiements d'une commande"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/orders/{test_order.id}/summary",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == str(test_order.id)
        assert data["total_amount"] == 150.0
        assert data["amount_paid"] == 0.0
        assert data["amount_due"] == 150.0
        assert "payment_intents" in data
        assert "transactions" in data


class TestPaymentRoutesMinimal:
    """Tests minimaux pour les routes de paiement"""
    
    @pytest.mark.asyncio
    async def test_create_payment_intent_route_exists(
        self,
        test_client: AsyncClient
    ):
        """Test que la route de création d'intention de paiement existe"""
        # Act
        response = await test_client.post(
            "/api/v1/payments/intents",
            json={
                "order_id": str(uuid4()),
                "payment_method": "mobile_money",
                "amount_expected": 100.0
            },
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code in [201, 404, 401, 403]
    
    @pytest.mark.asyncio
    async def test_get_payment_intent_route_exists(
        self,
        test_client: AsyncClient
    ):
        """Test que la route de récupération d'intention de paiement existe"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/intents/{uuid4()}",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code in [200, 404, 401, 403]
    
    @pytest.mark.asyncio
    async def test_process_cash_payment_route_exists(
        self,
        test_client: AsyncClient
    ):
        """Test que la route de traitement de paiement cash existe"""
        # Act
        response = await test_client.post(
            f"/api/v1/payments/intents/{uuid4()}/confirm-cash",
            json={
                "confirmed_by_user_id": str(uuid4()),
                "amount_paid": 100.0
            },
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code in [200, 404, 401, 403]
    
    @pytest.mark.asyncio
    async def test_get_order_payment_summary_route_exists(
        self,
        test_client: AsyncClient
    ):
        """Test que la route de résumé des paiements d'une commande existe"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/orders/{uuid4()}/summary",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code in [200, 404, 401, 403]
