"""Tests unitaires pour HybridDispatchService"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4, UUID
from datetime import datetime, timedelta

from app.services.hybrid_dispatch_service import HybridDispatchService
from app.models.marketplace import (
    DispatchStrategy,
    DispatchMode,
    DispatchScopeType,
    DeliveryCompanyStatus
)
from app.models.logistics import DeliveryTaskStatus, TaskType, LocationType
from app.models.order import Order, OrderStatus
from app.models.partner import Partner


class TestHybridDispatchService:
    """Tests pour HybridDispatchService"""
    
    def setup_method(self):
        """Configuration avant chaque test"""
        self.mock_db = Mock()
        self.mock_marketplace_repo = Mock()
        self.mock_logistics_repo = Mock()
        self.mock_order_repo = Mock()
        self.mock_dispatch_service = Mock()
        
        # Mock des repositories
        with patch('app.services.hybrid_dispatch_service.MarketplaceRepository') as mock_marketplace_repo_class:
            with patch('app.services.hybrid_dispatch_service.LogisticsRepository') as mock_logistics_repo_class:
                with patch('app.services.hybrid_dispatch_service.OrderRepository') as mock_order_repo_class:
                    with patch('app.services.hybrid_dispatch_service.DispatchService') as mock_dispatch_service_class:
                        mock_marketplace_repo_class.return_value = self.mock_marketplace_repo
                        mock_logistics_repo_class.return_value = self.mock_logistics_repo
                        mock_order_repo_class.return_value = self.mock_order_repo
                        mock_dispatch_service_class.return_value = self.mock_dispatch_service
                        
                        self.service = HybridDispatchService(self.mock_db)
    
    def test_resolve_dispatch_strategy_partner_scope(self):
        """Test de résolution de stratégie avec scope partenaire"""
        # Arrange
        partner_id = uuid4()
        order_id = uuid4()
        mock_setting = Mock()
        mock_setting.dispatch_strategy = DispatchStrategy.MARKETPLACE_FIRST
        mock_setting.marketplace_timeout_minutes = 45
        
        self.mock_marketplace_repo.get_dispatch_settings_by_scope.return_value = [mock_setting]
        
        # Act
        strategy, timeout = self.service.resolve_dispatch_strategy(
            order_id=order_id,
            task_type=TaskType.PICKUP,
            partner_id=partner_id,
            city="Kinshasa",
            zone="Gombe"
        )
        
        # Assert
        assert strategy == DispatchStrategy.MARKETPLACE_FIRST
        assert timeout == 45
        self.mock_marketplace_repo.get_dispatch_settings_by_scope.assert_called_once_with(
            DispatchScopeType.PARTNER, partner_id
        )
    
    def test_resolve_dispatch_strategy_global_fallback(self):
        """Test de fallback vers stratégie globale"""
        # Arrange
        order_id = uuid4()
        mock_setting = Mock()
        mock_setting.dispatch_strategy = DispatchStrategy.INTERNAL_FIRST
        mock_setting.marketplace_timeout_minutes = 30
        
        # Aucun setting pour partenaire
        self.mock_marketplace_repo.get_dispatch_settings_by_scope.side_effect = [
            [],  # PARTNER
            [],  # TASK_TYPE
            [mock_setting]  # GLOBAL
        ]
        
        # Act
        strategy, timeout = self.service.resolve_dispatch_strategy(
            order_id=order_id,
            task_type=TaskType.DELIVERY
        )
        
        # Assert
        assert strategy == DispatchStrategy.INTERNAL_FIRST
        assert timeout == 30
    
    def test_resolve_dispatch_strategy_default(self):
        """Test de stratégie par défaut"""
        # Arrange
        order_id = uuid4()
        
        # Aucun setting trouvé
        self.mock_marketplace_repo.get_dispatch_settings_by_scope.return_value = []
        
        # Act
        strategy, timeout = self.service.resolve_dispatch_strategy(
            order_id=order_id,
            task_type=TaskType.PICKUP
        )
        
        # Assert
        assert strategy == DispatchStrategy.INTERNAL_FIRST
        assert timeout == 30
    
    def test_dispatch_task_internal_first_with_driver(self):
        """Test de dispatch INTERNAL_FIRST avec chauffeur disponible"""
        # Arrange
        task_id = uuid4()
        order_id = uuid4()
        
        # Mock task et order
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.task_type = TaskType.PICKUP
        
        mock_order = Mock()
        mock_order.id = order_id
        mock_order.partner_id = None
        mock_order.delivery_city = "Kinshasa"
        mock_order.delivery_zone = "Gombe"
        
        self.mock_marketplace_repo.get_market_task.return_value = mock_task
        self.mock_marketplace_repo.get_task_with_order_details.return_value = (mock_task, mock_order)
        
        # Mock resolve strategy
        with patch.object(self.service, 'resolve_dispatch_strategy') as mock_resolve:
            mock_resolve.return_value = (DispatchStrategy.INTERNAL_FIRST, 30)
            
            # Mock available driver
            mock_driver = Mock()
            mock_driver.id = uuid4()
            self.mock_logistics_repo.list_available_drivers.return_value = [mock_driver]
            
            # Mock assign driver
            assigned_task = Mock()
            assigned_task.dispatch_mode = DispatchMode.INTERNAL
            self.mock_marketplace_repo.assign_internal_driver_to_task.return_value = assigned_task
            
            # Act
            result = self.service.dispatch_task(task_id)
            
            # Assert
            assert result == assigned_task
            assert result.dispatch_mode == DispatchMode.INTERNAL
            self.mock_marketplace_repo.assign_internal_driver_to_task.assert_called_once_with(
                task_id, mock_driver.id
            )
    
    def test_dispatch_task_internal_first_no_driver(self):
        """Test de dispatch INTERNAL_FIRST sans chauffeur -> marketplace"""
        # Arrange
        task_id = uuid4()
        order_id = uuid4()
        
        # Mock task et order
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.task_type = TaskType.PICKUP
        
        mock_order = Mock()
        mock_order.id = order_id
        
        self.mock_marketplace_repo.get_market_task.return_value = mock_task
        self.mock_marketplace_repo.get_task_with_order_details.return_value = (mock_task, mock_order)
        
        # Mock resolve strategy
        with patch.object(self.service, 'resolve_dispatch_strategy') as mock_resolve:
            mock_resolve.return_value = (DispatchStrategy.INTERNAL_FIRST, 30)
            
            # No available drivers
            self.mock_logistics_repo.list_available_drivers.return_value = []
            
            # Mock open to market
            market_task = Mock()
            market_task.dispatch_mode = DispatchMode.MARKETPLACE
            with patch.object(self.service, '_open_task_to_market') as mock_open_market:
                mock_open_market.return_value = market_task
                
                # Act
                result = self.service.dispatch_task(task_id)
                
                # Assert
                assert result == market_task
                assert result.dispatch_mode == DispatchMode.MARKETPLACE
                mock_open_market.assert_called_once_with(mock_task, 30)
    
    def test_dispatch_task_marketplace_only(self):
        """Test de dispatch MARKETPLACE_ONLY"""
        # Arrange
        task_id = uuid4()
        order_id = uuid4()
        
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.task_type = TaskType.DELIVERY
        
        mock_order = Mock()
        mock_order.id = order_id
        
        self.mock_marketplace_repo.get_market_task.return_value = mock_task
        self.mock_marketplace_repo.get_task_with_order_details.return_value = (mock_task, mock_order)
        
        # Mock resolve strategy
        with patch.object(self.service, 'resolve_dispatch_strategy') as mock_resolve:
            mock_resolve.return_value = (DispatchStrategy.MARKETPLACE_ONLY, 45)
            
            # Mock open to market
            market_task = Mock()
            market_task.dispatch_mode = DispatchMode.MARKETPLACE
            with patch.object(self.service, '_open_task_to_market') as mock_open_market:
                mock_open_market.return_value = market_task
                
                # Act
                result = self.service.dispatch_task(task_id)
                
                # Assert
                assert result == market_task
                mock_open_market.assert_called_once_with(mock_task, 45)
    
    def test_claim_market_task_success(self):
        """Test de claim réussi d'une tâche marketplace"""
        # Arrange
        task_id = uuid4()
        company_id = uuid4()
        
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.status = DeliveryTaskStatus.CLAIMED
        
        self.mock_marketplace_repo.claim_market_task.return_value = mock_task
        
        # Act
        result = self.service.claim_market_task(task_id, company_id)
        
        # Assert
        assert result == mock_task
        self.mock_marketplace_repo.claim_market_task.assert_called_once_with(task_id, company_id)
    
    def test_claim_market_task_failure(self):
        """Test d'échec de claim d'une tâche marketplace"""
        # Arrange
        task_id = uuid4()
        company_id = uuid4()
        
        self.mock_marketplace_repo.claim_market_task.return_value = None
        
        # Act & Assert
        with pytest.raises(ValueError) as exc_info:
            self.service.claim_market_task(task_id, company_id)
        
        assert "Impossible de claimer la tâche" in str(exc_info.value)
    
    def test_assign_company_driver_success(self):
        """Test d'assignation réussie d'un chauffeur de compagnie"""
        # Arrange
        task_id = uuid4()
        company_id = uuid4()
        driver_id = uuid4()
        
        mock_task = Mock()
        mock_task.id = task_id
        
        self.mock_marketplace_repo.assign_company_driver_to_task.return_value = mock_task
        
        # Act
        result = self.service.assign_company_driver(task_id, company_id, driver_id)
        
        # Assert
        assert result == mock_task
        self.mock_marketplace_repo.assign_company_driver_to_task.assert_called_once_with(
            task_id, company_id, driver_id
        )
    
    def test_expire_market_tasks(self):
        """Test d'expiration des tâches marketplace"""
        # Arrange
        task_id = uuid4()
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.dispatch_strategy = DispatchStrategy.MARKETPLACE_FIRST
        
        self.mock_marketplace_repo.expire_market_tasks.return_value = [mock_task]
        
        # Mock fallback handling
        with patch.object(self.service, '_handle_expired_task_fallback') as mock_fallback:
            
            # Act
            result = self.service.expire_market_tasks()
            
            # Assert
            assert result == [mock_task]
            self.mock_marketplace_repo.expire_market_tasks.assert_called_once()
            mock_fallback.assert_called_once_with(mock_task)
    
    def test_fallback_dispatch_marketplace_first_to_internal(self):
        """Test de fallback MARKETPLACE_FIRST -> INTERNAL_ONLY"""
        # Arrange
        task_id = uuid4()
        
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.dispatch_strategy = DispatchStrategy.MARKETPLACE_FIRST
        mock_task.status = DeliveryTaskStatus.EXPIRED
        
        self.mock_marketplace_repo.get_market_task.return_value = mock_task
        
        # Mock internal dispatch
        internal_task = Mock()
        internal_task.dispatch_mode = DispatchMode.INTERNAL
        with patch.object(self.service, '_dispatch_internal_only') as mock_internal:
            mock_internal.return_value = internal_task
            
            # Act
            result = self.service.fallback_dispatch(task_id)
            
            # Assert
            assert result == internal_task
            mock_internal.assert_called_once_with(mock_task)
    
    def test_get_market_tasks_for_company(self):
        """Test de récupération des tâches marketplace pour une compagnie"""
        # Arrange
        company_id = uuid4()
        task_type = TaskType.PICKUP
        city = "Kinshasa"
        
        mock_tasks = [Mock(), Mock()]
        total = 2
        
        self.mock_marketplace_repo.list_market_tasks.return_value = (mock_tasks, total)
        
        # Act
        tasks, total_result = self.service.get_market_tasks_for_company(
            company_id=company_id,
            task_type=task_type,
            city=city,
            skip=0,
            limit=10
        )
        
        # Assert
        assert tasks == mock_tasks
        assert total_result == total
        self.mock_marketplace_repo.list_market_tasks.assert_called_once_with(
            company_id=company_id,
            task_type=task_type,
            city=city,
            skip=0,
            limit=10
        )
    
    def test_complete_task_with_internal_driver(self):
        """Test de complétion de tâche avec chauffeur interne"""
        # Arrange
        task_id = uuid4()
        driver_id = uuid4()
        proof_photo_url = "https://example.com/photo.jpg"
        proof_note = "Livraison effectuée"
        
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.driver_id = driver_id
        mock_task.assigned_company_id = None
        mock_task.dispatch_mode = None
        
        self.mock_dispatch_service.complete_task.return_value = mock_task
        
        # Act
        result = self.service.complete_task(
            task_id=task_id,
            driver_id=driver_id,
            proof_photo_url=proof_photo_url,
            proof_note=proof_note
        )
        
        # Assert
        assert result == mock_task
        assert result.dispatch_mode == DispatchMode.INTERNAL
        self.mock_dispatch_service.complete_task.assert_called_once_with(
            task_id=task_id,
            driver_id=driver_id,
            proof_photo_url=proof_photo_url,
            proof_note=proof_note
        )
    
    def test_complete_task_with_company_driver(self):
        """Test de complétion de tâche avec chauffeur de compagnie"""
        # Arrange
        task_id = uuid4()
        driver_id = uuid4()
        company_id = uuid4()
        
        mock_task = Mock()
        mock_task.id = task_id
        mock_task.driver_id = driver_id
        mock_task.assigned_company_id = company_id
        mock_task.dispatch_mode = None
        
        self.mock_dispatch_service.complete_task.return_value = mock_task
        
        # Act
        result = self.service.complete_task(
            task_id=task_id,
            driver_id=driver_id
        )
        
        # Assert
        assert result == mock_task
        assert result.dispatch_mode == DispatchMode.MARKETPLACE
    
    def test_get_company_drivers_for_task(self):
        """Test de récupération des chauffeurs de compagnie disponibles"""
        # Arrange
        task_id = uuid4()
        company_id = uuid4()
        
        # Mock company drivers
        mock_company_driver1 = Mock()
        mock_company_driver1.driver_id = uuid4()
        
        mock_company_driver2 = Mock()
        mock_company_driver2.driver_id = uuid4()
        
        self.mock_marketplace_repo.list_company_drivers.return_value = (
            [mock_company_driver1, mock_company_driver2], 2
        )
        
        # Mock drivers
        mock_driver1 = Mock()
        mock_driver1.id = mock_company_driver1.driver_id
        mock_driver1.is_available = True
        mock_driver1.status = "active"
        mock_driver1.user_id = "driver1"
        
        mock_driver2 = Mock()
        mock_driver2.id = mock_company_driver2.driver_id
        mock_driver2.is_available = False  # Not available
        mock_driver2.status = "active"
        
        self.mock_logistics_repo.get_driver.side_effect = [mock_driver1, mock_driver2]
        
        # Act
        result = self.service.get_company_drivers_for_task(task_id, company_id)
        
        # Assert
        assert len(result) == 1
        assert result[0][0] == mock_driver1.id
        assert "driver1" in result[0][1]
        
        self.mock_marketplace_repo.list_company_drivers.assert_called_once_with(
            company_id=company_id, is_active=True
        )