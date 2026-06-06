"""Tests unitaires pour le PaymentService"""

import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4, UUID
from datetime import datetime, timezone

from app.services.payment_service import PaymentService
from app.models.payment import (
    PaymentIntent, PaymentIntentStatus, PaymentMethod, PaymentProvider,
    PaymentTransaction, PaymentTransactionStatus, PaymentTransactionType
)
from app.models.order import Order, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.user import User, UserRole
from app.schemas.payment import PaymentIntentCreate, CashPaymentConfirmRequest
from app.exceptions import PaymentError, ValidationError


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    return db


@pytest.fixture
def payment_service(mock_db):
    return PaymentService(mock_db)


@pytest.fixture
def sample_order():
    order_id = uuid4()
    order = MagicMock(spec=Order)
    order.id = order_id
    order.customer_id = uuid4()
    order.partner_id = uuid4()
    order.total_amount = 100.0
    order.amount_paid = 0.0
    order.refunded_amount = 0.0
    order.discount_amount = 0.0
    order.status = OrderStatus.DRAFT
    order.payment_status = OrderPaymentStatus.PENDING
    order.currency = "CDF"
    order.created_at = datetime.now(timezone.utc)
    order.updated_at = datetime.now(timezone.utc)
    return order


@pytest.fixture
def sample_user():
    user_id = uuid4()
    user = MagicMock(spec=User)
    user.id = user_id
    user.email = "test@example.com"
    user.name = "Test User"
    user.role = UserRole.CUSTOMER
    user.is_active = True
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    return user


@pytest.fixture
def sample_payment_intent():
    payment_intent_id = uuid4()
    intent = MagicMock(spec=PaymentIntent)
    intent.id = payment_intent_id
    intent.order_id = uuid4()
    intent.customer_id = uuid4()
    intent.payment_method = PaymentMethod.MOBILE_MONEY
    intent.currency = "CDF"
    intent.amount_expected = 100.0
    intent.amount_paid = 0.0
    intent.status = PaymentIntentStatus.CREATED
    intent.created_at = datetime.now(timezone.utc)
    intent.updated_at = datetime.now(timezone.utc)
    return intent


class TestPaymentService:
    """Tests pour le PaymentService"""
    
    def test_create_payment_intent_success(
        self,
        payment_service,
        mock_db,
        sample_order
    ):
        """Test de création d'une intention de paiement réussie"""
        # Arrange
        order_id = sample_order.id
        customer_id = sample_order.customer_id
        payment_data = PaymentIntentCreate(
            order_id=order_id,
            payment_method=PaymentMethod.MOBILE_MONEY,
            amount_expected=100.0,
            currency="CDF"
        )
        
        # Mock des repositories
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=sample_order):
            with patch.object(payment_service.payment_repo, 'get_active_intent_for_order', return_value=None):
                # Mock de la création d'intention
                mock_intent = MagicMock(spec=PaymentIntent)
                mock_intent.order_id = order_id
                mock_intent.customer_id = customer_id
                mock_intent.payment_method = PaymentMethod.MOBILE_MONEY
                mock_intent.amount_expected = 100.0
                mock_intent.status = PaymentIntentStatus.CREATED
                
                with patch.object(payment_service.payment_repo, 'create_intent', return_value=mock_intent):
                    # Act
                    result = payment_service.create_payment_intent(payment_data, customer_id)
                    
                    # Assert
                    assert result.order_id == order_id
                    assert result.customer_id == customer_id
                    assert result.payment_method == PaymentMethod.MOBILE_MONEY
                    assert result.amount_expected == 100.0
                    assert result.status == PaymentIntentStatus.CREATED
                    mock_db.add.assert_called()
                    mock_db.commit.assert_called()
                    mock_db.refresh.assert_called()
    
    def test_create_payment_intent_order_not_found(
        self,
        payment_service,
        sample_order
    ):
        """Test de création d'intention de paiement avec commande inexistante"""
        # Arrange
        order_id = sample_order.id
        customer_id = sample_order.customer_id
        payment_data = PaymentIntentCreate(
            order_id=order_id,
            payment_method=PaymentMethod.MOBILE_MONEY,
            amount_expected=100.0,
            currency="CDF"
        )
        
        # Mock du repository pour retourner None
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=None):
            # Act & Assert
            with pytest.raises(ValidationError) as exc_info:
                payment_service.create_payment_intent(payment_data, customer_id)
            
            assert "Commande" in str(exc_info.value)
            assert str(order_id) in str(exc_info.value)
    
    def test_create_payment_intent_invalid_amount(
        self,
        payment_service,
        sample_order
    ):
        """Test de création d'intention de paiement avec montant invalide"""
        # Arrange
        order_id = sample_order.id
        customer_id = sample_order.customer_id
        payment_data = PaymentIntentCreate(
            order_id=order_id,
            payment_method=PaymentMethod.MOBILE_MONEY,
            amount_expected=50.0,  # Différent du total de la commande (100.0)
            currency="CDF"
        )
        
        # Mock des repositories
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=sample_order):
            with patch.object(payment_service.payment_repo, 'get_active_intent_for_order', return_value=None):
                # Act & Assert
                with pytest.raises(ValidationError) as exc_info:
                    payment_service.create_payment_intent(payment_data, customer_id)
                
                assert "montant attendu" in str(exc_info.value).lower()
    
    def test_create_payment_intent_already_exists(
        self,
        payment_service,
        sample_order,
        sample_payment_intent
    ):
        """Test de création d'intention de paiement quand une existe déjà"""
        # Arrange
        order_id = sample_order.id
        customer_id = sample_order.customer_id
        payment_data = PaymentIntentCreate(
            order_id=order_id,
            payment_method=PaymentMethod.MOBILE_MONEY,
            amount_expected=100.0,
            currency="CDF"
        )
        
        # Mock des repositories
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=sample_order):
            with patch.object(payment_service.payment_repo, 'get_active_intent_for_order', return_value=sample_payment_intent):
                # Act & Assert
                with pytest.raises(PaymentError) as exc_info:
                    payment_service.create_payment_intent(payment_data, customer_id)
                
                assert "Une intention de paiement existe déjà" in str(exc_info.value)
    
    def test_confirm_cash_payment_success(
        self,
        payment_service,
        mock_db,
        sample_payment_intent,
        sample_user
    ):
        """Test de confirmation d'un paiement cash réussi"""
        # Arrange
        payment_intent_id = sample_payment_intent.id
        sample_payment_intent.payment_method = PaymentMethod.CASH_ON_DELIVERY
        
        confirm_data = CashPaymentConfirmRequest(
            confirmed_by_user_id=sample_user.id,
            amount_paid=100.0
        )
        
        # Mock des repositories
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=sample_payment_intent):
            # Mock de la transaction
            mock_transaction = MagicMock(spec=PaymentTransaction)
            mock_transaction.amount = 100.0
            mock_transaction.status = PaymentTransactionStatus.SUCCESS
            
            # Mock order_repo.get_by_id pour retourner un ordre avec total_amount comme float
            mock_order = MagicMock(spec=Order)
            mock_order.id = sample_payment_intent.order_id
            mock_order.total_amount = 100.0  # float, pas MagicMock
            mock_order.amount_paid = 0.0
            mock_order.refunded_amount = 0.0
            mock_order.payment_status = OrderPaymentStatus.PENDING
            
            with patch.object(payment_service.payment_repo, 'create_transaction', return_value=mock_transaction):
                with patch.object(payment_service.order_repo, 'get_by_id', return_value=mock_order):
                    # Act
                    intent, transaction = payment_service.confirm_cash_payment(payment_intent_id, confirm_data)
                    
                    # Assert
                    assert intent.amount_paid == 100.0
                    assert intent.status == PaymentIntentStatus.SUCCEEDED
                    assert transaction.amount == 100.0
                    assert transaction.status == PaymentTransactionStatus.SUCCESS
                    mock_db.add.assert_called()
                    mock_db.commit.assert_called()
    
    def test_confirm_cash_payment_invalid_method(
        self,
        payment_service,
        sample_payment_intent,
        sample_user
    ):
        """Test de confirmation d'un paiement cash avec méthode invalide"""
        # Arrange
        payment_intent_id = sample_payment_intent.id
        sample_payment_intent.payment_method = PaymentMethod.MOBILE_MONEY  # Pas cash
        
        confirm_data = CashPaymentConfirmRequest(
            confirmed_by_user_id=sample_user.id,
            amount_paid=100.0
        )
        
        # Mock du repository
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=sample_payment_intent):
            # Act & Assert
            with pytest.raises(PaymentError) as exc_info:
                payment_service.confirm_cash_payment(payment_intent_id, confirm_data)
            
            assert "Cette méthode ne s'applique qu'aux paiements cash" in str(exc_info.value)
    
    def test_confirm_cash_payment_excess_amount(
        self,
        payment_service,
        sample_payment_intent,
        sample_user
    ):
        """Test de confirmation d'un paiement cash avec montant excessif"""
        # Arrange
        payment_intent_id = sample_payment_intent.id
        sample_payment_intent.payment_method = PaymentMethod.CASH_ON_DELIVERY
        sample_payment_intent.amount_expected = 100.0
        
        confirm_data = CashPaymentConfirmRequest(
            confirmed_by_user_id=sample_user.id,
            amount_paid=150.0  # Plus que le montant attendu
        )
        
        # Mock du repository
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=sample_payment_intent):
            # Act & Assert
            with pytest.raises(ValidationError) as exc_info:
                payment_service.confirm_cash_payment(payment_intent_id, confirm_data)
            
            assert "dépasse le montant attendu" in str(exc_info.value)
    
    def test_recalculate_order_payment_status(
        self,
        payment_service,
        mock_db,
        sample_order
    ):
        """Test de recalcul du statut de paiement d'une commande"""
        # Arrange
        order_id = sample_order.id
        
        # Mock des repositories
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=sample_order):
            with patch.object(payment_service.payment_repo, 'get_intents_for_order', return_value=[]):
                with patch.object(payment_service.refund_repo, 'get_total_refunded_for_order', return_value=0.0):
                    # Act
                    result = payment_service.recalculate_order_payment_status(order_id)
                    
                    # Assert
                    assert result.id == order_id
                    assert result.payment_status == OrderPaymentStatus.PENDING
                    mock_db.commit.assert_called()
    
    def test_get_order_payment_summary_success(
        self,
        payment_service,
        sample_order
    ):
        """Test de récupération du résumé des paiements d'une commande"""
        # Arrange
        order_id = sample_order.id
        
        # Mock des repositories
        with patch.object(payment_service.order_repo, 'get_by_id', return_value=sample_order):
            with patch.object(payment_service.payment_repo, 'get_intents_for_order', return_value=[]):
                with patch.object(payment_service.payment_repo, 'get_transactions_for_order', return_value=[]):
                    with patch.object(payment_service.refund_repo, 'get_requests_for_order', return_value=[]):
                        # Act
                        result = payment_service.get_order_payment_summary(order_id)
                        
                        # Assert
                        assert result["order"].id == order_id
                        assert "payment_intents" in result
                        assert "transactions" in result
                        assert "refund_requests" in result
                        assert "total_paid" in result
                        assert "total_refunded" in result
                        assert "amount_due" in result
                        assert "payment_status" in result
    
    def test_initiate_payment_success(
        self,
        payment_service,
        mock_db,
        sample_payment_intent
    ):
        """Test d'initiation d'un paiement"""
        # Arrange
        payment_intent_id = sample_payment_intent.id
        
        # Mock du repository
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=sample_payment_intent):
            # Mock de la transaction
            mock_transaction = MagicMock(spec=PaymentTransaction)
            mock_transaction.payment_intent_id = payment_intent_id
            mock_transaction.transaction_type = PaymentTransactionType.PAYMENT
            mock_transaction.status = PaymentTransactionStatus.INITIATED
            
            # Mock order_repo.get_by_id pour retourner un ordre avec total_amount comme float
            mock_order = MagicMock(spec=Order)
            mock_order.id = sample_payment_intent.order_id
            mock_order.total_amount = 100.0  # float, pas MagicMock
            mock_order.amount_paid = 0.0
            mock_order.refunded_amount = 0.0
            mock_order.payment_status = OrderPaymentStatus.PENDING
            
            with patch.object(payment_service.payment_repo, 'create_transaction', return_value=mock_transaction):
                with patch.object(payment_service.order_repo, 'get_by_id', return_value=mock_order):
                    # Act
                    result = payment_service.initiate_payment(payment_intent_id)
                    
                    # Assert
                    assert result.payment_intent_id == payment_intent_id
                    assert result.transaction_type == PaymentTransactionType.PAYMENT
                    # Note: _simulate_mobile_money_payment change le statut à SUCCESS
                    assert result.status == PaymentTransactionStatus.SUCCESS
                    mock_db.add.assert_called()
                    mock_db.commit.assert_called()
                    mock_db.refresh.assert_called()
    
    def test_initiate_payment_intent_not_found(
        self,
        payment_service
    ):
        """Test d'initiation d'un paiement avec intention inexistante"""
        # Arrange
        payment_intent_id = uuid4()
        
        # Mock du repository pour retourner None
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=None):
            # Act & Assert
            with pytest.raises(PaymentError) as exc_info:
                payment_service.initiate_payment(payment_intent_id)
            
            assert "Intention de paiement" in str(exc_info.value)
            assert str(payment_intent_id) in str(exc_info.value)
    
    def test_initiate_payment_invalid_status(
        self,
        payment_service,
        sample_payment_intent
    ):
        """Test d'initiation d'un paiement avec statut invalide"""
        # Arrange
        payment_intent_id = sample_payment_intent.id
        sample_payment_intent.status = PaymentIntentStatus.SUCCEEDED  # Déjà réussi
        
        # Mock du repository
        with patch.object(payment_service.payment_repo, 'get_intent_by_id', return_value=sample_payment_intent):
            # Act & Assert
            with pytest.raises(PaymentError) as exc_info:
                payment_service.initiate_payment(payment_intent_id)
            
            assert "état invalide" in str(exc_info.value)