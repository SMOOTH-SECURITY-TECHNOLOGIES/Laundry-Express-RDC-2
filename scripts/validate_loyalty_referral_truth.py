#!/usr/bin/env python3
"""
Sprint 6.5 — Loyalty / Referral Truth Validation

Valide le corridor fidélité et parrainage sans mock ni seed métier.

Partie 1 — Loyalty:
  Commande payée → points → ledger → profil → historique
  Nouvelle commande → rachat points → remise → débit ledger → solde cohérent

Partie 2 — Referral:
  Parrain → filleul inscrit → filleul paie → bonus → ledger → profil parrain
  Double recalcul paiement → aucun double bonus

Usage:
  python scripts/validate_loyalty_referral_truth.py
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
from dataclasses import dataclass, field
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

# Réutilise les helpers du corridor client (Sprint 5.5)
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
CUSTOMER_PASSWORD = os.getenv("TRUTH_CUSTOMER_PASSWORD", f"TruthLoyalty-{uuid4().hex[:12]}!aA1")
KEEP_DATA = os.getenv("KEEP_TRUTH_E2E_DATA", "").strip().lower() in {"1", "true", "yes"}

from app.models.admin import AuditLog
from app.models.loyalty import LoyaltyLedgerEntry
from app.models.notification import Notification
from app.models.user import User
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
    points_per_dollar: int = 10
    points_to_dollar: int = 100
    referrer_bonus: int = 500
    first_order_id: str = ""
    redeem_order_id: str = ""
    points_before_redeem: int = 0
    points_redeemed: int = 0
    referrer_id: str = ""
    referrer_token: str = ""
    referrer_code: str = ""
    referee_id: str = ""
    referee_token: str = ""
    referee_order_id: str = ""


def db_user_points(user_id: str) -> int:
    session = _session()
    try:
        user = session.query(User).filter(User.id == UUID(user_id)).first()
        return int(getattr(user, "loyalty_points", 0) or 0) if user else -1
    finally:
        session.close()


def db_ledger_entries(user_id: str, *, order_id: str | None = None, entry_type: str | None = None) -> list[LoyaltyLedgerEntry]:
    session = _session()
    try:
        query = session.query(LoyaltyLedgerEntry).filter(LoyaltyLedgerEntry.user_id == UUID(user_id))
        if order_id:
            query = query.filter(LoyaltyLedgerEntry.order_id == UUID(order_id))
        if entry_type:
            query = query.filter(LoyaltyLedgerEntry.entry_type == entry_type)
        return query.order_by(LoyaltyLedgerEntry.created_at.asc()).all()
    finally:
        session.close()


def enable_program_settings(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    try:
        ctx.admin_token, _ = ensure_admin_token(_corridor.RuntimeContext(run_slug=ctx.run_slug))
    except RuntimeError as exc:
        checks.append(check("admin_token", False, str(exc)))
        return StepResult(step=1, title="Activer programmes fidélité/parrainage", passed=False, checks=checks)

    status, loyalty = api_request(
        "PUT",
        "/loyalty/settings",
        {"isEnabled": True, "pointsPerDollar": 10, "pointsToDollar": 100},
        token=ctx.admin_token,
    )
    ok = status == 200 and isinstance(loyalty, dict)
    checks.append(check("loyalty_settings", ok, f"{status} {loyalty}"))
    if ok:
        ctx.points_per_dollar = int(loyalty.get("pointsPerDollar", 10))
        ctx.points_to_dollar = int(loyalty.get("pointsToDollar", 100))

    status, referral = api_request(
        "PUT",
        "/referral/settings",
        {"isEnabled": True, "referrerBonusPoints": 500, "refereeDiscountAmount": 5},
        token=ctx.admin_token,
    )
    ok = status == 200 and isinstance(referral, dict)
    checks.append(check("referral_settings", ok, f"{status} {referral}"))
    if ok:
        ctx.referrer_bonus = int(referral.get("referrerBonusPoints", 500))

    return StepResult(step=1, title="Activer programmes fidélité/parrainage", passed=all(c.passed for c in checks), checks=checks)


def setup_customer_and_catalog(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    email, phone, slug = build_customer_identity()
    ctx.run_slug = slug
    ctx.customer_email = email
    ctx.customer_phone = phone

    status, body = api_request("POST", "/auth/register", {
        "email": email, "phone": phone, "name": f"Truth Loyalty {slug}", "password": CUSTOMER_PASSWORD,
    })
    ok = status == 201 and isinstance(body, dict) and body.get("id")
    checks.append(check("register_customer", ok, f"{status}"))
    if ok:
        ctx.customer_id = str(body["id"])
    ctx.customer_token = login(email, CUSTOMER_PASSWORD)

    status, addr = api_request("POST", "/users/me/addresses", {
        "user_id": ctx.customer_id,
        "label": "Truth",
        "contact_name": "Truth Client",
        "contact_phone": phone,
        "address_line_1": "10 Avenue Loyalty",
        "city": "Kinshasa",
        "commune": "Gombe",
        "zone": "Centre",
        "is_default": True,
    }, token=ctx.customer_token)
    ok = status == 201 and isinstance(addr, dict)
    checks.append(check("create_address", ok, f"{status}"))
    if ok:
        ctx.address_id = str(addr["id"])

    try:
        _, _, partner, service = bootstrap_ephemeral_catalog(slug)
    except Exception as exc:
        checks.append(check("catalog", False, str(exc)))
        return StepResult(step=2, title="Créer client + catalogue", passed=False, checks=checks)

    ctx.partner_id = str(partner["id"])
    ctx.service_id = str(service["id"])
    ctx.service_name = str(service.get("service_type_name", "Service"))
    ctx.service_price = str(service.get("base_price", "1500.00"))
    checks.append(check("catalog", True, ctx.partner_id))

    return StepResult(step=2, title="Créer client + catalogue", passed=all(c.passed for c in checks), checks=checks)


def _order_item(ctx: Ctx) -> dict[str, Any]:
    return {
        "service_id": ctx.service_id,
        "item_name": ctx.service_name,
        "quantity": "1.00",
        "unit_price": ctx.service_price,
        "notes": "validate_loyalty_referral_truth.py",
        "detected_by_ai": False,
    }


def _create_and_pay_order(
    ctx: Ctx,
    *,
    token: str,
    user_id: str,
    loyalty_points_to_redeem: int = 0,
) -> tuple[int, dict[str, Any]]:
    estimate_payload = {
        "partner_id": ctx.partner_id,
        "items": [{"service_id": ctx.service_id, "item_name": ctx.service_name, "quantity": 1}],
        "pickup_requested": True,
        "delivery_requested": True,
        "loyalty_points_to_redeem": loyalty_points_to_redeem,
    }
    status, estimate = api_request("POST", "/pricing/estimate", estimate_payload, token=token)
    if status != 200:
        return status, estimate

    order_payload = {
        "partner_id": ctx.partner_id,
        "pickup_address_id": ctx.address_id,
        "delivery_address_id": ctx.address_id,
        "items": [_order_item(ctx)],
        "currency": estimate.get("currency", "CDF"),
        "pickup_requested": True,
        "delivery_requested": True,
        "loyalty_points_to_redeem": loyalty_points_to_redeem,
        "idempotency_key": f"truth-lr-{uuid4().hex[:12]}",
    }
    status, order = api_request("POST", "/orders", order_payload, token=token, headers={
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
    }, token=token)
    if status != 201:
        return status, intent

    status, _tx = api_request("POST", f"/payments/intents/{intent['id']}/initiate", token=token)
    if status != 200:
        return status, _tx

    status, paid_order = api_request("GET", f"/orders/{order['id']}", token=token)
    return status, paid_order if status == 200 else order


def step_loyalty_earn(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    status, me_before = api_request("GET", "/auth/me", token=ctx.customer_token)
    points_before = int(me_before.get("user", {}).get("loyalty_points", 0)) if status == 200 else 0

    status, order = _create_and_pay_order(ctx, token=ctx.customer_token, user_id=ctx.customer_id)
    ok = status == 200 and _normalize_value(order.get("payment_status")) == "paid"
    checks.append(check("first_order_paid", ok, f"{status} payment_status={order.get('payment_status')}"))
    if not ok:
        return StepResult(step=3, title="Gagner points après paiement", passed=False, checks=checks)

    ctx.first_order_id = str(order["id"])
    amount_paid = float(order.get("amount_paid", 0))
    expected_points = int(Decimal(str(amount_paid)) * Decimal(ctx.points_per_dollar))
    breakdown = order.get("calculation_breakdown") or {}
    api_earned = int(breakdown.get("loyalty_points_earned", 0))

    status, me_after = api_request("GET", "/auth/me", token=ctx.customer_token)
    api_points = int(me_after.get("user", {}).get("loyalty_points", 0)) if status == 200 else -1
    db_points = db_user_points(ctx.customer_id)
    ledger = db_ledger_entries(ctx.customer_id, order_id=ctx.first_order_id, entry_type="earn")

    checks.append(check("expected_points_positive", expected_points > 0, f"expected={expected_points}"))
    checks.append(check("breakdown_points_earned", api_earned == expected_points, f"api={api_earned} expected={expected_points}"))
    checks.append(check("profile_points_increased", api_points == points_before + expected_points, f"api={api_points}"))
    checks.append(assert_match(api_points, db_points, "loyalty_points"))
    checks.append(check("ledger_earn_exists", len(ledger) == 1, f"entries={len(ledger)}", layer="db"))
    if ledger:
        checks.append(check("ledger_earn_delta", int(ledger[0].points_delta) == expected_points, f"delta={ledger[0].points_delta}", layer="db"))
        checks.append(assert_match(ledger[0].balance_after, db_points, "ledger.balance_after"))

    status, history = api_request("GET", "/loyalty/me/history", token=ctx.customer_token)
    ok = status == 200 and isinstance(history, dict) and history.get("total", 0) > 0
    checks.append(check("loyalty_history_api", ok, f"total={history.get('total') if isinstance(history, dict) else 'n/a'}"))

    return StepResult(step=3, title="Gagner points après paiement", passed=all(c.passed for c in checks), checks=checks)


def step_loyalty_redeem(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    status, me = api_request("GET", "/auth/me", token=ctx.customer_token)
    ctx.points_before_redeem = int(me.get("user", {}).get("loyalty_points", 0)) if status == 200 else 0
    redeem_points = min(ctx.points_to_dollar, ctx.points_before_redeem)
    if redeem_points <= 0:
        checks.append(check("has_points_to_redeem", False, f"balance={ctx.points_before_redeem}"))
        return StepResult(step=4, title="Racheter des points au checkout", passed=False, checks=checks)

    baseline_status, baseline = api_request("POST", "/pricing/estimate", {
        "partner_id": ctx.partner_id,
        "items": [{"service_id": ctx.service_id, "item_name": ctx.service_name, "quantity": 1}],
        "pickup_requested": True,
        "delivery_requested": True,
    }, token=ctx.customer_token)
    redeem_status, redeem_est = api_request("POST", "/pricing/estimate", {
        "partner_id": ctx.partner_id,
        "items": [{"service_id": ctx.service_id, "item_name": ctx.service_name, "quantity": 1}],
        "pickup_requested": True,
        "delivery_requested": True,
        "loyalty_points_to_redeem": redeem_points,
    }, token=ctx.customer_token)
    ok = baseline_status == 200 and redeem_status == 200
    checks.append(check("estimate_with_redeem", ok, f"{baseline_status}/{redeem_status}"))
    if ok:
        baseline_total = Decimal(str(baseline["total"]))
        redeem_total = Decimal(str(redeem_est["total"]))
        checks.append(check("discount_applied", redeem_total < baseline_total, f"{redeem_total} < {baseline_total}"))

    status, order = _create_and_pay_order(
        ctx, token=ctx.customer_token, user_id=ctx.customer_id, loyalty_points_to_redeem=redeem_points,
    )
    ok = status == 200 and _normalize_value(order.get("payment_status")) == "paid"
    checks.append(check("redeem_order_paid", ok, f"{status}"))
    if not ok:
        return StepResult(step=4, title="Racheter des points au checkout", passed=False, checks=checks)

    ctx.redeem_order_id = str(order["id"])
    breakdown = order.get("calculation_breakdown") or {}
    ctx.points_redeemed = int(breakdown.get("loyalty_points_redeemed", 0))
    checks.append(check("breakdown_redeemed", ctx.points_redeemed > 0, f"redeemed={ctx.points_redeemed}"))

    status, me_after = api_request("GET", "/auth/me", token=ctx.customer_token)
    api_points = int(me_after.get("user", {}).get("loyalty_points", 0)) if status == 200 else -1
    db_points = db_user_points(ctx.customer_id)
    ledger = db_ledger_entries(ctx.customer_id, order_id=ctx.redeem_order_id, entry_type="redeem")

    expected_balance = ctx.points_before_redeem - ctx.points_redeemed + int(
        Decimal(str(order.get("amount_paid", 0))) * Decimal(ctx.points_per_dollar)
    )
    checks.append(check("profile_balance_after_redeem", api_points == expected_balance, f"api={api_points} expected={expected_balance}"))
    checks.append(assert_match(api_points, db_points, "loyalty_points"))
    checks.append(check("ledger_redeem_exists", len(ledger) == 1, f"entries={len(ledger)}", layer="db"))
    if ledger:
        checks.append(check("ledger_redeem_delta", int(ledger[0].points_delta) == -ctx.points_redeemed, f"delta={ledger[0].points_delta}", layer="db"))

    return StepResult(step=4, title="Racheter des points au checkout", passed=all(c.passed for c in checks), checks=checks)


def step_referral_signup(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    ref_email, ref_phone, ref_slug = build_customer_identity()
    status, ref_body = api_request("POST", "/auth/register", {
        "email": ref_email, "phone": ref_phone, "name": f"Truth Referrer {ref_slug}", "password": CUSTOMER_PASSWORD,
    })
    ok = status == 201 and isinstance(ref_body, dict)
    checks.append(check("register_referrer", ok, f"{status}"))
    ctx.referrer_token = login(ref_email, CUSTOMER_PASSWORD)
    status, ref_me = api_request("GET", "/auth/me", token=ctx.referrer_token)
    ctx.referrer_id = str(ref_me.get("user", {}).get("id", ""))
    ctx.referrer_code = str(ref_me.get("user", {}).get("referral_code", ""))
    checks.append(check("referrer_has_code", bool(ctx.referrer_code), f"code={ctx.referrer_code}"))

    fee_email, fee_phone, fee_slug = build_customer_identity()
    status, fee_body = api_request("POST", "/auth/register", {
        "email": fee_email, "phone": fee_phone, "name": f"Truth Referee {fee_slug}",
        "password": CUSTOMER_PASSWORD, "referral_code": ctx.referrer_code,
    })
    ok = status == 201 and isinstance(fee_body, dict)
    checks.append(check("register_referee", ok, f"{status}"))
    ctx.referee_token = login(fee_email, CUSTOMER_PASSWORD)
    status, fee_me = api_request("GET", "/auth/me", token=ctx.referee_token)
    ctx.referee_id = str(fee_me.get("user", {}).get("id", ""))
    referred_by = fee_me.get("user", {}).get("referred_by_user_id")
    checks.append(check("referee_linked", str(referred_by) == ctx.referrer_id, f"referred_by={referred_by}"))

    status, addr = api_request("POST", "/users/me/addresses", {
        "user_id": ctx.referee_id,
        "label": "Referee",
        "contact_name": "Referee",
        "contact_phone": fee_phone,
        "address_line_1": "20 Avenue Referral",
        "city": "Kinshasa",
        "commune": "Gombe",
        "zone": "Centre",
        "is_default": True,
    }, token=ctx.referee_token)
    checks.append(check("referee_address", status == 201, f"{status}"))
    if status == 201:
        ctx.address_id = str(addr["id"])

    return StepResult(step=5, title="Parrainage — inscription filleul", passed=all(c.passed for c in checks), checks=checks)


def step_referral_bonus(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    status, ref_me_before = api_request("GET", "/auth/me", token=ctx.referrer_token)
    referrer_points_before = int(ref_me_before.get("user", {}).get("loyalty_points", 0)) if status == 200 else 0

    status, order = _create_and_pay_order(ctx, token=ctx.referee_token, user_id=ctx.referee_id)
    ok = status == 200 and _normalize_value(order.get("payment_status")) == "paid"
    checks.append(check("referee_order_paid", ok, f"{status}"))
    if not ok:
        return StepResult(step=6, title="Bonus parrain après paiement filleul", passed=False, checks=checks)

    ctx.referee_order_id = str(order["id"])

    status, ref_me = api_request("GET", "/auth/me", token=ctx.referrer_token)
    api_points = int(ref_me.get("user", {}).get("loyalty_points", 0)) if status == 200 else -1
    db_points = db_user_points(ctx.referrer_id)
    ledger = db_ledger_entries(ctx.referrer_id, order_id=ctx.referee_order_id, entry_type="referral_bonus")

    checks.append(check("referrer_points_increased", api_points == referrer_points_before + ctx.referrer_bonus, f"api={api_points}"))
    checks.append(assert_match(api_points, db_points, "referrer.loyalty_points"))
    checks.append(check("ledger_referral_bonus", len(ledger) == 1, f"entries={len(ledger)}", layer="db"))
    if ledger:
        checks.append(check("ledger_bonus_delta", int(ledger[0].points_delta) == ctx.referrer_bonus, f"delta={ledger[0].points_delta}", layer="db"))

    status, ref_stats = api_request("GET", "/referral/me", token=ctx.referrer_token)
    ok = status == 200 and isinstance(ref_stats, dict)
    checks.append(check("referral_me_api", ok, f"{status}"))
    if ok:
        checks.append(check("referral_completed_conversions", int(ref_stats.get("completed_conversions", 0)) >= 1, str(ref_stats)))
        checks.append(check("referral_total_bonus_points", int(ref_stats.get("total_bonus_points", 0)) >= ctx.referrer_bonus, str(ref_stats)))

    return StepResult(step=6, title="Bonus parrain après paiement filleul", passed=all(c.passed for c in checks), checks=checks)


def step_referral_idempotence(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    points_before = db_user_points(ctx.referrer_id)
    ledger_before = len(db_ledger_entries(ctx.referrer_id, order_id=ctx.referee_order_id, entry_type="referral_bonus"))

    session = _session()
    try:
        PaymentService(session).recalculate_order_payment_status(UUID(ctx.referee_order_id))
        session.commit()
    finally:
        session.close()

    points_after = db_user_points(ctx.referrer_id)
    ledger_after = len(db_ledger_entries(ctx.referrer_id, order_id=ctx.referee_order_id, entry_type="referral_bonus"))

    checks.append(check("no_double_bonus_points", points_before == points_after, f"before={points_before} after={points_after}", layer="db"))
    checks.append(check("no_double_bonus_ledger", ledger_before == ledger_after == 1, f"before={ledger_before} after={ledger_after}", layer="db"))

    return StepResult(step=7, title="Idempotence bonus parrainage", passed=all(c.passed for c in checks), checks=checks)


def step_audit_and_notifications(ctx: Ctx) -> StepResult:
    checks: list[CheckResult] = []
    session = _session()
    try:
        audits = (
            session.query(AuditLog)
            .filter(AuditLog.resource_id.in_([UUID(ctx.first_order_id), UUID(ctx.redeem_order_id), UUID(ctx.referee_order_id)]))
            .all()
        )
        actions = {str(a.action) for a in audits}
        checks.append(check("audit_loyalty_earned", "loyalty_points_earned" in actions, f"actions={actions}", layer="db"))
        checks.append(check("audit_loyalty_redeemed", "loyalty_points_redeemed" in actions, f"actions={actions}", layer="db"))
        checks.append(check("audit_referral_bonus", "referral_bonus_awarded" in actions, f"actions={actions}", layer="db"))

        notifications = session.query(Notification).filter(
            Notification.user_id.in_([UUID(ctx.customer_id), UUID(ctx.referrer_id)])
        ).all()
        types = {str(n.notification_type) for n in notifications}
        checks.append(check("notification_loyalty_earned", "loyalty_points_earned" in types, f"types={types}", layer="db"))
        checks.append(check("notification_referral_bonus", "referral_bonus_awarded" in types, f"types={types}", layer="db"))
    finally:
        session.close()

    return StepResult(step=8, title="Audit et notifications corridor", passed=all(c.passed for c in checks), checks=checks)


def run() -> tuple[list[StepResult], Ctx]:
    ctx = Ctx()
    steps: list[StepResult] = []
    for runner in (
        enable_program_settings,
        setup_customer_and_catalog,
        step_loyalty_earn,
        step_loyalty_redeem,
        step_referral_signup,
        step_referral_bonus,
        step_referral_idempotence,
        step_audit_and_notifications,
    ):
        result = runner(ctx)
        steps.append(result)
        print_step(result)
        if not result.passed:
            break
    return steps, ctx


def main() -> int:
    print("Sprint 6.5 — Loyalty / Referral Truth Validation")
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

    steps, _ctx = run()
    passed = sum(1 for s in steps if s.passed)
    total = 8
    print("\n" + "=" * 60)
    print(f"Résultat: {passed}/{total} étapes")
    if passed == total:
        print("VERDICT: GO — corridor fidélité/parrainage validé.")
        return 0
    failed = next(s for s in steps if not s.passed)
    print(f"VERDICT: NO-GO — bloqué à l'étape {failed.step}: {failed.title}")
    print(f"         {failed.detail}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
