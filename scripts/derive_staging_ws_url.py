#!/usr/bin/env python3
"""Dérive l'URL WebSocket logistique staging à partir de STAGING_API_BASE_URL."""

from __future__ import annotations

import os
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from staging_ws_probe import derive_logistics_ws_url, resolve_logistics_ws_url


def main() -> int:
    explicit = os.getenv("STAGING_LOGISTICS_WS_URL", "").strip()
    api_base = os.getenv("STAGING_API_BASE_URL", "").strip()

    if explicit:
        print(explicit)
        return 0

    if not api_base:
        print("STAGING_API_BASE_URL or STAGING_LOGISTICS_WS_URL is required", file=sys.stderr)
        return 1

    print(resolve_logistics_ws_url(api_base))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
