#!/usr/bin/env python3
"""
Verifie le moteur fidelite minimal contre l'API reelle.
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


def login(email: str, password: str) -> tuple[str, dict]:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or "access_token" not in body:
        raise AssertionError(f"login failed for {email}: {status} {body}")
    return body["access_token"], body


def assert_status(name: str, actual: int, expected: int, body) -> None:
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def main() -> int:
    print(f"Verifying loyalty engine flow against {API_BASE_URL}")
    creds = load_local_test_credentials()
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    customer_token, _ = login(creds["customer"]["email"], creds["customer"]["password"])

    status, me_body = api_request("GET", "/auth/me", token=customer_token)
    assert_status("loyalty_engine_me_before", status, 200, me_body)
    before_points = int(me_body["user"]["loyalty_points"])
    customer_id = me_body["user"]["id"]
    address_id = me_body["addresses"][0]["id"]

    status, loyalty_settings = api_request("GET", "/loyalty/settings", token=customer_token)
    assert_status("loyalty_engine_settings", status, 200, loyalty_settings)
    original_loyalty_settings = {
        "isEnabled": loyalty_settings["isEnabled"],
        "pointsPerDollar": loyalty_settings["pointsPerDollar"],
        "pointsToDollar": loyalty_settings["pointsToDollar"],
    }
    if (
        not loyalty_settings["isEnabled"]
        or int(loyalty_settings["pointsPerDollar"]) <= 0
        or int(loyalty_settings["pointsToDollar"]) <= 0
    ):
        status, loyalty_settings = api_request(
            "PUT",
            "/loyalty/settings",
            {
                "isEnabled": True,
                "pointsPerDollar": max(10, int(original_loyalty_settings["pointsPerDollar"] or 0)),
                "pointsToDollar": max(100, int(original_loyalty_settings["pointsToDollar"] or 0)),
            },
            token=admin_token,
        )
        assert_status("loyalty_engine_enable_settings", status, 200, loyalty_settings)

    points_per_dollar = int(loyalty_settings["pointsPerDollar"])
    points_to_dollar = int(loyalty_settings["pointsToDollar"])

    try:
        status, partners = api_request("GET", "/catalog/partners", token=customer_token)
        assert_status("loyalty_engine_partners", status, 200, partners)
        partner = partners[0]

        status, services = api_request("GET", f"/catalog/partners/{partner['id']}/services", token=customer_token)
        assert_status("loyalty_engine_services", status, 200, services)
        service = services[0]

        item_payload = {
            "service_id": service["id"],
            "item_name": service.get("service_category_name") or "Loyalty Test Item",
            "quantity": 1,
            "unit_price": str(service.get("base_price") or "0.00"),
            "notes": "Loyalty engine proof",
            "detected_by_ai": False,
        }

        estimate_payload = {
            "partner_id": partner["id"],
            "items": [item_payload],
            "currency": "CDF",
            "pickup_requested": True,
            "delivery_requested": True,
        }

        minimum_points_for_redemption = max(points_to_dollar, 100)
        if before_points < minimum_points_for_redemption:
            bootstrap_order_payload = {
                **estimate_payload,
                "pickup_address_id": address_id,
                "delivery_address_id": address_id,
                "idempotency_key": f"loyalty-bootstrap-{uuid4()}",
            }
            status, bootstrap_order = api_request("POST", "/orders", bootstrap_order_payload, token=customer_token)
            assert_status("loyalty_engine_bootstrap_order_create", status, 201, bootstrap_order)
            bootstrap_total = Decimal(str(bootstrap_order["total_amount"]))
            status, bootstrap_payment_intent = api_request(
                "POST",
                "/payments/intents",
                {
                    "order_id": bootstrap_order["id"],
                    "payment_method": "cash_on_delivery",
                    "amount_expected": float(bootstrap_total),
                    "currency": "CDF",
                },
                token=customer_token,
            )
            assert_status("loyalty_engine_bootstrap_payment_intent", status, 201, bootstrap_payment_intent)
            status, bootstrap_confirmed = api_request(
                "POST",
                f"/payments/intents/{bootstrap_payment_intent['id']}/confirm-cash",
                {
                    "confirmed_by_user_id": customer_id,
                    "amount_paid": float(bootstrap_total),
                    "notes": "Bootstrap loyalty points for proof",
                },
                token=partner_token,
            )
            assert_status("loyalty_engine_bootstrap_confirm_cash", status, 200, bootstrap_confirmed)
            status, seeded_me = api_request("GET", "/auth/me", token=customer_token)
            assert_status("loyalty_engine_bootstrap_me", status, 200, seeded_me)
            before_points = int(seeded_me["user"]["loyalty_points"])
            if before_points <= 0:
                raise AssertionError(f"unable to bootstrap loyalty points for test user: {before_points}")
            print("PASS loyalty_engine_bootstrap_points: earned points for redemption scenario")

        requested_points = min(500, before_points)

        status, baseline = api_request("POST", "/orders/estimate", estimate_payload, token=customer_token)
        assert_status("loyalty_engine_estimate_without_points", status, 200, baseline)
        baseline_total = Decimal(str(baseline["total_amount"]))
        requested_discount = Decimal(requested_points) / Decimal(points_to_dollar)
        if baseline_total <= requested_discount:
            unit_price = Decimal(str(item_payload["unit_price"]))
            if unit_price <= 0:
                raise AssertionError(f"cannot scale loyalty proof order for zero-priced service: {item_payload}")
            minimum_quantity = int((requested_discount / unit_price).to_integral_value()) + 2
            item_payload["quantity"] = max(item_payload["quantity"], minimum_quantity)
            estimate_payload["items"] = [item_payload]
            status, baseline = api_request("POST", "/orders/estimate", estimate_payload, token=customer_token)
            assert_status("loyalty_engine_estimate_without_points_scaled", status, 200, baseline)
            baseline_total = Decimal(str(baseline["total_amount"]))
            if baseline_total <= requested_discount:
                raise AssertionError(
                    f"unable to produce positive payable order after loyalty discount: total={baseline_total}, "
                    f"requested_discount={requested_discount}"
                )

        status, redeemed = api_request(
            "POST",
            "/orders/estimate",
            {**estimate_payload, "loyalty_points_to_redeem": requested_points},
            token=customer_token,
        )
        assert_status("loyalty_engine_estimate_with_points", status, 200, redeemed)
        redeemed_total = Decimal(str(redeemed["total_amount"]))
        redeemed_discount = Decimal(str(redeemed["discount_amount"]))
        if redeemed_discount <= 0 or redeemed_total >= baseline_total:
            raise AssertionError(f"loyalty discount not applied: {redeemed}")
        print("PASS loyalty_engine_discount_applied: estimate reduced")
        expected_redeemed_points = min(
            requested_points,
            int((redeemed_discount * Decimal(points_to_dollar)).to_integral_value()),
        )
        if expected_redeemed_points <= 0:
            raise AssertionError(f"invalid expected redeemed loyalty points computed from estimate: {redeemed}")

        order_payload = {
            **estimate_payload,
            "pickup_address_id": address_id,
            "delivery_address_id": address_id,
            "loyalty_points_to_redeem": requested_points,
            "idempotency_key": f"loyalty-engine-{uuid4()}",
        }
        status, created_order = api_request("POST", "/orders", order_payload, token=customer_token)
        assert_status("loyalty_engine_order_create", status, 201, created_order)
        breakdown = created_order.get("calculation_breakdown") or {}
        actual_redeemed_points = int(breakdown.get("loyalty_points_redeemed", 0))
        if actual_redeemed_points != expected_redeemed_points:
            raise AssertionError(f"loyalty points redeemed missing from order breakdown: {breakdown}")
        print("PASS loyalty_engine_order_breakdown: points redemption persisted")

        status, me_after_create = api_request("GET", "/auth/me", token=customer_token)
        assert_status("loyalty_engine_me_after_create", status, 200, me_after_create)
        after_create_points = int(me_after_create["user"]["loyalty_points"])
        if after_create_points != before_points - actual_redeemed_points:
            raise AssertionError(
                f"loyalty points not deducted on order create: before={before_points}, after_create={after_create_points}"
            )
        print("PASS loyalty_engine_points_deducted: points balance decreased")

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
            token=customer_token,
        )
        assert_status("loyalty_engine_create_payment_intent", status, 201, payment_intent)

        status, confirmed = api_request(
            "POST",
            f"/payments/intents/{payment_intent['id']}/confirm-cash",
            {
                "confirmed_by_user_id": customer_id,
                "amount_paid": float(order_total),
                "notes": "Loyalty engine proof cash confirmation",
            },
            token=partner_token,
        )
        assert_status("loyalty_engine_confirm_cash", status, 200, confirmed)

        expected_earned = int(order_total * Decimal(points_per_dollar))
        expected_after_payment = after_create_points + expected_earned
        last_me_after_payment = None
        after_payment_points = None
        for _ in range(5):
            status, me_after_payment = api_request("GET", "/auth/me", token=customer_token)
            assert_status("loyalty_engine_me_after_payment", status, 200, me_after_payment)
            last_me_after_payment = me_after_payment
            after_payment_points = int(me_after_payment["user"]["loyalty_points"])
            if after_payment_points == expected_after_payment:
                break
            time.sleep(0.5)
        if after_payment_points != expected_after_payment:
            raise AssertionError(
                "loyalty points not awarded correctly after payment: "
                f"expected={expected_after_payment}, got={after_payment_points}"
            )
        print("PASS loyalty_engine_points_awarded: payment accrual applied")

        status, history_body = api_request("GET", "/loyalty/me/history?limit=20", token=customer_token)
        assert_status("loyalty_engine_history", status, 200, history_body)
        order_entries = [
            entry for entry in history_body.get("entries", [])
            if entry.get("order_id") == created_order["id"]
        ]
        entry_types = {entry.get("entry_type") for entry in order_entries}
        if "redeem" not in entry_types or "earn" not in entry_types:
            raise AssertionError(
                f"loyalty ledger entries missing for created order: order_entries={order_entries}"
            )
        print("PASS loyalty_engine_history_entries: redeem and earn entries recorded")

        print("Verified 9/9 loyalty engine checks")
        return 0
    finally:
        api_request("PUT", "/loyalty/settings", original_loyalty_settings, token=admin_token)


if __name__ == "__main__":
    raise SystemExit(main())
