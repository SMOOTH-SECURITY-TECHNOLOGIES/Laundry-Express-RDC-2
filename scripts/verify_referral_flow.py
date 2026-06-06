#!/usr/bin/env python3
"""
Verifie un flow referral settings minimal contre l'API reelle.
"""

import json
import os
from urllib import error, request

from local_test_credentials import load_local_test_credentials


API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")


def api_request(method: str, path: str, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{API_BASE_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"raw": raw}
        return exc.code, parsed


def login(email: str, password: str) -> str:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or "access_token" not in body:
        raise AssertionError(f"login failed for {email}: {status} {body}")
    return body["access_token"]


def assert_status(name: str, actual: int, expected: int, body) -> None:
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def main() -> int:
    print(f"Verifying referral flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, body = api_request("GET", "/referral/settings")
    assert_status("referral_flow_public_read", status, 200, body)
    original_payload = {
        "isEnabled": body["isEnabled"],
        "referrerBonusPoints": body["referrerBonusPoints"],
        "refereeDiscountAmount": body["refereeDiscountAmount"],
    }

    try:
        status, body = api_request(
            "PUT",
            "/referral/settings",
            {
                "isEnabled": False,
                "referrerBonusPoints": 250,
                "refereeDiscountAmount": 2.5,
            },
            token=admin_token,
        )
        assert_status("referral_flow_admin_update", status, 200, body)
        if (
            body["isEnabled"] is not False
            or body["referrerBonusPoints"] != 250
            or float(body["refereeDiscountAmount"]) != 2.5
        ):
            raise AssertionError(f"unexpected referral payload: {body}")
        print("PASS referral_flow_saved_payload: values updated")

        status, body = api_request(
            "PUT",
            "/referral/settings",
            {
                "isEnabled": True,
                "referrerBonusPoints": 999,
                "refereeDiscountAmount": 9.9,
            },
            token=customer_token,
        )
        assert_status("referral_flow_customer_forbidden_update", status, 403, body)

        status, body = api_request("GET", "/admin/activity-logs?limit=50", token=admin_token)
        assert_status("referral_flow_admin_activity_logs", status, 200, body)
        actions = {(entry["action"], entry["resource_type"]) for entry in body["logs"]}
        if ("update", "referral_settings") not in actions:
            raise AssertionError(f"referral_settings audit entry missing: {actions}")
        print("PASS referral_flow_audit_entry: present")

        print("Verified 5/5 referral checks")
        return 0
    finally:
        api_request("PUT", "/referral/settings", original_payload, token=admin_token)
