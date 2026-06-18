#!/usr/bin/env python3
"""Sonde WebSocket logistique staging (stdlib uniquement)."""

from __future__ import annotations

import base64
import json
import os
import socket
import ssl
import struct
from typing import Any
from urllib.parse import quote, urlparse


def derive_logistics_ws_url(api_base_url: str) -> str:
    base = api_base_url.rstrip("/")
    if base.startswith("https://"):
        return f"wss://{base[len('https://'):]}/logistics/live"
    if base.startswith("http://"):
        return f"ws://{base[len('http://'):]}/logistics/live"
    return f"{base}/logistics/live"


def resolve_logistics_ws_url(api_base_url: str) -> str:
    explicit = os.getenv("STAGING_LOGISTICS_WS_URL", "").strip()
    if explicit:
        return explicit
    return derive_logistics_ws_url(api_base_url)


def _read_http_headers(sock: socket.socket, timeout: float) -> tuple[int, str]:
    sock.settimeout(timeout)
    chunks: list[bytes] = []
    while b"\r\n\r\n" not in b"".join(chunks):
        chunk = sock.recv(4096)
        if not chunk:
            break
        chunks.append(chunk)
    raw = b"".join(chunks).decode("utf-8", errors="replace")
    status_line = raw.split("\r\n", 1)[0]
    try:
        status = int(status_line.split(" ", 2)[1])
    except (IndexError, ValueError):
        status = 0
    return status, raw


def _recv_exact(sock: socket.socket, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            break
        data.extend(chunk)
    return bytes(data)


def _read_ws_text_frame(sock: socket.socket, timeout: float) -> str:
    sock.settimeout(timeout)
    header = _recv_exact(sock, 2)
    if len(header) < 2:
        raise TimeoutError("websocket frame header incomplete")

    opcode = header[0] & 0x0F
    masked = bool(header[1] & 0x80)
    payload_len = header[1] & 0x7F

    if payload_len == 126:
        extended = _recv_exact(sock, 2)
        payload_len = struct.unpack("!H", extended)[0]
    elif payload_len == 127:
        extended = _recv_exact(sock, 8)
        payload_len = struct.unpack("!Q", extended)[0]

    mask_key = b""
    if masked:
        mask_key = _recv_exact(sock, 4)

    payload = _recv_exact(sock, payload_len)
    if masked and mask_key:
        payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))

    if opcode == 0x8:
        raise ConnectionError("websocket closed by server")
    if opcode != 0x1:
        raise ValueError(f"unexpected websocket opcode: {opcode}")

    return payload.decode("utf-8")


def probe_logistics_ws(ws_url: str, token: str, timeout: float = 20.0) -> tuple[bool, str]:
    """Ouvre le flux live, attend un snapshot ou un événement JSON."""
    if not token:
        return False, "missing auth token"

    parsed = urlparse(ws_url)
    if parsed.scheme not in {"ws", "wss"}:
        return False, f"unsupported scheme: {parsed.scheme}"

    host = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme == "wss" else 80)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    else:
        path = f"{path}?token={quote(token, safe='')}"

    sock: socket.socket | ssl.SSLSocket | None = None
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        if parsed.scheme == "wss":
            ctx = ssl.create_default_context()
            sock = ctx.wrap_socket(sock, server_hostname=host)

        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
            f"\r\n"
        )
        sock.sendall(request.encode("utf-8"))

        status, _ = _read_http_headers(sock, timeout)
        if status != 101:
            return False, f"handshake failed with HTTP {status}"

        raw = _read_ws_text_frame(sock, timeout)
        data = json.loads(raw)
        if not isinstance(data, dict):
            return False, "first frame is not a JSON object"

        if data.get("type") == "snapshot":
            task_count = len(data.get("tasks", []))
            return True, f"snapshot received ({task_count} active tasks)"

        if data.get("channel"):
            return True, f"event received ({data['channel']})"

        return False, f"unexpected payload keys: {sorted(data.keys())}"
    except TimeoutError:
        return False, "timeout waiting for websocket data"
    except ConnectionError as exc:
        return False, str(exc)
    except json.JSONDecodeError:
        return False, "first frame is not valid JSON"
    except OSError as exc:
        return False, f"socket error: {exc}"
    finally:
        if sock is not None:
            try:
                sock.close()
            except OSError:
                pass


def is_valid_live_payload(data: dict[str, Any]) -> bool:
    return data.get("type") == "snapshot" or bool(data.get("channel"))
