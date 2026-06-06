#!/usr/bin/env python3
"""
Verifie un flow promotions minimal contre l'API reelle.
"""

import json
import os
import sys
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from local_test_credentials import load_local_test_credentials


ROOT = Path(__file__).resolve().parents[1]
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
    print(f"Verifying promotions flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    suffix = uuid4().hex[:8].upper()
    code = f"PROMO{suffix}"
    promo_id = None

    try:
        status, body = api_request("GET", "/promotions", token=admin_token)
        assert_status("promotions_flow_admin_list", status, 200, body)

        status, body = api_request("GET", "/promotions", token=customer_token)
        assert_status("promotions_flow_customer_forbidden_list", status, 403, body)

        payload = {
            "code": code,
            "discount_type": "percentage",
            "discount_value": 15,
            "min_order_value": 1000,
            "is_for_new_users_only": False,
            "is_active": True,
            "description": "Promotions flow verification",
        }
        status, body = api_request("POST", "/promotions", payload, token=admin_token)
        assert_status("promotions_flow_admin_create", status, 201, body)
        promo_id = body["id"]

        status, body = api_request(
            "PATCH",
            f"/promotions/{promo_id}",
            {"discount_value": 12, "is_active": False},
            token=admin_token,
        )
        assert_status("promotions_flow_admin_update", status, 200, body)
        if body["discount_value"] != 12.0 or body["is_active"] is not False:
            raise AssertionError(f"updated promo has wrong values: {body}")
        print("PASS promotions_flow_update_payload: values updated")

        status, body = api_request("GET", "/admin/activity-logs?limit=50", token=admin_token)
        assert_status("promotions_flow_activity_logs", status, 200, body)
        actions = {(entry["action"], entry["resource_type"]) for entry in body["logs"]}
        required = {("create", "promo_code"), ("update", "promo_code")}
        if not required.issubset(actions):
            raise AssertionError(f"promo audit entries missing: {actions}")
        print("PASS promotions_flow_audit_entries: present")

        status, body = api_request("DELETE", f"/promotions/{promo_id}", token=admin_token)
        assert_status("promotions_flow_admin_delete", status, 204, body)
        promo_id = None

        print("Verified 6/6 promotions checks")
        return 0
    finally:
        if promo_id:
            api_request("DELETE", f"/promotions/{promo_id}", token=admin_token)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Promotions flow verification failed: {exc}")
        raise SystemExit(1)
