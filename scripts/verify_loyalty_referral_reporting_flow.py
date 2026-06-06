#!/usr/bin/env python3
"""
Verifie le reporting admin minimal loyalty/referral contre l'API reelle.
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
    print(f"Verifying loyalty/referral reporting against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, body = api_request("GET", "/loyalty/admin/overview", token=admin_token)
    assert_status("loyalty_reporting_admin_read", status, 200, body)
    required_loyalty_keys = {
        "total_users_with_points",
        "total_points_balance",
        "average_points_balance",
        "ledger_entries_total",
        "total_points_earned",
        "total_points_redeemed",
        "total_referral_bonus_points",
        "total_adjustment_points_net",
        "policy_metrics",
        "top_users",
        "top_redeemers",
        "recent_entries",
    }
    if not required_loyalty_keys.issubset(body.keys()):
        raise AssertionError(f"missing loyalty overview keys: {body.keys()}")
    if not isinstance(body["recent_entries"], list):
        raise AssertionError(f"loyalty recent_entries should be a list: {body}")
    if not isinstance(body["top_users"], list):
        raise AssertionError(f"loyalty top_users should be a list: {body}")
    if not isinstance(body["top_redeemers"], list):
        raise AssertionError(f"loyalty top_redeemers should be a list: {body}")
    if not isinstance(body["policy_metrics"], dict):
        raise AssertionError(f"loyalty policy_metrics should be an object: {body}")
    print("PASS loyalty_reporting_payload: structure present")

    required_policy_keys = {
        "is_enabled",
        "points_per_dollar",
        "points_to_dollar",
        "reward_value_per_point",
        "reward_value_per_100_spent",
    }
    if not required_policy_keys.issubset(body["policy_metrics"].keys()):
        raise AssertionError(f"missing loyalty policy metric keys: {body['policy_metrics']}")
    print("PASS loyalty_reporting_policy_metrics: present")

    if body["recent_entries"]:
        first_entry = body["recent_entries"][0]
        required_entry_keys = {
            "id",
            "user_id",
            "entry_type",
            "points_delta",
            "balance_after",
            "description",
        }
        if not required_entry_keys.issubset(first_entry.keys()):
            raise AssertionError(f"missing loyalty recent entry keys: {first_entry}")
        print("PASS loyalty_reporting_recent_entries: populated")
    if body["top_users"]:
        first_user = body["top_users"][0]
        required_user_keys = {"user_id", "user_name", "user_email", "loyalty_points"}
        if not required_user_keys.issubset(first_user.keys()):
            raise AssertionError(f"missing loyalty top user keys: {first_user}")
        print("PASS loyalty_reporting_top_users: populated")
    if body["top_redeemers"]:
        first_redeemer = body["top_redeemers"][0]
        required_redeemer_keys = {"user_id", "user_name", "user_email", "total_points_redeemed"}
        if not required_redeemer_keys.issubset(first_redeemer.keys()):
            raise AssertionError(f"missing loyalty top redeemer keys: {first_redeemer}")
        print("PASS loyalty_reporting_top_redeemers: populated")

    status, body = api_request("GET", "/loyalty/admin/overview", token=customer_token)
    assert_status("loyalty_reporting_customer_forbidden", status, 403, body)

    status, body = api_request("GET", "/referral/admin/overview", token=admin_token)
    assert_status("referral_reporting_admin_read", status, 200, body)
    required_referral_keys = {
        "total_users_with_referral_codes",
        "total_referred_users",
        "total_referred_signed_up_only",
        "total_referred_pending_bonus",
        "total_completed_referral_conversions",
        "total_referral_discounts_used",
        "total_referral_bonuses_awarded",
        "total_referrer_bonus_points_awarded",
        "top_referrers",
        "watchlist",
        "recent_conversions",
    }
    if not required_referral_keys.issubset(body.keys()):
        raise AssertionError(f"missing referral overview keys: {body.keys()}")
    if not isinstance(body["top_referrers"], list):
        raise AssertionError(f"referral top_referrers should be a list: {body}")
    if not isinstance(body["watchlist"], list):
        raise AssertionError(f"referral watchlist should be a list: {body}")
    if not isinstance(body["recent_conversions"], list):
        raise AssertionError(f"referral recent_conversions should be a list: {body}")
    if body["total_completed_referral_conversions"] != body["total_referral_bonuses_awarded"]:
        raise AssertionError(
            "referral completed conversions should match awarded bonuses: "
            f"{body['total_completed_referral_conversions']} != {body['total_referral_bonuses_awarded']}"
        )
    print("PASS referral_reporting_payload: structure present")

    if body["top_referrers"]:
        first_referrer = body["top_referrers"][0]
        required_referrer_keys = {
            "user_id",
            "user_name",
            "user_email",
            "successful_referrals",
            "total_bonus_points_awarded",
        }
        if not required_referrer_keys.issubset(first_referrer.keys()):
            raise AssertionError(f"missing referral top referrer keys: {first_referrer}")
        print("PASS referral_reporting_top_referrers: populated")
    if body["recent_conversions"]:
        first_conversion = body["recent_conversions"][0]
        required_conversion_keys = {
            "referred_user_id",
            "referred_user_name",
            "referred_user_email",
            "referrer_user_id",
            "referrer_user_name",
            "referrer_user_email",
        }
        if not required_conversion_keys.issubset(first_conversion.keys()):
            raise AssertionError(f"missing referral recent conversion keys: {first_conversion}")
        print("PASS referral_reporting_recent_conversions: populated")
    if body["watchlist"]:
        first_watch = body["watchlist"][0]
        required_watch_keys = {
            "referrer_user_id",
            "referrer_user_name",
            "referrer_user_email",
            "total_referred_users",
            "signed_up_only_count",
            "pending_bonus_count",
            "completed_conversion_count",
            "attention_reason",
        }
        if not required_watch_keys.issubset(first_watch.keys()):
            raise AssertionError(f"missing referral watchlist keys: {first_watch}")
        print("PASS referral_reporting_watchlist: populated")

    status, body = api_request("GET", "/referral/admin/overview", token=customer_token)
    assert_status("referral_reporting_customer_forbidden", status, 403, body)

    print("Verified 11/11 loyalty-referral reporting checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
