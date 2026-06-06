#!/usr/bin/env python3
"""
Verifie le workflow admin minimal de revue referral.
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
    print(f"Verifying referral review flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, overview = api_request("GET", "/referral/admin/overview", token=admin_token)
    assert_status("referral_review_overview", status, 200, overview)
    if not overview.get("watchlist"):
        raise AssertionError(f"referral watchlist is empty, cannot verify review flow: {overview}")
    watch_entry = overview["watchlist"][0]
    referrer_user_id = watch_entry["referrer_user_id"]

    status, body = api_request(
        "PUT",
        f"/referral/admin/reviews/{referrer_user_id}",
        {
            "review_status": "monitor",
            "review_note": "Verified through automated referral review gate",
        },
        token=admin_token,
    )
    assert_status("referral_review_admin_update", status, 200, body)
    if body["review_status"] != "monitor":
        raise AssertionError(f"unexpected review status payload: {body}")
    print("PASS referral_review_saved_payload: review persisted")

    status, body = api_request("GET", f"/referral/admin/reviews/{referrer_user_id}", token=admin_token)
    assert_status("referral_review_admin_read", status, 200, body)
    if body["review_note"] != "Verified through automated referral review gate":
        raise AssertionError(f"unexpected review note payload: {body}")
    print("PASS referral_review_direct_read: review fetched")

    status, body = api_request("GET", "/referral/admin/overview", token=admin_token)
    assert_status("referral_review_overview_refresh", status, 200, body)
    updated_entry = next((entry for entry in body.get("watchlist", []) if entry["referrer_user_id"] == referrer_user_id), None)
    if not updated_entry:
        raise AssertionError(f"reviewed referrer missing from watchlist refresh: {body}")
    if updated_entry.get("review_status") != "monitor":
        raise AssertionError(f"review status missing from watchlist entry: {updated_entry}")
    print("PASS referral_review_watchlist_reflected: watchlist shows review")

    status, body = api_request(
        "PUT",
        f"/referral/admin/reviews/{referrer_user_id}",
        {
            "review_status": "clear",
            "review_note": "Cleared by automated referral review gate",
        },
        token=customer_token,
    )
    assert_status("referral_review_customer_forbidden", status, 403, body)

    print("Verified 5/5 referral review checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
