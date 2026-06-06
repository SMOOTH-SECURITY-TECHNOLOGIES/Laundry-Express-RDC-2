#!/usr/bin/env python3
"""
Verifie un flow marketplace backoffice minimal contre l'API reelle.
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
from app.models.logistics import DeliveryTask, Driver  # noqa: E402
from app.models.marketplace import CompanyDriver, CompanyServiceZone, DeliveryCompany  # noqa: E402
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
            print("PASS marketplace_flow_order_visible: status=200")
            return
        time.sleep(0.25)
    raise AssertionError(f"order visibility failed for {order_id}: {status} {body}")


def wait_for_driver_task(task_id: str, token: str) -> None:
    deadline = time.time() + 5
    while time.time() < deadline:
        status, body = api_request("GET", "/logistics/tasks", token=token)
        if status == 200 and any(item["id"] == task_id for item in body["tasks"]):
            print("PASS marketplace_flow_driver_tasks_contains_task: true")
            return
        time.sleep(0.25)
    raise AssertionError("driver task list does not contain marketplace-assigned task")


def main() -> int:
    print(f"Verifying marketplace flow against {API_BASE_URL}")

    creds = load_local_test_credentials()
    customer_token, customer_user = login(creds["customer"]["email"], creds["customer"]["password"])
    admin_token, _ = login(creds["super_admin"]["email"], creds["super_admin"]["password"])
    partner_owner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    logistics_manager_token, _ = login(
        creds["logistics_manager"]["email"],
        creds["logistics_manager"]["password"],
    )
    driver_token, driver_user = login(creds["driver"]["email"], creds["driver"]["password"])

    session = SessionLocal()
    created_ids = {}
    driver_availability = {}
    partner = None

    try:
        partner = session.query(Partner).filter(Partner.email == "partner@test.com").first()
        if not partner:
            raise AssertionError("seeded partner@test.com not found")

        customer = session.query(User).filter(User.id == customer_user["id"]).first()
        if not customer:
            raise AssertionError("seeded customer not found")

        driver = session.query(Driver).filter(Driver.user_id == driver_user["id"]).first()
        if not driver:
            driver_payload = {
                "user_id": driver_user["id"],
                "vehicle_type": "Moto",
                "license_number": f"MKP-{uuid4().hex[:8]}",
                "status": "active",
                "is_available": True,
            }
            status, body = api_request("POST", "/logistics/drivers", driver_payload, token=admin_token)
            assert_status("marketplace_flow_create_driver", status, 201, body)
            driver = session.query(Driver).filter(Driver.id == body["id"]).first()
            created_ids["driver_id"] = body["id"]
        else:
            created_ids["driver_id"] = str(driver.id)
            print("PASS marketplace_flow_reuse_driver: existing")

        # Neutraliser temporairement les chauffeurs internes pour forcer l'ouverture au marketplace.
        for existing_driver in session.query(Driver).all():
            driver_availability[str(existing_driver.id)] = existing_driver.is_available
            existing_driver.is_available = False
        session.commit()

        slug = uuid4().hex[:8]
        company_payload = {
            "name": f"Marketplace Co {slug}",
            "slug": f"marketplace-co-{slug}",
            "phone": "+243899000001",
            "email": f"marketplace-{slug}@example.com",
            "status": "active",
            "is_active": True,
            "supports_pickup": True,
            "supports_delivery": True,
        }
        status, body = api_request("POST", "/marketplace/companies", company_payload, token=admin_token)
        assert_status("marketplace_flow_create_company", status, 201, body)
        created_ids["company_id"] = body["id"]

        zone_payload = {"city": "Kinshasa", "commune": "Gombe", "zone": "Centre", "is_active": True}
        status, body = api_request(
            "POST",
            f"/marketplace/companies/{created_ids['company_id']}/zones",
            zone_payload,
            token=admin_token,
        )
        assert_status("marketplace_flow_add_company_zone", status, 201, body)
        created_ids["zone_id"] = body["id"]

        add_driver_payload = {"driver_id": created_ids["driver_id"], "is_active": True}
        status, body = api_request(
            "POST",
            f"/marketplace/companies/{created_ids['company_id']}/drivers",
            add_driver_payload,
            token=admin_token,
        )
        assert_status("marketplace_flow_add_company_driver", status, 201, body)
        created_ids["company_driver_id"] = body["id"]

        address = CustomerAddress(
            user_id=customer.id,
            label=f"marketplace-{uuid4().hex[:6]}",
            contact_name=customer.name,
            contact_phone=customer.phone,
            address_line_1="44 Avenue Marketplace",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point="Reference marketplace",
            instructions="Flow marketplace",
            is_default=False,
        )
        session.add(address)
        session.flush()
        created_ids["address_id"] = address.id

        category = ServiceCategory(
            name=f"Marketplace Category {slug}",
            slug=f"marketplace-category-{slug}",
            description="Marketplace flow category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Marketplace Type {slug}",
            slug=f"marketplace-type-{slug}",
            description="Marketplace flow type",
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
            base_price=Decimal("3500.00"),
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
                    "item_name": "Marketplace shirt",
                    "quantity": "1.00",
                    "unit_price": "3500.00",
                    "notes": "Marketplace flow",
                    "detected_by_ai": False,
                }
            ],
            "currency": "CDF",
            "special_instructions": "Marketplace flow test",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
        }
        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=customer_token,
            headers={"Idempotency-Key": f"marketplace-flow-{slug}"},
        )
        assert_status("marketplace_flow_create_order", status, 201, body)
        created_ids["order_id"] = body["id"]
        wait_for_order(created_ids["order_id"], customer_token)

        pickup_task_payload = {
            "order_id": created_ids["order_id"],
            "task_type": "pickup",
            "pickup_location_type": "customer",
            "dropoff_location_type": "partner",
            "scheduled_at": None,
        }
        status, body = api_request("POST", "/logistics/tasks/pickup", pickup_task_payload, token=partner_owner_token)
        assert_status("marketplace_flow_create_pickup_task", status, 201, body)
        created_ids["task_id"] = body["id"]

        status, body = api_request("GET", "/marketplace/tasks", token=customer_token)
        assert_status("marketplace_flow_customer_forbidden_market_tasks", status, 403, body)

        dispatch_payload = {"task_id": created_ids["task_id"]}
        status, body = api_request(
            "POST",
            f"/marketplace/tasks/{created_ids['task_id']}/dispatch",
            dispatch_payload,
            token=admin_token,
        )
        assert_status("marketplace_flow_admin_dispatch_to_market", status, 200, body)

        status, body = api_request("GET", "/marketplace/tasks", token=logistics_manager_token)
        assert_status("marketplace_flow_marketplace_operator_list_tasks", status, 200, body)
        if not any(item["id"] == created_ids["task_id"] for item in body["tasks"]):
            raise AssertionError("marketplace task list does not contain dispatched task")
        print("PASS marketplace_flow_task_visible_in_market_list: true")

        claim_payload = {"company_id": created_ids["company_id"]}
        status, body = api_request(
            "POST",
            f"/marketplace/tasks/{created_ids['task_id']}/claim",
            claim_payload,
            token=logistics_manager_token,
        )
        assert_status("marketplace_flow_operator_claim_task", status, 200, body)

        status, body = api_request(
            "GET",
            f"/marketplace/tasks/{created_ids['task_id']}/claimed",
            token=logistics_manager_token,
        )
        assert_status("marketplace_flow_operator_get_claimed_task", status, 200, body)

        assign_payload = {"company_id": created_ids["company_id"], "driver_id": created_ids["driver_id"]}
        status, body = api_request(
            "POST",
            f"/marketplace/tasks/{created_ids['task_id']}/assign-company",
            assign_payload,
            token=admin_token,
        )
        assert_status("marketplace_flow_admin_assign_company_driver", status, 200, body)

        status, body = api_request("GET", "/logistics/tasks", token=driver_token)
        assert_status("marketplace_flow_driver_list_tasks", status, 200, body)
        wait_for_driver_task(created_ids["task_id"], driver_token)

        print("Verified 11/11 marketplace checks")
        return 0
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            for driver_id, was_available in driver_availability.items():
                driver_row = cleanup.query(Driver).filter(Driver.id == UUID(str(driver_id))).first()
                if driver_row:
                    driver_row.is_available = was_available
            if created_ids.get("task_id"):
                cleanup.query(DeliveryTask).filter(
                    DeliveryTask.id == created_ids["task_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("order_id"):
                cleanup.query(Order).filter(
                    Order.id == created_ids["order_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("payment_intent_id"):
                cleanup.query(PaymentIntent).filter(
                    PaymentIntent.id == created_ids["payment_intent_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("company_driver_id"):
                cleanup.query(CompanyDriver).filter(
                    CompanyDriver.id == created_ids["company_driver_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("zone_id"):
                cleanup.query(CompanyServiceZone).filter(
                    CompanyServiceZone.id == created_ids["zone_id"]
                ).delete(synchronize_session=False)
            if created_ids.get("company_id"):
                cleanup.query(DeliveryCompany).filter(
                    DeliveryCompany.id == created_ids["company_id"]
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
        print(f"Marketplace flow verification failed: {exc}")
        raise SystemExit(1)
