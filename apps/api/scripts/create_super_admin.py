#!/usr/bin/env python3
"""
Script idempotent pour créer ou promouvoir le super administrateur.

Usage local recommandé:
    python apps/api/scripts/create_super_admin.py

Overrides utiles si le shell local ne peut pas résoudre le host Docker `db`:
    set DATABASE_URL_SYNC=postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express
    python apps/api/scripts/create_super_admin.py

    ou

    set SUPER_ADMIN_DATABASE_URL_SYNC=postgresql://laundry_user:laundry_pass@127.0.0.1:5433/laundry_express
    python apps/api/scripts/create_super_admin.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker


ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.core.config import settings
from app.models.user import User, UserProfile, UserRole, UserStatus
from app.services.auth_service import AuthService


SUPER_ADMIN_EMAIL = "admin@laundryexpress.cd"
SUPER_ADMIN_PHONE = "+243810000000"
SUPER_ADMIN_NAME = "Super Administrateur"


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Environment variable {name} is required")
    return value


def mask_database_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if not parsed.hostname:
        return "<invalid>"
    user = parsed.username or "user"
    db_name = parsed.path.lstrip("/") or "database"
    port = parsed.port or 5432
    return f"{parsed.scheme}://{user}:***@{parsed.hostname}:{port}/{db_name}"


def resolve_database_url_sync() -> str:
    return (
        os.getenv("SUPER_ADMIN_DATABASE_URL_SYNC")
        or os.getenv("DATABASE_URL_SYNC")
        or settings.DATABASE_URL_SYNC
    )


def split_name(name: str) -> tuple[str | None, str | None]:
    parts = name.strip().split()
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def ensure_super_admin() -> bool:
    database_url_sync = resolve_database_url_sync()
    super_admin_password = require_env("SUPER_ADMIN_PASSWORD")
    print("Création / promotion du super administrateur...")
    print(f"DB sync utilisée: {mask_database_url(database_url_sync)}")

    engine = create_engine(database_url_sync, pool_pre_ping=True)
    session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    auth_service = AuthService(None)

    db = session_local()
    try:
        existing_user = db.execute(select(User).where(User.email == SUPER_ADMIN_EMAIL)).scalar_one_or_none()
        phone_owner = db.execute(select(User).where(User.phone == SUPER_ADMIN_PHONE)).scalar_one_or_none()

        if phone_owner and (not existing_user or phone_owner.id != existing_user.id):
            print(
                "❌ Impossible de créer le super administrateur: "
                f"le téléphone {SUPER_ADMIN_PHONE} est déjà utilisé par {phone_owner.email}."
            )
            return False

        password_hash = auth_service.hash_password(super_admin_password)
        action = "mis à jour"

        if existing_user:
            existing_user.phone = SUPER_ADMIN_PHONE
            existing_user.name = SUPER_ADMIN_NAME
            existing_user.password_hash = password_hash
            existing_user.role = UserRole.SUPER_ADMIN
            existing_user.status = UserStatus.ACTIVE
            existing_user.is_email_verified = True
            existing_user.is_phone_verified = True
            existing_user.is_2fa_enabled = False
            user = existing_user
        else:
            user = User(
                id=uuid4(),
                email=SUPER_ADMIN_EMAIL,
                phone=SUPER_ADMIN_PHONE,
                name=SUPER_ADMIN_NAME,
                password_hash=password_hash,
                role=UserRole.SUPER_ADMIN,
                status=UserStatus.ACTIVE,
                is_email_verified=True,
                is_phone_verified=True,
                is_2fa_enabled=False,
            )
            db.add(user)
            db.flush()
            action = "créé"

        profile = db.execute(select(UserProfile).where(UserProfile.user_id == user.id)).scalar_one_or_none()
        first_name, last_name = split_name(SUPER_ADMIN_NAME)

        if profile:
            profile.first_name = first_name
            profile.last_name = last_name
            profile.preferred_language = "fr"
            profile.theme_preference = "light"
        else:
            db.add(
                UserProfile(
                    id=uuid4(),
                    user_id=user.id,
                    first_name=first_name,
                    last_name=last_name,
                    preferred_language="fr",
                    theme_preference="light",
                )
            )

        db.commit()

        print(f"✅ Super administrateur {action} avec succès.")
        print(f"   Email: {SUPER_ADMIN_EMAIL}")
        print("   Mot de passe: fourni via la variable d'environnement SUPER_ADMIN_PASSWORD")
        return True
    except ValueError as exc:
        print(f"❌ {exc}")
        return False
    except OperationalError as exc:
        db.rollback()
        print("❌ Connexion base impossible pour create_super_admin.py")
        print(f"   Détail: {exc}")
        print(
            "\nCause probable: ce shell local utilise une URL DB qui pointe vers le host Docker `db`, "
            "non résolu hors conteneur."
        )
        print("Correction minimale:")
        print(
            "  - exécuter le script dans le conteneur API, ou"
        )
        print(
            "  - définir DATABASE_URL_SYNC / SUPER_ADMIN_DATABASE_URL_SYNC vers un host local réel "
            "(ex: 127.0.0.1:5433)"
        )
        return False
    except Exception as exc:
        db.rollback()
        print(f"❌ Erreur lors de la création du super administrateur: {exc}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(0 if ensure_super_admin() else 1)
