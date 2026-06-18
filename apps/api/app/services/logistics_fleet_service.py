"""Self-service fleet operations scoped to delivery companies."""

from typing import Optional, Set
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.logistics import Driver, DriverStatus, Vehicle
from app.models.marketplace import CompanyDriver
from app.models.user import User, UserRole, UserStatus, create_user, create_user_profile
from app.repositories.logistics_repository import LogisticsRepository
from app.repositories.marketplace_repository import MarketplaceRepository
from app.schemas.logistics import DriverCreate, VehicleCreate
from app.services.auth_service import AuthService
from app.services.logistics_fleet_errors import FleetAccessError, FleetNotFoundError, FleetValidationError


class LogisticsFleetService:
    """Provision drivers and enforce company-scoped fleet access."""

    ADMIN_ROLES = {UserRole.ADMIN, UserRole.SUPER_ADMIN}

    def __init__(self, db: Session):
        self.db = db
        self.logistics_repo = LogisticsRepository(db)
        self.marketplace_repo = MarketplaceRepository(db)

    def resolve_company_id(self, operator: User, requested_company_id: Optional[UUID]) -> UUID:
        if operator.role == UserRole.LOGISTICS_MANAGER:
            company_id = getattr(operator, "delivery_company_id", None)
            if not company_id:
                raise FleetValidationError("Aucune compagnie logistique liée à ce compte.")
            if requested_company_id and requested_company_id != company_id:
                raise FleetAccessError("Vous ne pouvez pas agir pour une autre compagnie.")
            return company_id

        if operator.role in self.ADMIN_ROLES:
            if not requested_company_id:
                raise FleetValidationError("delivery_company_id est requis pour les administrateurs.")
            company = self.marketplace_repo.get_company(requested_company_id)
            if not company:
                raise FleetValidationError("Compagnie logistique introuvable.")
            return requested_company_id

        raise FleetAccessError("Accès réservé aux administrateurs et managers logistiques")

    def company_driver_ids(self, company_id: UUID, active_only: bool = True) -> Set[UUID]:
        query = self.db.query(CompanyDriver.driver_id).filter(CompanyDriver.company_id == company_id)
        if active_only:
            query = query.filter(CompanyDriver.is_active == True)
        return {row.driver_id for row in query.all()}

    def ensure_driver_in_company(self, company_id: UUID, driver_id: UUID) -> None:
        link = self.marketplace_repo.get_company_driver(company_id, driver_id)
        if not link or not link.is_active:
            raise FleetNotFoundError("Chauffeur non trouvé")

    def ensure_vehicle_company_access(self, operator: User, vehicle: Vehicle) -> None:
        company_id = getattr(operator, "delivery_company_id", None) if operator.role == UserRole.LOGISTICS_MANAGER else None
        if not company_id:
            return
        if vehicle.delivery_company_id != company_id:
            raise FleetNotFoundError("Véhicule non trouvé")

    def reject_cross_company_field_change(
        self,
        operator: User,
        requested_company_id: Optional[UUID],
        resource_company_id: Optional[UUID],
    ) -> None:
        if operator.role != UserRole.LOGISTICS_MANAGER:
            return
        operator_company_id = getattr(operator, "delivery_company_id", None)
        if requested_company_id is not None:
            if requested_company_id != operator_company_id:
                raise FleetAccessError("Vous ne pouvez pas modifier la compagnie de cette ressource.")
            if resource_company_id and requested_company_id != resource_company_id:
                raise FleetAccessError("Vous ne pouvez pas réassigner ce véhicule à une autre compagnie.")
        if resource_company_id and resource_company_id != operator_company_id:
            raise FleetNotFoundError("Véhicule non trouvé")

    def apply_vehicle_company_filter(self, query, operator: User):
        company_id = getattr(operator, "delivery_company_id", None) if operator.role == UserRole.LOGISTICS_MANAGER else None
        if company_id:
            return query.filter(Vehicle.delivery_company_id == company_id)
        return query

    def ensure_driver_company_access(self, operator: User, driver_id: UUID) -> None:
        company_id = getattr(operator, "delivery_company_id", None) if operator.role == UserRole.LOGISTICS_MANAGER else None
        if not company_id:
            return
        if driver_id not in self.company_driver_ids(company_id):
            raise FleetNotFoundError("Chauffeur non trouvé")

    def _get_or_create_user_for_driver(self, data: DriverCreate) -> User:
        if data.user_id:
            user = self.db.query(User).filter(User.id == data.user_id).first()
            if not user:
                raise FleetValidationError("Utilisateur introuvable")
            if user.role != UserRole.DRIVER:
                raise FleetValidationError("L'utilisateur doit avoir le rôle chauffeur")
            return user

        if not data.name or not data.email or not data.phone or not data.password:
            raise FleetValidationError("name, email, phone et password sont requis pour créer un chauffeur")

        existing = self.db.query(User).filter(User.email == data.email).first()
        if existing:
            if existing.role != UserRole.DRIVER:
                raise FleetValidationError("Un utilisateur avec cet email existe déjà")
            phone_owner = self.db.query(User).filter(User.phone == data.phone, User.id != existing.id).first()
            if phone_owner:
                raise FleetValidationError("Un utilisateur avec ce numéro de téléphone existe déjà")
            return existing

        phone_owner = self.db.query(User).filter(User.phone == data.phone).first()
        if phone_owner:
            raise FleetValidationError("Un utilisateur avec ce numéro de téléphone existe déjà")

        password_hash = AuthService(None).hash_password(data.password)
        user = create_user(
            email=data.email,
            phone=data.phone,
            password_hash=password_hash,
            name=data.name,
            role=UserRole.DRIVER,
            status=UserStatus.ACTIVE,
            is_email_verified=True,
            is_phone_verified=True,
        )
        self.db.add(user)
        self.db.flush()

        name_parts = data.name.strip().split()
        profile = create_user_profile(
            user_id=user.id,
            first_name=name_parts[0] if name_parts else data.name,
            last_name=" ".join(name_parts[1:]) if len(name_parts) > 1 else None,
        )
        self.db.add(profile)
        self.db.flush()
        return user

    def _assert_no_active_foreign_company(self, driver_id: UUID, company_id: UUID) -> None:
        foreign = (
            self.db.query(CompanyDriver)
            .filter(
                CompanyDriver.driver_id == driver_id,
                CompanyDriver.company_id != company_id,
                CompanyDriver.is_active == True,
            )
            .first()
        )
        if foreign:
            raise FleetAccessError("Ce chauffeur est déjà rattaché à une autre compagnie active.")

    def provision_driver(self, operator: User, data: DriverCreate) -> Driver:
        try:
            company_id = self.resolve_company_id(operator, data.delivery_company_id)
            user = self._get_or_create_user_for_driver(data)

            driver = self.logistics_repo.get_driver_by_user_id(user.id)
            if not driver:
                driver = Driver(
                    user_id=user.id,
                    vehicle_type=data.vehicle_type,
                    license_number=data.license_number,
                    status=data.status,
                    is_available=data.is_available,
                )
                self.db.add(driver)
                self.db.flush()
            else:
                if data.vehicle_type is not None:
                    driver.vehicle_type = data.vehicle_type
                if data.license_number is not None:
                    driver.license_number = data.license_number
                driver.status = data.status
                driver.is_available = data.is_available

            existing_link = self.marketplace_repo.get_company_driver(company_id, driver.id)
            if existing_link:
                if not existing_link.is_active:
                    existing_link.is_active = True
                self._assert_no_active_foreign_company(driver.id, company_id)
                self.db.commit()
                self.db.refresh(driver)
                return driver

            self._assert_no_active_foreign_company(driver.id, company_id)
            self.marketplace_repo.add_company_driver(company_id, driver.id)
            self.db.commit()
            self.db.refresh(driver)
            return driver
        except IntegrityError as exc:
            self.db.rollback()
            raise FleetValidationError("Un utilisateur avec cet email ou ce téléphone existe déjà") from exc

    def create_vehicle_for_operator(self, operator: User, vehicle_data: VehicleCreate) -> Vehicle:
        company_id = self.resolve_company_id(operator, vehicle_data.delivery_company_id)

        if vehicle_data.driver_id:
            self.ensure_driver_in_company(company_id, vehicle_data.driver_id)

        existing = self.db.query(Vehicle).filter(Vehicle.plate == vehicle_data.plate).first()
        if existing:
            raise FleetValidationError("Un véhicule avec cette immatriculation existe déjà")

        vehicle = Vehicle(
            delivery_company_id=company_id,
            plate=vehicle_data.plate,
            type=vehicle_data.type,
            status=vehicle_data.status,
            driver_id=vehicle_data.driver_id,
            assigned_driver_name=vehicle_data.assigned_driver_name,
            zone=vehicle_data.zone,
            location=vehicle_data.location,
            last_known_location=vehicle_data.last_known_location,
            mileage_km=vehicle_data.mileage_km,
            insurance_expires_at=vehicle_data.insurance_expires_at,
            maintenance_status=vehicle_data.maintenance_status,
            maintenance_next_service_km=vehicle_data.maintenance_next_service_km,
            maintenance_notes=vehicle_data.maintenance_notes,
        )
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle
