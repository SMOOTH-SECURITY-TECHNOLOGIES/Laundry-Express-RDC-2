#!/usr/bin/env python3
"""
Détecte les références legacy de rôles qui ne correspondent plus au modèle UserRole actuel.
"""

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CHECKS = [
    (re.compile(r"\bUserRole\.PARTNER\b"), "UserRole.PARTNER", "legacy partner role reference"),
    (re.compile(r"\bUserRole\.COMPANY\b"), "UserRole.COMPANY", "legacy company role reference"),
    (re.compile(r"\bget_current_company\b"), "get_current_company", "legacy company dependency"),
]

TARGETS = [
    ROOT / "apps" / "api" / "app",
    ROOT / "apps" / "api" / "tests",
]


def main() -> int:
    findings: list[tuple[str, int, str, str]] = []

    for target in TARGETS:
        for path in target.rglob("*.py"):
            text = path.read_text(encoding="utf-8")
            lines = text.splitlines()
            for line_number, line in enumerate(lines, start=1):
                for regex, pattern_text, label in CHECKS:
                    if regex.search(line):
                        findings.append((str(path.relative_to(ROOT)), line_number, pattern_text, label))

    if findings:
        print("Legacy role drift detected:")
        for path, line_number, pattern, label in findings:
            print(f"- {path}:{line_number} -> {pattern} ({label})")
        print(f"Total findings: {len(findings)}")
        return 1

    print("No legacy role drift detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
