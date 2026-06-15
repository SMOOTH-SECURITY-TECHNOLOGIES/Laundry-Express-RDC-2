"""
Sprint 5.5 — Customer corridor truth E2E (live API + PostgreSQL).

Exécution :
  cd apps/api
  TRUTH_E2E=1 pytest tests/integration/test_customer_corridor_truth_e2e.py -v

Nécessite API démarrée et variables TRUTH_* / ADMIN_PASSWORD configurées.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[4]
SCRIPT = ROOT / "scripts" / "validate_customer_corridor_truth.py"

pytestmark = pytest.mark.skipif(
    os.getenv("TRUTH_E2E", "").strip().lower() not in {"1", "true", "yes"},
    reason="Définir TRUTH_E2E=1 pour exécuter le corridor truth live",
)


def test_customer_corridor_truth_e2e():
    env = os.environ.copy()
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        timeout=300,
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    assert result.returncode == 0, "Customer corridor truth validation failed — voir sortie ci-dessus"
