#!/usr/bin/env python3
"""
Verifie un flow logistique minimal contre l'API reelle.
"""

import json
import os
import sys
import time
from contextlib import suppress
from decimal import Decimal
from pathlib import Path
from urllib import error, request
from uuid import UUID, uuid4

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
from app.models.logistics import DeliveryTask, Driver, DriverLocation  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.partner import Partner  # noqa: E402
from app.models.payment import PaymentIntent  # noqa: E402
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
    token = body["access_token"]
    me_status, me_body = api_request("GET", "/auth/me", token=token)
    if me_status != 200:
        raise AssertionError(f"/auth/me failed for {email}: {me_status} {me_body}")
    return token, me_body["user"]


def assert_status(name: str, actual: int, expected: int, body) -> None:
    if actual != expected:
        raise AssertionError(f"{name} expected {expected}, got {actual}: {body}")
    print(f"PASS {name}: status={actual}")


def wait_for_order(order_id: str, token: str) -> None:
    deadline = time.time() + 5
    while time.time() < deadline:
        status, body = api_request("GET", f"/orders/{order_id}", token=token)
        if status == 200:
            print("PASS logistics_flow_order_visible: status=200")
            return
        time.sleep(0.25)
    raise AssertionError(f"order visibility failed for {order_id}: {status} {body}")


def main() -> int:
    print(f"Verifying logistics flow against {API_BASE_URL}")

    creds = load_local_test_credentials()
    customer_token, customer_user = login(creds["customer"]["email"], creds["customer"]["password"])
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_owner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    driver_token, driver_user = login(creds["driver"]["email"], creds["driver"]["password"])

    session = SessionLocal()
    created_ids = {}
    partner = None

    try:
        partner = session.query(Partner).filter(Partner.email == "partner@test.com").first()
        if not partner:
            raise AssertionError("seeded partner@test.com not found")

        customer = session.query(User).filter(User.id == customer_user["id"]).first()
        if not customer:
            raise AssertionError("seeded customer not found")

        address = CustomerAddress(
            user_id=customer.id,
            label=f"logistics-{uuid4().hex[:6]}",
            contact_name=customer.name,
            contact_phone=customer.phone,
            address_line_1="25 Avenue Logistics",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point="Reference logistics",
            instructions="Flow logistics",
            is_default=False,
        )
        session.add(address)
        session.flush()
        created_ids["address_id"] = address.id

        slug = uuid4().hex[:8]
        category = ServiceCategory(
            name=f"Logistics Category {slug}",
            slug=f"logistics-category-{slug}",
            description="Logistics flow category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Logistics Type {slug}",
            slug=f"logistics-type-{slug}",
            description="Logistics flow type",
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
                    "item_name": "Logistics shirt",
                    "quantity": "1.00",
                    "unit_price": "1500.00",
                    "notes": "Logistics flow",
                    "detected_by_ai": False,
                }
            ],
            "currency": "CDF",
            "special_instructions": "Logistics flow test",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
        }
        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=customer_token,
            headers={"Idempotency-Key": f"logistics-flow-{slug}"},
        )
        assert_status("logistics_flow_create_order", status, 201, body)
        created_ids["order_id"] = body["id"]
        wait_for_order(created_ids["order_id"], customer_token)

        driver_create_payload = {
            "user_id": driver_user["id"],
            "vehicle_type": "Moto",
            "license_number": f"DRV-{slug}",
            "status": "active",
            "is_available": True,
        }
        status, body = api_request("POST", "/logistics/drivers", driver_create_payload, token=admin_token)
        if status == 201:
            created_ids["driver_id"] = body["id"]
            print("PASS logistics_flow_create_driver: status=201")
        elif status == 400 and "déjà un chauffeur" in str(body):
            existing_driver = session.query(Driver).filter(Driver.user_id == driver_user["id"]).first()
            if not existing_driver:
                raise AssertionError(f"driver exists response but no driver row found: {body}")
            created_ids["driver_id"] = str(existing_driver.id)
            print("PASS logistics_flow_reuse_existing_driver: status=400")
        else:
            raise AssertionError(f"logistics_flow_create_driver expected 201 or known 400, got {status}: {body}")

        driver_row = session.query(Driver).filter(Driver.id == UUID(str(created_ids["driver_id"]))).first()
        if not driver_row:
            raise AssertionError("driver row not found after create/reuse")
        driver_row.is_available = True
        session.commit()

        location_payload = {"latitude": -4.325, "longitude": 15.322}
        status, body = api_request(
            "POST",
            f"/logistics/drivers/{created_ids['driver_id']}/location",
            location_payload,
            token=driver_token,
        )
        assert_status("logistics_flow_driver_update_location", status, 200, body)

        pickup_task_payload = {
            "order_id": created_ids["order_id"],
            "task_type": "pickup",
            "pickup_location_type": "customer",
            "dropoff_location_type": "partner",
            "scheduled_at": None,
        }
        status, body = api_request("POST", "/logistics/tasks/pickup", pickup_task_payload, token=partner_owner_token)
        assert_status("logistics_flow_partner_create_pickup_task", status, 201, body)
        created_ids["task_id"] = body["id"]

        assign_payload = {"driver_id": created_ids["driver_id"]}
        status, body = api_request(
            "POST",
            f"/logistics/tasks/{created_ids['task_id']}/assign",
            assign_payload,
            token=admin_token,
        )
        assert_status("logistics_flow_admin_assign_driver", status, 200, body)

        status, body = api_request("POST", f"/logistics/tasks/{created_ids['task_id']}/accept", {}, token=driver_token)
        assert_status("logistics_flow_driver_accept_task", status, 200, body)

        status, body = api_request("POST", f"/logistics/tasks/{created_ids['task_id']}/start", {}, token=driver_token)
        assert_status("logistics_flow_driver_start_task", status, 200, body)

        complete_payload = {
            "proof_note": "Pickup completed",
            "proof_photo_url": "https://example.com/proof.jpg",
        }
        status, body = api_request(
            "POST",
            f"/logistics/tasks/{created_ids['task_id']}/complete",
            complete_payload,
            token=driver_token,
        )
        assert_status("logistics_flow_driver_complete_task", status, 200, body)

        status, body = api_request("GET", "/logistics/tasks", token=driver_token)
        assert_status("logistics_flow_driver_list_tasks", status, 200, body)
        if not any(item["id"] == created_ids["task_id"] for item in body["tasks"]):
            raise AssertionError("driver task list does not contain created task")
        print("PASS logistics_flow_driver_tasks_contains_task: true")

        print("Verified 9/9 logistics checks")
        return 0
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            if created_ids.get("task_id"):
                cleanup.query(DeliveryTask).filter(
                    DeliveryTask.id == created_ids["task_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("service_id") and partner is not None:
                cleanup.query(PricingRule).filter(
                    PricingRule.partner_id == partner.id
                ).filter(
                    PricingRule.price_adjustment_value.in_([Decimal("500.00")])
                ).delete(synchronize_session=False)
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
            if created_ids.get("payment_intent_id"):
                cleanup.query(PaymentIntent).filter(
                    PaymentIntent.id == created_ids["payment_intent_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("order_id"):
                cleanup.query(Order).filter(
                    Order.id == created_ids["order_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("address_id"):
                cleanup.query(CustomerAddress).filter(
                    CustomerAddress.id == created_ids["address_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("driver_id"):
                cleanup.query(DriverLocation).filter(
                    DriverLocation.driver_id == created_ids["driver_id"]
                ).delete(synchronize_session=False)
                if created_ids.get("driver_id") and created_ids.get("task_id") is None:
                    cleanup.query(Driver).filter(
                        Driver.id == created_ids["driver_id"]
                    ).delete(synchronize_session=False)
            cleanup.commit()
        cleanup.close()
        session.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Logistics flow verification failed: {exc}")
        raise SystemExit(1)
