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
    "STAGING_SMOKE_TEST_USER_EMAIL": "existing staging smoke-test user email",
    "STAGING_SMOKE_TEST_USER_PASSWORD": "existing staging smoke-test user password",
    "STAGING_PAYMENT_PROVIDER_MODE": "declared provider mode for staging",
}


def mask(value: str) -> str:
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "..." + value[-4:]


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
