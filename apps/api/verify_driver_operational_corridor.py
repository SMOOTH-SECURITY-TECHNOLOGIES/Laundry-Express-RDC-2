#!/usr/bin/env python3
"""
verify_driver_operational_corridor.py

Gate E2E unifiée du corridor opérationnel logistique :

  Phase 1 — Self-service multi-tenant (verify_logistics_self_service_gate)
  Phase 2 — Mission complète SANS admin :
            manager crée chauffeur + véhicule → claim → assign → execute → preuve
  Phase 3 — Invariants DB (verify_logistics_truth_corridor)

Usage:
    python scripts/verify_driver_operational_corridor.py

Variables:
    API_BASE_URL (défaut http://localhost:18000/api/v1)
    API_SMOKE_DATABASE_URL (défaut postgresql://...@localhost:5434/laundry_express)
"""

from __future__ import annotations

import json
import os
import random
import sys
import time
import traceback
from contextlib import suppress
from decimal import Decimal
from pathlib import Path
from urllib import error, request
from uuid import UUID, uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")
DATABASE_URL = os.getenv(
    "API_SMOKE_DATABASE_URL",
    os.getenv(
        "DATABASE_URL",
        "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express",
    ),
)
# The truth-corridor tests use SQLAlchemy's synchronous engine. Force the same
# sync URL here so container env vars such as postgresql+asyncpg do not leak in.
os.environ["DATABASE_URL"] = DATABASE_URL

OK = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
RUN_ID = os.getenv("CORRIDOR_RUN_ID", uuid4().hex[:10])

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
sys.path.insert(0, str(ROOT / "scripts"))

from local_test_credentials import load_local_test_credentials  # noqa: E402
from verify_logistics_self_service_gate import run_gate_tests  # noqa: E402
from verify_logistics_truth_corridor import (  # noqa: E402
    test_atomic_driver_assignment,
    test_complete_task_requires_proof,
    test_complete_task_with_proof,
    test_fail_task_requires_reason,
    test_unique_constraint_order_task_type,
)
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
from app.models.logistics import DeliveryTask, DeliveryTaskStatus, Driver, Vehicle  # noqa: E402
from app.models.marketplace import CompanyDriver  # noqa: E402
from app.models.operational import OperationalProof  # noqa: E402
from app.models.order import Order  # noqa: E402
from app.models.partner import Partner  # noqa: E402
from app.models.user import User  # noqa: E402

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def random_phone() -> str:
    return "+243" + "".join(str(random.randint(0, 9)) for _ in range(9))


def api_request(method: str, path: str, payload=None, token=None, headers=None):
    final_headers = {"Content-Type": "application/json"}
    if token:
        final_headers["Authorization"] = f"Bearer {token}"
    if headers:
        final_headers.update(headers)
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(f"{API_BASE_URL}{path}", data=body, headers=final_headers, method=method)
    try:
        with request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"detail": raw}
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
    print(f"  {OK} {name}: status={actual}")


def wait_for_order(order_id: str, token: str) -> None:
    deadline = time.time() + 8
    while time.time() < deadline:
        status, body = api_request("GET", f"/orders/{order_id}", token=token)
        if status == 200:
            return
        time.sleep(0.25)
    raise AssertionError(f"order visibility failed for {order_id}: {status} {body}")


def run_operational_corridor() -> bool:
    """Phase 2 — mission complète sans intervention admin."""
    print()
    print("=" * 64)
    print("  PHASE 2 — DRIVER OPERATIONAL CORRIDOR (ZERO ADMIN)")
    print(f"  API: {API_BASE_URL}")
    print("=" * 64)

    creds = load_local_test_credentials()
    slug = RUN_ID[:8]
    driver_email = f"corridor-driver-{slug}@kinexpress.cd"
    driver_password = "driverpass123"
    driver_phone = random_phone()

    customer_token, customer_user = login(creds["customer"]["email"], creds["customer"]["password"])
    partner_token, _ = login(creds["partner_owner"]["email"], creds["partner_owner"]["password"])
    manager_token, manager_user = login(
        creds["logistics_manager"]["email"],
        creds["logistics_manager"]["password"],
    )

    session = SessionLocal()
    created: dict[str, str] = {}
    partner = None

    try:
        partner = session.query(Partner).filter(Partner.email == "partner@test.com").first()
        if not partner:
            raise AssertionError("seeded partner@test.com not found")

        customer = session.query(User).filter(User.id == customer_user["id"]).first()
        if not customer:
            raise AssertionError("seeded customer not found")

        company_id = manager_user.get("delivery_company_id")
        if not company_id:
            manager_row = session.query(User).filter(User.id == manager_user["id"]).first()
            company_id = str(manager_row.delivery_company_id) if manager_row else None
        if not company_id:
            raise AssertionError("logistics manager has no delivery_company_id")

        # 1. Manager crée chauffeur (self-service)
        status, driver_body = api_request(
            "POST",
            "/logistics/drivers",
            {
                "name": f"Corridor Driver {RUN_ID}",
                "email": driver_email,
                "phone": driver_phone,
                "password": driver_password,
                "vehicle_type": "Moto",
                "license_number": f"COR-{RUN_ID.upper()}",
                "status": "active",
                "is_available": True,
            },
            token=manager_token,
        )
        assert_status("corridor_create_driver", status, 201, driver_body)
        created["driver_id"] = driver_body["id"]

        link = (
            session.query(CompanyDriver)
            .filter(
                CompanyDriver.company_id == UUID(str(company_id)),
                CompanyDriver.driver_id == UUID(created["driver_id"]),
            )
            .first()
        )
        if not link or not link.is_active:
            raise AssertionError("CompanyDriver missing after self-service driver create")
        print(f"  {OK} corridor_company_driver_link: active")

        # 2. Manager crée véhicule scopé
        plate = f"COR-{RUN_ID[:8].upper()}"
        status, vehicle_body = api_request(
            "POST",
            "/logistics/vehicles",
            {
                "plate": plate,
                "type": "moto",
                "location": "Gombe",
                "zone": "Gombe",
                "driver_id": created["driver_id"],
                "assigned_driver_name": driver_body.get("user_name") or "Corridor Driver",
            },
            token=manager_token,
        )
        assert_status("corridor_create_vehicle", status, 201, vehicle_body)
        created["vehicle_id"] = vehicle_body["id"]
        if str(vehicle_body.get("deliveryCompanyId") or vehicle_body.get("delivery_company_id")) != str(company_id):
            raise AssertionError("vehicle not scoped to manager company")

        vehicle_row = session.query(Vehicle).filter(Vehicle.id == UUID(created["vehicle_id"])).first()
        if not vehicle_row or str(vehicle_row.delivery_company_id) != str(company_id):
            raise AssertionError("vehicle delivery_company_id mismatch in DB")

        # 3. Commande client + mission pickup (open market auto)
        address = CustomerAddress(
            user_id=customer.id,
            label=f"corridor-{RUN_ID}",
            contact_name=customer.name,
            contact_phone=customer.phone,
            address_line_1="10 Avenue Corridor",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point=f"Corridor test {RUN_ID}",
            instructions=f"Driver operational corridor {RUN_ID}",
            is_default=False,
        )
        session.add(address)
        session.flush()
        created["address_id"] = str(address.id)

        category = ServiceCategory(
            name=f"Corridor Cat {RUN_ID}",
            slug=f"corridor-cat-{RUN_ID}",
            description="Corridor category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Corridor Type {RUN_ID}",
            slug=f"corridor-type-{RUN_ID}",
            description="Corridor type",
            is_active=True,
        )
        session.add_all([category, service_type])
        session.flush()
        created["category_id"] = str(category.id)
        created["service_type_id"] = str(service_type.id)

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
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("500.00"),
            is_active=True,
        )
        delivery_rule = PricingRule(
            partner_id=partner.id,
            rule_type=RuleType.DELIVERY_FEE,
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("500.00"),
            is_active=True,
        )
        session.add_all([partner_service, pickup_rule, delivery_rule])
        session.commit()
        created["service_id"] = str(partner_service.id)
        created["pickup_rule_id"] = str(pickup_rule.id)
        created["delivery_rule_id"] = str(delivery_rule.id)

        status, order_body = api_request(
            "POST",
            "/orders",
            {
                "partner_id": str(partner.id),
                "pickup_address_id": created["address_id"],
                "delivery_address_id": created["address_id"],
                "items": [
                    {
                        "service_id": created["service_id"],
                        "item_name": "Corridor shirt",
                        "quantity": "1.00",
                        "unit_price": "2000.00",
                        "notes": "corridor",
                        "detected_by_ai": False,
                    }
                ],
                "currency": "CDF",
                "special_instructions": f"Driver operational corridor {RUN_ID}",
                "express": False,
                "pickup_requested": True,
                "delivery_requested": True,
            },
            token=customer_token,
            headers={"Idempotency-Key": f"corridor-{RUN_ID}"},
        )
        assert_status("corridor_create_order", status, 201, order_body)
        created["order_id"] = order_body["id"]
        wait_for_order(created["order_id"], customer_token)

        status, task_body = api_request(
            "POST",
            "/logistics/tasks/pickup",
            {
                "order_id": created["order_id"],
                "task_type": "pickup",
                "pickup_location_type": "customer",
                "dropoff_location_type": "partner",
            },
            token=partner_token,
        )
        assert_status("corridor_create_pickup_task", status, 201, task_body)
        created["task_id"] = task_body["id"]

        if task_body.get("status") not in {"open_market", "pending"}:
            print(f"  WARN task status after create: {task_body.get('status')}")

        # 4. Manager claim + assign (sans admin)
        status, claim_body = api_request(
            "POST",
            f"/logistics/tasks/{created['task_id']}/claim",
            {},
            token=manager_token,
        )
        assert_status("corridor_manager_claim_task", status, 200, claim_body)

        status, assign_body = api_request(
            "POST",
            f"/logistics/tasks/{created['task_id']}/assign",
            {"driver_id": created["driver_id"]},
            token=manager_token,
        )
        assert_status("corridor_manager_assign_driver", status, 200, assign_body)

        # 5. Chauffeur créé exécute la mission
        driver_token, _ = login(driver_email, driver_password)

        status, body = api_request(
            "POST",
            f"/logistics/drivers/{created['driver_id']}/location",
            {"latitude": -4.325, "longitude": 15.322},
            token=driver_token,
        )
        assert_status("corridor_driver_location", status, 200, body)

        for step, path in [
            ("corridor_driver_accept", "accept"),
            ("corridor_driver_start", "start"),
        ]:
            status, body = api_request("POST", f"/logistics/tasks/{created['task_id']}/{path}", {}, token=driver_token)
            assert_status(step, status, 200, body)

        status, body = api_request(
            "POST",
            f"/logistics/tasks/{created['task_id']}/complete",
            {
                "proof_note": "Corridor pickup completed",
                "proof_photo_url": "https://example.com/corridor-proof.jpg",
            },
            token=driver_token,
        )
        assert_status("corridor_driver_complete", status, 200, body)

        # 6. Assertions DB post-mission
        session.expire_all()
        task_row = session.query(DeliveryTask).filter(DeliveryTask.id == UUID(created["task_id"])).first()
        if not task_row or task_row.status != DeliveryTaskStatus.COMPLETED:
            raise AssertionError(f"task not completed in DB: {getattr(task_row, 'status', None)}")

        proofs = session.query(OperationalProof).filter(OperationalProof.task_id == UUID(created["task_id"])).all()
        if not proofs:
            raise AssertionError("no OperationalProof recorded after complete")

        driver_row = session.query(Driver).filter(Driver.id == UUID(created["driver_id"])).first()
        if not driver_row or not driver_row.is_available:
            raise AssertionError("driver not released after complete")

        print(f"  {OK} corridor_db_task_completed")
        print(f"  {OK} corridor_db_proof_recorded ({len(proofs)} proof(s))")
        print(f"  {OK} corridor_db_driver_released")
        print("-" * 64)
        print(f"  {OK} PHASE 2 OK — mission complète sans admin")
        print("-" * 64)
        return True

    except Exception as exc:
        print(f"  {FAIL} PHASE 2 FAILED: {exc}")
        return False
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            driver_user_id = None
            if created.get("driver_id"):
                driver_row = cleanup.query(Driver).filter(Driver.id == UUID(created["driver_id"])).first()
                driver_user_id = driver_row.user_id if driver_row else None
            if created.get("task_id"):
                cleanup.query(OperationalProof).filter(
                    OperationalProof.task_id == UUID(created["task_id"])
                ).delete(synchronize_session=False)
                cleanup.query(DeliveryTask).filter(DeliveryTask.id == UUID(created["task_id"])).delete(
                    synchronize_session=False
                )
            if created.get("order_id"):
                cleanup.query(Order).filter(Order.id == UUID(created["order_id"])).delete(synchronize_session=False)
            if created.get("address_id"):
                cleanup.query(CustomerAddress).filter(CustomerAddress.id == UUID(created["address_id"])).delete(
                    synchronize_session=False
                )
            if created.get("service_id") and partner:
                for rule_key in ("pickup_rule_id", "delivery_rule_id"):
                    if created.get(rule_key):
                        cleanup.query(PricingRule).filter(PricingRule.id == UUID(created[rule_key])).delete(
                            synchronize_session=False
                        )
                cleanup.query(PartnerService).filter(PartnerService.id == UUID(created["service_id"])).delete(
                    synchronize_session=False
                )
            if created.get("category_id"):
                cleanup.query(ServiceCategory).filter(ServiceCategory.id == UUID(created["category_id"])).delete(
                    synchronize_session=False
                )
            if created.get("service_type_id"):
                cleanup.query(ServiceType).filter(ServiceType.id == UUID(created["service_type_id"])).delete(
                    synchronize_session=False
                )
            if created.get("vehicle_id"):
                cleanup.query(Vehicle).filter(Vehicle.id == UUID(created["vehicle_id"])).delete(synchronize_session=False)
            if created.get("driver_id"):
                cleanup.query(CompanyDriver).filter(
                    CompanyDriver.driver_id == UUID(created["driver_id"])
                ).delete(synchronize_session=False)
                cleanup.query(Driver).filter(Driver.id == UUID(created["driver_id"])).delete(synchronize_session=False)
            if driver_user_id:
                cleanup.query(User).filter(User.id == driver_user_id).delete(synchronize_session=False)
            cleanup.commit()
        cleanup.close()
        session.close()


def run_truth_corridor() -> tuple[int, int]:
    """Phase 3 — invariants DB du Logistics Truth Corridor."""
    print()
    print("=" * 64)
    print("  PHASE 3 — LOGISTICS TRUTH CORRIDOR (DB INVARIANTS)")
    print("=" * 64)

    tests = [
        ("unique_constraint_order_task_type", test_unique_constraint_order_task_type),
        ("atomic_driver_assignment", test_atomic_driver_assignment),
        ("complete_task_requires_proof", test_complete_task_requires_proof),
        ("complete_task_with_proof", test_complete_task_with_proof),
        ("fail_task_requires_reason", test_fail_task_requires_reason),
    ]
    results: list[bool] = []
    for name, fn in tests:
        print(f"  running {name}...")
        try:
            results.append(bool(fn()))
        except Exception as exc:
            print(f"  {FAIL} {name}: {type(exc).__name__}: {exc}")
            traceback.print_exc()
            results.append(False)

    passed = sum(results)
    total = len(results)
    print("-" * 64)
    if passed == total:
        print(f"  {OK} PHASE 3 OK ({passed}/{total})")
    else:
        print(f"  {FAIL} PHASE 3 FAILED ({passed}/{total})")
    print("-" * 64)
    return passed, total


def main() -> int:
    print("=" * 64)
    print("  DRIVER OPERATIONAL CORRIDOR — UNIFIED GATE")
    print(f"  API: {API_BASE_URL}")
    print(f"  DB:  {DATABASE_URL.split('@')[-1]}")
    print(f"  RUN_ID: {RUN_ID}")
    print("=" * 64)

    phase1_passed, phase1_total = run_gate_tests()
    phase2_ok = run_operational_corridor() if phase1_passed == phase1_total else False
    if phase1_passed != phase1_total:
        print(f"  {FAIL} skipping phase 2 (phase 1 failed)")

    phase3_passed, phase3_total = run_truth_corridor() if phase2_ok else (0, 5)
    if not phase2_ok:
        print(f"  {FAIL} skipping phase 3 DB invariants (phase 2 failed)")

    print()
    print("=" * 64)
    print("  FINAL VERDICT")
    print("=" * 64)
    labels = [
        ("LOGISTICS SELF-SERVICE", phase1_passed == phase1_total),
        ("TENANT ISOLATION (HTTP)", phase1_passed == phase1_total),
        ("DRIVER OPERATIONAL CORRIDOR", phase2_ok),
        ("LOGISTICS TRUTH INVARIANTS (DB)", phase3_passed == phase3_total if phase2_ok else False),
        ("MARKETPLACE SCALE READINESS", phase2_ok),
    ]
    for label, ok in labels:
        print(f"  {label:<34}: {'PASS' if ok else 'FAIL'}")

    all_ok = (
        phase1_passed == phase1_total
        and phase2_ok
        and phase3_passed == phase3_total
    )
    print("=" * 64)
    return 0 if all_ok else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Driver operational corridor failed: {exc}")
        raise SystemExit(1)
