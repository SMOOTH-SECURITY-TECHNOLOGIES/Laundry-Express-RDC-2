#!/usr/bin/env python3
"""
Verifie un flow advertisements minimal contre l'API reelle.
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
    print(f"Verifying advertisements flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])
    advertisement_id = None

    try:
        status, body = api_request("GET", "/advertisements")
        assert_status("advertisements_flow_public_list", status, 200, body)

        status, body = api_request(
            "POST",
            "/advertisements",
            {
                "title": "Backend Ad Proof",
                "description": "Advertisement proof flow",
                "imageUrl": "https://example.com/backend-ad-proof.jpg",
                "linkUrl": "https://example.com/order",
                "isActive": True,
            },
            token=admin_token,
        )
        assert_status("advertisements_flow_admin_create", status, 201, body)
        advertisement_id = body["id"]

        status, body = api_request(
            "PATCH",
            f"/advertisements/{advertisement_id}",
            {"title": "Backend Ad Proof Updated", "isActive": False},
            token=admin_token,
        )
        assert_status("advertisements_flow_admin_update", status, 200, body)
        if body["title"] != "Backend Ad Proof Updated" or body["isActive"] is not False:
            raise AssertionError(f"unexpected advertisement payload: {body}")
        print("PASS advertisements_flow_updated_payload: values updated")

        status, body = api_request(
            "POST",
            "/advertisements",
            {
                "title": "Forbidden Ad",
                "description": "Forbidden",
                "imageUrl": "https://example.com/forbidden.jpg",
                "linkUrl": "https://example.com/forbidden",
                "isActive": True,
            },
            token=customer_token,
        )
        assert_status("advertisements_flow_customer_forbidden_create", status, 403, body)

        status, body = api_request("GET", "/admin/activity-logs?limit=50", token=admin_token)
        assert_status("advertisements_flow_admin_activity_logs", status, 200, body)
        actions = {(entry["action"], entry["resource_type"]) for entry in body["logs"]}
        required = {("create", "advertisement"), ("update", "advertisement")}
        if not required.issubset(actions):
            raise AssertionError(f"advertisement audit entries missing: {actions}")
        print("PASS advertisements_flow_audit_entries: present")

        status, body = api_request("DELETE", f"/advertisements/{advertisement_id}", token=admin_token)
        assert_status("advertisements_flow_admin_delete", status, 204, body)
        advertisement_id = None

        print("Verified 6/6 advertisements checks")
        return 0
    finally:
        if advertisement_id:
            api_request("DELETE", f"/advertisements/{advertisement_id}", token=admin_token)
