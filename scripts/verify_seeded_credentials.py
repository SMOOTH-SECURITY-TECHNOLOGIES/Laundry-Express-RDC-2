#!/usr/bin/env python3
"""
Vérifie les identifiants seedés contre l'API locale réelle.

Usage:
    python scripts/verify_seeded_credentials.py
"""

import json
import os
import sys
import urllib.error
import urllib.request

from local_test_credentials import load_local_test_credentials


API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")


def request_json(method: str, url: str, payload: dict | None = None, headers: dict | None = None):
    body = None
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(url=url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response_body = response.read().decode("utf-8")
            parsed = json.loads(response_body) if response_body else {}
            return response.status, parsed
    except urllib.error.HTTPError as exc:
        response_body = exc.read().decode("utf-8")
        parsed = json.loads(response_body) if response_body else {}
        return exc.code, parsed


def verify_active_case(case: dict) -> None:
    login_status, login_data = request_json(
        "POST",
        f"{API_BASE_URL}/auth/login",
        {"email": case["email"], "password": case["password"]},
    )
    if login_status != 200:
        raise AssertionError(f"{case['label']} login failed with status {login_status}")

    access_token = login_data.get("access_token")
    token_type = login_data.get("token_type")
    if not access_token or token_type != "bearer":
        raise AssertionError(f"{case['label']} login response missing bearer token")

    me_status, me_data = request_json(
        "GET",
        f"{API_BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if me_status != 200:
        raise AssertionError(f"{case['label']} /auth/me failed with status {me_status}")

    actual_role = ((me_data or {}).get("user") or {}).get("role")
    if actual_role != case["expected_role"]:
        raise AssertionError(
            f"{case['label']} expected role {case['expected_role']}, got {actual_role}"
        )

    if case.get("expects_partner"):
        primary_partner_id = (me_data or {}).get("primary_partner_id")
        partner_ids = (me_data or {}).get("partner_ids") or []
        if not primary_partner_id or primary_partner_id not in partner_ids:
            raise AssertionError(
                f"{case['label']} missing partner linkage in /auth/me"
            )

    print(f"PASS active {case['label']}: role={actual_role}")


def verify_inactive_case(case: dict) -> None:
    login_status, _ = request_json(
        "POST",
        f"{API_BASE_URL}/auth/login",
        {"email": case["email"], "password": case["password"]},
    )
    if login_status == 200:
        raise AssertionError(f"{case['label']} unexpectedly logged in")

    print(f"PASS inactive {case['label']}: rejected_status={login_status}")


def main() -> int:
    print(f"Verifying seeded credentials against {API_BASE_URL}")
    creds = load_local_test_credentials()
    active_cases = [
        {
            "label": "super_admin",
            "email": creds["super_admin"]["email"],
            "password": creds["super_admin"]["password"],
            "expected_role": "super_admin",
        },
        {
            "label": "customer",
            "email": creds["customer"]["email"],
            "password": creds["customer"]["password"],
            "expected_role": "customer",
        },
        {
            "label": "partner_owner",
            "email": creds["partner_owner"]["email"],
            "password": creds["partner_owner"]["password"],
            "expected_role": "partner_owner",
            "expects_partner": True,
        },
        {
            "label": "partner_staff",
            "email": creds["partner_staff"]["email"],
            "password": creds["partner_staff"]["password"],
            "expected_role": "partner_staff",
            "expects_partner": True,
        },
        {
            "label": "driver",
            "email": creds["driver"]["email"],
            "password": creds["driver"]["password"],
            "expected_role": "driver",
        },
        {
            "label": "logistics_manager",
            "email": creds["logistics_manager"]["email"],
            "password": creds["logistics_manager"]["password"],
            "expected_role": "logistics_manager",
        },
    ]
    inactive_case = {
        "label": "inactive_customer",
        "email": creds["inactive_customer"]["email"],
        "password": creds["inactive_customer"]["password"],
    }

    for case in active_cases:
        verify_active_case(case)

    verify_inactive_case(inactive_case)
    print(f"Verified {len(active_cases) + 1}/{len(active_cases) + 1} credential checks")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Credential verification failed: {exc}")
        raise SystemExit(1)
