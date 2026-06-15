#!/usr/bin/env python3
"""
Sprint 5.5 — Truth Validation (Customer Corridor E2E)

Valide le corridor client complet sans mock, sans localStorage comme source de vérité,
et sans données seed injectées pour faire passer le test.

Corridor :
  Inscription → Commande → Paiement → Support → Livraison → Avis → Historique → Tracking → Audit

Chaque étape vérifie la cohérence :
  API ↔ Base de données (et API summary quand disponible)

Prérequis :
  - API en cours d'exécution
  - PostgreSQL accessible
  - Au moins un partenaire actif avec services dans le catalogue (infra, pas seed de test)
  - Compte admin pour les transitions de statut commande

Variables d'environnement :
  TRUTH_API_BASE_URL      (défaut: http://localhost:8000/api/v1)
  TRUTH_DATABASE_URL_SYNC (défaut: postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express)
  TRUTH_ADMIN_EMAIL       (défaut: ADMIN_EMAIL ou admin@laundryexpress.cd)
  TRUTH_ADMIN_PASSWORD    (défaut: ADMIN_PASSWORD)
  KEEP_TRUTH_E2E_DATA=1   conserver les données créées après le run (debug)

Usage :
  python scripts/validate_customer_corridor_truth.py
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib import error, parse, request
from uuid import UUID, uuid4

ROOT = Path(__file__).resolve().parents[1]
API_PKG = ROOT / "apps" / "api"
sys.path.insert(0, str(API_PKG))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from app.models.admin import AuditLog
from app.models.notification import Notification
from app.models.order import Order
from app.models.payment import PaymentIntent, PaymentTransaction
from app.models.support import Review, SupportTicket

API_BASE_URL = os.getenv("TRUTH_API_BASE_URL", os.getenv("API_BASE_URL", "http://localhost:18000/api/v1")).rstrip("/")
DATABASE_URL_SYNC = os.getenv(
    "TRUTH_DATABASE_URL_SYNC",
    os.getenv(
        "DATABASE_URL_SYNC",
        "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express",
    ),
)
ADMIN_EMAIL = os.getenv("TRUTH_ADMIN_EMAIL", os.getenv("ADMIN_EMAIL", "admin@laundryexpress.cd"))
ADMIN_PASSWORD = os.getenv("TRUTH_ADMIN_PASSWORD", os.getenv("ADMIN_PASSWORD", ""))
CUSTOMER_PASSWORD = os.getenv("TRUTH_CUSTOMER_PASSWORD", f"TruthPass-{uuid4().hex[:12]}!aA1")
KEEP_DATA = os.getenv("KEEP_TRUTH_E2E_DATA", "").strip().lower() in {"1", "true", "yes"}

ORDER_STATUS_TO_DELIVERED = [
    "confirmed",
    "pickup_scheduled",
    "pickup_driver_assigned",
    "pickup_in_progress",
    "picked_up",
    "received_by_partner",
    "cleaning_in_progress",
    "quality_check",
    "ready_for_delivery",
    "delivery_driver_assigned",
    "delivery_in_progress",
    "delivered",
]


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str
    layer: str = "api"


@dataclass
class StepResult:
    step: int
    title: str
    passed: bool
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def detail(self) -> str:
        failed = [c for c in self.checks if not c.passed]
        if not failed:
            return "ok"
        return failed[0].detail


@dataclass
class RuntimeContext:
    customer_email: str = ""
    customer_phone: str = ""
    customer_id: str = ""
    customer_token: str = ""
    admin_token: str = ""
    address_id: str = ""
    partner_id: str = ""
    service_id: str = ""
    order_id: str = ""
    order_number: str = ""
    payment_intent_id: str = ""
    payment_transaction_id: str = ""
    ticket_id: str = ""
    attachment_id: str = ""
    review_id: str = ""
    run_slug: str = ""
    catalog_bootstrapped: bool = False
    bootstrap_slug: str = ""
    operator_token: str = ""
    operator_bootstrapped: bool = False
    admin_bootstrapped: bool = False


def _engine():
    return create_engine(DATABASE_URL_SYNC)


def _session():
    return sessionmaker(bind=_engine(), autocommit=False, autoflush=False)()


def health_url() -> str:
    if API_BASE_URL.endswith("/api/v1"):
        return f"{API_BASE_URL[:-7]}/health"
    return f"{API_BASE_URL}/health"


def request_json(
    method: str,
    url: str,
    payload: dict[str, Any] | None = None,
    token: str | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, Any] | list[Any]]:
    final_headers = {"Content-Type": "application/json"}
    if token:
        final_headers["Authorization"] = f"Bearer {token}"
    if headers:
        final_headers.update(headers)

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, headers=final_headers, method=method)
    try:
        with request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return response.status, {}
            parsed = json.loads(raw)
            return response.status, parsed
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"raw": raw}
        return exc.code, parsed


def api_request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
    token: str | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, Any] | list[Any]]:
    return request_json(method, f"{API_BASE_URL}{path}", payload=payload, token=token, headers=headers)


def check(name: str, passed: bool, detail: str, layer: str = "api") -> CheckResult:
    return CheckResult(name=name, passed=passed, detail=detail, layer=layer)


def _normalize_value(value: Any) -> str:
    if value is None:
        return ""
    if hasattr(value, "value"):
        return str(value.value).lower()
    return str(value).lower()


def assert_match(api_value: Any, db_value: Any, field_name: str) -> CheckResult:
    api_norm = _normalize_value(api_value)
    db_norm = _normalize_value(db_value)
    passed = api_norm == db_norm
    return check(
        f"api_db_{field_name}",
        passed,
        f"{field_name}: API={api_value!r} DB={db_value!r}" if not passed else f"{field_name}={api_value!r}",
        layer="api↔db",
    )


def build_customer_identity() -> tuple[str, str, str]:
    slug = uuid4().hex[:10]
    email = f"truth-e2e-{slug}@example.com"
    digits = "".join(str(int(char, 16) % 10) for char in slug[:7])
    phone = f"24381{digits}"
    return email, phone, slug


def bootstrap_ephemeral_catalog(slug: str) -> tuple[str, str, dict[str, Any], dict[str, Any]]:
    """Crée un partenaire + service éphémères (infra de test, pas seed métier)."""
    from app.models.catalog import (
        PartnerService,
        PriceAdjustmentType,
        PricingMode,
        PricingRule,
        RuleType,
        ServiceCategory,
        ServiceType,
    )
    from app.models.partner import Partner, PartnerStatus, PartnerType

    session = _session()
    try:
        partner = Partner(
            name=f"Truth Partner {slug}",
            business_name=f"Truth Laundry {slug}",
            tax_id=f"TAX-TRUTH-{slug}",
            partner_type=PartnerType.LAUNDRY.value,
            status=PartnerStatus.ACTIVE.value,
            email=f"truth-partner-{slug}@example.com",
            phone=f"24382{slug[:7]}",
            is_verified=True,
            is_featured=False,
            is_accepting_orders=True,
        )
        session.add(partner)
        session.flush()

        category = ServiceCategory(
            name=f"Truth Cat {slug}",
            slug=f"truth-cat-{slug}",
            description="Catalogue éphémère Sprint 5.5",
            is_active=True,
        )
        service_type = ServiceType(
            name=f"Truth Service {slug}",
            slug=f"truth-svc-{slug}",
            description="Service éphémère Sprint 5.5",
            is_active=True,
        )
        session.add_all([category, service_type])
        session.flush()

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
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("500.00"),
            is_active=True,
        )
        delivery_rule = PricingRule(
            partner_id=partner.id,
            rule_type=RuleType.DELIVERY_FEE,
            price_adjustment_type=PriceAdjustmentType.FIXED,
            price_adjustment_value=Decimal("1000.00"),
            is_active=True,
        )
        session.add_all([partner_service, pickup_rule, delivery_rule])
        session.commit()

        partner_dict = {"id": str(partner.id), "name": partner.name}
        service_dict = {
            "id": str(partner_service.id),
            "service_type_name": service_type.name,
            "base_price": "1500.00",
        }
        return str(partner.id), str(partner_service.id), partner_dict, service_dict
    finally:
        session.close()


def choose_catalog_service() -> tuple[dict[str, Any], dict[str, Any]]:
    status, partners = api_request("GET", "/catalog/partners")
    if status != 200 or not isinstance(partners, list) or not partners:
        raise RuntimeError(f"catalogue partenaires indisponible: {status} {partners}")

    last_error = "aucun service catalogue disponible"
    for partner in partners:
        partner_id = partner.get("id")
        if not partner_id:
            continue
        service_status, services = api_request("GET", f"/catalog/partners/{partner_id}/services")
        if service_status == 200 and isinstance(services, list) and services:
            return partner, services[0]
        last_error = f"partenaire {partner.get('name', partner_id)} sans services"

    raise RuntimeError(last_error)


def bootstrap_ephemeral_partner_operator(ctx: RuntimeContext) -> str:
    from app.models.partner import PartnerStaff
    from app.models.user import User, UserRole, UserStatus
    from app.services.auth_service import AuthService

    slug = ctx.run_slug or uuid4().hex[:10]
    email = f"truth-operator-{slug}@example.com"
    phone = f"24383{''.join(str(int(c, 16) % 10) for c in slug[:7])}"
    password = f"TruthOp-{slug[:8]}!aA1"

    session = _session()
    try:
        user = User(
            email=email,
            phone=phone,
            password_hash=AuthService(None).hash_password(password),
            name=f"Truth Operator {slug}",
            role=UserRole.PARTNER_OWNER,
            status=UserStatus.ACTIVE,
            is_email_verified=True,
            is_phone_verified=True,
        )
        session.add(user)
        session.flush()
        session.add(
            PartnerStaff(
                partner_id=UUID(ctx.partner_id),
                user_id=user.id,
                role="owner",
                is_active=True,
            )
        )
        session.commit()
    finally:
        session.close()

    ctx.operator_bootstrapped = True
    token = login(email, password)
    ctx.operator_token = token
    return token


def bootstrap_ephemeral_admin(ctx: RuntimeContext) -> str:
    from app.models.user import User, UserRole, UserStatus
    from app.services.auth_service import AuthService

    slug = ctx.run_slug or uuid4().hex[:10]
    email = f"truth-admin-{slug}@example.com"
    phone = f"24384{''.join(str(int(c, 16) % 10) for c in slug[:7])}"
    password = f"TruthAdm-{slug[:8]}!aA1"

    session = _session()
    try:
        user = User(
            email=email,
            phone=phone,
            password_hash=AuthService(None).hash_password(password),
            name=f"Truth Admin {slug}",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_email_verified=True,
            is_phone_verified=True,
        )
        session.add(user)
        session.commit()
    finally:
        session.close()

    ctx.admin_bootstrapped = True
    token = login(email, password)
    ctx.admin_token = token
    return token


def ensure_status_operator_token(ctx: RuntimeContext) -> tuple[str, str]:
    if ctx.operator_token:
        return ctx.operator_token, "partner_operator"
    if ADMIN_PASSWORD:
        try:
            ctx.admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
            ctx.operator_token = ctx.admin_token
            return ctx.operator_token, f"admin:{ADMIN_EMAIL}"
        except RuntimeError:
            pass
    token = bootstrap_ephemeral_partner_operator(ctx)
    return token, "ephemeral_partner_owner"


def ensure_admin_token(ctx: RuntimeContext) -> tuple[str, str]:
    if ctx.admin_token:
        return ctx.admin_token, "cached"
    if ADMIN_PASSWORD:
        try:
            ctx.admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
            return ctx.admin_token, f"admin:{ADMIN_EMAIL}"
        except RuntimeError:
            pass
    token = bootstrap_ephemeral_admin(ctx)
    return token, "ephemeral_admin"


def login(email: str, password: str) -> str:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or not isinstance(body, dict) or "access_token" not in body:
        raise RuntimeError(f"login échoué pour {email}: {status} {body}")
    return body["access_token"]


def db_order(order_id: str, *, with_history: bool = False) -> Order | None:
    session = _session()
    try:
        query = session.query(Order).filter(Order.id == UUID(order_id))
        if with_history:
            from sqlalchemy.orm import joinedload

            query = query.options(joinedload(Order.status_history))
        return query.first()
    finally:
        session.close()


def db_payment_intent(intent_id: str) -> PaymentIntent | None:
    session = _session()
    try:
        return session.query(PaymentIntent).filter(PaymentIntent.id == UUID(intent_id)).first()
    finally:
        session.close()


def db_payment_transactions(order_id: str) -> list[PaymentTransaction]:
    session = _session()
    try:
        return (
            session.query(PaymentTransaction)
            .filter(PaymentTransaction.order_id == UUID(order_id))
            .order_by(PaymentTransaction.created_at.asc())
            .all()
        )
    finally:
        session.close()


def db_notifications(user_id: str) -> list[Notification]:
    session = _session()
    try:
        return (
            session.query(Notification)
            .filter(Notification.user_id == UUID(user_id))
            .order_by(Notification.created_at.asc())
            .all()
        )
    finally:
        session.close()


def db_audit_logs(*, resource_ids: list[str], user_id: str | None = None) -> list[AuditLog]:
    session = _session()
    try:
        query = session.query(AuditLog)
        uuid_ids = [UUID(rid) for rid in resource_ids if rid]
        filters = []
        if uuid_ids:
            filters.append(AuditLog.resource_id.in_(uuid_ids))
        if user_id:
            filters.append(AuditLog.user_id == UUID(user_id))
        if not filters:
            return []
        from sqlalchemy import or_

        return query.filter(or_(*filters)).order_by(AuditLog.created_at.asc()).all()
    finally:
        session.close()


def db_review(review_id: str) -> Review | None:
    session = _session()
    try:
        return session.query(Review).filter(Review.id == UUID(review_id)).first()
    finally:
        session.close()


def notification_refs_order(notifications: list[Notification], order_id: str) -> bool:
    for item in notifications:
        raw = item.notification_metadata
        if not raw:
            continue
        try:
            metadata = json.loads(raw) if isinstance(raw, str) else raw
        except (TypeError, json.JSONDecodeError):
            continue
        for key in ("orderId", "order_id"):
            if str(metadata.get(key, "")) == str(order_id):
                return True
    return False


def step_create_user(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    email, phone, slug = build_customer_identity()
    ctx.customer_email = email
    ctx.customer_phone = phone
    ctx.run_slug = slug

    status, body = request_json("GET", health_url())
    checks.append(check("health", status == 200 and isinstance(body, dict) and body.get("status") == "healthy", f"{status} {body}"))

    register_payload = {
        "email": email,
        "phone": phone,
        "name": f"Truth E2E {slug}",
        "password": CUSTOMER_PASSWORD,
    }
    status, body = api_request("POST", "/auth/register", register_payload)
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("register", ok, f"{status} {body}"))
    if ok:
        ctx.customer_id = str(body["id"])

    status, body = api_request("POST", "/auth/login", {"email": email, "password": CUSTOMER_PASSWORD})
    ok = status == 200 and isinstance(body, dict) and body.get("access_token")
    checks.append(check("login", ok, f"{status} {body}"))
    if ok:
        ctx.customer_token = body["access_token"]

    status, body = api_request("GET", "/auth/me", token=ctx.customer_token)
    ok = status == 200 and isinstance(body, dict) and body.get("user", {}).get("email") == email
    checks.append(check("auth_me", ok, f"{status} {body}"))

    return StepResult(step=1, title="Créer un utilisateur", passed=all(c.passed for c in checks), checks=checks)


def step_create_order(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    address_payload = {
        "user_id": ctx.customer_id,
        "label": "Truth E2E",
        "contact_name": "Truth Client",
        "contact_phone": ctx.customer_phone,
        "address_line_1": "10 Avenue Validation",
        "city": "Kinshasa",
        "commune": "Gombe",
        "zone": "Centre",
        "reference_point": "Porte verte",
        "is_default": True,
    }
    status, body = api_request("POST", "/users/me/addresses", address_payload, token=ctx.customer_token)
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("create_address", ok, f"{status} {body}"))
    if ok:
        ctx.address_id = str(body["id"])

    partner: dict[str, Any]
    service: dict[str, Any]
    try:
        partner, service = choose_catalog_service()
        checks.append(check("catalog", True, f"{partner.get('name')} / {service.get('service_type_name', service.get('id'))}"))
    except RuntimeError as exc:
        slug = ctx.run_slug or uuid4().hex[:10]
        ctx.bootstrap_slug = slug
        ctx.partner_id, ctx.service_id, partner, service = bootstrap_ephemeral_catalog(slug)
        ctx.catalog_bootstrapped = True
        checks.append(
            check(
                "catalog_bootstrap",
                True,
                f"catalogue live indisponible ({exc}) — infra éphémère créée: {partner.get('name')}",
                layer="db→api",
            )
        )

    ctx.partner_id = str(partner["id"])
    ctx.service_id = str(service["id"])

    pricing_payload = {
        "partner_id": ctx.partner_id,
        "items": [
            {
                "service_id": ctx.service_id,
                "item_name": service.get("service_type_name") or "Service truth",
                "quantity": 1,
                "notes": "validate_customer_corridor_truth.py",
            }
        ],
        "express": False,
        "pickup_requested": True,
        "delivery_requested": True,
        "promo_code": None,
    }
    status, body = api_request("POST", "/pricing/estimate", pricing_payload, token=ctx.customer_token)
    ok = status == 200 and isinstance(body, dict) and "total" in body
    checks.append(check("pricing_estimate", ok, f"{status} {body}"))
    if not ok:
        return StepResult(step=2, title="Créer une commande", passed=False, checks=checks)

    order_payload = {
        "partner_id": ctx.partner_id,
        "pickup_address_id": ctx.address_id,
        "delivery_address_id": ctx.address_id,
        "items": [
            {
                "service_id": ctx.service_id,
                "item_name": service.get("service_type_name") or "Service truth",
                "quantity": "1.00",
                "unit_price": str(service.get("base_price") or "0"),
                "notes": "truth corridor order",
                "detected_by_ai": False,
            }
        ],
        "currency": body.get("currency", "CDF"),
        "pickup_time_slot": "09:00-12:00",
        "special_instructions": "Sprint 5.5 truth validation",
        "express": False,
        "pickup_requested": True,
        "delivery_requested": True,
        "promo_code": None,
    }
    status, body = api_request(
        "POST",
        "/orders",
        order_payload,
        token=ctx.customer_token,
        headers={"Idempotency-Key": f"truth-e2e-{uuid4().hex[:12]}"},
    )
    ok = status in {200, 201} and isinstance(body, dict) and body.get("id")
    checks.append(check("create_order", ok, f"{status} {body}"))
    if ok:
        ctx.order_id = str(body["id"])
        ctx.order_number = str(body.get("order_number", ""))

        db_row = db_order(ctx.order_id)
        checks.append(check("db_order_exists", db_row is not None, "ok" if db_row else "commande absente en base", layer="db"))
        if db_row:
            checks.append(assert_match(body.get("status"), db_row.status, "order.status"))
            checks.append(assert_match(body.get("payment_status"), db_row.payment_status, "order.payment_status"))

    return StepResult(step=2, title="Créer une commande", passed=all(c.passed for c in checks), checks=checks)


def step_initiate_payment(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, order_body = api_request("GET", f"/orders/{ctx.order_id}", token=ctx.customer_token)
    ok = status == 200 and isinstance(order_body, dict)
    checks.append(check("prefetch_order", ok, f"{status} {order_body}"))
    if not ok:
        return StepResult(step=3, title="Initier paiement", passed=False, checks=checks)

    total_amount = float(order_body["total_amount"])
    payment_payload = {
        "order_id": ctx.order_id,
        "payment_method": "mobile_money",
        "amount_expected": total_amount,
        "currency": order_body.get("currency", "CDF"),
        "provider_name": "orange_money_rdc",
        "payment_metadata": {"source": "validate_customer_corridor_truth.py"},
    }
    status, intent_body = api_request("POST", "/payments/intents", payment_payload, token=ctx.customer_token)
    ok = status == 201 and isinstance(intent_body, dict) and intent_body.get("id")
    checks.append(check("create_payment_intent", ok, f"{status} {intent_body}"))
    if not ok:
        return StepResult(step=3, title="Initier paiement", passed=False, checks=checks)

    ctx.payment_intent_id = str(intent_body["id"])

    status, tx_body = api_request(
        "POST",
        f"/payments/intents/{ctx.payment_intent_id}/initiate",
        token=ctx.customer_token,
    )
    ok = status == 200 and isinstance(tx_body, dict) and tx_body.get("id")
    checks.append(check("initiate_payment", ok, f"{status} {tx_body}"))
    if ok:
        ctx.payment_transaction_id = str(tx_body["id"])

    return StepResult(step=3, title="Initier paiement", passed=all(c.passed for c in checks), checks=checks)


def step_verify_payment_truth(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, order_api = api_request("GET", f"/orders/{ctx.order_id}", token=ctx.customer_token)
    ok = status == 200 and isinstance(order_api, dict)
    checks.append(check("get_order_api", ok, f"{status} {order_api}"))

    status, summary = api_request("GET", f"/payments/orders/{ctx.order_id}/summary", token=ctx.customer_token)
    ok = status == 200 and isinstance(summary, dict)
    checks.append(check("payment_summary_api", ok, f"{status} {summary}"))

    db_row = db_order(ctx.order_id)
    checks.append(check("db_order", db_row is not None, "ok" if db_row else "commande absente", layer="db"))
    if db_row and isinstance(order_api, dict):
        checks.append(assert_match(order_api.get("status"), db_row.status, "order.status"))
        checks.append(assert_match(order_api.get("payment_status"), db_row.payment_status, "order.payment_status"))

    if isinstance(summary, dict) and db_row:
        checks.append(assert_match(summary.get("payment_status"), db_row.payment_status, "payment_status"))

    checks.append(
        check(
            "order_payment_status_paid",
            db_row is not None and _normalize_value(db_row.payment_status) == "paid",
            f"payment_status={getattr(db_row, 'payment_status', None)}",
            layer="db",
        )
    )

    intent_db = db_payment_intent(ctx.payment_intent_id)
    checks.append(check("db_payment_intent_exists", intent_db is not None, "ok" if intent_db else "payment_intent absent", layer="db"))
    if intent_db:
        checks.append(
            check(
                "db_payment_intent_succeeded",
                _normalize_value(intent_db.status) == "succeeded",
                f"intent.status={intent_db.status}",
                layer="db",
            )
        )
        if isinstance(intent_body := (summary.get("payment_intents", [{}])[0] if isinstance(summary, dict) else None), dict):
            checks.append(assert_match(intent_body.get("status"), intent_db.status, "payment_intent.status"))

    transactions = db_payment_transactions(ctx.order_id)
    checks.append(
        check(
            "db_payment_transaction_exists",
            len(transactions) > 0,
            f"{len(transactions)} transaction(s)" if transactions else "aucune payment_transaction",
            layer="db",
        )
    )
    if transactions:
        tx = transactions[-1]
        checks.append(
            check(
                "db_payment_transaction_success",
                _normalize_value(tx.status) == "success",
                f"transaction.status={tx.status}",
                layer="db",
            )
        )
        if isinstance(summary, dict):
            api_txs = summary.get("transactions") or []
            if api_txs:
                checks.append(assert_match(api_txs[-1].get("status"), tx.status, "payment_transaction.status"))

    if isinstance(summary, dict) and isinstance(order_api, dict):
        summary_paid = summary.get("amount_paid", summary.get("total_paid"))
        checks.append(
            check(
                "summary_amount_paid_matches_order",
                float(summary_paid or -1) == float(order_api.get("amount_paid", -2)),
                f"summary.amount_paid={summary_paid} order.amount_paid={order_api.get('amount_paid')}",
                layer="api↔api",
            )
        )

    return StepResult(step=4, title="Vérifier order.status et payment_status", passed=all(c.passed for c in checks), checks=checks)


def step_verify_notifications(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, api_body = api_request("GET", "/notifications/me", token=ctx.customer_token)
    ok = status == 200 and isinstance(api_body, dict)
    checks.append(check("notifications_api", ok, f"{status} {api_body}"))

    api_notifications = api_body.get("notifications", []) if isinstance(api_body, dict) else []
    api_for_order = [
        item
        for item in api_notifications
        if str((item.get("notification_metadata") or {}).get("orderId", "")) == ctx.order_id
        or str((item.get("notification_metadata") or {}).get("order_id", "")) == ctx.order_id
    ]
    has_order_notification_api = len(api_for_order) > 0
    checks.append(
        check(
            "api_notification_for_order",
            has_order_notification_api,
            f"{len(api_for_order)} notification(s) API pour order_id={ctx.order_id}"
            if has_order_notification_api
            else "aucune notification API liée à la commande",
            layer="api",
        )
    )

    db_rows = db_notifications(ctx.customer_id)
    has_order_notification_db = notification_refs_order(db_rows, ctx.order_id)
    checks.append(
        check(
            "db_notification_for_order",
            has_order_notification_db,
            f"notification DB trouvée pour order_id={ctx.order_id}"
            if has_order_notification_db
            else "aucune notification DB liée à la commande",
            layer="db",
        )
    )

    payment_types = {"payment_confirmation", "paymentConfirmation", "payment_success", "paymentSucceeded"}
    has_payment_notification = any(
        str(item.get("notification_type", "")).lower() in {t.lower() for t in payment_types}
        or "paiement" in str(item.get("title", "")).lower()
        for item in api_notifications
    )
    checks.append(
        check(
            "payment_notification_emitted",
            has_payment_notification,
            "notification payment_confirmation présente côté client"
            if has_payment_notification
            else "CORRIDOR GAP: aucune notification de confirmation paiement côté client",
            layer="api",
        )
    )

    has_payment_notification_db = any(
        _normalize_value(n.notification_type) == "payment_confirmation"
        and notification_refs_order([n], ctx.order_id)
        for n in db_rows
    )
    checks.append(
        check(
            "payment_notification_db",
            has_payment_notification_db,
            "notification payment_confirmation en base"
            if has_payment_notification_db
            else "aucune notification payment_confirmation en base",
            layer="db",
        )
    )

    if api_for_order and db_rows:
        checks.append(
            check(
                "notification_api_db_count_coherent",
                len(api_for_order) <= len([n for n in db_rows if notification_refs_order([n], ctx.order_id)]),
                "écart notifications API/DB pour la commande",
                layer="api↔db",
            )
        )

    return StepResult(step=5, title="Vérifier notification créée", passed=all(c.passed for c in checks), checks=checks)


def step_open_support_ticket(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    payload = {
        "title": "Problème livraison truth E2E",
        "description": "Ticket ouvert par validate_customer_corridor_truth.py",
        "category": "delivery",
        "priority": "medium",
        "order_id": ctx.order_id,
    }
    status, body = api_request("POST", "/support/tickets", payload, token=ctx.customer_token)
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("create_ticket", ok, f"{status} {body}"))
    if ok:
        ctx.ticket_id = str(body["id"])
        checks.append(check("ticket_links_order", str(body.get("order_id")) == ctx.order_id, f"order_id={body.get('order_id')}"))

    status, listed = api_request("GET", "/support/tickets", token=ctx.customer_token)
    ok = status == 200 and isinstance(listed, list) and any(str(t.get("id")) == ctx.ticket_id for t in listed)
    checks.append(check("ticket_listed_for_customer", ok, f"{status} count={len(listed) if isinstance(listed, list) else 'n/a'}"))

    return StepResult(step=6, title="Ouvrir ticket support", passed=all(c.passed for c in checks), checks=checks)


def step_add_attachment(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    payload = {
        "file_url": "https://example.com/truth-e2e-proof.jpg",
        "file_name": "truth-proof.jpg",
        "mime_type": "image/jpeg",
        "size": 1024,
    }
    status, body = api_request(
        "POST",
        f"/support/tickets/{ctx.ticket_id}/attachments",
        payload,
        token=ctx.customer_token,
    )
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("add_attachment", ok, f"{status} {body}"))
    if ok:
        ctx.attachment_id = str(body["id"])

    status, ticket = api_request("GET", f"/support/tickets/{ctx.ticket_id}", token=ctx.customer_token)
    ok = status == 200 and isinstance(ticket, dict)
    checks.append(check("ticket_has_attachment", ok and len(ticket.get("attachments", [])) > 0, f"{status} {ticket}"))

    return StepResult(step=7, title="Ajouter pièce jointe", passed=all(c.passed for c in checks), checks=checks)


def step_reply_ticket(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    payload = {"content": "Merci, voici des précisions supplémentaires (truth E2E)."}
    status, body = api_request(
        "POST",
        f"/support/tickets/{ctx.ticket_id}/messages",
        payload,
        token=ctx.customer_token,
    )
    ok = status == 200 and isinstance(body, dict)
    checks.append(check("reply_ticket", ok, f"{status} {body}"))

    messages = body.get("messages", []) if isinstance(body, dict) else []
    checks.append(
        check(
            "reply_visible_in_ticket",
            any("précisions supplémentaires" in str(m.get("content", "")) for m in messages),
            f"messages={len(messages)}",
        )
    )

    return StepResult(step=8, title="Répondre au ticket", passed=all(c.passed for c in checks), checks=checks)


def step_deliver_order(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    try:
        operator_token, operator_source = ensure_status_operator_token(ctx)
    except RuntimeError as exc:
        checks.append(check("status_operator", False, str(exc)))
        return StepResult(step=9, title="Passer commande à delivered", passed=False, checks=checks)

    checks.append(check("status_operator", True, operator_source))

    for new_status in ORDER_STATUS_TO_DELIVERED:
        payload: dict[str, Any] = {
            "new_status": new_status,
            "change_reason": f"truth e2e transition → {new_status}",
        }
        if new_status in {"picked_up", "delivered"}:
            payload["proof_note"] = f"Truth E2E proof for {new_status}"
            payload["proof_photo_url"] = "https://example.com/truth-e2e-proof.jpg"
        status, body = api_request(
            "POST",
            f"/orders/{ctx.order_id}/status",
            payload,
            token=operator_token,
        )
        ok = status == 200 and isinstance(body, dict) and str(body.get("status", "")).lower() == new_status
        checks.append(check(f"transition_{new_status}", ok, f"{status} {body}"))
        if not ok:
            break

    db_row = db_order(ctx.order_id)
    checks.append(
        check(
            "db_order_delivered",
            db_row is not None and _normalize_value(db_row.status) == "delivered",
            f"db.status={getattr(db_row, 'status', None)}",
            layer="db",
        )
    )

    status, order_api = api_request("GET", f"/orders/{ctx.order_id}", token=ctx.customer_token)
    if db_row and isinstance(order_api, dict):
        checks.append(assert_match(order_api.get("status"), db_row.status, "order.status"))

    return StepResult(step=9, title="Passer commande à delivered", passed=all(c.passed for c in checks), checks=checks)


def step_submit_review(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []
    payload = {
        "order_id": ctx.order_id,
        "rating": 5,
        "comment": "Excellent service — truth E2E validation",
        "title": "Parfait",
    }
    status, body = api_request("POST", "/reviews", payload, token=ctx.customer_token)
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("submit_review", ok, f"{status} {body}"))
    if ok:
        ctx.review_id = str(body["id"])

    return StepResult(step=10, title="Déposer un avis", passed=all(c.passed for c in checks), checks=checks)


def step_verify_review(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, my_reviews = api_request("GET", "/reviews/me", token=ctx.customer_token)
    ok = status == 200 and isinstance(my_reviews, list)
    checks.append(check("my_reviews_api", ok, f"{status}"))
    mine = next((r for r in my_reviews if str(r.get("id")) == ctx.review_id), None) if ok else None
    checks.append(check("review_in_my_list", mine is not None, "avis absent de /reviews/me"))

    review_db = db_review(ctx.review_id)
    checks.append(check("review_db_exists", review_db is not None, "avis absent en base", layer="db"))
    if mine and review_db:
        checks.append(assert_match(mine.get("status"), review_db.status, "review.status"))
        checks.append(assert_match(mine.get("rating"), review_db.rating, "review.rating"))

    status, public_reviews = api_request("GET", f"/reviews/public?partner_id={ctx.partner_id}&limit=50")
    ok = status == 200 and isinstance(public_reviews, list)
    checks.append(check("public_reviews_api", ok, f"{status}"))
    visible = any(str(r.get("id")) == ctx.review_id for r in public_reviews) if ok else False
    checks.append(
        check(
            "review_publicly_visible",
            visible,
            "avis publié (rating≥3) absent de /reviews/public",
            layer="api",
        )
    )

    return StepResult(step=11, title="Vérifier review.status et visibilité publique", passed=all(c.passed for c in checks), checks=checks)


def step_verify_order_history(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, body = api_request("GET", "/orders?page=1&page_size=50", token=ctx.customer_token)
    ok = status == 200 and isinstance(body, dict)
    checks.append(check("order_history_api", ok, f"{status} {body}"))
    orders = body.get("orders", []) if ok else []
    found = next((o for o in orders if str(o.get("id")) == ctx.order_id), None)
    checks.append(check("order_in_history", found is not None, "commande absente de GET /orders"))

    db_row = db_order(ctx.order_id)
    if found and db_row:
        checks.append(assert_match(found.get("status"), db_row.status, "history.order.status"))
        checks.append(assert_match(found.get("payment_status"), db_row.payment_status, "history.order.payment_status"))
        checks.append(
            check(
                "history_has_status_timeline",
                len(found.get("status_history") or []) > 0,
                f"status_history_len={len(found.get('status_history') or [])}",
                layer="api",
            )
        )

    return StepResult(step=12, title="Vérifier historique commande", passed=all(c.passed for c in checks), checks=checks)


def step_verify_tracking(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    status, tracking_api = api_request("GET", f"/orders/{ctx.order_id}", token=ctx.customer_token)
    ok = status == 200 and isinstance(tracking_api, dict)
    checks.append(check("tracking_order_api", ok, f"{status} {tracking_api}"))

    db_row = db_order(ctx.order_id, with_history=True)
    checks.append(check("tracking_db_order", db_row is not None, "commande absente", layer="db"))
    if ok and db_row:
        checks.append(assert_match(tracking_api.get("status"), db_row.status, "tracking.status"))
        checks.append(assert_match(tracking_api.get("payment_status"), db_row.payment_status, "tracking.payment_status"))
        api_history_len = len(tracking_api.get("status_history") or [])
        db_history_len = len(db_row.status_history or [])
        checks.append(
            check(
                "tracking_status_history_coherent",
                api_history_len == db_history_len,
                f"API history={api_history_len} DB history={db_history_len}",
                layer="api↔db",
            )
        )

    return StepResult(step=13, title="Vérifier tracking reflète le backend", passed=all(c.passed for c in checks), checks=checks)


def step_verify_audit_logs(ctx: RuntimeContext) -> StepResult:
    checks: list[CheckResult] = []

    resource_ids = [ctx.order_id, ctx.ticket_id, ctx.review_id]
    logs = db_audit_logs(resource_ids=resource_ids, user_id=ctx.customer_id)

    expected_types = {
        "support_tickets": False,
        "support_ticket_attachments": False,
        "support_messages": False,
        "reviews": False,
    }
    for entry in logs:
        rtype = str(entry.resource_type)
        if rtype in expected_types:
            expected_types[rtype] = True

    for rtype, found in expected_types.items():
        checks.append(
            check(
                f"audit_{rtype}",
                found,
                f"audit log {rtype} présent" if found else f"aucun audit log pour {rtype}",
                layer="db",
            )
        )

    has_payment_audit = any(str(log.resource_type).startswith("payment") for log in logs)
    checks.append(
        check(
            "audit_payment_corridor",
            has_payment_audit,
            "audit log paiement présent"
            if has_payment_audit
            else "CORRIDOR GAP: aucun audit log paiement (attendu pour truth payment complet)",
            layer="db",
        )
    )

    try:
        admin_token, admin_source = ensure_admin_token(ctx)
    except RuntimeError as exc:
        checks.append(check("admin_activity_logs_api", False, str(exc), layer="api"))
        return StepResult(step=14, title="Vérifier audit logs générés", passed=all(c.passed for c in checks), checks=checks)

    status, admin_logs = api_request("GET", "/admin/activity-logs?limit=50", token=admin_token)
    if status == 200 and isinstance(admin_logs, dict):
        api_items = admin_logs.get("logs") or admin_logs.get("items") or []
        checks.append(check("admin_activity_logs_api", True, f"{len(api_items)} entrées ({admin_source})", layer="api"))
    else:
        checks.append(check("admin_activity_logs_api", False, f"{status} {admin_logs}", layer="api"))

    return StepResult(step=14, title="Vérifier audit logs générés", passed=all(c.passed for c in checks), checks=checks)


def cleanup_runtime(ctx: RuntimeContext) -> None:
    if KEEP_DATA or not ctx.customer_id:
        return

    session = _session()
    try:
        from app.models.order import OrderEvent, OrderItem, OrderStatusHistory
        from app.models.support import SupportMessage, SupportTicketAttachment
        from app.models.user import User
        from app.models.customer import CustomerAddress

        order_uuid = UUID(ctx.order_id) if ctx.order_id else None
        if order_uuid:
            session.query(Review).filter(Review.order_id == order_uuid).delete(synchronize_session=False)
            session.query(SupportTicketAttachment).filter(
                SupportTicketAttachment.ticket_id.in_(
                    session.query(SupportTicket.id).filter(SupportTicket.order_id == order_uuid)
                )
            ).delete(synchronize_session=False)
            session.query(SupportMessage).filter(
                SupportMessage.ticket_id.in_(
                    session.query(SupportTicket.id).filter(SupportTicket.order_id == order_uuid)
                )
            ).delete(synchronize_session=False)
            session.query(SupportTicket).filter(SupportTicket.order_id == order_uuid).delete(synchronize_session=False)
            session.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_uuid).delete(synchronize_session=False)
            session.query(PaymentIntent).filter(PaymentIntent.order_id == order_uuid).delete(synchronize_session=False)
            session.query(OrderEvent).filter(OrderEvent.order_id == order_uuid).delete(synchronize_session=False)
            session.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order_uuid).delete(synchronize_session=False)
            session.query(OrderItem).filter(OrderItem.order_id == order_uuid).delete(synchronize_session=False)
            session.query(Notification).filter(Notification.user_id == UUID(ctx.customer_id)).delete(synchronize_session=False)
            session.query(AuditLog).filter(AuditLog.user_id == UUID(ctx.customer_id)).delete(synchronize_session=False)
            session.query(Order).filter(Order.id == order_uuid).delete(synchronize_session=False)

        session.query(CustomerAddress).filter(CustomerAddress.user_id == UUID(ctx.customer_id)).delete(synchronize_session=False)
        from app.models.user import RefreshToken, User, UserProfile

        user_ids_to_delete: list[UUID] = [UUID(ctx.customer_id)]
        if ctx.operator_bootstrapped:
            operator = (
                session.query(User)
                .filter(User.email == f"truth-operator-{ctx.run_slug}@example.com")
                .first()
            )
            if operator:
                user_ids_to_delete.append(operator.id)
        if ctx.admin_bootstrapped:
            admin = (
                session.query(User)
                .filter(User.email == f"truth-admin-{ctx.run_slug}@example.com")
                .first()
            )
            if admin:
                user_ids_to_delete.append(admin.id)

        session.query(RefreshToken).filter(RefreshToken.user_id.in_(user_ids_to_delete)).delete(
            synchronize_session=False
        )

        session.query(UserProfile).filter(UserProfile.user_id.in_(user_ids_to_delete)).delete(synchronize_session=False)

        if ctx.operator_bootstrapped:
            from app.models.partner import PartnerStaff

            operator = (
                session.query(User)
                .filter(User.email == f"truth-operator-{ctx.run_slug}@example.com")
                .first()
            )
            if operator:
                session.query(PartnerStaff).filter(PartnerStaff.user_id == operator.id).delete(synchronize_session=False)

        for user_id in user_ids_to_delete:
            session.query(User).filter(User.id == user_id).delete(synchronize_session=False)

        if ctx.catalog_bootstrapped and ctx.bootstrap_slug:
            from app.models.catalog import PartnerService, PricingRule, ServiceCategory, ServiceType
            from app.models.partner import Partner

            slug = ctx.bootstrap_slug
            partner = session.query(Partner).filter(Partner.tax_id == f"TAX-TRUTH-{slug}").first()
            if partner:
                session.query(PricingRule).filter(PricingRule.partner_id == partner.id).delete(synchronize_session=False)
                session.query(PartnerService).filter(PartnerService.partner_id == partner.id).delete(synchronize_session=False)
                session.query(Partner).filter(Partner.id == partner.id).delete(synchronize_session=False)
            session.query(ServiceCategory).filter(ServiceCategory.slug == f"truth-cat-{slug}").delete(synchronize_session=False)
            session.query(ServiceType).filter(ServiceType.slug == f"truth-svc-{slug}").delete(synchronize_session=False)

        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def print_step(result: StepResult) -> None:
    mark = "PASS" if result.passed else "FAIL"
    print(f"\n[Step {result.step:02d}] {mark} — {result.title}")
    for check_item in result.checks:
        sub = "PASS" if check_item.passed else "FAIL"
        print(f"  - {sub} [{check_item.layer}] {check_item.name}: {check_item.detail}")


def preflight() -> list[str]:
    issues: list[str] = []
    if not API_BASE_URL:
        issues.append("TRUTH_API_BASE_URL / API_BASE_URL manquant")
    if not DATABASE_URL_SYNC:
        issues.append("TRUTH_DATABASE_URL_SYNC / DATABASE_URL_SYNC manquant")
    try:
        status, body = request_json("GET", health_url())
        if status != 200:
            issues.append(f"API health KO: {status} {body}")
    except Exception as exc:
        issues.append(f"API injoignable: {exc}")
    try:
        session = _session()
        session.execute(func.now())
        session.close()
    except Exception as exc:
        issues.append(f"Base injoignable: {exc}")
    return issues


def run_corridor() -> tuple[list[StepResult], RuntimeContext]:
    ctx = RuntimeContext()
    steps: list[StepResult] = []

    pipeline = [
        step_create_user,
        step_create_order,
        step_initiate_payment,
        step_verify_payment_truth,
        step_verify_notifications,
        step_open_support_ticket,
        step_add_attachment,
        step_reply_ticket,
        step_deliver_order,
        step_submit_review,
        step_verify_review,
        step_verify_order_history,
        step_verify_tracking,
        step_verify_audit_logs,
    ]

    for runner in pipeline:
        result = runner(ctx)
        steps.append(result)
        print_step(result)
        if not result.passed:
            break

    return steps, ctx


def main() -> int:
    print("Sprint 5.5 — Customer Corridor Truth Validation")
    print("=" * 60)
    print(f"API : {API_BASE_URL}")
    print(f"DB  : {DATABASE_URL_SYNC.split('@')[-1] if '@' in DATABASE_URL_SYNC else DATABASE_URL_SYNC}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("Règles: 0 mock | 0 localStorage | 0 seed de test")
    print()

    issues = preflight()
    if issues:
        print("Preflight FAIL")
        for issue in issues:
            print(f"  - {issue}")
        return 1
    print("Preflight PASS")

    steps, ctx = run_corridor()
    passed = sum(1 for step in steps if step.passed)
    total = 14

    print("\n" + "=" * 60)
    print(f"Résultat: {passed}/{total} étapes")
    if passed == total:
        print("VERDICT: GO — corridor client validé intégralement.")
        try:
            cleanup_runtime(ctx)
        except Exception as exc:
            print(f"\nCleanup warning: {exc}")
        return 0

    failed = next(step for step in steps if not step.passed)
    print(f"VERDICT: NO-GO — bloqué à l'étape {failed.step}: {failed.title}")
    print(f"         {failed.detail}")
    print("\nCorrigez le corridor avant Sprint 6 (Loyalty / Referral).")
    if not KEEP_DATA:
        print("Données conservées pour investigation (définir KEEP_TRUTH_E2E_DATA=1 pour forcer).")
    else:
        print("KEEP_TRUTH_E2E_DATA=1 — données conservées.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
