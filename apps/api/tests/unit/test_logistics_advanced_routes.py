from types import SimpleNamespace
from uuid import uuid4

from app.api.routes import logistics
from app.models.logistics import DeliveryTask, DeliveryTaskStatus, Vehicle, VehicleStatus, VehicleType
from app.models.user import UserRole


class FakeQuery:
    def __init__(self, items):
        self.items = items

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self.items


class FakeDB:
    def __init__(self):
        self.vehicles = [
            SimpleNamespace(
                id=uuid4(),
                plate="LX-001",
                type=VehicleType.MOTO,
                status=VehicleStatus.IN_TRANSIT,
                mileage_km=120500,
            ),
            SimpleNamespace(
                id=uuid4(),
                plate="LX-002",
                type="van",
                status=VehicleStatus.PENDING,
                mileage_km=None,
            ),
        ]
        self.tasks = [
            SimpleNamespace(id=uuid4(), status=DeliveryTaskStatus.IN_PROGRESS),
            SimpleNamespace(id=uuid4(), status=DeliveryTaskStatus.ACCEPTED),
        ]

    def query(self, model):
        if model is Vehicle:
            return FakeQuery(self.vehicles)
        if model is DeliveryTask:
            return FakeQuery(self.tasks)
        return FakeQuery([])


class FakeFleetService:
    def apply_vehicle_company_filter(self, query, current_user):
        return query


def test_fuel_usage_summary_handles_vehicle_enums_strings_and_null_mileage(monkeypatch):
    monkeypatch.setattr(logistics, "_fleet_service", lambda db: FakeFleetService())

    response = logistics.get_fuel_usage(
        db=FakeDB(),
        current_user=SimpleNamespace(id=uuid4(), role=UserRole.ADMIN),
    )

    assert response.trackedVehicles == 2
    assert response.estimatedCost == 4.2
    assert response.costPerMission == 2.1
    assert response.costPerKm == 0.42
    assert response.anomalyCount == 1
    assert response.byVehicle[0].anomaly == "high_mileage"
