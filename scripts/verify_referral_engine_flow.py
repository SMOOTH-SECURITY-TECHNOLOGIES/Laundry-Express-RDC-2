#!/usr/bin/env python3
"""
Verifie le moteur referral minimal contre l'API reelle.
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
    print(f"Verifying referral engine flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    referrer_token, _ = login(creds["customer"]["email"], creds["customer"]["password"])

    status, referrer_me = api_request("GET", "/auth/me", token=referrer_token)
    assert_status("referral_engine_referrer_me", status, 200, referrer_me)
    referrer_code = referrer_me["user"].get("referral_code")
    referrer_points_before = int(referrer_me["user"]["loyalty_points"])
    if not referrer_code:
        raise AssertionError(f"missing referral code on referrer: {referrer_me}")

    status, referral_settings = api_request("GET", "/referral/settings", token=referrer_token)
    assert_status("referral_engine_settings", status, 200, referral_settings)
    original_settings = {
        "isEnabled": referral_settings["isEnabled"],
        "referrerBonusPoints": referral_settings["referrerBonusPoints"],
        "refereeDiscountAmount": referral_settings["refereeDiscountAmount"],
    }

    try:
        if not referral_settings["isEnabled"] or float(referral_settings["refereeDiscountAmount"]) <= 0:
            status, referral_settings = api_request(
                "PUT",
                "/referral/settings",
                {
                    "isEnabled": True,
                    "referrerBonusPoints": max(500, int(original_settings["referrerBonusPoints"] or 0)),
                    "refereeDiscountAmount": max(5, float(original_settings["refereeDiscountAmount"] or 0)),
                },
                token=admin_token,
            )
            assert_status("referral_engine_enable_settings", status, 200, referral_settings)

        referred_email = f"ref_{uuid4().hex[:10]}@example.com"
        referred_phone = f"+24382{str(uuid4().int)[:7]}"
        referred_password = f"referral-engine-{uuid4().hex[:12]}-A!"
        referred_name = "Referral Engine User"

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
        assert_status("referral_engine_register_referred_user", status, 201, registered)

        referred_token, _ = login(referred_email, referred_password)
        status, referred_me = api_request("GET", "/auth/me", token=referred_token)
        assert_status("referral_engine_referred_me", status, 200, referred_me)
        referred_user_id = referred_me["user"]["id"]

        status, created_address = api_request(
            "POST",
            "/users/me/addresses",
            {
                "user_id": referred_user_id,
                "label": "Maison",
                "contact_name": referred_name,
                "contact_phone": referred_phone,
                "address_line_1": "25 Avenue Referral",
                "address_line_2": "12",
                "city": "Kinshasa",
                "commune": "Gombe",
                "zone": "Centre",
                "reference_point": "Referral proof",
                "is_default": True,
            },
            token=referred_token,
        )
        assert_status("referral_engine_create_address", status, 201, created_address)

        status, partners = api_request("GET", "/catalog/partners", token=referred_token)
        assert_status("referral_engine_partners", status, 200, partners)
        partner = partners[0]

        status, services = api_request("GET", f"/catalog/partners/{partner['id']}/services", token=referred_token)
        assert_status("referral_engine_services", status, 200, services)
        service = services[0]

        item_payload = {
            "service_id": service["id"],
            "item_name": service.get("service_category_name") or "Referral Test Item",
            "quantity": 3,
            "unit_price": str(service.get("base_price") or "0.00"),
            "notes": "Referral engine proof",
            "detected_by_ai": False,
        }
        estimate_payload = {
            "partner_id": partner["id"],
            "items": [item_payload],
            "currency": "CDF",
            "pickup_requested": True,
            "delivery_requested": True,
        }

        status, baseline = api_request("POST", "/orders/estimate", estimate_payload, token=referred_token)
        assert_status("referral_engine_estimate_without_manual_code", status, 200, baseline)
        baseline_total = Decimal(str(baseline["total_amount"]))
        breakdown = baseline.get("calculation_breakdown") or {}
        referral_discount = Decimal(str(breakdown.get("referral_discount", 0)))
        if referral_discount <= 0:
            raise AssertionError(f"missing referral discount in estimate: {baseline}")
        if baseline_total >= Decimal(str(baseline["subtotal_amount"])) + Decimal(str(baseline["pickup_fee"])) + Decimal(str(baseline["delivery_fee"])):
            raise AssertionError(f"referral discount did not reduce estimate total: {baseline}")
        print("PASS referral_engine_referee_discount: estimate reduced")

        order_payload = {
            **estimate_payload,
            "pickup_address_id": created_address["id"],
            "delivery_address_id": created_address["id"],
            "idempotency_key": f"referral-engine-{uuid4()}",
        }
        status, created_order = api_request("POST", "/orders", order_payload, token=referred_token)
        assert_status("referral_engine_create_order", status, 201, created_order)
        order_breakdown = created_order.get("calculation_breakdown") or {}
        if Decimal(str(order_breakdown.get("referral_discount", 0))) <= 0:
            raise AssertionError(f"referral discount missing on order breakdown: {created_order}")
        print("PASS referral_engine_order_breakdown: referral discount persisted")

        status, follow_up_estimate = api_request("POST", "/orders/estimate", estimate_payload, token=referred_token)
        assert_status("referral_engine_follow_up_estimate", status, 200, follow_up_estimate)
        follow_up_breakdown = follow_up_estimate.get("calculation_breakdown") or {}
        if Decimal(str(follow_up_breakdown.get("referral_discount", 0))) != Decimal("0"):
            raise AssertionError(f"referral discount should be one-time after order creation: {follow_up_estimate}")
        print("PASS referral_engine_one_time_discount: consumed after first order")

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
        assert_status("referral_engine_payment_intent", status, 201, payment_intent)

        status, confirmed = api_request(
            "POST",
            f"/payments/intents/{payment_intent['id']}/confirm-cash",
            {
                "confirmed_by_user_id": referred_user_id,
                "amount_paid": float(order_total),
                "notes": "Referral engine proof cash confirmation",
            },
            token=partner_token,
        )
        assert_status("referral_engine_confirm_cash", status, 200, confirmed)

        expected_bonus = int(referral_settings["referrerBonusPoints"])
        referrer_points_after = None
        for _ in range(5):
            status, referrer_me_after = api_request("GET", "/auth/me", token=referrer_token)
            assert_status("referral_engine_referrer_me_after", status, 200, referrer_me_after)
            referrer_points_after = int(referrer_me_after["user"]["loyalty_points"])
            if referrer_points_after == referrer_points_before + expected_bonus:
                break
            time.sleep(0.5)
        if referrer_points_after != referrer_points_before + expected_bonus:
            raise AssertionError(
                f"referrer bonus not applied correctly: before={referrer_points_before}, after={referrer_points_after}, expected_bonus={expected_bonus}"
            )
        print("PASS referral_engine_referrer_bonus: loyalty points awarded")

        status, referrer_history = api_request("GET", "/loyalty/me/history?limit=20", token=referrer_token)
        assert_status("referral_engine_referrer_history", status, 200, referrer_history)
        referral_bonus_entries = [
            entry for entry in referrer_history.get("entries", [])
            if entry.get("entry_type") == "referral_bonus" and entry.get("order_id") == created_order["id"]
        ]
        if not referral_bonus_entries:
            raise AssertionError(f"missing referral bonus ledger entry: {referrer_history}")
        print("PASS referral_engine_referrer_ledger: entry recorded")

        print("Verified 8/8 referral engine checks")
        return 0
    finally:
        api_request("PUT", "/referral/settings", original_settings, token=admin_token)


if __name__ == "__main__":
    raise SystemExit(main())
