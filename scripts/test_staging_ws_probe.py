from pathlib import Path
import sys

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from staging_ws_probe import derive_logistics_ws_url, resolve_logistics_ws_url


def test_derive_logistics_ws_url_from_https(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("STAGING_LOGISTICS_WS_URL", raising=False)
    assert (
        derive_logistics_ws_url("https://staging-api.example.com/api/v1")
        == "wss://staging-api.example.com/api/v1/logistics/live"
    )


def test_resolve_prefers_explicit_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "STAGING_LOGISTICS_WS_URL",
        "wss://custom.example.com/api/v1/logistics/live",
    )
    assert (
        resolve_logistics_ws_url("https://staging-api.example.com/api/v1")
        == "wss://custom.example.com/api/v1/logistics/live"
    )
