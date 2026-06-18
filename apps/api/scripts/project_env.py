"""Charge le .env projet (hôte ou conteneur Docker)."""

from __future__ import annotations

import os
from pathlib import Path


def _apply_env_file(env_path: Path) -> None:
    if not env_path.is_file():
        return
    try:
        from dotenv import load_dotenv

        load_dotenv(env_path, override=False)
        return
    except ImportError:
        pass

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_project_env() -> None:
    explicit = os.getenv("PROJECT_ENV_FILE", "").strip()
    if explicit:
        _apply_env_file(Path(explicit))
        return

    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.is_file():
            _apply_env_file(candidate)
            return

    _apply_env_file(Path("/etc/laundry-express/.env"))


def resolve_password(*keys: str) -> str:
    for key in keys:
        value = os.getenv(key, "").strip()
        if value:
            return value
    tried = ", ".join(keys)
    raise ValueError(f"Missing password env var. Set one of: {tried}")
