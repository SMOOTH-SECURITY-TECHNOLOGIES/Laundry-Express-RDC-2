import pytest
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4, UUID
from unittest.mock import Mock, AsyncMock

from app.services.pricing_service import PricingService
from app.models.catalog import (
    ServiceCategory,
    ServiceType,
    PartnerService,
    PricingRule,
    PricingMode,
    RuleType,
    PriceAdjustmentType,
)
from app.schemas.pricing import (
    PricingEstimateRequest,
    PricingEstimateItemInput,
    PriceCalculationInput,
)
from app.schemas.order import OrderItemCreate


@pytest.fixture
def mock_db_session():
    """Mock de session de base de données"""
    return Mock()


@pytest.fixture
def sample_service_category():
    """Catégorie de service de test"""
    return ServiceCategory(
        id=uuid4(),
        name="Lavage",
        slug="lavage",
        description="Services de lavage",
        is_active=True,
    )


@pytest.fixture
def sample_service_type():
    """Type de service de test"""
    return ServiceType(
        id=uuid4(),
        name="Lavage standard",
        slug="lavage-standard",
        description="Lavage standard",
        is_active=True,
    )


@pytest.fixture
def sample_partner_service(sample_service_category, sample_service_type):
    """Service partenaire de test"""
    return PartnerService(
        id=uuid4(),
        partner_id=uuid4(),
        service_category_id=sample_service_category.id,
        service_type_id=sample_service_type.id,
        base_price=Decimal("5000.00"),
        pricing_mode=PricingMode.UNIT,
        estimated_turnaround_hours=24,
        is_available=True,
        service_category=sample_service_category,
        service_type=sample_service_type,
    )


@pytest.fixture
def sample_pricing_rule():
    """Règle de tarification de test"""
    return PricingRule(
        id=uuid4(),
        partner_id=uuid4(),
        rule_type=RuleType.EXPRESS_SURCHARGE,
        service_category_id=None,
        service_type_id=None,
        min_quantity=None,
        max_quantity=None,
        price_adjustment_type=PriceAdjustmentType.PERCENTAGE,
        price_adjustment_value=Decimal("20.00"),
        is_active=True,
    )


@pytest.fixture
def pricing_service(mock_db_session):
    """Service de tarification pour les tests"""
    return PricingService(mock_db_session)


class TestPricingService:
    """Tests pour le service de tarification"""

    @staticmethod
    def _make_order_item(**overrides):
        data = {
            "service_id": uuid4(),
            "quantity": Decimal("2.00"),
            "item_name": "Chemise",
            "unit_price": Decimal("1500.00"),
            "notes": "Blanche",
            "detected_by_ai": False,
        }
        data.update(overrides)
        return OrderItemCreate(**data)

    def test_calculate_item_price_unit(self, pricing_service, sample_partner_service):
        """Test du calcul de prix pour un article en mode UNIT"""
        # Arrange
        sample_partner_service.pricing_mode = PricingMode.UNIT
        sample_partner_service.base_price = Decimal("1000.00")
        quantity = 3
        item_name = "Chemise"

        # Act
        unit_price, line_total = pricing_service.calculate_item_price(
            sample_partner_service, quantity, item_name
        )

        # Assert
        assert unit_price == Decimal("1000.00")
        assert line_total == Decimal("3000.00")

    def test_calculate_item_price_kg(self, pricing_service, sample_partner_service):
        """Test du calcul de prix pour un article en mode KG"""
        # Arrange
        sample_partner_service.pricing_mode = PricingMode.KG
        sample_partner_service.base_price = Decimal("2000.00")
        quantity = 2.5  # 2.5 kg
        item_name = "Couverture"

        # Act
        unit_price, line_total = pricing_service.calculate_item_price(
            sample_partner_service, quantity, item_name
        )

        # Assert
        assert unit_price == Decimal("2000.00")
        assert line_total == Decimal("5000.00")  # 2000 * 2.5

    def test_calculate_item_price_fixed(self, pricing_service, sample_partner_service):
        """Test du calcul de prix pour un article en mode FIXED"""
        # Arrange
        sample_partner_service.pricing_mode = PricingMode.FIXED
        sample_partner_service.base_price = Decimal("5000.00")
        quantity = 3  # Ignoré pour FIXED
        item_name = "Service spécial"

        # Act
        unit_price, line_total = pricing_service.calculate_item_price(
            sample_partner_service, quantity, item_name
        )

        # Assert
        assert unit_price == Decimal("5000.00")
        assert line_total == Decimal("5000.00")  # Prix fixe

    def test_apply_pricing_rule_fixed(self, pricing_service, sample_pricing_rule):
        """Test de l'application d'une règle de tarification FIXED"""
        # Arrange
        sample_pricing_rule.price_adjustment_type = PriceAdjustmentType.FIXED
        sample_pricing_rule.price_adjustment_value = Decimal("1000.00")
        amount = Decimal("5000.00")

        # Act
        adjustment = pricing_service.apply_pricing_rule(amount, sample_pricing_rule)

        # Assert
        assert adjustment == Decimal("1000.00")

    def test_apply_pricing_rule_percentage(self, pricing_service, sample_pricing_rule):
        """Test de l'application d'une règle de tarification PERCENTAGE"""
        # Arrange
        sample_pricing_rule.price_adjustment_type = PriceAdjustmentType.PERCENTAGE
        sample_pricing_rule.price_adjustment_value = Decimal("10.00")
        amount = Decimal("5000.00")

        # Act
        adjustment = pricing_service.apply_pricing_rule(amount, sample_pricing_rule)

        # Assert
        assert adjustment == Decimal("500.00")  # 10% de 5000

    def test_apply_pricing_rule_discount(self, pricing_service, sample_pricing_rule):
        """Test de l'application d'une règle de remise"""
        # Arrange
        sample_pricing_rule.rule_type = RuleType.BULK_DISCOUNT
        sample_pricing_rule.price_adjustment_type = PriceAdjustmentType.PERCENTAGE
        sample_pricing_rule.price_adjustment_value = Decimal("15.00")
        amount = Decimal("10000.00")

        # Act
        adjustment = pricing_service.apply_pricing_rule(amount, sample_pricing_rule)

        # Assert
        assert adjustment == Decimal("-1500.00")  # -15% de 10000

    def test_validate_order_items_success(self, pricing_service, mock_db_session):
        """Test de validation d'articles valides"""
        # Arrange
        partner_id = uuid4()
        service_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.get_partner_service_by_ids.return_value = Mock(
            is_available=True,
            service_category=Mock(name="Lavage"),
            service_type=Mock(name="Standard"),
        )
        pricing_service.repository = mock_repository
        
        items = [
            self._make_order_item(service_id=service_id)
        ]

        # Act
        errors = pricing_service.validate_order_items(partner_id, items)

        # Assert
        assert len(errors) == 0

    def test_validate_order_items_service_not_found(self, pricing_service, mock_db_session):
        """Test de validation avec service non trouvé"""
        # Arrange
        partner_id = uuid4()
        service_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.get_partner_service_by_ids.return_value = None
        pricing_service.repository = mock_repository
        
        items = [
            self._make_order_item(service_id=service_id)
        ]

        # Act
        errors = pricing_service.validate_order_items(partner_id, items)

        # Assert
        assert len(errors) == 1
        assert "non trouvé" in errors[0]

    def test_validate_order_items_service_unavailable(self, pricing_service, mock_db_session):
        """Test de validation avec service non disponible"""
        # Arrange
        partner_id = uuid4()
        service_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.get_partner_service_by_ids.return_value = Mock(
            is_available=False,
            service_category=Mock(name="Lavage"),
            service_type=Mock(name="Standard"),
        )
        pricing_service.repository = mock_repository
        
        items = [
            self._make_order_item(service_id=service_id)
        ]

        # Act
        errors = pricing_service.validate_order_items(partner_id, items)

        # Assert
        assert len(errors) == 1
        assert "n'est pas disponible" in errors[0]

    def test_validate_order_items_invalid_quantity(self, pricing_service, mock_db_session):
        """Test de validation avec quantité invalide"""
        # Arrange
        partner_id = uuid4()
        service_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.get_partner_service_by_ids.return_value = Mock(
            is_available=True,
            service_category=Mock(name="Lavage"),
            service_type=Mock(name="Standard"),
        )
        pricing_service.repository = mock_repository
        
        items = [
            SimpleNamespace(
                service_id=service_id,
                quantity=Decimal("0.00"),
                item_name="Chemise",
                unit_price=Decimal("1500.00"),
                notes="Blanche",
                detected_by_ai=False,
            )
        ]

        # Act
        errors = pricing_service.validate_order_items(partner_id, items)

        # Assert
        assert len(errors) == 1
        assert "La quantité doit être positive" in errors[0]

    def test_validate_order_items_missing_item_name(self, pricing_service, mock_db_session):
        """Test de validation avec nom d'article manquant"""
        # Arrange
        partner_id = uuid4()
        service_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.get_partner_service_by_ids.return_value = Mock(
            is_available=True,
            service_category=Mock(name="Lavage"),
            service_type=Mock(name="Standard"),
        )
        pricing_service.repository = mock_repository
        
        items = [
            SimpleNamespace(
                service_id=service_id,
                quantity=Decimal("2.00"),
                item_name="",
                unit_price=Decimal("1500.00"),
                notes="Blanche",
                detected_by_ai=False,
            )
        ]

        # Act
        errors = pricing_service.validate_order_items(partner_id, items)

        # Assert
        assert len(errors) == 1
        assert "Le nom de l'article est requis" in errors[0]

    def test_get_pricing_summary(self, pricing_service, mock_db_session):
        """Test de récupération du résumé de tarification"""
        # Arrange
        partner_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.list_partner_services.return_value = [
            Mock(base_price=Decimal("1000.00")),
            Mock(base_price=Decimal("2000.00")),
            Mock(base_price=Decimal("3000.00")),
        ]
        mock_repository.list_pricing_rules.return_value = [
            Mock(rule_type=RuleType.EXPRESS_SURCHARGE),
            Mock(rule_type=RuleType.PICKUP_FEE),
        ]
        pricing_service.repository = mock_repository

        # Act
        summary = pricing_service.get_pricing_summary(partner_id)

        # Assert
        assert summary["services_count"] == 3
        assert summary["rules_count"] == 2
        assert summary["average_price"] == 2000.0  # (1000+2000+3000)/3
        assert summary["min_price"] == 1000.0
        assert summary["max_price"] == 3000.0
        assert summary["has_express"] == True
        assert summary["has_pickup_fee"] == True
        assert summary["has_delivery_fee"] == False
        assert summary["has_bulk_discount"] == False

    def test_get_pricing_summary_no_services(self, pricing_service, mock_db_session):
        """Test de récupération du résumé sans services"""
        # Arrange
        partner_id = uuid4()
        
        # Mock du repository
        mock_repository = Mock()
        mock_repository.list_partner_services.return_value = []
        mock_repository.list_pricing_rules.return_value = []
        pricing_service.repository = mock_repository

        # Act
        summary = pricing_service.get_pricing_summary(partner_id)

        # Assert
        assert summary["services_count"] == 0
        assert summary["rules_count"] == 0
        assert summary["average_price"] == 0
        assert summary["min_price"] == 0
        assert summary["max_price"] == 0
        assert summary["has_express"] == False
        assert summary["has_pickup_fee"] == False
        assert summary["has_delivery_fee"] == False
        assert summary["has_bulk_discount"] == False
