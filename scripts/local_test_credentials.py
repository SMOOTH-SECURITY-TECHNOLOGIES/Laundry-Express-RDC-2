#!/usr/bin/env python3
"""
Centralise les credentials locaux de verification pour eviter les secrets
figes dans les scripts versionnes.
"""

from __future__ import annotations

import os


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Environment variable {name} is required")
    return value


def optional_env(name: str, fallback: str) -> str:
    return os.getenv(name, fallback).strip() or fallback


def load_local_test_credentials() -> dict[str, dict[str, str]]:
    return {
        "super_admin": {
            "email": optional_env("SEED_SUPER_ADMIN_EMAIL", "admin@laundryexpress.cd"),
            "password": require_env("SEED_SUPER_ADMIN_PASSWORD"),
        },
        "platform_admin": {
            "email": optional_env("SEED_PLATFORM_ADMIN_EMAIL", "admin@laundryexpress.cd"),
            "password": require_env("SEED_PLATFORM_ADMIN_PASSWORD"),
        },
        "customer": {
            "email": optional_env("SEED_CUSTOMER_EMAIL", "test@example.com"),
            "password": require_env("SEED_CUSTOMER_PASSWORD"),
        },
        "inactive_customer": {
            "email": optional_env("SEED_INACTIVE_CUSTOMER_EMAIL", "inactive@example.com"),
            "password": require_env("SEED_INACTIVE_CUSTOMER_PASSWORD"),
        },
        "new_customer": {
            "email": optional_env("SEED_NEW_CUSTOMER_EMAIL", "new@example.com"),
            "password": require_env("SEED_NEW_CUSTOMER_PASSWORD"),
        },
        "partner_owner": {
            "email": optional_env("SEED_PARTNER_OWNER_EMAIL", "owner@partner.com"),
            "password": require_env("SEED_PARTNER_OWNER_PASSWORD"),
        },
        "partner_staff": {
            "email": optional_env("SEED_PARTNER_STAFF_EMAIL", "staff@partner.com"),
            "password": require_env("SEED_PARTNER_STAFF_PASSWORD"),
        },
        "driver": {
            "email": optional_env("SEED_DRIVER_EMAIL", "driver@laundryexpress.cd"),
            "password": require_env("SEED_DRIVER_PASSWORD"),
        },
        "logistics_manager": {
            "email": optional_env("SEED_LOGISTICS_EMAIL", "logistics@laundryexpress.cd"),
            "password": require_env("SEED_LOGISTICS_PASSWORD"),
        },
    }
