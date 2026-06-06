#!/usr/bin/env python3
"""
Execute les gates des surfaces admin de configuration backend-reelles.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]

COMMANDS = [
    ("promotions", ["python", "scripts/verify_promotions_flow.py"]),
    ("promo-pricing", ["python", "scripts/verify_promo_pricing_consumption.py"]),
    ("content", ["python", "scripts/verify_content_flow.py"]),
    ("subscriptions", ["python", "scripts/verify_subscriptions_flow.py"]),
    ("tracking", ["python", "scripts/verify_tracking_flow.py"]),
    ("advertisements", ["python", "scripts/verify_advertisements_flow.py"]),
    ("loyalty-settings", ["python", "scripts/verify_loyalty_flow.py"]),
    ("loyalty-engine", ["python", "scripts/verify_loyalty_engine_flow.py"]),
    ("loyalty-adjustments", ["python", "scripts/verify_loyalty_adjustment_flow.py"]),
    ("loyalty-expiry", ["python", "scripts/verify_loyalty_expiry_flow.py"]),
    ("referral-settings", ["python", "scripts/verify_referral_flow.py"]),
    ("referral-engine", ["python", "scripts/verify_referral_engine_flow.py"]),
    ("referral-review", ["python", "scripts/verify_referral_review_flow.py"]),
    ("referral-antifraud", ["python", "scripts/verify_referral_antifraud_flow.py"]),
    ("loyalty-referral-reporting", ["python", "scripts/verify_loyalty_referral_reporting_flow.py"]),
]


def main() -> int:
    print("Running admin config proof gate")
    for name, command in COMMANDS:
        print(f"\n=== {name} ===")
        completed = subprocess.run(command, cwd=REPO_ROOT)
        if completed.returncode != 0:
            print(f"\nFAIL admin config proof gate at: {name}")
            return completed.returncode

    print(f"\nPASS admin config proof gate: {len(COMMANDS)}/{len(COMMANDS)} checks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
