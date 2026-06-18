from app.services.logistics_live_hub import (
    build_logistics_event,
    channel_for_task_status,
    enqueue_logistics_event,
)


def test_channel_for_task_status_maps_laundry_statuses():
    assert channel_for_task_status("driver_assigned") == "task.assigned"
    assert channel_for_task_status("in_progress") == "task.updated"
    assert channel_for_task_status("completed") == "task.completed"
    assert channel_for_task_status("pending") == "task.created"


def test_build_logistics_event_shape():
    event = build_logistics_event("driver.location", {"driverId": "drv-1", "lat": -4.3, "lng": 15.3})
    assert event["channel"] == "driver.location"
    assert event["payload"]["driverId"] == "drv-1"
    assert "timestamp" in event


def test_enqueue_ignores_unknown_channels():
    enqueue_logistics_event("unknown.channel", {"foo": "bar"})
    from app.services import logistics_live_hub

    assert len(logistics_live_hub._pending_events) == 0
