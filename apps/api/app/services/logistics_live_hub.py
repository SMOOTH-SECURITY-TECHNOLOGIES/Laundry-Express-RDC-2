"""Hub WebSocket logistique — diffusion temps réel des événements terrain."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

LOGISTICS_WS_CHANNELS = frozenset({
    "task.created",
    "task.updated",
    "task.assigned",
    "task.completed",
    "driver.location",
    "driver.availability",
})

_live_connections: set[WebSocket] = set()
_pending_events: list[dict[str, Any]] = []


def build_logistics_event(channel: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "channel": channel,
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def channel_for_task_status(status: str) -> str:
    if status in {"driver_assigned", "claimed"}:
        return "task.assigned"
    if status == "completed":
        return "task.completed"
    if status in {"pending", "open_market"}:
        return "task.created"
    return "task.updated"


async def register_connection(websocket: WebSocket) -> None:
    _live_connections.add(websocket)


async def unregister_connection(websocket: WebSocket) -> None:
    _live_connections.discard(websocket)


async def broadcast_logistics_event(channel: str, payload: dict[str, Any]) -> None:
    if channel not in LOGISTICS_WS_CHANNELS:
        return

    message = build_logistics_event(channel, payload)
    dead: set[WebSocket] = set()
    for connection in list(_live_connections):
        try:
            await connection.send_json(message)
        except Exception:
            dead.add(connection)
    for connection in dead:
        _live_connections.discard(connection)


def enqueue_logistics_event(channel: str, payload: dict[str, Any]) -> None:
    """File d'événements pour les handlers HTTP synchrones."""
    if channel not in LOGISTICS_WS_CHANNELS:
        return
    _pending_events.append(build_logistics_event(channel, payload))


async def flush_pending_events() -> None:
    while _pending_events:
        event = _pending_events.pop(0)
        channel = str(event.get("channel", "task.updated"))
        payload = event.get("payload") if isinstance(event.get("payload"), dict) else {}
        await broadcast_logistics_event(channel, payload)


def publish_logistics_event(channel: str, payload: dict[str, Any]) -> None:
    """Publie depuis un handler sync (assignation, GPS, etc.)."""
    enqueue_logistics_event(channel, payload)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(flush_pending_events())
    except RuntimeError:
        pass
