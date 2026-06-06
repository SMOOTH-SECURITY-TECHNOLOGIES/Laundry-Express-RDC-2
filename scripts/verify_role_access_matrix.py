#!/usr/bin/env python3
"""
Vérifie une matrice minimale d'autorisations contre l'API réelle.

Usage:
    python scripts/verify_role_access_matrix.py
"""

import json
import os
import random
import sys
import time
from contextlib import suppress
from decimal import Decimal
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from sqlalchemy import create_engine
from local_test_credentials import load_local_test_credentials
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")
DATABASE_URL = os.getenv(
    "API_SMOKE_DATABASE_URL",
    "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express",
)

sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.models.catalog import (  # noqa: E402
    PartnerService,
    PriceAdjustmentType,
    PricingMode,
    PricingRule,
    RuleType,
    ServiceCategory,
    ServiceType,
)
from app.models.customer import CustomerAddress  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.partner import Partner, PartnerStatus, PartnerType  # noqa: E402
from app.models.payment import PaymentIntent  # noqa: E402


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def api_request(method: str, path: str, payload=None, token=None, headers=None):
    final_headers = {"Content-Type": "application/json"}
    if token:
        final_headers["Authorization"] = f"Bearer {token}"
    if headers:
        final_headers.update(headers)

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{API_BASE_URL}{path}",
        data=body,
        headers=final_headers,
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
    status, body = api_request(
        "POST",
        "/auth/login",
        {"email": email, "password": password},
    )
    if status != 200 or "access_token" not in body:
        raise AssertionError(f"login failed for {email}: {status} {body}")
    return body["access_token"]


def get_me(token: str) -> dict:
    status, body = api_request("GET", "/auth/me", token=token)
    if status != 200:
        raise AssertionError(f"/auth/me failed: {status} {body}")
    return body


def assert_status(name: str, actual: int, expected: int, body) -> None:
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def wait_for_order_visibility(order_id: str, token: str, timeout_seconds: float = 5.0) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        status, body = api_request("GET", f"/orders/{order_id}", token=token)
        if status == 200:
            print(f"PASS order_visible_for_payment: status={status}")
            return
        time.sleep(0.25)
    raise AssertionError(f"order_visible_for_payment expected 200, last response={status} {body}")


def main() -> int:
    print(f"Verifying role access matrix against {API_BASE_URL}")

    creds = load_local_test_credentials()
    customer_token = login(creds["customer"]["email"], creds["customer"]["password"])
    super_admin_token = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_owner_token = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])

    customer_me = get_me(customer_token)
    super_admin_me = get_me(super_admin_token)

    customer_id = customer_me["user"]["id"]
    super_admin_id = super_admin_me["user"]["id"]

    status, body = api_request("GET", f"/users/{customer_id}", token=super_admin_token)
    assert_status("super_admin_get_user", status, 200, body)

    status, body = api_request("GET", f"/users/{super_admin_id}", token=customer_token)
    assert_status("customer_forbidden_on_admin_user_read", status, 403, body)

    slug = uuid4().hex[:8]
    session = SessionLocal()
    created_ids = {}

    try:
        address = CustomerAddress(
            user_id=customer_id,
            label=f"matrix-{slug}",
            contact_name="Test User",
            contact_phone="+243810000001",
            address_line_1="15 Avenue Matrix",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point="Borne rouge",
            instructions="Matrix auth test",
            is_default=False,
        )
        session.add(address)
        session.flush()
        created_ids["address_id"] = address.id

        partner = Partner(
            name=f"Matrix Partner {slug}",
            business_name=f"Matrix Business {slug}",
            tax_id=f"MATRIX-{slug}",
            partner_type=PartnerType.LAUNDRY.value,
            status=PartnerStatus.ACTIVE.value,
            email=f"matrix-partner-{slug}@example.com",
            phone=f"+24384{random.randint(1000000, 9999999)}",
            is_verified=True,
            is_featured=False,
            is_accepting_orders=True,
        )
        session.add(partner)
        session.flush()
        created_ids["partner_id"] = partner.id

        category = ServiceCategory(
            name=f"Matrix Category {slug}",
            slug=f"matrix-category-{slug}",
            description="Auth matrix category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Matrix Type {slug}",
            slug=f"matrix-type-{slug}",
            description="Auth matrix type",
            is_active=True,
        )
        session.add_all([category, service_type])
        session.flush()
        created_ids["category_id"] = category.id
        created_ids["service_type_id"] = service_type.id

        partner_service = PartnerService(
            partner_id=partner.id,
            service_category_id=category.id,
            service_type_id=service_type.id,
            base_price=Decimal("1500.00"),
            pricing_mode=PricingMode.UNIT,
            estimated_turnaround_hours=24,
            is_available=True,
        )
        pickup_rule = PricingRule(
            partner_id=partner.id,
            rule_type=RuleType.PICKUP_FEE,
            service_category_id=None,
            service_type_id=None,
            min_quantity=None,
            max_quantity=None,
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("500.00"),
            is_active=True,
        )
        delivery_rule = PricingRule(
            partner_id=partner.id,
            rule_type=RuleType.DELIVERY_FEE,
            service_category_id=None,
            service_type_id=None,
            min_quantity=None,
            max_quantity=None,
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("1000.00"),
            is_active=True,
        )
        session.add_all([partner_service, pickup_rule, delivery_rule])
        session.commit()

        created_ids["service_id"] = partner_service.id

        order_payload = {
            "partner_id": str(partner.id),
            "pickup_address_id": str(address.id),
            "delivery_address_id": str(address.id),
            "items": [
                {
                    "service_id": str(partner_service.id),
                    "item_name": "Matrix shirt",
                    "quantity": "2.00",
                    "unit_price": "1500.00",
                    "notes": "Authorization matrix",
                    "detected_by_ai": False,
                }
            ],
            "currency": "CDF",
            "special_instructions": "Role access matrix",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
        }

        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=customer_token,
            headers={"Idempotency-Key": f"role-matrix-{slug}"},
        )
        assert_status("customer_create_order", status, 201, body)
        created_ids["order_id"] = body["id"]
        total_amount = float(body["total_amount"])
        wait_for_order_visibility(created_ids["order_id"], customer_token)

        payment_payload = {
            "order_id": created_ids["order_id"],
            "payment_method": "cash_on_delivery",
            "amount_expected": total_amount,
            "currency": "CDF",
            "provider_name": None,
            "expires_at": None,
            "payment_metadata": {"source": "verify_role_access_matrix"},
        }
        status, body = api_request("POST", "/payments/intents", payment_payload, token=customer_token)
        assert_status("customer_create_payment_intent", status, 201, body)
        created_ids["payment_intent_id"] = body["id"]

        customer_confirm_payload = {
            "confirmed_by_user_id": customer_id,
            "amount_paid": total_amount,
            "notes": "Customer should be forbidden",
        }
        status, body = api_request(
            "POST",
            f"/payments/intents/{created_ids['payment_intent_id']}/confirm-cash",
            customer_confirm_payload,
            token=customer_token,
        )
        assert_status("customer_forbidden_confirm_cash", status, 403, body)

        partner_confirm_payload = {
            "confirmed_by_user_id": customer_id,
            "amount_paid": total_amount,
            "notes": "Partner owner confirms cash",
        }
        status, body = api_request(
            "POST",
            f"/payments/intents/{created_ids['payment_intent_id']}/confirm-cash",
            partner_confirm_payload,
            token=partner_owner_token,
        )
        assert_status("partner_owner_confirm_cash", status, 200, body)

        print("Verified 6/6 authorization checks")
        return 0
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            if created_ids.get("payment_intent_id"):
                cleanup.query(PaymentIntent).filter(
                    PaymentIntent.id == created_ids["payment_intent_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("order_id"):
                cleanup.query(Order).filter(Order.id == created_ids["order_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("service_id"):
                cleanup.query(PartnerService).filter(
                    PartnerService.id == created_ids["service_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("partner_id"):
                cleanup.query(PricingRule).filter(
                    PricingRule.partner_id == created_ids["partner_id"]
                ).delete(synchronize_session=False)
                cleanup.query(Partner).filter(Partner.id == created_ids["partner_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("category_id"):
                cleanup.query(ServiceCategory).filter(
                    ServiceCategory.id == created_ids["category_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("service_type_id"):
                cleanup.query(ServiceType).filter(
                    ServiceType.id == created_ids["service_type_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("address_id"):
                cleanup.query(CustomerAddress).filter(
                    CustomerAddress.id == created_ids["address_id"]
                ).delete(synchronize_session=False)
            cleanup.commit()
        cleanup.close()
        session.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Role access verification failed: {exc}")
        raise SystemExit(1)
