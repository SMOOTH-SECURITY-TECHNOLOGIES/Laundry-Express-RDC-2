#!/usr/bin/env python3
"""
Sprint 7.5 — Promotion Truth Validation

Corridor:
  Code promo → validation → remise → commande → paiement → ledger → historique → audit

Usage:
  python scripts/validate_promotion_truth.py
"""

from __future__ import annotations

import importlib.util
import os
import sys
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

ROOT = Path(__file__).resolve().parents[1]
API_PKG = ROOT / "apps" / "api"
sys.path.insert(0, str(API_PKG))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass

_CORRIDOR_PATH = ROOT / "scripts" / "validate_customer_corridor_truth.py"
_spec = importlib.util.spec_from_file_location("customer_corridor_truth", _CORRIDOR_PATH)
_corridor = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
sys.modules["customer_corridor_truth"] = _corridor
_spec.loader.exec_module(_corridor)

api_request = _corridor.api_request
login = _corridor.login
build_customer_identity = _corridor.build_customer_identity
bootstrap_ephemeral_catalog = _corridor.bootstrap_ephemeral_catalog
ensure_admin_token = _corridor.ensure_admin_token
check = _corridor.check
assert_match = _corridor.assert_match
_normalize_value = _corridor._normalize_value
_session = _corridor._session
preflight = _corridor.preflight
print_step = _corridor.print_step
CheckResult = _corridor.CheckResult
StepResult = _corridor.StepResult

API_BASE_URL = _corridor.API_BASE_URL
DATABASE_URL_SYNC = _corridor.DATABASE_URL_SYNC
CUSTOMER_PASSWORD = os.getenv("TRUTH_CUSTOMER_PASSWORD", f"TruthPromo-{uuid4().hex[:12]}!aA1")

from app.models.admin import AuditLog
from app.models.promotion import PromoCode, PromoCodeUsage
from app.services.payment_service import PaymentService


@dataclass
class Ctx:
    run_slug: str = ""
    customer_id: str = ""
    customer_token: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    address_id: str = ""
    partner_id: str = ""
    service_id: str = ""
    service_name: str = ""
    service_price: str = "1500.00"
    admin_token: str = ""
    promo_code: str = ""
    promo_id: str = ""
    promo_discount: float = 0.0
    baseline_total: float = 0.0
    discounted_total: float = 0.0
    order_id: str = ""


def db_promo_usage_count(promo_id: str) -> int:
    session = _session()
    try:
        return (
            session.query(PromoCodeUsage)
            .filter(PromoCodeUsage.promo_code_id == UUID(promo_id))
            .count()
        )
    finally:
        session.close()


def db_order_usage(order_id: str) -> PromoCodeUsage | None:
    session = _session()
    try:
        return (
            session.query(PromoCodeUsage)
            .filter(PromoCodeUsage.order_id == UUID(order_id))
            .first()
        )
    finally:
        session.close()


def db_audit_actions_for_order(order_id: str) -> set[str]:
    session = _session()
    try:
        rows = (
            session.query(AuditLog)
            .filter(AuditLog.resource_id == UUID(order_id))
            .all()
        )
        return {str(r.action) for r in rows}
    finally:
        session.close()


def db_rejection_audits(customer_id: str) -> list[AuditLog]:
    session = _session()
    try:
        return (
            session.query(AuditLog)
            .filter(
                AuditLog.user_id == UUID(customer_id),
                AuditLog.action == "promotion_rejected",
            )
            .all()
        )
    finally:
        session.close()


def setup(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    email, phone, slug = build_customer_identity()
    ctx.run_slug = slug
    ctx.customer_email = email
    ctx.customer_phone = phone

    status, body = api_request("POST", "/auth/register", {
        "email": email, "phone": phone, "name": f"Truth Promo {slug}", "password": CUSTOMER_PASSWORD,
    })
    ok = status == 201
    checks.append(check("register", ok, f"{status}"))
    if ok:
        ctx.customer_id = str(body["id"])
    ctx.customer_token = login(email, CUSTOMER_PASSWORD)

    status, addr = api_request("POST", "/users/me/addresses", {
        "user_id": ctx.customer_id,
        "label": "Truth",
        "contact_name": "Truth Client",
        "contact_phone": phone,
        "address_line_1": "10 Avenue Promo",
        "city": "Kinshasa",
        "commune": "Gombe",
        "zone": "Centre",
        "is_default": True,
    }, token=ctx.customer_token)
    checks.append(check("address", status == 201, f"{status}"))
    if status == 201:
        ctx.address_id = str(addr["id"])

    try:
        ctx.admin_token, _ = ensure_admin_token(_corridor.RuntimeContext(run_slug=slug))
        _, _, partner, service = bootstrap_ephemeral_catalog(slug)
    except Exception as exc:
        checks.append(check("bootstrap", False, str(exc)))
        return StepResult(step=1, title="Setup client + catalogue", passed=False, checks=checks)

    ctx.partner_id = str(partner["id"])
    ctx.service_id = str(service["id"])
    ctx.service_name = str(service.get("service_type_name", "Service"))
    ctx.service_price = str(service.get("base_price", "1500.00"))
    checks.append(check("bootstrap", True, ctx.partner_id))

    return StepResult(step=1, title="Setup client + catalogue", passed=all(c.passed for c in checks), checks=checks)


def _estimate_payload(ctx: Ctx, promo_code: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "partner_id": ctx.partner_id,
        "items": [{"service_id": ctx.service_id, "item_name": ctx.service_name, "quantity": 1}],
        "pickup_requested": True,
        "delivery_requested": True,
    }
    if promo_code:
        payload["promo_code"] = promo_code
    return payload


def _create_promo(ctx: Ctx, code: str, **overrides: Any) -> tuple[int, dict[str, Any]]:
    payload = {
        "code": code,
        "discount_type": "fixed",
        "discount_value": 100,
        "min_order_value": 0,
        "is_for_new_users_only": False,
        "is_active": True,
        "partner_id": ctx.partner_id,
        "max_usage": None,
        "usage_limit_per_customer": None,
        "description": "Truth promo",
        **overrides,
    }
    return api_request("POST", "/promotions", payload, token=ctx.admin_token)


def step_create_and_apply(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    ctx.promo_code = f"TRUTH{ctx.run_slug.upper()[:8]}"

    status, baseline = api_request("POST", "/pricing/estimate", _estimate_payload(ctx), token=ctx.customer_token)
    checks.append(check("baseline_estimate", status == 200, f"{status}"))
    if status != 200:
        return StepResult(step=2, title="Créer promo active + appliquer", passed=False, checks=checks)
    ctx.baseline_total = float(baseline["total"])

    status, promo = _create_promo(ctx, ctx.promo_code, discount_value=100, max_usage=5, usage_limit_per_customer=2)
    checks.append(check("create_promo", status == 201, f"{status} {promo}"))
    if status != 201:
        return StepResult(step=2, title="Créer promo active + appliquer", passed=False, checks=checks)
    ctx.promo_id = str(promo["id"])

    status, discounted = api_request(
        "POST", "/pricing/estimate", _estimate_payload(ctx, ctx.promo_code), token=ctx.customer_token,
    )
    checks.append(check("discounted_estimate", status == 200, f"{status}"))
    if status != 200:
        return StepResult(step=2, title="Créer promo active + appliquer", passed=False, checks=checks)

    ctx.discounted_total = float(discounted["total"])
    ctx.promo_discount = ctx.baseline_total - ctx.discounted_total
    checks.append(check("discount_applied", ctx.promo_discount >= 100, f"discount={ctx.promo_discount}"))
    checks.append(check("total_lower", ctx.discounted_total < ctx.baseline_total, f"{ctx.discounted_total} < {ctx.baseline_total}"))

    return StepResult(step=2, title="Créer promo active + appliquer", passed=all(c.passed for c in checks), checks=checks)


def _create_and_pay(ctx: Ctx, promo_code: str | None = None) -> tuple[int, dict[str, Any]]:
    estimate_payload = _estimate_payload(ctx, promo_code)
    status, estimate = api_request("POST", "/pricing/estimate", estimate_payload, token=ctx.customer_token)
    if status != 200:
        return status, estimate

    order_payload = {
        "partner_id": ctx.partner_id,
        "pickup_address_id": ctx.address_id,
        "delivery_address_id": ctx.address_id,
        "items": [{
            "service_id": ctx.service_id,
            "item_name": ctx.service_name,
            "quantity": "1.00",
            "unit_price": ctx.service_price,
            "notes": "validate_promotion_truth.py",
            "detected_by_ai": False,
        }],
        "currency": estimate.get("currency", "CDF"),
        "pickup_requested": True,
        "delivery_requested": True,
        "promo_code": promo_code,
        "idempotency_key": f"truth-promo-{uuid4().hex[:12]}",
    }
    status, order = api_request("POST", "/orders", order_payload, token=ctx.customer_token, headers={
        "Idempotency-Key": order_payload["idempotency_key"],
    })
    if status not in {200, 201}:
        return status, order

    total = float(order["total_amount"])
    status, intent = api_request("POST", "/payments/intents", {
        "order_id": order["id"],
        "payment_method": "mobile_money",
        "amount_expected": total,
        "currency": order.get("currency", "CDF"),
        "provider_name": "orange_money_rdc",
    }, token=ctx.customer_token)
    if status != 201:
        return status, intent

    status, _tx = api_request("POST", f"/payments/intents/{intent['id']}/initiate", token=ctx.customer_token)
    if status != 200:
        return status, _tx

    status, paid = api_request("GET", f"/orders/{order['id']}", token=ctx.customer_token)
    return status, paid if status == 200 else order


def step_order_payment_ledger(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    status, order = _create_and_pay(ctx, ctx.promo_code)
    ok = status == 200 and _normalize_value(order.get("payment_status")) == "paid"
    checks.append(check("order_paid", ok, f"{status} payment_status={order.get('payment_status')}"))
    if not ok:
        return StepResult(step=3, title="Commande payée + ledger promo", passed=False, checks=checks)

    ctx.order_id = str(order["id"])
    amount_paid = float(order.get("amount_paid", 0))
    total_amount = float(order.get("total_amount", 0))
    breakdown = order.get("calculation_breakdown") or {}

    checks.append(assert_match(amount_paid, total_amount, "amount_paid_vs_total"))
    checks.append(assert_match(total_amount, ctx.discounted_total, "order_total_vs_estimate"))
    checks.append(check("breakdown_promo", float(breakdown.get("promo_discount", 0)) >= 100, str(breakdown)))

    usage = db_order_usage(ctx.order_id)
    checks.append(check("ledger_usage_exists", usage is not None, "promo_code_usage row present" if usage else "missing promo_code_usage", layer="db"))
    if usage:
        checks.append(check("ledger_discount", float(usage.discount_applied) >= 100, str(usage.discount_applied), layer="db"))

    status, history = api_request("GET", "/promotions/me/history", token=ctx.customer_token)
    ok = status == 200 and isinstance(history, dict) and history.get("total", 0) >= 1
    checks.append(check("promo_history_api", ok, f"total={history.get('total') if isinstance(history, dict) else 'n/a'}"))

    actions = db_audit_actions_for_order(ctx.order_id)
    checks.append(check("audit_applied", "promotion_applied" in actions, f"actions={actions}", layer="db"))
    checks.append(check("audit_consumed", "promotion_consumed" in actions, f"actions={actions}", layer="db"))

    return StepResult(step=3, title="Commande payée + ledger promo", passed=all(c.passed for c in checks), checks=checks)


def step_anti_fraud_rejections(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    before_rejections = len(db_rejection_audits(ctx.customer_id))

    inactive_code = f"INACT{ctx.run_slug.upper()[:6]}"
    status, _ = _create_promo(ctx, inactive_code, is_active=False)
    checks.append(check("create_inactive", status == 201, f"{status}"))
    status, body = api_request("POST", "/pricing/estimate", _estimate_payload(ctx, inactive_code), token=ctx.customer_token)
    checks.append(check("reject_inactive", status == 400, f"{status} {body}"))

    expired_code = f"EXPIR{ctx.run_slug.upper()[:6]}"
    past = (date.today() - timedelta(days=30)).isoformat()
    status, _ = _create_promo(ctx, expired_code, end_date=past)
    checks.append(check("create_expired", status == 201, f"{status}"))
    status, body = api_request("POST", "/pricing/estimate", _estimate_payload(ctx, expired_code), token=ctx.customer_token)
    checks.append(check("reject_expired", status == 400, f"{status} {body}"))

    min_code = f"MINC{ctx.run_slug.upper()[:7]}"
    status, _ = _create_promo(ctx, min_code, min_order_value=999999)
    checks.append(check("create_min_cart", status == 201, f"{status}"))
    status, body = api_request("POST", "/pricing/estimate", _estimate_payload(ctx, min_code), token=ctx.customer_token)
    checks.append(check("reject_min_cart", status == 400, f"{status} {body}"))

    after_rejections = len(db_rejection_audits(ctx.customer_id))
    checks.append(
        check(
            "audit_rejections",
            after_rejections >= before_rejections + 3,
            f"before={before_rejections} after={after_rejections}",
            layer="db",
        )
    )

    return StepResult(step=4, title="Anti-fraude — rejets promo", passed=all(c.passed for c in checks), checks=checks)


def step_max_usage(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    single_code = f"ONCE{ctx.run_slug.upper()[:7]}"
    status, promo = _create_promo(ctx, single_code, max_usage=1, usage_limit_per_customer=5)
    checks.append(check("create_max_usage_1", status == 201, f"{status}"))
    if status != 201:
        return StepResult(step=5, title="Limite usage globale", passed=False, checks=checks)

    status, order = _create_and_pay(ctx, single_code)
    checks.append(check("first_use_paid", status == 200 and _normalize_value(order.get("payment_status")) == "paid", f"{status}"))

    status, body = api_request("POST", "/pricing/estimate", _estimate_payload(ctx, single_code), token=ctx.customer_token)
    checks.append(check("reject_second_use", status == 400, f"{status} {body}"))

    usage_count = db_promo_usage_count(str(promo["id"]))
    checks.append(check("ledger_single_row", usage_count == 1, f"count={usage_count}", layer="db"))

    return StepResult(step=5, title="Limite usage globale", passed=all(c.passed for c in checks), checks=checks)


def step_idempotence(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    before = db_promo_usage_count(ctx.promo_id) if ctx.promo_id else 0
    ledger_before = 1 if db_order_usage(ctx.order_id) else 0

    session = _session()
    try:
        PaymentService(session).recalculate_order_payment_status(UUID(ctx.order_id))
        session.commit()
    finally:
        session.close()

    after = db_promo_usage_count(ctx.promo_id) if ctx.promo_id else 0
    order_rows = 1 if db_order_usage(ctx.order_id) else 0

    checks.append(check("no_double_ledger", before == after, f"before={before} after={after}", layer="db"))
    checks.append(check("order_usage_unique", order_rows == 1 and ledger_before == 1, f"rows={order_rows}", layer="db"))

    return StepResult(step=6, title="Idempotence consommation promo", passed=all(c.passed for c in checks), checks=checks)


def run() -> list[StepResult]:
    ctx = Ctx()
    steps: list[StepResult] = []
    for runner in (
        setup,
        step_create_and_apply,
        step_order_payment_ledger,
        step_anti_fraud_rejections,
        step_max_usage,
        step_idempotence,
    ):
        result = runner(ctx)
        steps.append(result)
        print_step(result)
        if not result.passed:
            break
    return steps


def main() -> int:
    print("Sprint 7.5 — Promotion Truth Validation")
    print("=" * 60)
    print(f"API : {API_BASE_URL}")
    print(f"DB  : {DATABASE_URL_SYNC.split('@')[-1] if '@' in DATABASE_URL_SYNC else DATABASE_URL_SYNC}")
    print()

    issues = preflight()
    if issues:
        print("Preflight FAIL")
        for issue in issues:
            print(f"  - {issue}")
        return 1
    print("Preflight PASS")

    steps = run()
    passed = sum(1 for s in steps if s.passed)
    total = 6
    print("\n" + "=" * 60)
    print(f"Résultat: {passed}/{total} étapes")
    if passed == total:
        print("VERDICT: GO — corridor promotions validé.")
        return 0
    failed = next(s for s in steps if not s.passed)
    print(f"VERDICT: NO-GO — bloqué à l'étape {failed.step}: {failed.title}")
    print(f"         {failed.detail}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
