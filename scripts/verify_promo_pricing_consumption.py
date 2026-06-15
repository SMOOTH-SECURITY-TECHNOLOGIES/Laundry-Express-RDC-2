#!/usr/bin/env python3
"""
Verifie le corridor promo aligne sur le modele metier actuel :

  commande creee avec promo -> audit promotion_applied
  pas encore de ledger usage
  paiement PAID -> promo_code_usage + audit promotion_consumed
  double recalculate -> pas de double ledger
"""

from __future__ import annotations

import json
import os
import sys
from decimal import Decimal
from pathlib import Path
from urllib import error, request
from uuid import UUID, uuid4

import importlib.util

ROOT = Path(__file__).resolve().parents[1]
API_PKG = ROOT / "apps" / "api"
sys.path.insert(0, str(API_PKG))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.admin import AuditLog
from app.models.promotion import PromoCode, PromoCodeUsage
from app.services.payment_service import PaymentService

_CORRIDOR_PATH = ROOT / "scripts" / "validate_customer_corridor_truth.py"
_spec = importlib.util.spec_from_file_location("customer_corridor_truth", _CORRIDOR_PATH)
_corridor = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
sys.modules["customer_corridor_truth"] = _corridor
_spec.loader.exec_module(_corridor)

build_customer_identity = _corridor.build_customer_identity
bootstrap_ephemeral_catalog = _corridor.bootstrap_ephemeral_catalog
ensure_admin_token = _corridor.ensure_admin_token
RuntimeContext = _corridor.RuntimeContext

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")
CUSTOMER_PASSWORD = os.getenv("TRUTH_CUSTOMER_PASSWORD", f"PromoProof-{uuid4().hex[:12]}!aA1")
DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL_SYNC",
    os.getenv(
        "API_SMOKE_DATABASE_URL",
        "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express",
    ),
)


def api_request(method: str, path: str, payload=None, token=None, headers=None):
    req_headers = {"Content-Type": "application/json"}
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    if headers:
        req_headers.update(headers)

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{API_BASE_URL}{path}",
        data=body,
        headers=req_headers,
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


def db_session():
    engine = create_engine(DATABASE_URL_SYNC)
    return sessionmaker(bind=engine)()


def audit_actions(order_id: str) -> set[str]:
    session = db_session()
    try:
        rows = session.query(AuditLog).filter(AuditLog.resource_id == UUID(order_id)).all()
        return {str(row.action) for row in rows}
    finally:
        session.close()


def promo_usage_for_order(order_id: str) -> PromoCodeUsage | None:
    session = db_session()
    try:
        return (
            session.query(PromoCodeUsage)
            .filter(PromoCodeUsage.order_id == UUID(order_id))
            .first()
        )
    finally:
        session.close()


def promo_usage_count(promo_id: str) -> int:
    session = db_session()
    try:
        return (
            session.query(PromoCodeUsage)
            .filter(PromoCodeUsage.promo_code_id == UUID(promo_id))
            .count()
        )
    finally:
        session.close()


def admin_promo_usage_count(promo_id: str, admin_token: str) -> int:
    status, body = api_request("GET", "/promotions", token=admin_token)
    assert_status("promo_pricing_admin_list", status, 200, body)
    promo = next((item for item in body["promo_codes"] if item["id"] == promo_id), None)
    if not promo:
        raise AssertionError("created promo not found in admin list")
    return int(promo.get("usage_count") or 0)


def pay_order(customer_token: str, order: dict) -> dict:
    total = float(order["total_amount"])
    status, intent = api_request(
        "POST",
        "/payments/intents",
        {
            "order_id": order["id"],
            "payment_method": "mobile_money",
            "amount_expected": total,
            "currency": order.get("currency", "CDF"),
            "provider_name": "orange_money_rdc",
        },
        token=customer_token,
    )
    assert_status("promo_pricing_payment_intent", status, 201, intent)

    status, _tx = api_request("POST", f"/payments/intents/{intent['id']}/initiate", token=customer_token)
    assert_status("promo_pricing_payment_initiate", status, 200, _tx)

    status, paid = api_request("GET", f"/orders/{order['id']}", token=customer_token)
    assert_status("promo_pricing_order_after_pay", status, 200, paid)
    if str(paid.get("payment_status", "")).lower() != "paid":
        raise AssertionError(f"order not paid after initiate: {paid}")
    return paid


def main() -> int:
    print(f"Verifying promo pricing consumption against {API_BASE_URL}")
    print(f"DB sync   : {DATABASE_URL_SYNC.split('@')[-1]}")

    email, phone, slug = build_customer_identity()
    status, reg = api_request("POST", "/auth/register", {
        "email": email, "phone": phone, "name": f"Promo Proof {slug}", "password": CUSTOMER_PASSWORD,
    })
    assert_status("promo_pricing_register_customer", status, 201, reg)
    customer_token = login(email, CUSTOMER_PASSWORD)

    status, addr = api_request("POST", "/users/me/addresses", {
        "user_id": str(reg["id"]),
        "label": "Promo Proof",
        "contact_name": "Promo Proof",
        "contact_phone": phone,
        "address_line_1": "10 Avenue Promo Proof",
        "city": "Kinshasa",
        "commune": "Gombe",
        "zone": "Centre",
        "is_default": True,
    }, token=customer_token)
    assert_status("promo_pricing_create_address", status, 201, addr)
    address_id = str(addr["id"])

    admin_token, _ = ensure_admin_token(RuntimeContext(run_slug=slug))
    _, _, partner, service = bootstrap_ephemeral_catalog(slug)
    promo_id = None
    promo_code = f"PRICEPROOF{uuid4().hex[:6].upper()}"
    unit_price = str(service.get("base_price") or "0.00")
    checks_passed = 0
    total_checks = 9

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
            "code": promo_code,
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
        checks_passed += 1

        status, body = api_request("POST", "/orders/estimate", estimate_payload, token=customer_token)
        assert_status("promo_pricing_estimate_without_code", status, 200, body)
        baseline_total = Decimal(str(body["total_amount"]))
        checks_passed += 1

        status, body = api_request(
            "POST",
            "/orders/estimate",
            {**estimate_payload, "promo_code": promo_code},
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
        checks_passed += 1

        idempotency_key = f"promo-pricing-proof-{uuid4().hex[:12]}"
        status, order = api_request(
            "POST",
            "/orders",
            {
                **estimate_payload,
                "pickup_address_id": address_id,
                "delivery_address_id": address_id,
                "promo_code": promo_code,
                "idempotency_key": idempotency_key,
            },
            token=customer_token,
            headers={"Idempotency-Key": idempotency_key},
        )
        assert_status("promo_pricing_order_create_with_code", status, 201, order)
        order_id = str(order["id"])
        order_discount = Decimal(str(order["discount_amount"]))
        order_total = Decimal(str(order["total_amount"]))
        if order_discount <= 0:
            raise AssertionError(f"order discount not persisted: {order}")
        if order_total >= baseline_total:
            raise AssertionError(f"order total not discounted: {baseline_total} vs {order_total}")
        print("PASS promo_pricing_order_discount_persisted: order totals reflect promo")
        checks_passed += 1

        if str(order.get("payment_status", "")).lower() == "paid":
            raise AssertionError("promo must not be consumed before explicit payment in this proof")
        if promo_usage_for_order(order_id) is not None:
            raise AssertionError("promo_code_usage must not exist before payment")
        if admin_promo_usage_count(promo_id, admin_token) != 0:
            raise AssertionError("usage_count must remain 0 before payment")
        actions = audit_actions(order_id)
        if "promotion_applied" not in actions:
            raise AssertionError(f"promotion_applied audit missing before payment: {actions}")
        if "promotion_consumed" in actions:
            raise AssertionError(f"promotion_consumed must not exist before payment: {actions}")
        print("PASS promo_pricing_applied_not_consumed_yet: applied only, no ledger")
        checks_passed += 1

        paid_order = pay_order(customer_token, order)
        if Decimal(str(paid_order.get("amount_paid", 0))) != order_total:
            raise AssertionError(
                f"amount_paid must equal discounted total: {paid_order.get('amount_paid')} vs {order_total}"
            )
        print("PASS promo_pricing_payment_paid: amount_paid matches discounted total")
        checks_passed += 1

        usage = promo_usage_for_order(order_id)
        if usage is None:
            raise AssertionError("promo_code_usage missing after payment")
        if float(usage.discount_applied) <= 0:
            raise AssertionError(f"ledger discount_applied invalid: {usage.discount_applied}")
        print("PASS promo_pricing_ledger_created: promo_code_usage row present")
        checks_passed += 1

        actions = audit_actions(order_id)
        if "promotion_consumed" not in actions:
            raise AssertionError(f"promotion_consumed audit missing after payment: {actions}")
        print("PASS promo_pricing_audit_consumed: promotion_consumed logged")
        checks_passed += 1

        if admin_promo_usage_count(promo_id, admin_token) != 1:
            raise AssertionError("usage_count must be 1 after first paid consumption")

        before = promo_usage_count(promo_id)
        session = db_session()
        try:
            PaymentService(session).recalculate_order_payment_status(UUID(order_id))
            session.commit()
        finally:
            session.close()
        after = promo_usage_count(promo_id)
        if before != 1 or after != 1:
            raise AssertionError(f"double recalculate created duplicate ledger: before={before} after={after}")
        if promo_usage_for_order(order_id) is None:
            raise AssertionError("ledger row missing after idempotent recalculate")
        print("PASS promo_pricing_idempotent_recalculate: single ledger row preserved")
        checks_passed += 1

        print(f"Verified {checks_passed}/{total_checks} promo pricing checks")
        return 0
    finally:
        if promo_id:
            api_request("DELETE", f"/promotions/{promo_id}", token=admin_token)


if __name__ == "__main__":
    raise SystemExit(main())
