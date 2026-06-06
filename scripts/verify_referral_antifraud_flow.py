#!/usr/bin/env python3
"""
Verifie l'enforcement anti-abuse minimal du referral via le statut high risk.
"""

import json
import os
import time
from decimal import Decimal
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


def login(email: str, password: str):
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or "access_token" not in body:
        raise AssertionError(f"login failed for {email}: {status} {body}")
    return body["access_token"], body


def assert_status(name: str, actual: int, expected: int, body):
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def main() -> int:
    print(f"Verifying referral anti-abuse flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    referrer_token, _ = login(creds["customer"]["email"], creds["customer"]["password"])

    status, referrer_me = api_request("GET", "/auth/me", token=referrer_token)
    assert_status("referral_antifraud_referrer_me", status, 200, referrer_me)
    referrer_user_id = referrer_me["user"]["id"]
    referrer_code = referrer_me["user"]["referral_code"]
    referrer_points_before = int(referrer_me["user"]["loyalty_points"])

    referred_email = f"anti_{uuid4().hex[:10]}@example.com"
    referred_phone = f"+24383{str(uuid4().int)[:7]}"
    referred_password = f"referral-antifraud-{uuid4().hex[:12]}-A!"
    referred_name = "Referral Antifraud User"

    try:
        status, body = api_request(
            "PUT",
            f"/referral/admin/reviews/{referrer_user_id}",
            {
                "review_status": "clear",
                "review_note": "Reset before anti-abuse proof",
            },
            token=admin_token,
        )
        assert_status("referral_antifraud_clear_before", status, 200, body)

        status, registered = api_request(
            "POST",
            "/auth/register",
            {
                "email": referred_email,
                "phone": referred_phone,
                "name": referred_name,
                "password": referred_password,
                "role": "customer",
                "referral_code": referrer_code,
            },
        )
        assert_status("referral_antifraud_register_before_block", status, 201, registered)

        referred_token, _ = login(referred_email, referred_password)
        status, referred_me = api_request("GET", "/auth/me", token=referred_token)
        assert_status("referral_antifraud_referred_me", status, 200, referred_me)
        referred_user_id = referred_me["user"]["id"]

        status, body = api_request(
            "PUT",
            f"/referral/admin/reviews/{referrer_user_id}",
            {
                "review_status": "reviewed_high_risk",
                "review_note": "Blocked by automated anti-abuse proof",
            },
            token=admin_token,
        )
        assert_status("referral_antifraud_mark_high_risk", status, 200, body)

        blocked_email = f"blocked_{uuid4().hex[:10]}@example.com"
        blocked_phone = f"+24384{str(uuid4().int)[:7]}"
        status, blocked_registration = api_request(
            "POST",
            "/auth/register",
            {
                "email": blocked_email,
                "phone": blocked_phone,
                "name": "Blocked Referral User",
                "password": f"blocked-{uuid4().hex[:12]}-A!",
                "role": "customer",
                "referral_code": referrer_code,
            },
        )
        assert_status("referral_antifraud_register_blocked", status, 400, blocked_registration)

        status, created_address = api_request(
            "POST",
            "/users/me/addresses",
            {
                "user_id": referred_user_id,
                "label": "Maison",
                "contact_name": referred_name,
                "contact_phone": referred_phone,
                "address_line_1": "42 Avenue Anti Abuse",
                "address_line_2": "5",
                "city": "Kinshasa",
                "commune": "Gombe",
                "zone": "Centre",
                "reference_point": "Referral antifraud proof",
                "is_default": True,
            },
            token=referred_token,
        )
        assert_status("referral_antifraud_create_address", status, 201, created_address)

        status, partners = api_request("GET", "/catalog/partners", token=referred_token)
        assert_status("referral_antifraud_partners", status, 200, partners)
        partner = partners[0]

        status, services = api_request("GET", f"/catalog/partners/{partner['id']}/services", token=referred_token)
        assert_status("referral_antifraud_services", status, 200, services)
        service = services[0]

        item_payload = {
            "service_id": service["id"],
            "item_name": service.get("service_category_name") or "Referral Anti Abuse Item",
            "quantity": 3,
            "unit_price": str(service.get("base_price") or "0.00"),
            "notes": "Referral anti-abuse proof",
            "detected_by_ai": False,
        }
        estimate_payload = {
            "partner_id": partner["id"],
            "items": [item_payload],
            "currency": "CDF",
            "pickup_requested": True,
            "delivery_requested": True,
        }

        status, estimate = api_request("POST", "/orders/estimate", estimate_payload, token=referred_token)
        assert_status("referral_antifraud_estimate", status, 200, estimate)
        breakdown = estimate.get("calculation_breakdown") or {}
        if Decimal(str(breakdown.get("referral_discount", 0))) != Decimal("0"):
            raise AssertionError(f"blocked referrer should not grant estimate discount: {estimate}")
        print("PASS referral_antifraud_discount_blocked: referral discount removed")

        order_payload = {
            **estimate_payload,
            "pickup_address_id": created_address["id"],
            "delivery_address_id": created_address["id"],
            "idempotency_key": f"referral-antifraud-{uuid4()}",
        }
        status, created_order = api_request("POST", "/orders", order_payload, token=referred_token)
        assert_status("referral_antifraud_order_create", status, 201, created_order)
        order_breakdown = created_order.get("calculation_breakdown") or {}
        if Decimal(str(order_breakdown.get("referral_discount", 0))) != Decimal("0"):
            raise AssertionError(f"blocked referrer should not grant order discount: {created_order}")
        print("PASS referral_antifraud_order_discount_blocked: persisted without referral discount")

        order_total = Decimal(str(created_order["total_amount"]))
        status, payment_intent = api_request(
            "POST",
            "/payments/intents",
            {
                "order_id": created_order["id"],
                "payment_method": "cash_on_delivery",
                "amount_expected": float(order_total),
                "currency": "CDF",
            },
            token=referred_token,
        )
        assert_status("referral_antifraud_payment_intent", status, 201, payment_intent)

        status, confirmed = api_request(
            "POST",
            f"/payments/intents/{payment_intent['id']}/confirm-cash",
            {
                "confirmed_by_user_id": referred_user_id,
                "amount_paid": float(order_total),
                "notes": "Referral anti-abuse proof cash confirmation",
            },
            token=partner_token,
        )
        assert_status("referral_antifraud_confirm_cash", status, 200, confirmed)

        referrer_points_after = None
        for _ in range(5):
            status, referrer_me_after = api_request("GET", "/auth/me", token=referrer_token)
            assert_status("referral_antifraud_referrer_me_after", status, 200, referrer_me_after)
            referrer_points_after = int(referrer_me_after["user"]["loyalty_points"])
            if referrer_points_after == referrer_points_before:
                break
            time.sleep(0.5)
        if referrer_points_after != referrer_points_before:
            raise AssertionError(
                f"blocked referrer should not receive bonus: before={referrer_points_before}, after={referrer_points_after}"
            )
        print("PASS referral_antifraud_bonus_blocked: no referrer bonus awarded")

        print("Verified 5/5 referral anti-abuse checks")
        return 0
    finally:
        api_request(
            "PUT",
            f"/referral/admin/reviews/{referrer_user_id}",
            {
                "review_status": "clear",
                "review_note": "Reset after automated anti-abuse proof",
            },
            token=admin_token,
        )


if __name__ == "__main__":
    raise SystemExit(main())
