#!/usr/bin/env python3
"""
Verifie la politique d'expiration loyalty contre l'API reelle.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
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
    print(f"Verifying loyalty expiry flow against {API_BASE_URL}")

    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, me_before = api_request("GET", "/auth/me", token=customer_token)
    assert_status("loyalty_expiry_me_before", status, 200, me_before)
    customer_id = me_before["user"]["id"]

    status, settings_body = api_request("GET", "/loyalty/settings", token=admin_token)
    assert_status("loyalty_expiry_settings_read", status, 200, settings_body)
    original_settings = {
        "isEnabled": settings_body["isEnabled"],
        "pointsPerDollar": settings_body["pointsPerDollar"],
        "pointsToDollar": settings_body["pointsToDollar"],
        "pointsExpiryDays": settings_body.get("pointsExpiryDays"),
    }

    try:
        status, updated_settings = api_request(
            "PUT",
            "/loyalty/settings",
            {
                "isEnabled": True,
                "pointsPerDollar": max(10, int(original_settings["pointsPerDollar"] or 0)),
                "pointsToDollar": max(100, int(original_settings["pointsToDollar"] or 0)),
                "pointsExpiryDays": 1,
            },
            token=admin_token,
        )
        assert_status("loyalty_expiry_settings_update", status, 200, updated_settings)
        if updated_settings.get("pointsExpiryDays") != 1:
            raise AssertionError(f"expiry policy not saved: {updated_settings}")
        print("PASS loyalty_expiry_settings_saved: expiry days persisted")

        status, adjusted = api_request(
            "POST",
            "/loyalty/admin/adjustments",
            {
                "user_id": customer_id,
                "points_delta": 25,
                "reason": "Seed points for expiry proof",
            },
            token=admin_token,
        )
        assert_status("loyalty_expiry_adjust_points", status, 200, adjusted)
        print("PASS loyalty_expiry_adjustment_created: positive points granted")

        status, history_before = api_request("GET", "/loyalty/me/history?limit=20", token=customer_token)
        assert_status("loyalty_expiry_history_before", status, 200, history_before)
        latest_adjustment = next(
            (
                entry
                for entry in history_before.get("entries", [])
                if entry.get("entry_type") == "adjustment"
                and entry.get("description") == "Seed points for expiry proof"
            ),
            None,
        )
        if latest_adjustment is None:
            raise AssertionError(f"adjustment entry missing from loyalty history: {history_before}")
        if not latest_adjustment.get("expires_at"):
            raise AssertionError(f"expiry timestamp missing on positive ledger entry: {latest_adjustment}")
        print("PASS loyalty_expiry_entry_has_timestamp: positive entry carries expires_at")

        status, expiry_run = api_request(
            "POST",
            "/loyalty/admin/run-expiration",
            {
                "user_id": customer_id,
                "as_of": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            },
            token=admin_token,
        )
        assert_status("loyalty_expiry_run", status, 200, expiry_run)
        if int(expiry_run.get("expired_points", 0)) <= 0:
            raise AssertionError(f"no points expired during run: {expiry_run}")
        print("PASS loyalty_expiry_run_effective: points expired")

        status, history_after = api_request("GET", "/loyalty/me/history?limit=20", token=customer_token)
        assert_status("loyalty_expiry_history_after", status, 200, history_after)
        expire_entry = next(
            (
                entry
                for entry in history_after.get("entries", [])
                if entry.get("entry_type") == "expire"
            ),
            None,
        )
        if expire_entry is None:
            raise AssertionError(f"expire entry missing from history: {history_after}")
        print("PASS loyalty_expiry_history_entry: expire ledger entry recorded")

        status, overview = api_request("GET", "/loyalty/admin/overview", token=admin_token)
        assert_status("loyalty_expiry_overview", status, 200, overview)
        if "total_points_expired" not in overview or "policy_metrics" not in overview:
            raise AssertionError(f"expiry metrics missing from overview: {overview}")
        if overview["policy_metrics"].get("points_expiry_days") != 1:
            raise AssertionError(f"expiry policy metric missing from overview: {overview}")
        print("PASS loyalty_expiry_overview_metrics: expiry policy and totals exposed")

        status, forbidden = api_request(
            "POST",
            "/loyalty/admin/run-expiration",
            {"user_id": customer_id},
            token=customer_token,
        )
        assert_status("loyalty_expiry_customer_forbidden", status, 403, forbidden)
        print("PASS loyalty_expiry_customer_forbidden: status=403")

        print("Verified 6/6 loyalty expiry checks")
        return 0
    finally:
        api_request("PUT", "/loyalty/settings", original_settings, token=admin_token)


if __name__ == "__main__":
    raise SystemExit(main())
