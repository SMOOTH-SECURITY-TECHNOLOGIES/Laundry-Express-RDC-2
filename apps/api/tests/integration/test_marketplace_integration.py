"""Tests d'intégration pour le système Marketplace"""

import pytest
from uuid import uuid4
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.marketplace import (
    DeliveryCompany,
    DeliveryCompanyStatus,
    DispatchStrategy,
    DispatchMode,
    DispatchScopeType,
    DispatchSetting,
    CompanyDriver,
    CompanyServiceZone
)
from app.models.logistics import DeliveryTask, DeliveryTaskStatus, TaskType, LocationType, Driver, DriverStatus
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.models.partner import Partner
from app.services.hybrid_dispatch_service import HybridDispatchService


pytestmark = pytest.mark.skip(
    reason="Quarantined during MVP stabilization: non-MVP flow with outdated user/order assumptions."
)


class TestMarketplaceIntegration:
    """Tests d'intégration pour le système Marketplace"""
    
    def test_complete_marketplace_flow(self, db: Session):
        """Test du flux complet marketplace"""
        # 1. Créer une compagnie de livraison
        company = DeliveryCompany(
            id=uuid4(),
            name="Express Delivery RDC",
            slug="express-delivery-rdc",
            phone="+243810000000",
            email="contact@expressdelivery.cd",
            status=DeliveryCompanyStatus.ACTIVE,
            is_active=True,
            supports_pickup=True,
            supports_delivery=True,
            rating_avg=4.5,
            rating_count=10,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(company)
        db.flush()
        
        # 2. Créer un paramètre de dispatch
        setting = DispatchSetting(
            id=uuid4(),
            scope_type=DispatchScopeType.GLOBAL,
            scope_id=None,
            dispatch_strategy=DispatchStrategy.MARKETPLACE_FIRST,
            marketplace_timeout_minutes=30,
            driver_assignment_timeout_minutes=15,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(setting)
        db.flush()
        
        # 3. Créer un utilisateur et un chauffeur
        user = User(
            id=uuid4(),
            email="driver@example.com",
            phone="+243811111111",
            first_name="John",
            last_name="Doe",
            role=UserRole.DRIVER,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        
        driver = Driver(
            id=uuid4(),
            user_id=user.id,
            status=DriverStatus.ACTIVE,
            rating_avg=4.8,
            rating_count=25,
            is_available=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(driver)
        db.flush()
        
        # 4. Associer le chauffeur à la compagnie
        company_driver = CompanyDriver(
            id=uuid4(),
            company_id=company.id,
            driver_id=driver.id,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(company_driver)
        db.flush()
        
        # 5. Créer une zone de service
        service_zone = CompanyServiceZone(
            id=uuid4(),
            company_id=company.id,
            city="Kinshasa",
            commune="Gombe",
            zone="Centre Ville",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(service_zone)
        db.flush()
        
        # 6. Créer une commande
        order = Order(
            id=uuid4(),
            customer_id=uuid4(),
            partner_id=uuid4(),
            status=OrderStatus.CONFIRMED,
            total_amount=15000.0,
            delivery_city="Kinshasa",
            delivery_zone="Gombe",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(order)
        db.flush()
        
        # 7. Créer une tâche de livraison
        task = DeliveryTask(
            id=uuid4(),
            order_id=order.id,
            task_type=TaskType.DELIVERY,
            status=DeliveryTaskStatus.PENDING,
            pickup_location_type=LocationType.PARTNER,
            dropoff_location_type=LocationType.CUSTOMER,
            scheduled_at=datetime.utcnow() + timedelta(hours=2),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(task)
        db.flush()
        
        # 8. Initialiser le service
        service = HybridDispatchService(db)
        
        # 9. Dispatcher la tâche (MARKETPLACE_FIRST)
        dispatched_task = service.dispatch_task(task.id)
        
        # Vérifications
        assert dispatched_task is not None
        assert dispatched_task.status == DeliveryTaskStatus.OPEN_MARKET
        assert dispatched_task.market_visible == True
        assert dispatched_task.market_opened_at is not None
        assert dispatched_task.market_expires_at is not None
        assert dispatched_task.dispatch_mode == DispatchMode.MARKETPLACE
        
        # 10. Claimer la tâche par la compagnie
        claimed_task = service.claim_market_task(task.id, company.id)
        
        assert claimed_task is not None
        assert claimed_task.status == DeliveryTaskStatus.CLAIMED
        assert claimed_task.claimed_by_company_id == company.id
        assert claimed_task.claimed_at is not None
        assert claimed_task.market_visible == False
        
        # 11. Assigner un chauffeur de la compagnie
        assigned_task = service.assign_company_driver(task.id, company.id, driver.id)
        
        assert assigned_task is not None
        assert assigned_task.driver_id == driver.id
        assert assigned_task.assigned_company_id == company.id
        assert assigned_task.assigned_at is not None
        
        # 12. Compléter la tâche
        completed_task = service.complete_task(
            task_id=task.id,
            driver_id=driver.id,
            proof_photo_url="https://example.com/proof.jpg",
            proof_note="Livraison effectuée avec succès"
        )
        
        assert completed_task is not None
        assert completed_task.status == DeliveryTaskStatus.COMPLETED
        assert completed_task.completed_at is not None
        assert completed_task.proof_photo_url == "https://example.com/proof.jpg"
        assert completed_task.proof_note == "Livraison effectuée avec succès"
        
        # Nettoyage
        db.rollback()
    
    def test_marketplace_expiration_fallback(self, db: Session):
        """Test d'expiration marketplace avec fallback"""
        # 1. Créer une compagnie
        company = DeliveryCompany(
            id=uuid4(),
            name="Test Company",
            slug="test-company",
            status=DeliveryCompanyStatus.ACTIVE,
            is_active=True,
            supports_pickup=True,
            supports_delivery=True,
            rating_avg=4.0,
            rating_count=5,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(company)
        db.flush()
        
        # 2. Créer un chauffeur interne
        user = User(
            id=uuid4(),
            email="internal@example.com",
            phone="+243822222222",
            first_name="Internal",
            last_name="Driver",
            role=UserRole.DRIVER,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        
        internal_driver = Driver(
            id=uuid4(),
            user_id=user.id,
            status=DriverStatus.ACTIVE,
            rating_avg=4.5,
            rating_count=15,
            is_available=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(internal_driver)
        db.flush()
        
        # 3. Créer une commande et une tâche
        order = Order(
            id=uuid4(),
            customer_id=uuid4(),
            partner_id=uuid4(),
            status=OrderStatus.CONFIRMED,
            total_amount=10000.0,
            delivery_city="Kinshasa",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(order)
        db.flush()
        
        task = DeliveryTask(
            id=uuid4(),
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(task)
        db.flush()
        
        # 4. Créer un setting MARKETPLACE_FIRST
        setting = DispatchSetting(
            id=uuid4(),
            scope_type=DispatchScopeType.GLOBAL,
            scope_id=None,
            dispatch_strategy=DispatchStrategy.MARKETPLACE_FIRST,
            marketplace_timeout_minutes=1,  # Court timeout pour le test
            driver_assignment_timeout_minutes=15,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(setting)
        db.flush()
        
        # 5. Initialiser le service
        service = HybridDispatchService(db)
        
        # 6. Dispatcher la tâche (ouvre au marketplace)
        dispatched_task = service.dispatch_task(task.id)
        assert dispatched_task.status == DeliveryTaskStatus.OPEN_MARKET
        
        # 7. Simuler l'expiration
        # Modifier manuellement la date d'expiration pour simuler l'expiration
        dispatched_task.market_expires_at = datetime.utcnow() - timedelta(minutes=5)
        db.flush()
        
        # 8. Exécuter l'expiration
        expired_tasks = service.expire_market_tasks()
        
        # Vérifier que la tâche est expirée
        assert len(expired_tasks) >= 1
        expired_task = expired_tasks[0]
        assert expired_task.status == DeliveryTaskStatus.EXPIRED
        
        # 9. Fallback vers interne
        # Pour ce test, on vérifie que le fallback est géré
        # (le fallback automatique est géré dans _handle_expired_task_fallback)
        
        # Nettoyage
        db.rollback()
    
    def test_race_condition_prevention(self, db: Session):
        """Test de prévention des conditions de course lors du claim"""
        # 1. Créer deux compagnies
        company1 = DeliveryCompany(
            id=uuid4(),
            name="Company 1",
            slug="company-1",
            status=DeliveryCompanyStatus.ACTIVE,
            is_active=True,
            supports_pickup=True,
            supports_delivery=True,
            rating_avg=4.0,
            rating_count=5,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(company1)
        
        company2 = DeliveryCompany(
            id=uuid4(),
            name="Company 2",
            slug="company-2",
            status=DeliveryCompanyStatus.ACTIVE,
            is_active=True,
            supports_pickup=True,
            supports_delivery=True,
            rating_avg=4.2,
            rating_count=8,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(company2)
        db.flush()
        
        # 2. Créer une commande et une tâche
        order = Order(
            id=uuid4(),
            customer_id=uuid4(),
            partner_id=uuid4(),
            status=OrderStatus.CONFIRMED,
            total_amount=12000.0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(order)
        db.flush()
        
        task = DeliveryTask(
            id=uuid4(),
            order_id=order.id,
            task_type=TaskType.DELIVERY,
            status=DeliveryTaskStatus.OPEN_MARKET,
            market_visible=True,
            market_opened_at=datetime.utcnow(),
            market_expires_at=datetime.utcnow() + timedelta(minutes=30),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(task)
        db.flush()
        
        # 3. Initialiser le service
        service = HybridDispatchService(db)
        
        # 4. Simuler deux tentatives de claim simultanées
        # (Dans un environnement réel, ce serait des threads/processus concurrents)
        
        # Première tentative (devrait réussir)
        claimed_task1 = service.claim_market_task(task.id, company1.id)
        assert claimed_task1 is not None
        assert claimed_task1.claimed_by_company_id == company1.id
        
        # Deuxième tentative (devrait échouer - tâche déjà claimée)
        with pytest.raises(ValueError) as exc_info:
            service.claim_market_task(task.id, company2.id)
        
        assert "Impossible de claimer la tâche" in str(exc_info.value)
        
        # Vérifier que la tâche est toujours claimée par company1
        db.refresh(task)
        assert task.claimed_by_company_id == company1.id
        assert task.market_visible == False
        
        # Nettoyage
        db.rollback()
    
    def test_dispatch_strategy_resolution_hierarchy(self, db: Session):
        """Test de la hiérarchie de résolution des stratégies"""
        # 1. Créer différents paramètres de dispatch
        global_setting = DispatchSetting(
            id=uuid4(),
            scope_type=DispatchScopeType.GLOBAL,
            scope_id=None,
            dispatch_strategy=DispatchStrategy.INTERNAL_FIRST,
            marketplace_timeout_minutes=30,
            driver_assignment_timeout_minutes=15,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(global_setting)
        
        partner_id = uuid4()
        partner_setting = DispatchSetting(
            id=uuid4(),
            scope_type=DispatchScopeType.PARTNER,
            scope_id=partner_id,
            dispatch_strategy=DispatchStrategy.MARKETPLACE_ONLY,
            marketplace_timeout_minutes=45,
            driver_assignment_timeout_minutes=20,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(partner_setting)
        db.flush()
        
        # 2. Initialiser le service
        service = HybridDispatchService(db)
        
        # 3. Tester la résolution avec partenaire (devrait prendre partner_setting)
        strategy, timeout = service.resolve_dispatch_strategy(
            order_id=uuid4(),
            task_type=TaskType.PICKUP,
            partner_id=partner_id
        )
        
        assert strategy == DispatchStrategy.MARKETPLACE_ONLY
        assert timeout == 45
        
        # 4. Tester la résolution sans partenaire (devrait prendre global_setting)
        strategy, timeout = service.resolve_dispatch_strategy(
            order_id=uuid4(),
            task_type=TaskType.DELIVERY
        )
        
        assert strategy == DispatchStrategy.INTERNAL_FIRST
        assert timeout == 30
        
        # Nettoyage
        db.rollback()


@pytest.fixture
def db():
    """Fixture de base de données pour les tests"""
    # Cette fixture devrait être définie dans conftest.py
    # Pour ce test, on utilise un mock
    from unittest.mock import Mock
    mock_db = Mock(spec=Session)
    return mock_db
