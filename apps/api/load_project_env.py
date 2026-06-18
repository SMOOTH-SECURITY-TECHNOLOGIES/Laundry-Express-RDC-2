"""Charge le fichier .env du projet dans os.environ (sans écraser les vars déjà définies)."""

from __future__ import annotations

import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


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

    for parent in [ROOT, *ROOT.parents]:
        candidate = parent / ".env"
        if candidate.is_file():
            _apply_env_file(candidate)
            return

    _apply_env_file(Path("/etc/laundry-express/.env"))
