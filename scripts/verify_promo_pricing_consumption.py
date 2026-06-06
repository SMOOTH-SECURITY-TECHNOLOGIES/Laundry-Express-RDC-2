#!/usr/bin/env python3
"""
Verifie qu'un code promo backend est reellement consomme par pricing et orders.
"""

import json
import os
from decimal import Decimal
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


def find_partner_and_service(customer_token: str):
    status, partners = api_request("GET", "/catalog/partners", token=customer_token)
    assert_status("promo_pricing_catalog_partners", status, 200, partners)
    if not partners:
        raise AssertionError("no catalog partners available")

    partner = partners[0]
    status, services = api_request("GET", f"/catalog/partners/{partner['id']}/services", token=customer_token)
    assert_status("promo_pricing_partner_services", status, 200, services)
    if not services:
        raise AssertionError("no services available for partner")
    return partner, services[0]


def get_default_address(customer_token: str):
    status, body = api_request("GET", "/auth/me", token=customer_token)
    assert_status("promo_pricing_me", status, 200, body)
    addresses = body.get("addresses", [])
    if not addresses:
        raise AssertionError("customer has no address")
    return addresses[0]["id"]


def main() -> int:
    print(f"Verifying promo pricing consumption against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])

    partner, service = find_partner_and_service(customer_token)
    address_id = get_default_address(customer_token)
    promo_id = None
    unit_price = str(service.get("base_price") or "0.00")

    estimate_payload = {
        "partner_id": partner["id"],
        "items": [
            {
                "service_id": service["id"],
                "item_name": service.get("service_category_name") or "Promo Test Item",
                "quantity": 1,
                "unit_price": unit_price,
                "notes": "Promo pricing proof",
                "detected_by_ai": False,
            }
        ],
        "currency": "CDF",
        "pickup_requested": True,
        "delivery_requested": True,
    }

    try:
        create_payload = {
            "code": "PRICEPROOF2026",
            "discount_type": "fixed",
            "discount_value": 100,
            "min_order_value": 0,
            "is_for_new_users_only": False,
            "is_active": True,
            "partner_id": partner["id"],
            "description": "Pricing proof promo",
        }
        status, body = api_request("POST", "/promotions", create_payload, token=admin_token)
        assert_status("promo_pricing_create_promo", status, 201, body)
        promo_id = body["id"]

        status, body = api_request("POST", "/orders/estimate", estimate_payload, token=customer_token)
        assert_status("promo_pricing_estimate_without_code", status, 200, body)
        baseline_total = Decimal(str(body["total_amount"]))

        status, body = api_request(
            "POST",
            "/orders/estimate",
            {**estimate_payload, "promo_code": "PRICEPROOF2026"},
            token=customer_token,
        )
        assert_status("promo_pricing_estimate_with_code", status, 200, body)
        discounted_total = Decimal(str(body["total_amount"]))
        discount_amount = Decimal(str(body["discount_amount"]))
        if discount_amount <= 0:
            raise AssertionError(f"discount amount not applied: {body}")
        if discounted_total >= baseline_total:
            raise AssertionError(f"discounted total not lower than baseline: {baseline_total} vs {discounted_total}")
        print("PASS promo_pricing_discount_applied: estimate total reduced")

        status, body = api_request(
            "POST",
            "/orders",
            {
                **estimate_payload,
                "pickup_address_id": address_id,
                "delivery_address_id": address_id,
                "promo_code": "PRICEPROOF2026",
                "idempotency_key": "promo-pricing-proof-2026",
            },
            token=customer_token,
        )
        assert_status("promo_pricing_order_create_with_code", status, 201, body)
        order_discount = Decimal(str(body["discount_amount"]))
        order_total = Decimal(str(body["total_amount"]))
        if order_discount <= 0:
            raise AssertionError(f"order discount not persisted: {body}")
        if order_total >= baseline_total:
            raise AssertionError(f"order total not discounted: {baseline_total} vs {order_total}")
        print("PASS promo_pricing_order_discount_persisted: order totals reflect promo")

        status, body = api_request("GET", "/promotions", token=admin_token)
        assert_status("promo_pricing_admin_list", status, 200, body)
        promo = next((item for item in body["promo_codes"] if item["id"] == promo_id), None)
        if not promo:
            raise AssertionError("created promo not found in admin list")
        if int(promo["usage_count"]) < 1:
            raise AssertionError(f"promo usage_count not incremented: {promo}")
        print("PASS promo_pricing_usage_count_incremented: usage tracked")

        print("Verified 5/5 promo pricing checks")
        return 0
    finally:
        if promo_id:
            api_request("DELETE", f"/promotions/{promo_id}", token=admin_token)
