#!/usr/bin/env python3
"""
Verifie un flow content minimal contre l'API reelle.
"""

import json
import os
from copy import deepcopy
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
    print(f"Verifying content flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    status, body = api_request("GET", "/content/site")
    assert_status("content_flow_public_read", status, 200, body)
    original_content = deepcopy(body["content_data"])

    try:
        status, body = api_request(
            "PUT",
            "/content/site",
            {
                "hero": {
                    "title": "Laundry Express Content Proof",
                    "subtitle": "Backend-managed content flow",
                },
                "howItWorksSteps": [
                    {
                        "id": "step-1",
                        "title": "Collect",
                        "description": "We collect your items",
                        "icon": "shoppingBag",
                    }
                ],
                "faq": [
                    {
                        "id": "faq-1",
                        "question": "Is this backend-managed?",
                        "answer": "Yes.",
                    }
                ],
            },
            token=admin_token,
        )
        assert_status("content_flow_admin_update", status, 200, body)
        if body["content_data"]["hero"]["title"] != "Laundry Express Content Proof":
            raise AssertionError(f"unexpected saved title: {body}")
        print("PASS content_flow_saved_payload: title updated")

        status, body = api_request(
            "PUT",
            "/content/site",
            {
                "hero": {"title": "Should not pass", "subtitle": "Should not pass"},
                "howItWorksSteps": [],
                "faq": [],
            },
            token=customer_token,
        )
        assert_status("content_flow_customer_forbidden_update", status, 403, body)

        status, body = api_request("GET", "/admin/activity-logs?limit=50", token=admin_token)
        assert_status("content_flow_admin_activity_logs", status, 200, body)
        actions = {(entry["action"], entry["resource_type"]) for entry in body["logs"]}
        if ("update", "site_content") not in actions:
            raise AssertionError(f"site_content audit entry missing: {actions}")
        print("PASS content_flow_audit_entry: present")

        print("Verified 5/5 content checks")
        return 0
    finally:
        api_request("PUT", "/content/site", original_content, token=admin_token)
