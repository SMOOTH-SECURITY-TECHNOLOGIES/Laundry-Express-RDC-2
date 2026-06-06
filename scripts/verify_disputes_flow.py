#!/usr/bin/env python3
"""
Vérifie un flow disputes minimal contre l'API réelle.
"""

import json
import os
import sys
import time
from contextlib import suppress
from decimal import Decimal
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from local_test_credentials import load_local_test_credentials

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
from app.models.dispute import Dispute  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.partner import Partner  # noqa: E402
from app.models.payment import PaymentIntent, RefundRequest  # noqa: E402
from app.models.user import User  # noqa: E402


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


def login(email: str, password: str) -> tuple[str, dict]:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or "access_token" not in body:
        raise AssertionError(f"login failed for {email}: {status} {body}")
    access_token = body["access_token"]
    me_status, me_body = api_request("GET", "/auth/me", token=access_token)
    if me_status != 200:
        raise AssertionError(f"/auth/me failed for {email}: {me_status} {me_body}")
    return access_token, me_body["user"]


def assert_status(name: str, actual: int, expected: int, body) -> None:
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def wait_for_order(order_id: str, token: str) -> None:
    deadline = time.time() + 5
    last_status = None
    last_body = None
    while time.time() < deadline:
        last_status, last_body = api_request("GET", f"/orders/{order_id}", token=token)
        if last_status == 200:
            print("PASS dispute_flow_order_visible: status=200")
            return
        time.sleep(0.25)
    raise AssertionError(f"order visibility failed: {last_status} {last_body}")


def main() -> int:
    print(f"Verifying disputes flow against {API_BASE_URL}")

    creds = load_local_test_credentials()
    customer_token, customer_user = login(creds["customer"]["email"], creds["customer"]["password"])
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_owner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    driver_token, _ = login(creds["driver"]["email"], creds["driver"]["password"])

    session = SessionLocal()
    created_ids = {}

    try:
        partner = session.query(Partner).filter(Partner.email == "partner@test.com").first()
        if not partner:
            raise AssertionError("seeded partner@test.com not found")

        customer = session.query(User).filter(User.id == customer_user["id"]).first()
        if not customer:
            raise AssertionError("seeded test customer not found")

        address = CustomerAddress(
            user_id=customer.id,
            label=f"dispute-{uuid4().hex[:6]}",
            contact_name=customer.name,
            contact_phone=customer.phone,
            address_line_1="18 Avenue Litige",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point="Immeuble test",
            instructions="Flow disputes",
            is_default=False,
        )
        session.add(address)
        session.flush()
        created_ids["address_id"] = address.id

        slug = uuid4().hex[:8]
        category = ServiceCategory(
            name=f"Dispute Category {slug}",
            slug=f"dispute-category-{slug}",
            description="Dispute flow category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Dispute Type {slug}",
            slug=f"dispute-type-{slug}",
            description="Dispute flow type",
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
            base_price=Decimal("2000.00"),
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
            price_adjustment_value=Decimal("500.00"),
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
                    "item_name": "Dispute shirt",
                    "quantity": "1.00",
                    "unit_price": "2000.00",
                    "notes": "Dispute flow",
                    "detected_by_ai": False,
                }
            ],
            "currency": "CDF",
            "special_instructions": "Dispute flow test",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
        }
        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=customer_token,
            headers={"Idempotency-Key": f"dispute-flow-{slug}"},
        )
        assert_status("dispute_flow_create_order", status, 201, body)
        created_ids["order_id"] = body["id"]
        wait_for_order(created_ids["order_id"], customer_token)
        total_amount = float(body["total_amount"])

        payment_payload = {
            "order_id": created_ids["order_id"],
            "payment_method": "cash_on_delivery",
            "amount_expected": total_amount,
            "currency": "CDF",
            "provider_name": None,
            "expires_at": None,
            "payment_metadata": {"source": "verify_disputes_flow"},
        }
        status, body = api_request("POST", "/payments/intents", payment_payload, token=customer_token)
        assert_status("dispute_flow_create_payment_intent", status, 201, body)
        created_ids["payment_intent_id"] = body["id"]

        confirm_payload = {
            "confirmed_by_user_id": customer_user["id"],
            "amount_paid": total_amount,
            "notes": "Partner owner confirms for disputes flow",
        }
        status, body = api_request(
            "POST",
            f"/payments/intents/{created_ids['payment_intent_id']}/confirm-cash",
            confirm_payload,
            token=partner_owner_token,
        )
        assert_status("dispute_flow_confirm_cash", status, 200, body)

        dispute_payload = {
            "order_id": created_ids["order_id"],
            "category": "quality_issue",
            "title": "Chemise mal nettoyee",
            "description": "Le resultat de lavage est insuffisant.",
            "refund_requested": True,
            "requested_amount": total_amount,
        }
        status, body = api_request("POST", "/disputes", dispute_payload, token=customer_token)
        assert_status("dispute_flow_customer_create_dispute", status, 201, body)
        created_ids["dispute_id"] = body["id"]
        refund_requests = body.get("refund_requests", [])
        if not refund_requests:
            raise AssertionError("dispute_flow expected refund request to be created")
        print(f"PASS dispute_flow_refund_request_created: count={len(refund_requests)}")

        status, body = api_request("GET", f"/disputes/{created_ids['dispute_id']}", token=partner_owner_token)
        assert_status("dispute_flow_partner_owner_can_read", status, 200, body)

        status, body = api_request("GET", f"/disputes/{created_ids['dispute_id']}", token=driver_token)
        assert_status("dispute_flow_driver_forbidden", status, 403, body)

        status, body = api_request("GET", "/disputes/summary", token=admin_token)
        assert_status("dispute_flow_admin_summary", status, 200, body)

        status, body = api_request("GET", "/disputes/open", token=partner_owner_token)
        assert_status("dispute_flow_partner_owner_open_list", status, 200, body)
        if not any(item["id"] == created_ids["dispute_id"] for item in body):
            raise AssertionError("created dispute not visible in partner open disputes list")
        print("PASS dispute_flow_partner_open_contains_dispute: true")

        print("Verified 9/9 disputes checks")
        return 0
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            if created_ids.get("dispute_id"):
                cleanup.query(RefundRequest).filter(
                    RefundRequest.dispute_id == created_ids["dispute_id"]
                ).delete(synchronize_session=False)
                cleanup.query(Dispute).filter(
                    Dispute.id == created_ids["dispute_id"]
                ).delete(synchronize_session=False)
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
            if created_ids.get("category_id"):
                cleanup.query(ServiceCategory).filter(
                    ServiceCategory.id == created_ids["category_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("service_type_id"):
                cleanup.query(ServiceType).filter(
                    ServiceType.id == created_ids["service_type_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("service_id"):
                cleanup.query(PricingRule).filter(
                    PricingRule.partner_id == partner.id
                ).filter(PricingRule.price_adjustment_value.in_([Decimal("500.00")])).delete(
                    synchronize_session=False
                )
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
        print(f"Disputes flow verification failed: {exc}")
        raise SystemExit(1)
