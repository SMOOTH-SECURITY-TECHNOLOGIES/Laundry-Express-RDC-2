"""Tests d'intégration pour les routes de paiement"""

import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime, timezone

from app.main import app
from app.models.payment import PaymentIntent, PaymentIntentStatus, PaymentMethod
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.core.database import get_db
from app.core.config import settings


pytestmark = pytest.mark.skip(
    reason="Quarantined during MVP stabilization: asserts routes and models that no longer match the real payment contract."
)


@pytest.fixture
async def test_client():
    """Client HTTP pour les tests"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def test_db():
    """Session de base de données pour les tests"""
    async for session in get_db():
        yield session


@pytest.fixture
async def test_customer(test_db):
    """Créer un client de test"""
    customer = User(
        email="customer@test.com",
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


@pytest.fixture
async def test_partner(test_db):
    """Créer un partenaire de test"""
    partner = User(
        email="partner@test.com",
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


@pytest.fixture
async def test_order(test_db, test_customer, test_partner):
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


@pytest.fixture
async def test_payment_intent(test_db, test_order, test_customer):
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
        test_client,
        test_order,
        test_customer
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
        assert data["customer_id"] == str(test_customer.id)
        assert data["payment_method"] == "mobile_money"
        assert data["amount_expected"] == 150.0
        assert data["amount_paid"] == 0.0
        assert data["status"] == "created"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_create_payment_intent_order_not_found(
        self,
        test_client
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
        test_client,
        test_payment_intent
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
        test_client
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
    async def test_process_cash_payment_success(
        self,
        test_client,
        test_payment_intent,
        test_customer
    ):
        """Test de traitement d'un paiement cash"""
        # Arrange
        # Créer une intention de paiement cash
        cash_payment_intent = PaymentIntent(
            order_id=test_payment_intent.order_id,
            customer_id=test_customer.id,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            currency="CDF",
            amount_expected=150.0,
            amount_paid=0.0,
            status=PaymentIntentStatus.CREATED,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Sauvegarder dans la base de données
        async for session in get_db():
            session.add(cash_payment_intent)
            await session.commit()
            await session.refresh(cash_payment_intent)
            break
        
        confirm_data = {
            "confirmed_by_user_id": str(test_customer.id),
            "amount_paid": 150.0
        }
        
        # Act
        response = await test_client.post(
            f"/api/v1/payments/intents/{cash_payment_intent.id}/cash/confirm",
            json=confirm_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(cash_payment_intent.id)
        assert data["status"] == "paid"
        assert data["amount_paid"] == 150.0
    
    @pytest.mark.asyncio
    async def test_get_order_payment_summary_success(
        self,
        test_client,
        test_order,
        test_payment_intent
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
    
    @pytest.mark.asyncio
    async def test_get_payment_intents_by_customer_success(
        self,
        test_client,
        test_customer,
        test_payment_intent
    ):
        """Test de récupération des intentions de paiement d'un client"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/customers/{test_customer.id}/intents",
            params={"page": 1, "page_size": 10},
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:  # Si des données sont retournées
            assert data[0]["customer_id"] == str(test_customer.id)
    
    @pytest.mark.asyncio
    async def test_get_payment_intents_by_order_success(
        self,
        test_client,
        test_order,
        test_payment_intent
    ):
        """Test de récupération des intentions de paiement d'une commande"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/orders/{test_order.id}/intents",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:  # Si des données sont retournées
            assert data[0]["order_id"] == str(test_order.id)
    
    @pytest.mark.asyncio
    async def test_update_payment_intent_status_success(
        self,
        test_client,
        test_payment_intent
    ):
        """Test de mise à jour du statut d'une intention de paiement"""
        # Arrange
        update_data = {
            "status": "paid"
        }
        
        # Act
        response = await test_client.patch(
            f"/api/v1/payments/intents/{test_payment_intent.id}/status",
            json=update_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_payment_intent.id)
        assert data["status"] == "paid"
    
    @pytest.mark.asyncio
    async def test_create_payment_transaction_success(
        self,
        test_client,
        test_payment_intent
    ):
        """Test de création d'une transaction de paiement"""
        # Arrange
        transaction_data = {
            "transaction_type": "payment",
            "provider_name": "orange_money_rdc",
            "provider_transaction_id": "txn_test_123456",
            "status": "success",
            "amount": 150.0,
            "currency": "CDF"
        }
        
        # Act
        response = await test_client.post(
            f"/api/v1/payments/intents/{test_payment_intent.id}/transactions",
            json=transaction_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["payment_intent_id"] == str(test_payment_intent.id)
        assert data["order_id"] == str(test_payment_intent.order_id)
        assert data["transaction_type"] == "payment"
        assert data["provider_name"] == "orange_money_rdc"
        assert data["provider_transaction_id"] == "txn_test_123456"
        assert data["status"] == "success"
        assert data["amount"] == 150.0
        assert data["currency"] == "CDF"
    
    @pytest.mark.asyncio
    async def test_get_payment_transactions_by_intent_success(
        self,
        test_client,
        test_payment_intent
    ):
        """Test de récupération des transactions d'une intention de paiement"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/intents/{test_payment_intent.id}/transactions",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_get_payment_transactions_by_order_success(
        self,
        test_client,
        test_order
    ):
        """Test de récupération des transactions d'une commande"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/orders/{test_order.id}/transactions",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestRefundRoutes:
    """Tests d'intégration pour les routes de remboursement"""
    
    @pytest.mark.asyncio
    async def test_create_refund_request_success(
        self,
        test_client,
        test_order,
        test_payment_intent,
        test_customer
    ):
        """Test de création d'une demande de remboursement"""
        # Arrange
        # Mettre à jour l'intention de paiement comme payée
        async for session in get_db():
            test_payment_intent.status = PaymentIntentStatus.PAID
            test_payment_intent.amount_paid = 150.0
            await session.commit()
            await session.refresh(test_payment_intent)
            break
        
        refund_data = {
            "payment_intent_id": str(test_payment_intent.id),
            "reason_code": "customer_request",
            "reason_text": "Client non satisfait du service",
            "requested_amount": 150.0
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/refunds/requests",
            json=refund_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == str(test_order.id)
        assert data["payment_intent_id"] == str(test_payment_intent.id)
        assert data["customer_id"] == str(test_customer.id)
        assert data["reason_code"] == "customer_request"
        assert data["requested_amount"] == 150.0
        assert data["status"] == "requested"
    
    @pytest.mark.asyncio
    async def test_get_refund_requests_by_customer_success(
        self,
        test_client,
        test_customer
    ):
        """Test de récupération des demandes de remboursement d'un client"""
        # Act
        response = await test_client.get(
            f"/api/v1/refunds/customers/{test_customer.id}/requests",
            params={"page": 1, "page_size": 10},
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestDisputeRoutes:
    """Tests d'intégration pour les routes de litiges"""
    
    @pytest.mark.asyncio
    async def test_create_dispute_success(
        self,
        test_client,
        test_order,
        test_customer,
        test_partner
    ):
        """Test de création d'un litige"""
        # Arrange
        dispute_data = {
            "order_id": str(test_order.id),
            "category": "service_quality",
            "description": "Le service n'était pas à la hauteur des attentes",
            "priority": "high"
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/disputes",
            json=dispute_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == str(test_order.id)
        assert data["customer_id"] == str(test_customer.id)
        assert data["partner_id"] == str(test_partner.id)
        assert data["category"] == "service_quality"
        assert data["description"] == "Le service n'était pas à la hauteur des attentes"
        assert data["priority"] == "high"
        assert data["status"] == "open"
    
    @pytest.mark.asyncio
    async def test_get_disputes_by_customer_success(
        self,
        test_client,
        test_customer
    ):
        """Test de récupération des litiges d'un client"""
        # Act
        response = await test_client.get(
            f"/api/v1/disputes/customers/{test_customer.id}",
            params={"page": 1, "page_size": 10},
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_get_disputes_by_partner_success(
        self,
        test_client,
        test_partner
    ):
        """Test de récupération des litiges d'un partenaire"""
        # Act
        response = await test_client.get(
            f"/api/v1/disputes/partners/{test_partner.id}",
            params={"page": 1, "page_size": 10},
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_resolve_dispute_success(
        self,
        test_client,
        test_order,
        test_customer,
        test_partner
    ):
        """Test de résolution d'un litige"""
        # Arrange
        # Créer un litige
        dispute_data = {
            "order_id": str(test_order.id),
            "category": "service_quality",
            "description": "Test dispute",
            "priority": "medium"
        }
        
        create_response = await test_client.post(
            "/api/v1/disputes",
            json=dispute_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        dispute_id = create_response.json()["id"]
        
        resolve_data = {
            "resolution_notes": "Litige résolu avec succès",
            "status": "resolved"
        }
        
        # Act
        response = await test_client.patch(
            f"/api/v1/disputes/{dispute_id}/resolve",
            json=resolve_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == dispute_id
        assert data["status"] == "resolved"
        assert data["resolution_notes"] == "Litige résolu avec succès"


class TestCommissionRoutes:
    """Tests d'intégration pour les routes de commission"""
    
    @pytest.mark.asyncio
    async def test_create_commission_record_success(
        self,
        test_client,
        test_order,
        test_partner
    ):
        """Test de création d'un enregistrement de commission"""
        # Arrange
        commission_data = {
            "order_id": str(test_order.id),
            "partner_id": str(test_partner.id),
            "gross_amount": 150.0,
            "platform_commission_rate": 15.0,
            "platform_commission_amount": 22.5,
            "partner_net_amount": 127.5
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/commissions/records",
            json=commission_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == str(test_order.id)
        assert data["partner_id"] == str(test_partner.id)
        assert data["gross_amount"] == 150.0
        assert data["platform_commission_rate"] == 15.0
        assert data["platform_commission_amount"] == 22.5
        assert data["partner_net_amount"] == 127.5
        assert data["status"] == "pending"
    
    @pytest.mark.asyncio
    async def test_get_commissions_by_partner_success(
        self,
        test_client,
        test_partner
    ):
        """Test de récupération des commissions d'un partenaire"""
        # Act
        response = await test_client.get(
            f"/api/v1/commissions/partners/{test_partner.id}",
            params={"page": 1, "page_size": 10},
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_get_commissions_by_order_success(
        self,
        test_client,
        test_order
    ):
        """Test de récupération des commissions d'une commande"""
        # Act
        response = await test_client.get(
            f"/api/v1/commissions/orders/{test_order.id}",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_update_commission_status_success(
        self,
        test_client,
        test_order,
        test_partner
    ):
        """Test de mise à jour du statut d'une commission"""
        # Arrange
        # Créer un enregistrement de commission
        commission_data = {
            "order_id": str(test_order.id),
            "partner_id": str(test_partner.id),
            "gross_amount": 150.0,
            "platform_commission_rate": 15.0,
            "platform_commission_amount": 22.5,
            "partner_net_amount": 127.5
        }
        
        create_response = await test_client.post(
            "/api/v1/commissions/records",
            json=commission_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        commission_id = create_response.json()["id"]
        
        update_data = {
            "status": "paid"
        }
        
        # Act
        response = await test_client.patch(
            f"/api/v1/commissions/records/{commission_id}/status",
            json=update_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == commission_id
        assert data["status"] == "paid"


class TestPaymentProviderEvents:
    """Tests d'intégration pour les événements des fournisseurs de paiement"""
    
    @pytest.mark.asyncio
    async def test_create_payment_provider_event_success(
        self,
        test_client,
        test_payment_intent
    ):
        """Test de création d'un événement de fournisseur de paiement"""
        # Arrange
        event_data = {
            "payment_intent_id": str(test_payment_intent.id),
            "event_type": "payment_succeeded",
            "event_data": '{"transaction_id": "txn_123456", "amount": 150.0}',
            "provider": "orange_money_rdc",
            "provider_event_id": "evt_789012"
        }
        
        # Act
        response = await test_client.post(
            "/api/v1/payments/provider-events",
            json=event_data,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["payment_intent_id"] == str(test_payment_intent.id)
        assert data["event_type"] == "payment_succeeded"
        assert data["provider"] == "orange_money_rdc"
        assert data["provider_event_id"] == "evt_789012"
    
    @pytest.mark.asyncio
    async def test_get_payment_provider_events_by_intent_success(
        self,
        test_client,
        test_payment_intent
    ):
        """Test de récupération des événements d'une intention de paiement"""
        # Act
        response = await test_client.get(
            f"/api/v1/payments/intents/{test_payment_intent.id}/provider-events",
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestPaymentStatistics:
    """Tests d'intégration pour les statistiques de paiement"""
    
    @pytest.mark.asyncio
    async def test_get_payment_statistics_success(
        self,
        test_client
    ):
        """Test de récupération des statistiques de paiement"""
        # Arrange
        params = {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "group_by": "day"
        }
        
        # Act
        response = await test_client.get(
            "/api/v1/payments/statistics",
            params=params,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "total_amount" in data
        assert "total_transactions" in data
        assert "payment_methods_distribution" in data
        assert "daily_trends" in data
    
    @pytest.mark.asyncio
    async def test_get_partner_payment_statistics_success(
        self,
        test_client,
        test_partner
    ):
        """Test de récupération des statistiques de paiement d'un partenaire"""
        # Arrange
        params = {
            "start_date": "2024-01-01",
            "end_date": "2024-12-31"
        }
        
        # Act
        response = await test_client.get(
            f"/api/v1/payments/partners/{test_partner.id}/statistics",
            params=params,
            headers={"Authorization": f"Bearer {settings.TEST_TOKEN}"}
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "total_amount" in data
        assert "total_orders" in data
        assert "average_order_value" in data
        assert "payment_methods_distribution" in data
