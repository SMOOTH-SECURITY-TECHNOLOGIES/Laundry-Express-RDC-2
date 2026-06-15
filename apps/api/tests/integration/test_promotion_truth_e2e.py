"""Sprint 7.5 — Promotion truth E2E (live API + PostgreSQL)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[4]
SCRIPT = ROOT / "scripts" / "validate_promotion_truth.py"

pytestmark = pytest.mark.skipif(
    os.getenv("TRUTH_PROMOTION_E2E", "").strip().lower() not in {"1", "true", "yes"},
    reason="Définir TRUTH_PROMOTION_E2E=1 pour exécuter le corridor promotion live",
)


def test_promotion_truth_e2e():
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=str(ROOT),
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        timeout=300,
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    assert result.returncode == 0, "Promotion truth validation failed"
