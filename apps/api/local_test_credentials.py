#!/usr/bin/env python3
"""
Centralise les credentials locaux de verification pour eviter les secrets
figes dans les scripts versionnes.
"""

from __future__ import annotations

import os

from load_project_env import load_project_env

load_project_env()


def optional_env(name: str, fallback: str) -> str:
    return os.getenv(name, fallback).strip() or fallback


def resolve_password(*keys: str) -> str:
    for key in keys:
        value = os.getenv(key, "").strip()
        if value:
            return value
    tried = ", ".join(keys)
    raise ValueError(
        f"Missing password env var. Set one of: {tried}. "
        "Add them to .env (see LOCAL_DEFAULT_CREDENTIALS.md) then re-run seed if needed."
    )


def load_local_test_credentials() -> dict[str, dict[str, str]]:
    return {
        "super_admin": {
            "email": optional_env("SEED_SUPER_ADMIN_EMAIL", "admin@laundryexpress.cd"),
            "password": resolve_password("SEED_SUPER_ADMIN_PASSWORD", "SEED_DEFAULT_PASSWORD", "ADMIN_PASSWORD"),
        },
        "platform_admin": {
            "email": optional_env("SEED_PLATFORM_ADMIN_EMAIL", "admin@laundryexpress.cd"),
            "password": resolve_password(
                "SEED_PLATFORM_ADMIN_PASSWORD",
                "SEED_SUPER_ADMIN_PASSWORD",
                "SEED_DEFAULT_PASSWORD",
                "ADMIN_PASSWORD",
            ),
        },
        "customer": {
            "email": optional_env("SEED_CUSTOMER_EMAIL", "test@example.com"),
            "password": resolve_password("SEED_CUSTOMER_PASSWORD", "SEED_DEFAULT_PASSWORD"),
        },
        "inactive_customer": {
            "email": optional_env("SEED_INACTIVE_CUSTOMER_EMAIL", "inactive@example.com"),
            "password": optional_env("SEED_INACTIVE_CUSTOMER_PASSWORD", "password"),
        },
        "new_customer": {
            "email": optional_env("SEED_NEW_CUSTOMER_EMAIL", "new@example.com"),
            "password": resolve_password("SEED_NEW_CUSTOMER_PASSWORD", "SEED_DEFAULT_PASSWORD"),
        },
        "partner_owner": {
            "email": optional_env("SEED_PARTNER_OWNER_EMAIL", "owner@partner.com"),
            "password": resolve_password("SEED_PARTNER_OWNER_PASSWORD", "SEED_DEFAULT_PASSWORD"),
        },
        "partner_staff": {
            "email": optional_env("SEED_PARTNER_STAFF_EMAIL", "staff@partner.com"),
            "password": resolve_password("SEED_PARTNER_STAFF_PASSWORD", "SEED_DEFAULT_PASSWORD"),
        },
        "driver": {
            "email": optional_env("SEED_DRIVER_EMAIL", "driver1@kinexpress.cd"),
            "password": optional_env("SEED_DRIVER_PASSWORD", "driverpass123"),
        },
        "logistics_manager": {
            "email": optional_env("SEED_LOGISTICS_EMAIL", "logistics@laundryexpress.cd"),
            "password": resolve_password("SEED_LOGISTICS_PASSWORD", "SEED_DEFAULT_PASSWORD"),
        },
    }
