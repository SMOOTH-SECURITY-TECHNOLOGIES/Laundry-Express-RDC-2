"""Service de polling DB pour le flux WebSocket logistique."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.logistics import DeliveryTask, DeliveryTaskStatus, Driver, DriverLocation
from app.services.logistics_live_hub import build_logistics_event, channel_for_task_status

ACTIVE_TASK_STATUSES = [
    DeliveryTaskStatus.PENDING,
    DeliveryTaskStatus.OPEN_MARKET,
    DeliveryTaskStatus.CLAIMED,
    DeliveryTaskStatus.DRIVER_ASSIGNED,
    DeliveryTaskStatus.ACCEPTED,
    DeliveryTaskStatus.IN_PROGRESS,
]


class LogisticsLiveService:
    def __init__(self, db: Session):
        self.db = db

    def build_snapshot(self) -> dict:
        tasks = (
            self.db.query(DeliveryTask)
            .filter(DeliveryTask.status.in_(ACTIVE_TASK_STATUSES))
            .order_by(DeliveryTask.updated_at.desc())
            .limit(25)
            .all()
        )
        return {
            "type": "snapshot",
            "tasks": [
                {
                    "taskId": str(task.id),
                    "orderId": str(task.order_id),
                    "status": task.status.value if hasattr(task.status, "value") else str(task.status),
                    "driverId": str(task.driver_id) if task.driver_id else None,
                }
                for task in tasks
            ],
        }

    def poll_events(self, since: datetime) -> list[dict]:
        events: list[dict] = []

        tasks = (
            self.db.query(DeliveryTask)
            .filter(DeliveryTask.updated_at >= since)
            .order_by(DeliveryTask.updated_at.asc())
            .limit(50)
            .all()
        )
        for task in tasks:
            status = task.status.value if hasattr(task.status, "value") else str(task.status)
            events.append(
                build_logistics_event(
                    channel_for_task_status(status),
                    {
                        "taskId": str(task.id),
                        "orderId": str(task.order_id),
                        "status": status,
                        "driverId": str(task.driver_id) if task.driver_id else None,
                    },
                )
            )

        locations = (
            self.db.query(DriverLocation)
            .filter(DriverLocation.recorded_at >= since)
            .order_by(DriverLocation.recorded_at.asc())
            .limit(50)
            .all()
        )
        for location in locations:
            events.append(
                build_logistics_event(
                    "driver.location",
                    {
                        "driverId": str(location.driver_id),
                        "lat": location.latitude,
                        "lng": location.longitude,
                    },
                )
            )

        drivers = (
            self.db.query(Driver)
            .filter(Driver.updated_at >= since)
            .order_by(Driver.updated_at.asc())
            .limit(25)
            .all()
        )
        for driver in drivers:
            events.append(
                build_logistics_event(
                    "driver.availability",
                    {
                        "driverId": str(driver.id),
                        "isAvailable": driver.is_available,
                    },
                )
            )

        return events

    @staticmethod
    def default_since() -> datetime:
        return datetime.now(timezone.utc) - timedelta(seconds=20)
