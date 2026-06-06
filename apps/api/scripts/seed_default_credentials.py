#!/usr/bin/env python3
"""
Seed idempotent des comptes locaux par défaut pour Laundry Express.

Usage:
    python apps/api/scripts/seed_default_credentials.py

Overrides utiles en shell local:
    set DATABASE_URL_SYNC=postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express
    python apps/api/scripts/seed_default_credentials.py

    ou

    set SEED_DATABASE_URL_SYNC=postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express
    python apps/api/scripts/seed_default_credentials.py
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from sqlalchemy import create_engine, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker


ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.core.config import settings
from app.models.partner import Partner, PartnerStaff, PartnerStatus, PartnerType
from app.models.user import User, UserProfile, UserRole, UserStatus
from app.services.auth_service import AuthService


@dataclass(frozen=True)
class SeedUser:
    email: str
    phone: str
    name: str
    password: str
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    is_email_verified: bool = True
    is_phone_verified: bool = True
    preferred_language: str = "fr"
    loyalty_points: int = 0


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Environment variable {name} is required")
    return value


def resolve_database_url_sync() -> str:
    return (
        os.getenv("SEED_DATABASE_URL_SYNC")
        or os.getenv("DATABASE_URL_SYNC")
        or settings.DATABASE_URL_SYNC
    )


def mask_database_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if not parsed.hostname:
        return "<invalid>"
    user = parsed.username or "user"
    db_name = parsed.path.lstrip("/") or "database"
    port = parsed.port or 5432
    return f"{parsed.scheme}://{user}:***@{parsed.hostname}:{port}/{db_name}"


def split_name(name: str) -> tuple[Optional[str], Optional[str]]:
    parts = name.strip().split()
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def find_user_by_email(db, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def find_user_by_phone(db, phone: str) -> User | None:
    return db.execute(select(User).where(User.phone == phone)).scalar_one_or_none()


def find_available_phone(db, base_phone: str, reserved_phones: set[str]) -> str:
    digits = "".join(ch for ch in base_phone if ch.isdigit())
    if not digits:
        raise ValueError(f"Invalid seed phone: {base_phone}")

    prefix = "+" if base_phone.startswith("+") else ""
    current = int(digits)

    for _ in range(1000):
        candidate = f"{prefix}{current}"
        if candidate not in reserved_phones and not find_user_by_phone(db, candidate):
            return candidate
        current += 1

    raise ValueError(f"Unable to allocate an available phone near {base_phone}")


def ensure_user(db, auth_service: AuthService, seed: SeedUser, reserved_phones: set[str]) -> User:
    existing_user = find_user_by_email(db, seed.email)
    existing_phone_user = find_user_by_phone(db, seed.phone)

    password_hash = auth_service.hash_password(seed.password)
    phone_to_use = seed.phone

    if existing_user and existing_user.phone:
        reserved_phones.discard(existing_user.phone)

    phone_conflict = existing_phone_user and existing_phone_user.email != seed.email
    if not phone_conflict and phone_to_use in reserved_phones:
        phone_conflict = True

    if phone_conflict:
        phone_to_use = find_available_phone(db, seed.phone, reserved_phones)
        print(
            f"  - phone collision for {seed.email}: {seed.phone} already used by "
            f"{existing_phone_user.email if existing_phone_user else 'current seed batch'}, reassigned to {phone_to_use}"
        )

    if existing_user:
        existing_user.phone = phone_to_use
        existing_user.name = seed.name
        existing_user.password_hash = password_hash
        existing_user.role = seed.role
        existing_user.status = seed.status
        existing_user.is_email_verified = seed.is_email_verified
        existing_user.is_phone_verified = seed.is_phone_verified
        existing_user.is_2fa_enabled = False
        existing_user.loyalty_points = seed.loyalty_points
        user = existing_user
        action = "updated"
    else:
        user = User(
            email=seed.email,
            phone=phone_to_use,
            name=seed.name,
            password_hash=password_hash,
            role=seed.role,
            status=seed.status,
            is_email_verified=seed.is_email_verified,
            is_phone_verified=seed.is_phone_verified,
            is_2fa_enabled=False,
            loyalty_points=seed.loyalty_points,
        )
        db.add(user)
        db.flush()
        action = "created"

    first_name, last_name = split_name(seed.name)
    profile = db.execute(select(UserProfile).where(UserProfile.user_id == user.id)).scalar_one_or_none()

    if profile:
        profile.first_name = first_name
        profile.last_name = last_name
        profile.preferred_language = seed.preferred_language
        profile.theme_preference = "light"
    else:
        db.add(
            UserProfile(
                user_id=user.id,
                first_name=first_name,
                last_name=last_name,
                preferred_language=seed.preferred_language,
                theme_preference="light",
            )
        )

    print(f"  - user {action}: {seed.email} [{seed.role.value}]")
    reserved_phones.add(phone_to_use)
    return user


def ensure_partner(db) -> Partner:
    partner = db.execute(select(Partner).where(Partner.email == "partner@test.com")).scalar_one_or_none()

    if partner:
        partner.name = "Test Partner"
        partner.business_name = "Test Partner Business"
        partner.phone = "+243810000005"
        partner.partner_type = PartnerType.LAUNDRY.value
        partner.status = PartnerStatus.ACTIVE.value
        partner.is_verified = True
        partner.is_featured = False
        partner.is_accepting_orders = True
        print("  - partner updated: partner@test.com")
        return partner

    partner = Partner(
        name="Test Partner",
        business_name="Test Partner Business",
        email="partner@test.com",
        phone="+243810000005",
        partner_type=PartnerType.LAUNDRY.value,
        status=PartnerStatus.ACTIVE.value,
        is_verified=True,
        is_featured=False,
        is_accepting_orders=True,
    )
    db.add(partner)
    db.flush()
    print("  - partner created: partner@test.com")
    return partner


def ensure_partner_staff_link(db, partner: Partner, user: User, role: str) -> None:
    link = db.execute(select(PartnerStaff).where(PartnerStaff.user_id == user.id)).scalar_one_or_none()

    if link:
        link.partner_id = partner.id
        link.role = role
        link.permissions = None
        link.is_active = True
        print(f"  - partner_staff updated: {user.email} -> {role}")
        return

    db.add(
        PartnerStaff(
            partner_id=partner.id,
            user_id=user.id,
            role=role,
            permissions=None,
            is_active=True,
        )
    )
    print(f"  - partner_staff created: {user.email} -> {role}")


def seed_default_credentials() -> bool:
    database_url_sync = resolve_database_url_sync()
    print("Seeding default local credentials...")
    print(f"DB sync utilisée: {mask_database_url(database_url_sync)}")

    engine = create_engine(database_url_sync, pool_pre_ping=True)
    session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    auth_service = AuthService(None)

    db = session_local()
    try:
        reserved_phones = {
            phone
            for phone in db.execute(select(User.phone)).scalars().all()
            if phone
        }
        super_admin_seed = SeedUser(
            email="admin@laundryexpress.cd",
            phone="+243810000000",
            name="Super Administrateur",
            password=require_env("SEED_SUPER_ADMIN_PASSWORD"),
            role=UserRole.SUPER_ADMIN,
        )

        platform_admin_seed = SeedUser(
            email=settings.ADMIN_EMAIL,
            phone="+243810000006",
            name="Administrateur Plateforme",
            password=require_env("SEED_PLATFORM_ADMIN_PASSWORD"),
            role=UserRole.ADMIN,
        )

        partner_owner_seed = SeedUser(
            email="owner@partner.com",
            phone="+243810000002",
            name="Partner Owner",
            password=require_env("SEED_PARTNER_OWNER_PASSWORD"),
            role=UserRole.PARTNER_OWNER,
        )
        partner_staff_seed = SeedUser(
            email="staff@partner.com",
            phone="+243810000007",
            name="Partner Staff",
            password=require_env("SEED_PARTNER_STAFF_PASSWORD"),
            role=UserRole.PARTNER_STAFF,
        )
        customer_seed = SeedUser(
            email="test@example.com",
            phone="+243810000001",
            name="Test User",
            password=require_env("SEED_CUSTOMER_PASSWORD"),
            role=UserRole.CUSTOMER,
            loyalty_points=800,
        )
        inactive_customer_seed = SeedUser(
            email="inactive@example.com",
            phone="+243810000008",
            name="Inactive User",
            password=require_env("SEED_INACTIVE_CUSTOMER_PASSWORD"),
            role=UserRole.CUSTOMER,
            status=UserStatus.INACTIVE,
            is_email_verified=False,
            is_phone_verified=False,
        )
        new_customer_seed = SeedUser(
            email="new@example.com",
            phone="+243810000009",
            name="New User",
            password=require_env("SEED_NEW_CUSTOMER_PASSWORD"),
            role=UserRole.CUSTOMER,
        )
        driver_seed = SeedUser(
            email="driver@laundryexpress.cd",
            phone="+243810000003",
            name="Test Driver",
            password=require_env("SEED_DRIVER_PASSWORD"),
            role=UserRole.DRIVER,
        )
        logistics_seed = SeedUser(
            email="logistics@laundryexpress.cd",
            phone="+243810000004",
            name="Logistics Manager",
            password=require_env("SEED_LOGISTICS_PASSWORD"),
            role=UserRole.LOGISTICS_MANAGER,
        )

        print("Users:")
        super_admin = ensure_user(db, auth_service, super_admin_seed, reserved_phones)

        if platform_admin_seed.email == super_admin_seed.email:
            print(
                "  - platform admin skipped: ADMIN_EMAIL equals super admin email, "
                "so the single account keeps SUPER_ADMIN privileges"
            )
            platform_admin = super_admin
        else:
            platform_admin = ensure_user(db, auth_service, platform_admin_seed, reserved_phones)

        customer = ensure_user(db, auth_service, customer_seed, reserved_phones)
        inactive_customer = ensure_user(db, auth_service, inactive_customer_seed, reserved_phones)
        new_customer = ensure_user(db, auth_service, new_customer_seed, reserved_phones)
        driver = ensure_user(db, auth_service, driver_seed, reserved_phones)
        logistics_manager = ensure_user(db, auth_service, logistics_seed, reserved_phones)
        partner_owner = ensure_user(db, auth_service, partner_owner_seed, reserved_phones)
        partner_staff = ensure_user(db, auth_service, partner_staff_seed, reserved_phones)

        print("Partner:")
        partner = ensure_partner(db)
        ensure_partner_staff_link(db, partner, partner_owner, "owner")
        ensure_partner_staff_link(db, partner, partner_staff, "staff")

        db.commit()

        print("\nSeed complete.")
        print("\nAccounts updated:")
        print(f"  SUPER_ADMIN: {super_admin.email}")
        if platform_admin is not super_admin:
            print(f"  ADMIN: {platform_admin.email}")
        else:
            print("  ADMIN: same email as SUPER_ADMIN in config, no separate admin account created")
        print(f"  CUSTOMER: {customer.email}")
        print(f"  CUSTOMER_INACTIVE: {inactive_customer.email}")
        print(f"  CUSTOMER_NEW: {new_customer.email}")
        print(f"  PARTNER_OWNER: {partner_owner.email}")
        print(f"  PARTNER_STAFF: {partner_staff.email}")
        print(f"  DRIVER: {driver.email}")
        print(f"  LOGISTICS_MANAGER: {logistics_manager.email}")
        print(f"  PARTNER: {partner.email} / no direct login (Partner is a business entity)")
        print(
            "\nINFO: passwords are not echoed by this script. "
            "See LOCAL_DEFAULT_CREDENTIALS.md for documented bootstrap values "
            "or override them via SEED_* environment variables."
        )
        return True
    except ValueError as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        return False
    except OperationalError as exc:
        db.rollback()
        print("Seed failed: database connection unavailable.")
        print(f"Detail: {exc}")
        print(
            "Cause probable: ce shell local utilise une URL DB qui pointe vers le host Docker `db`, "
            "non résolu hors conteneur."
        )
        print(
            "Correction minimale: définir DATABASE_URL_SYNC / SEED_DATABASE_URL_SYNC vers un host local réel "
            "(ex: 127.0.0.1:5433) ou exécuter le script dans le conteneur API."
        )
        return False
    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(0 if seed_default_credentials() else 1)
