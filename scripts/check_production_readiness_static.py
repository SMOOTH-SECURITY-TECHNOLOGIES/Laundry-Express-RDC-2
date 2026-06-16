#!/usr/bin/env python3
"""
Static Production Readiness checks (no live API required).
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "apps" / "api"


def check(name: str, ok: bool, detail: str = "") -> bool:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f": {detail}" if detail else ""))
    return ok


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def main() -> int:
    passed = 0
    total = 0

    def run(name: str, ok: bool, detail: str = "") -> None:
        nonlocal passed, total
        total += 1
        if check(name, ok, detail):
            passed += 1

    # 4. VITE_USE_MOCK_API=false in docker-compose pilot stack
    compose = read_text(ROOT / "docker-compose.yml")
    run(
        "docker_compose_mock_api_disabled",
        "VITE_USE_MOCK_API=false" in compose,
        "set VITE_USE_MOCK_API=false on web service",
    )

    env_example = read_text(ROOT / ".env.example")
    run(
        "env_example_documents_mock_api",
        "VITE_USE_MOCK_API=false" in env_example,
        "document VITE_USE_MOCK_API=false in .env.example",
    )
    run(
        "env_example_documents_payment_mode",
        "VITE_PAYMENT_MODE" in env_example,
        "document VITE_PAYMENT_MODE in .env.example",
    )
    run(
        "env_example_frontend_port_3003",
        "3003" in env_example,
        "frontend port 3003 documented",
    )
    run(
        "env_example_secret_key_documented",
        "SECRET_KEY" in env_example and "production" in env_example.lower(),
        "SECRET_KEY production note",
    )

    # 5. No critical auth mock fallback on network error
    auth_ctx = read_text(ROOT / "context" / "AuthContext.tsx")
    run(
        "auth_no_network_mock_fallback",
        "shouldUseMockFallback || isNetworkError" not in auth_ctx,
        "AuthContext must not mock-login on network errors",
    )

    data_ctx = read_text(ROOT / "context" / "DataContext.tsx")
    run(
        "datacontext_skips_mock_db_without_flag",
        "features.useMockApi ? api.fetchAllData()" in data_ctx,
        "DataContext must not always load localStorage mock DB",
    )

    # 6. Admin premium hidden in pilot mode
    pilot_cfg = read_text(ROOT / "config" / "pilot.ts")
    sidebar = read_text(ROOT / "components" / "admin" / "ControlCenterSidebar.tsx")
    run("pilot_config_exists", "HIDDEN_ADMIN_MODULES" in pilot_cfg, "config/pilot.ts")
    run(
        "admin_sidebar_filters_hidden_modules",
        "isAdminModuleVisible" in sidebar,
        "ControlCenterSidebar filters pilot-hidden modules",
    )
    for label in ("WhatsApp", "SMS", "Email", "Campagnes", "Permissions"):
        run(f"hidden_module_listed:{label}", label in pilot_cfg, label)

    # 7. Payment sandbox label
    payment_modal = read_text(ROOT / "components" / "PaymentModal.tsx")
    run(
        "payment_modal_sandbox_label",
        "paymentModeLabel" in payment_modal and "pilotConfig" in payment_modal,
        "PaymentModal shows sandbox banner",
    )

    # Truth scripts exist
    for script in (
        "validate_customer_corridor_truth.py",
        "validate_loyalty_referral_truth.py",
        "validate_promotion_truth.py",
        "validate_growth_engine_truth.py",
        "verify_promo_pricing_consumption.py",
    ):
        run(f"truth_script_exists:{script}", (ROOT / "scripts" / script).exists(), script)

    # 9. Alembic single head
    try:
        result = subprocess.run(
            ["alembic", "heads"],
            cwd=str(API_DIR),
            capture_output=True,
            text=True,
            check=False,
        )
        heads = [line for line in result.stdout.splitlines() if "(head)" in line]
        run("alembic_single_head", len(heads) == 1, f"heads={len(heads)} {heads}")
    except Exception as exc:
        run("alembic_single_head", False, str(exc))

    # Local .env must not enable mock API in pilot
    dotenv = read_text(ROOT / ".env")
    if dotenv:
        mock_enabled = re.search(r"^VITE_USE_MOCK_API\s*=\s*true\s*$", dotenv, re.MULTILINE | re.IGNORECASE)
        run("local_env_mock_api_not_true", mock_enabled is None, ".env has VITE_USE_MOCK_API=true")

    print(f"\nStatic readiness: {passed}/{total}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
