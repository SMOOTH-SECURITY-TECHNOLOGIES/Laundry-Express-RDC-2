#!/usr/bin/env python3
"""
Vérifie si une configuration staging exploitable est réellement présente.
"""

from pathlib import Path
import os


ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "STAGING_API_BASE_URL": "remote staging API base URL",
    "STAGING_DATABASE_URL": "remote staging async database URL",
    "STAGING_DATABASE_URL_SYNC": "remote staging sync database URL",
}

OPTIONAL = {
    "STAGING_FRONTEND_URL": "staging frontend URL",
    "STAGING_LOGISTICS_WS_URL": "staging logistics live WebSocket URL (wss://)",
    "STAGING_SMOKE_TEST_USER_EMAIL": "existing staging smoke-test user email",
    "STAGING_SMOKE_TEST_USER_PASSWORD": "existing staging smoke-test user password",
    "STAGING_PAYMENT_PROVIDER_MODE": "declared provider mode for staging",
}


def mask(value: str) -> str:
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "..." + value[-4:]


def derive_logistics_ws_url(api_base_url: str) -> str:
    base = api_base_url.rstrip("/")
    if base.startswith("https://"):
        return f"wss://{base[len('https://'):]}/logistics/live"
    if base.startswith("http://"):
        return f"ws://{base[len('http://'):]}/logistics/live"
    return f"{base}/logistics/live"


def main() -> int:
    print("Staging prerequisite check")
    print("=========================")

    missing = []

    print("\nRequired")
    for key, label in REQUIRED.items():
        value = os.getenv(key)
        if value:
            print(f"PASS {key}: {label} -> {mask(value)}")
        else:
            print(f"FAIL {key}: {label} missing")
            missing.append(key)

    print("\nOptional")
    for key, label in OPTIONAL.items():
        value = os.getenv(key)
        if value:
            print(f"INFO {key}: {label} -> {mask(value)}")
        else:
            print(f"INFO {key}: {label} not set")

    print("\nLocal context")
    env_path = ROOT / ".env"
    if env_path.exists():
        print(f"INFO .env present: {env_path}")
    else:
        print("INFO .env not present")

    api_base = os.getenv("STAGING_API_BASE_URL", "").strip()
    if api_base:
        explicit_ws = os.getenv("STAGING_LOGISTICS_WS_URL", "").strip()
        derived_ws = derive_logistics_ws_url(api_base)
        if explicit_ws:
            print(f"INFO logistics WS: explicit -> {mask(explicit_ws)}")
        else:
            print(f"INFO logistics WS: derived from API base -> {mask(derived_ws)}")
            print("INFO set STAGING_LOGISTICS_WS_URL to override, or VITE_LOGISTICS_WS_URL at build time")

    if missing:
        print("\nVerdict")
        print("NO-GO: staging target is not configured in this environment.")
        print("Missing:")
        for key in missing:
            print(f"- {key}")
        return 1

    print("\nVerdict")
    print("GO TO NEXT STAGING ACTION: target configuration exists.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
