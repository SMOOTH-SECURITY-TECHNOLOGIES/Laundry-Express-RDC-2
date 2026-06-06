#!/usr/bin/env python3
"""
Verifie les ajustements admin de points de fidelite contre l'API reelle.
"""

import json
import os
from uuid import uuid4
from urllib import error, request

from local_test_credentials import load_local_test_credentials


API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")


def api_request(method: str, path: str, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(f"{API_BASE_URL}{path}", data=body, headers=headers, method=method)

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
    print(f"Verifying loyalty adjustment flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, me_before = api_request("GET", "/auth/me", token=customer_token)
    assert_status("loyalty_adjustment_me_before", status, 200, me_before)
    customer_id = me_before["user"]["id"]
    before_balance = int(me_before["user"]["loyalty_points"])
    adjustment_delta = 17
    adjustment_reason = f"Loyalty adjustment proof {uuid4().hex[:8]}"

    try:
        status, adjusted = api_request(
            "POST",
            "/loyalty/admin/adjustments",
            {
                "user_id": customer_id,
                "points_delta": adjustment_delta,
                "reason": adjustment_reason,
            },
            token=admin_token,
        )
        assert_status("loyalty_adjustment_admin_adjust", status, 200, adjusted)
        if int(adjusted["new_balance"]) != before_balance + adjustment_delta:
            raise AssertionError(f"unexpected adjustment response: {adjusted}")
        print("PASS loyalty_adjustment_response_balance: updated")

        status, me_after = api_request("GET", "/auth/me", token=customer_token)
        assert_status("loyalty_adjustment_me_after", status, 200, me_after)
        after_balance = int(me_after["user"]["loyalty_points"])
        if after_balance != before_balance + adjustment_delta:
            raise AssertionError(
                f"loyalty adjustment not reflected in user profile: before={before_balance}, after={after_balance}"
            )
        print("PASS loyalty_adjustment_profile_balance: updated")

        status, history_body = api_request("GET", "/loyalty/me/history?limit=20", token=customer_token)
        assert_status("loyalty_adjustment_history", status, 200, history_body)
        matching_entries = [
            entry
            for entry in history_body.get("entries", [])
            if entry.get("entry_type") == "adjustment" and entry.get("description") == adjustment_reason
        ]
        if not matching_entries:
            raise AssertionError(f"adjustment history entry missing: {history_body}")
        print("PASS loyalty_adjustment_history_entry: present")

        status, activity_body = api_request("GET", "/admin/activity-logs?limit=100", token=admin_token)
        assert_status("loyalty_adjustment_activity_logs", status, 200, activity_body)
        actions = {
            (entry.get("action"), entry.get("resource_type"), entry.get("resource_id"))
            for entry in activity_body.get("logs", [])
        }
        if ("adjust", "loyalty_points", customer_id) not in actions:
            raise AssertionError(f"loyalty adjustment audit entry missing: {actions}")
        print("PASS loyalty_adjustment_audit_entry: present")

        status, forbidden = api_request(
            "POST",
            "/loyalty/admin/adjustments",
            {
                "user_id": customer_id,
                "points_delta": 5,
                "reason": "Customer should not adjust loyalty points",
            },
            token=customer_token,
        )
        assert_status("loyalty_adjustment_customer_forbidden", status, 403, forbidden)

        print("Verified 6/6 loyalty adjustment checks")
        return 0
    finally:
        api_request(
            "POST",
            "/loyalty/admin/adjustments",
            {
                "user_id": customer_id,
                "points_delta": -adjustment_delta,
                "reason": f"Rollback {adjustment_reason}",
            },
            token=admin_token,
        )


if __name__ == "__main__":
    raise SystemExit(main())
