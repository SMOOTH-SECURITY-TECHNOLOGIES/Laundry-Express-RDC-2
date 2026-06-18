"""Unit tests for company-scoped logistics fleet operations."""

from unittest.mock import Mock, MagicMock
from uuid import uuid4

import pytest

from app.models.logistics import Driver, DriverStatus, Vehicle
from app.models.marketplace import CompanyDriver
from app.models.user import User, UserRole
from app.schemas.logistics import DriverCreate, VehicleCreate
from app.services.logistics_fleet_errors import FleetAccessError, FleetNotFoundError, FleetValidationError
from app.services.logistics_fleet_service import LogisticsFleetService


class TestLogisticsFleetService:
    def setup_method(self):
        self.db = Mock()
        self.service = LogisticsFleetService(self.db)
        self.service.logistics_repo = Mock()
        self.service.marketplace_repo = Mock()
        self.company_a = uuid4()
        self.company_b = uuid4()
        self.driver_id = uuid4()

    def _manager(self, company_id):
        user = Mock(spec=User)
        user.role = UserRole.LOGISTICS_MANAGER
        user.delivery_company_id = company_id
        return user

    def _admin(self):
        user = Mock(spec=User)
        user.role = UserRole.ADMIN
        user.delivery_company_id = None
        return user

    def test_resolve_company_id_manager_cannot_target_other_company(self):
        manager = self._manager(self.company_a)
        with pytest.raises(FleetAccessError, match="autre compagnie"):
            self.service.resolve_company_id(manager, self.company_b)

    def test_resolve_company_id_manager_without_company(self):
        manager = self._manager(None)
        with pytest.raises(FleetValidationError, match="Aucune compagnie"):
            self.service.resolve_company_id(manager, None)

    def test_resolve_company_id_admin_requires_company(self):
        admin = self._admin()
        with pytest.raises(FleetValidationError, match="delivery_company_id est requis"):
            self.service.resolve_company_id(admin, None)

    def test_ensure_vehicle_company_access_blocks_cross_company(self):
        manager = self._manager(self.company_a)
        vehicle = Mock(spec=Vehicle)
        vehicle.delivery_company_id = self.company_b
        with pytest.raises(FleetNotFoundError, match="non trouvé"):
            self.service.ensure_vehicle_company_access(manager, vehicle)

    def test_apply_vehicle_company_filter_scopes_manager_query(self):
        manager = self._manager(self.company_a)
        query = Mock()
        filtered = Mock()
        query.filter.return_value = filtered
        result = self.service.apply_vehicle_company_filter(query, manager)
        query.filter.assert_called_once()
        assert result is filtered

    def test_ensure_driver_company_access_blocks_foreign_driver(self):
        manager = self._manager(self.company_a)
        self.service.company_driver_ids = Mock(return_value={uuid4()})
        with pytest.raises(FleetNotFoundError, match="non trouvé"):
            self.service.ensure_driver_company_access(manager, self.driver_id)

    def test_provision_driver_rejects_cross_company_link(self):
        manager = self._manager(self.company_a)
        user = Mock()
        user.id = uuid4()
        user.role = UserRole.DRIVER
        driver = Mock(spec=Driver)
        driver.id = self.driver_id
        self.service._get_or_create_user_for_driver = Mock(return_value=user)
        self.service.logistics_repo.get_driver_by_user_id.return_value = driver
        self.service.marketplace_repo.get_company_driver.return_value = None
        foreign_link = Mock(spec=CompanyDriver)
        foreign_link.company_id = self.company_b
        foreign_link.is_active = True
        self.db.query.return_value.filter.return_value.first.return_value = foreign_link

        payload = DriverCreate(
            user_id=user.id,
            delivery_company_id=self.company_a,
            vehicle_type="Moto",
            license_number="ABC-123",
        )

        with pytest.raises(FleetAccessError, match="autre compagnie"):
            self.service.provision_driver(manager, payload)

    def test_create_vehicle_for_operator_assigns_company(self):
        manager = self._manager(self.company_a)
        self.service.marketplace_repo.get_company.return_value = Mock()
        self.db.query.return_value.filter.return_value.first.return_value = None

        payload = VehicleCreate(
            plate="KIN-001-AA",
            type="moto",
            location="Gombe",
        )

        created = self.service.create_vehicle_for_operator(manager, payload)
        assert created.delivery_company_id == self.company_a
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
