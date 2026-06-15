#!/usr/bin/env python
"""
Growth Engine V1.1 truth validation.

Checks the backend Growth contract against the local Docker API and Postgres:
admin-only access, stable dashboard fields, aggregate-only RFM output, actionable
promo risk actions, automation preparation, and audit log mutations.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from uuid import UUID, uuid4

from validate_customer_corridor_truth import (
    API_BASE_URL,
    DATABASE_URL_SYNC,
    RuntimeContext as CorridorRuntimeContext,
    StepResult,
    api_request,
    check,
    ensure_admin_token,
    preflight,
    print_step,
    _session,
)

from app.models.admin import AuditLog
from app.models.marketing_campaign import MarketingAutomation
from app.models.promotion import PromoCode, PromoDiscountType


@dataclass
class GrowthRuntimeContext:
    run_slug: str = field(default_factory=lambda: uuid4().hex[:10])
    admin_token: str = ""
    promo_code: str = ""
    promo_id: str = ""
    automation_id: str = ""


def _corridor_ctx(ctx: GrowthRuntimeContext) -> CorridorRuntimeContext:
    corridor = CorridorRuntimeContext()
    corridor.run_slug = ctx.run_slug
    corridor.admin_token = ctx.admin_token
    return corridor


def ensure_growth_admin_token(ctx: GrowthRuntimeContext) -> tuple[str, str]:
    corridor = _corridor_ctx(ctx)
    token, source = ensure_admin_token(corridor)
    ctx.admin_token = token
    return token, source


def seed_growth_promo(ctx: GrowthRuntimeContext) -> None:
    ctx.promo_code = f"GROWTH{ctx.run_slug[:8].upper()}"
    session = _session()
    try:
        existing = session.query(PromoCode).filter(PromoCode.code == ctx.promo_code).first()
        if existing:
            session.delete(existing)
            session.flush()

        promo = PromoCode(
            code=ctx.promo_code,
            discount_type=PromoDiscountType.PERCENTAGE.value,
            discount_value=Decimal("55.00"),
            min_order_value=Decimal("1.00"),
            is_for_new_users_only=False,
            is_active=True,
            usage_count=3,
            max_usage=1,
            usage_limit_per_customer=1,
            description="Growth V1.1 truth promo risk",
        )
        session.add(promo)
        session.commit()
        ctx.promo_id = str(promo.id)
    finally:
        session.close()


def db_promo(ctx: GrowthRuntimeContext) -> PromoCode | None:
    if not ctx.promo_id:
        return None
    session = _session()
    try:
        return session.query(PromoCode).filter(PromoCode.id == UUID(ctx.promo_id)).first()
    finally:
        session.close()


def db_automation(automation_id: str) -> MarketingAutomation | None:
    if not automation_id:
        return None
    session = _session()
    try:
        return session.query(MarketingAutomation).filter(MarketingAutomation.id == UUID(automation_id)).first()
    finally:
        session.close()


def db_has_audit(action: str, resource_id: str) -> bool:
    session = _session()
    try:
        return (
            session.query(AuditLog)
            .filter(AuditLog.action == action, AuditLog.resource_id == UUID(resource_id))
            .first()
            is not None
        )
    finally:
        session.close()


def cleanup_growth_data(ctx: GrowthRuntimeContext) -> None:
    session = _session()
    try:
        if ctx.automation_id:
            automation = session.query(MarketingAutomation).filter(MarketingAutomation.id == UUID(ctx.automation_id)).first()
            if automation:
                session.delete(automation)
        if ctx.promo_id:
            promo = session.query(PromoCode).filter(PromoCode.id == UUID(ctx.promo_id)).first()
            if promo:
                session.delete(promo)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def step_contract_and_dashboard(ctx: GrowthRuntimeContext) -> StepResult:
    checks = []
    token, source = ensure_growth_admin_token(ctx)
    checks.append(check("admin_token", bool(token), source))

    status, body = api_request("GET", "/admin/campaigns/growth/dashboard")
    checks.append(check("admin_only_dashboard", status in {401, 403}, f"{status} {body}"))

    status, body = api_request("GET", "/admin/campaigns/growth/dashboard", token=token)
    ok = status == 200 and isinstance(body, dict)
    checks.append(check("dashboard_status", ok, f"{status} {body}"))
    if not ok:
        return StepResult(step=1, title="Contrat dashboard Growth", passed=False, checks=checks)

    expected_fields = {
        "acquisition",
        "activation",
        "conversion",
        "retention",
        "referral",
        "revenue",
        "rfm_segments",
        "automations",
        "promo_fraud_risks",
        "trending_offers",
        "roi",
        "source",
    }
    missing = expected_fields - set(body.keys())
    checks.append(check("stable_fields", not missing, f"missing={sorted(missing)}"))
    checks.append(check("backend_source", body.get("source") == "backend", str(body.get("source"))))

    rfm = body.get("rfm_segments", [])
    pii_fields = {"customer_id", "user_id", "email", "phone", "name", "customer_name"}
    exposed = set()
    if isinstance(rfm, list):
        for segment in rfm:
            if isinstance(segment, dict):
                exposed.update(pii_fields.intersection(segment.keys()))
    checks.append(check("rfm_aggregate_only", not exposed, f"pii_fields={sorted(exposed)}", layer="api↔privacy"))

    roi = body.get("roi")
    roi_fields = {
        "promo_revenue",
        "loyalty_revenue",
        "referral_revenue",
        "remarketing_revenue",
        "reactivation_revenue",
        "estimated_cac",
        "estimated_ltv",
        "estimated_roi",
    }
    roi_missing = roi_fields - set(roi.keys()) if isinstance(roi, dict) else roi_fields
    checks.append(check("roi_contract", not roi_missing, f"missing={sorted(roi_missing)}"))

    return StepResult(step=1, title="Contrat dashboard Growth", passed=all(c.passed for c in checks), checks=checks)


def step_promo_fraud_actions(ctx: GrowthRuntimeContext) -> StepResult:
    checks = []
    seed_growth_promo(ctx)

    status, risks = api_request("GET", "/admin/campaigns/growth/promo-fraud", token=ctx.admin_token)
    risk = None
    if isinstance(risks, list):
        risk = next((item for item in risks if isinstance(item, dict) and item.get("promo_code") == ctx.promo_code), None)
    checks.append(check("promo_risk_listed", status == 200 and risk is not None, f"{status} {risk or risks}"))
    if isinstance(risk, dict):
        checks.append(check("promo_risk_actionable", risk.get("severity") in {"medium", "high"} and bool(risk.get("recommended_action")), str(risk)))

    status, body = api_request(
        "POST",
        f"/admin/campaigns/growth/promo-fraud/{ctx.promo_code}/review",
        {"note": "Growth V1.1 truth review"},
        token=ctx.admin_token,
    )
    reviewed = status == 200 and isinstance(body, dict) and body.get("action") == "growth_promo_risk_reviewed"
    checks.append(check("review_action", reviewed, f"{status} {body}"))
    checks.append(check("review_audit", db_has_audit("growth_promo_risk_reviewed", ctx.promo_id), ctx.promo_id, layer="db"))

    status, body = api_request(
        "POST",
        f"/admin/campaigns/growth/promo-fraud/{ctx.promo_code}/suspend",
        {"note": "Growth V1.1 truth suspend"},
        token=ctx.admin_token,
    )
    suspended = status == 200 and isinstance(body, dict) and body.get("action") == "growth_promo_suspended"
    checks.append(check("suspend_action", suspended, f"{status} {body}"))

    promo = db_promo(ctx)
    checks.append(check("promo_suspended_in_db", promo is not None and promo.is_active is False, f"promo_active={getattr(promo, 'is_active', None)}", layer="api↔db"))
    checks.append(check("suspend_audit", db_has_audit("growth_promo_suspended", ctx.promo_id), ctx.promo_id, layer="db"))

    return StepResult(step=2, title="Actions promo fraud Growth", passed=all(c.passed for c in checks), checks=checks)


def step_automation_action(ctx: GrowthRuntimeContext) -> StepResult:
    checks = []

    status, body = api_request(
        "POST",
        "/admin/campaigns/growth/automations/abandoned_cart/prepare",
        {"note": "Growth V1.1 truth automation"},
        token=ctx.admin_token,
    )
    ok = status == 200 and isinstance(body, dict) and body.get("action") == "growth_automation_prepared"
    checks.append(check("prepare_action", ok, f"{status} {body}"))
    if ok:
        ctx.automation_id = str(body.get("resource_id") or "")

    automation = db_automation(ctx.automation_id)
    checks.append(
        check(
            "automation_ready_in_db",
            automation is not None and automation.status == "ready" and automation.is_active is True,
            f"status={getattr(automation, 'status', None)} active={getattr(automation, 'is_active', None)}",
            layer="api↔db",
        )
    )
    checks.append(check("automation_audit", db_has_audit("growth_automation_prepared", ctx.automation_id), ctx.automation_id, layer="db"))

    return StepResult(step=3, title="Action automation Growth", passed=all(c.passed for c in checks), checks=checks)


def run_growth_truth() -> tuple[list[StepResult], GrowthRuntimeContext]:
    ctx = GrowthRuntimeContext()
    steps: list[StepResult] = []
    for runner in [step_contract_and_dashboard, step_promo_fraud_actions, step_automation_action]:
        result = runner(ctx)
        steps.append(result)
        print_step(result)
        if not result.passed:
            break
    return steps, ctx


def main() -> int:
    print("Sprint Growth V1.1 — Growth Engine Truth Validation")
    print("=" * 60)
    print(f"API : {API_BASE_URL}")
    print(f"DB  : {DATABASE_URL_SYNC.split('@')[-1] if '@' in DATABASE_URL_SYNC else DATABASE_URL_SYNC}")
    print("Règles: admin-only | backend truth | no PII RFM | audit actions")
    print()

    issues = preflight()
    if issues:
        print("Preflight FAIL")
        for issue in issues:
            print(f"  - {issue}")
        return 1
    print("Preflight PASS")

    steps, ctx = run_growth_truth()
    passed = sum(1 for step in steps if step.passed)
    total = 3

    print("\n" + "=" * 60)
    print(f"Résultat: {passed}/{total} étapes")
    if passed == total:
        print("VERDICT: GO — Growth Engine V1.1 validé côté contrat API/actions.")
        cleanup_growth_data(ctx)
        return 0

    failed = next(step for step in steps if not step.passed)
    print(f"VERDICT: NO-GO — bloqué à l'étape {failed.step}: {failed.title}")
    print(f"         {failed.detail}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
