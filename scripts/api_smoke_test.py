import json
import os
import random
import sys
from contextlib import suppress
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib import error, request
from uuid import uuid4

from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
API_BASE_URL = os.getenv("API_SMOKE_BASE_URL", "http://localhost:18000/api/v1")
DATABASE_URL = os.getenv(
    "API_SMOKE_DATABASE_URL",
    os.getenv(
        "DATABASE_URL_SYNC",
        "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express",
    ),
)
JWT_SECRET = os.getenv("API_SMOKE_SECRET_KEY", "development-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

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
from app.models.user import User, UserRole, UserStatus  # noqa: E402
from app.services.auth_service import AuthService  # noqa: E402


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@dataclass
class StepResult:
    name: str
    success: bool
    status: str
    detail: str


def api_request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
    token: str | None = None,
    headers: dict[str, str] | None = None,
):
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


def create_access_token(user_id, role: UserRole) -> str:
    return jwt.encode(
        {
            "sub": str(user_id),
            "role": role.value,
            "type": "access",
            "exp": 2524608000,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def fail(name: str, status: Any, detail: Any) -> StepResult:
    return StepResult(name=name, success=False, status=str(status), detail=str(detail))


def ok(name: str, status: Any, detail: Any) -> StepResult:
    return StepResult(name=name, success=True, status=str(status), detail=str(detail))


def main() -> int:
    slug = uuid4().hex[:8]
    auth_service = AuthService(None)
    session = SessionLocal()
    results: list[StepResult] = []

    created_ids: dict[str, Any] = {}
    tokens: dict[str, str] = {}
    current_step = "bootstrap"

    try:
        customer_email = f"smoke-{slug}@example.com"
        customer_phone = f"+24381{random.randint(1000000, 9999999)}"
        customer_password = "SmokePass123!"

        register_payload = {
            "email": customer_email,
            "phone": customer_phone,
            "name": f"Smoke Customer {slug}",
            "password": customer_password,
        }
        current_step = "register"
        status, body = api_request("POST", "/auth/register", register_payload)
        if status != 201:
            results.append(fail("register", status, body))
            raise RuntimeError("register failed")
        created_ids["customer_id"] = body["id"]
        results.append(ok("register", status, body["id"]))

        login_payload = {"email": customer_email, "password": customer_password}
        current_step = "login"
        status, body = api_request("POST", "/auth/login", login_payload)
        if status != 200 or "access_token" not in body:
            results.append(fail("login", status, body))
            raise RuntimeError("login failed")
        tokens["customer"] = body["access_token"]
        results.append(ok("login", status, "access token issued"))

        current_step = "me"
        status, body = api_request("GET", "/auth/me", token=tokens["customer"])
        if status != 200 or body.get("user", {}).get("email") != customer_email:
            results.append(fail("me", status, body))
            raise RuntimeError("me failed")
        results.append(ok("me", status, body["user"]["id"]))

        current_step = "bootstrap_data"
        customer_address = CustomerAddress(
            user_id=created_ids["customer_id"],
            label="home",
            contact_name=register_payload["name"],
            contact_phone=customer_phone,
            address_line_1="12 Avenue Test",
            city="Kinshasa",
            commune="Gombe",
            zone="Centre",
            reference_point="Porte bleue",
            instructions="Appeler avant d'arriver",
            is_default=True,
        )
        session.add(customer_address)
        session.flush()
        created_ids["address_id"] = customer_address.id

        partner = Partner(
            name=f"Partner {slug}",
            business_name=f"Laundry {slug}",
            tax_id=f"TAX-{slug}",
            partner_type=PartnerType.LAUNDRY.value,
            status=PartnerStatus.ACTIVE.value,
            email=f"partner-{slug}@example.com",
            phone=f"+24382{slug[:7]}",
            is_verified=True,
            is_featured=False,
            is_accepting_orders=True,
        )
        session.add(partner)
        session.flush()
        created_ids["partner_id"] = partner.id

        category = ServiceCategory(
            name=f"Chemise {slug}",
            slug=f"chemise-{slug}",
            description="Smoke category",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Lavage {slug}",
            slug=f"lavage-{slug}",
            description="Smoke type",
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
        session.flush()
        created_ids["service_id"] = partner_service.id

        admin_user = User(
            email=f"admin-{slug}@example.com",
            phone=f"+24383{random.randint(1000000, 9999999)}",
            password_hash=auth_service.hash_password("AdminPass123!"),
            name=f"Smoke Admin {slug}",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_email_verified=True,
            is_phone_verified=True,
            is_2fa_enabled=False,
        )
        session.add(admin_user)
        session.commit()
        created_ids["admin_id"] = admin_user.id
        tokens["admin"] = create_access_token(admin_user.id, UserRole.ADMIN)

        pricing_payload = {
            "partner_id": str(created_ids["partner_id"]),
            "items": [
                {
                    "service_id": str(created_ids["service_id"]),
                    "quantity": 2,
                    "item_name": "Chemise smoke",
                    "notes": None,
                }
            ],
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
            "promo_code": None,
        }
        current_step = "pricing"
        status, body = api_request("POST", "/pricing/estimate", pricing_payload, token=tokens["customer"])
        if status != 200 or "total" not in body:
            results.append(fail("pricing", status, body))
            raise RuntimeError("pricing failed")
        results.append(ok("pricing", status, body["total"]))

        idem_key = f"smoke-{slug}"
        order_payload = {
            "partner_id": str(created_ids["partner_id"]),
            "pickup_address_id": str(created_ids["address_id"]),
            "delivery_address_id": str(created_ids["address_id"]),
            "items": [
                {
                    "service_id": str(created_ids["service_id"]),
                    "item_name": "Chemise smoke",
                    "quantity": "2.00",
                    "unit_price": "1500.00",
                    "notes": "Smoke flow",
                    "detected_by_ai": False,
                }
            ],
            "currency": "CDF",
            "special_instructions": "Smoke test order",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
        }
        current_step = "create_order"
        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=tokens["customer"],
            headers={"Idempotency-Key": idem_key},
        )
        if status != 201:
            results.append(fail("create_order", status, body))
            raise RuntimeError("create_order failed")
        created_ids["order_id"] = body["id"]
        results.append(ok("create_order", status, body["id"]))

        payment_payload = {
            "order_id": created_ids["order_id"],
            "payment_method": "cash_on_delivery",
            "amount_expected": float(body["total_amount"]),
            "currency": "CDF",
            "provider_name": None,
            "expires_at": None,
            "payment_metadata": {"source": "api_smoke_test"},
        }
        current_step = "payment_intent"
        status, body = api_request("POST", "/payments/intents", payment_payload, token=tokens["customer"])
        if status != 201:
            results.append(fail("payment_intent", status, body))
            raise RuntimeError("payment_intent failed")
        created_ids["payment_intent_id"] = body["id"]
        results.append(ok("payment_intent", status, body["id"]))

        confirm_payload = {
            "confirmed_by_user_id": str(created_ids["admin_id"]),
            "amount_paid": payment_payload["amount_expected"],
            "notes": "Smoke cash confirmation",
        }
        current_step = "confirm_cash"
        status, body = api_request(
            "POST",
            f"/payments/intents/{created_ids['payment_intent_id']}/confirm-cash",
            confirm_payload,
            token=tokens["admin"],
        )
        if status != 200:
            results.append(fail("confirm_cash", status, body))
            raise RuntimeError("confirm_cash failed")
        results.append(ok("confirm_cash", status, body["status"]))

    except Exception as exc:
        if current_step not in {result.name for result in results}:
            results.append(fail(current_step, "EXC", f"{type(exc).__name__}: {exc}"))
    finally:
        cleanup = SessionLocal()
        with suppress(Exception):
            if created_ids.get("payment_intent_id"):
                cleanup.query(PaymentIntent).filter(PaymentIntent.id == created_ids["payment_intent_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("order_id"):
                cleanup.query(Order).filter(Order.id == created_ids["order_id"]).delete(synchronize_session=False)
            if created_ids.get("service_id"):
                cleanup.query(PartnerService).filter(PartnerService.id == created_ids["service_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("partner_id"):
                cleanup.query(PricingRule).filter(PricingRule.partner_id == created_ids["partner_id"]).delete(
                    synchronize_session=False
                )
                cleanup.query(Partner).filter(Partner.id == created_ids["partner_id"]).delete(synchronize_session=False)
            if created_ids.get("category_id"):
                cleanup.query(ServiceCategory).filter(ServiceCategory.id == created_ids["category_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("service_type_id"):
                cleanup.query(ServiceType).filter(ServiceType.id == created_ids["service_type_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("address_id"):
                cleanup.query(CustomerAddress).filter(CustomerAddress.id == created_ids["address_id"]).delete(
                    synchronize_session=False
                )
            if created_ids.get("admin_id"):
                cleanup.query(User).filter(User.id == created_ids["admin_id"]).delete(synchronize_session=False)
            if created_ids.get("customer_id"):
                cleanup.query(CustomerAddress).filter(CustomerAddress.user_id == created_ids["customer_id"]).delete(
                    synchronize_session=False
                )
                cleanup.query(User).filter(User.id == created_ids["customer_id"]).delete(synchronize_session=False)
            cleanup.commit()
        cleanup.close()
        session.close()

    print("\nAPI smoke test results\n")
    for result in results:
        mark = "PASS" if result.success else "FAIL"
        print(f"{mark:<4} {result.name:<14} status={result.status:<4} detail={result.detail}")

    all_steps = ["register", "login", "me", "pricing", "create_order", "payment_intent", "confirm_cash"]
    passed_steps = {result.name for result in results if result.success}
    total_success = len(passed_steps)
    total = len(all_steps)
    print(f"\nSummary: {total_success}/{total} steps passed")

    missing = [step for step in all_steps if step not in passed_steps]
    if missing:
        print("Missing or failed steps:", ", ".join(missing))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
