#!/usr/bin/env python3
"""
Verifie si une cible staging configuree peut executer les 5 flows critiques:
- auth
- order
- payment
- logistics
- dispute/refund

Le script ne suppose pas qu'un simple 200 = staging valide.
Il exige une cible coherente, des roles operables, et l'execution reelle des flows.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib import error, parse, request
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[1]

API_BASE_URL = os.getenv("STAGING_API_BASE_URL", "").rstrip("/")
STAGING_DATABASE_URL = os.getenv("STAGING_DATABASE_URL", "")
STAGING_DATABASE_URL_SYNC = os.getenv("STAGING_DATABASE_URL_SYNC", "")
PAYMENT_PROVIDER_MODE = os.getenv("STAGING_PAYMENT_PROVIDER_MODE", "unspecified")

DEFAULT_ADMIN_EMAIL = os.getenv("STAGING_ADMIN_EMAIL", "")
DEFAULT_ADMIN_PASSWORD = os.getenv("STAGING_ADMIN_PASSWORD", "")
DEFAULT_PARTNER_OWNER_EMAIL = os.getenv("STAGING_PARTNER_OWNER_EMAIL", "")
DEFAULT_PARTNER_OWNER_PASSWORD = os.getenv("STAGING_PARTNER_OWNER_PASSWORD", "")
DEFAULT_DRIVER_EMAIL = os.getenv("STAGING_DRIVER_EMAIL", "")
DEFAULT_DRIVER_PASSWORD = os.getenv("STAGING_DRIVER_PASSWORD", "")
DEFAULT_LOGISTICS_EMAIL = os.getenv("STAGING_LOGISTICS_EMAIL", "")
DEFAULT_LOGISTICS_PASSWORD = os.getenv("STAGING_LOGISTICS_PASSWORD", "")
CUSTOMER_PASSWORD = os.getenv("STAGING_SMOKE_TEST_USER_PASSWORD", "").strip() or (
    f"FlowPass-{uuid4().hex[:12]}!aA1"
)


@dataclass
class StepResult:
    name: str
    success: bool
    detail: str


@dataclass
class FlowResult:
    name: str
    success: bool
    detail: str
    steps: list[StepResult] = field(default_factory=list)


def mask(value: str) -> str:
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "..." + value[-4:]


def health_url(api_base_url: str) -> str:
    if api_base_url.endswith("/api/v1"):
        return f"{api_base_url[:-7]}/health"
    return f"{api_base_url}/health"


def parse_db_identity(raw_url: str) -> tuple[str, int | None, str, str]:
    parsed = parse.urlparse(raw_url)
    db_name = parsed.path.lstrip("/")
    return parsed.hostname or "", parsed.port, parsed.username or "", db_name


def request_json(
    method: str,
    url: str,
    payload: dict[str, Any] | None = None,
    token: str | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, Any]]:
    final_headers = {"Content-Type": "application/json"}
    if token:
        final_headers["Authorization"] = f"Bearer {token}"
    if headers:
        final_headers.update(headers)

    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, headers=final_headers, method=method)

    try:
        with request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
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
) -> tuple[int, dict[str, Any]]:
    return request_json(method, f"{API_BASE_URL}{path}", payload=payload, token=token, headers=headers)


def pass_step(name: str, detail: str) -> StepResult:
    return StepResult(name=name, success=True, detail=detail)


def fail_step(name: str, detail: str) -> StepResult:
    return StepResult(name=name, success=False, detail=detail)


def flow_result(name: str, steps: list[StepResult]) -> FlowResult:
    failed = next((step for step in steps if not step.success), None)
    if failed:
        return FlowResult(name=name, success=False, detail=failed.detail, steps=steps)
    return FlowResult(name=name, success=True, detail="all staging checks passed", steps=steps)


def login(email: str, password: str) -> tuple[str, dict[str, Any]]:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200 or "access_token" not in body:
        raise RuntimeError(f"login failed for {email}: {status} {body}")
    token = body["access_token"]
    me_status, me_body = api_request("GET", "/auth/me", token=token)
    if me_status != 200 or "user" not in me_body:
        raise RuntimeError(f"/auth/me failed for {email}: {me_status} {me_body}")
    return token, me_body


def build_customer_identity() -> tuple[str, str, str]:
    slug = uuid4().hex[:10]
    email = f"staging-flow-{slug}@example.com"
    phone = f"+24381{slug[:7].replace('a', '1').replace('b', '2').replace('c', '3').replace('d', '4').replace('e', '5').replace('f', '6')}"
    return email, phone, slug


def choose_catalog_service(preferred_partner_ids: list[str] | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
    status, partners = api_request("GET", "/catalog/partners")
    if status != 200 or not isinstance(partners, list):
        raise RuntimeError(f"catalog partners unavailable: {status} {partners}")
    if not partners:
        raise RuntimeError("catalog partners list is empty")

    preferred_partner_ids = preferred_partner_ids or []
    if preferred_partner_ids:
        preferred_set = {str(item) for item in preferred_partner_ids}
        ordered_partners = [
            *[partner for partner in partners if str(partner.get("id")) in preferred_set],
            *[partner for partner in partners if str(partner.get("id")) not in preferred_set],
        ]
    else:
        ordered_partners = partners

    last_error = "no partner services available"
    for partner in ordered_partners:
        partner_id = partner.get("id")
        if not partner_id:
            continue
        service_status, services = api_request("GET", f"/catalog/partners/{partner_id}/services")
        if service_status == 200 and isinstance(services, list) and services:
            return partner, services[0]
        last_error = f"partner {partner.get('name', partner_id)} has no usable services"

    raise RuntimeError(last_error)


def ensure_driver_exists(admin_token: str, driver_user_id: str) -> str:
    status, body = api_request("GET", "/logistics/drivers?page=1&page_size=100", token=admin_token)
    if status != 200:
        raise RuntimeError(f"cannot list drivers: {status} {body}")

    for driver in body.get("drivers", []):
        if str(driver.get("user_id")) == str(driver_user_id):
            return str(driver["id"])

    create_payload = {
        "user_id": driver_user_id,
        "vehicle_type": "Moto",
        "license_number": f"STAGE-{uuid4().hex[:8].upper()}",
        "status": "active",
        "is_available": True,
    }
    create_status, create_body = api_request("POST", "/logistics/drivers", create_payload, token=admin_token)
    if create_status == 201 and create_body.get("id"):
        return str(create_body["id"])

    status, body = api_request("GET", "/logistics/drivers?page=1&page_size=100", token=admin_token)
    if status == 200:
        for driver in body.get("drivers", []):
            if str(driver.get("user_id")) == str(driver_user_id):
                return str(driver["id"])

    raise RuntimeError(f"driver bootstrap failed: {create_status} {create_body}")


def run_auth_and_order_flow() -> tuple[FlowResult, FlowResult, dict[str, Any]]:
    steps: list[StepResult] = []
    runtime: dict[str, Any] = {}

    try:
        status, body = request_json("GET", health_url(API_BASE_URL))
        if status != 200 or body.get("status") != "healthy":
            steps.append(fail_step("health", f"unexpected health response: {status} {body}"))
            return flow_result("auth", steps), FlowResult(
                name="order",
                success=False,
                detail="blocked by failed auth flow",
                steps=[fail_step("blocked", "auth flow failed at health")],
            ), runtime
        steps.append(pass_step("health", body.get("status", "healthy")))

        email, phone, slug = build_customer_identity()
        register_payload = {
            "email": email,
            "phone": phone,
            "name": f"Staging Flow {slug}",
            "password": CUSTOMER_PASSWORD,
        }
        status, body = api_request("POST", "/auth/register", register_payload)
        if status != 201 or "id" not in body:
            steps.append(fail_step("register", f"expected 201, got {status}: {body}"))
            return flow_result("auth", steps), FlowResult(
                name="order",
                success=False,
                detail="blocked by failed auth flow",
                steps=[fail_step("blocked", "auth flow failed at register")],
            ), runtime
        steps.append(pass_step("register", body["email"]))
        runtime["customer_email"] = email
        runtime["customer_phone"] = phone
        runtime["customer_id"] = body["id"]

        status, body = api_request("POST", "/auth/login", {"email": email, "password": CUSTOMER_PASSWORD})
        if status != 200 or "access_token" not in body:
            steps.append(fail_step("login", f"expected 200, got {status}: {body}"))
            return flow_result("auth", steps), FlowResult(
                name="order",
                success=False,
                detail="blocked by failed auth flow",
                steps=[fail_step("blocked", "auth flow failed at login")],
            ), runtime
        customer_token = body["access_token"]
        runtime["customer_token"] = customer_token
        steps.append(pass_step("login", "access token issued"))

        status, body = api_request("GET", "/auth/me", token=customer_token)
        if status != 200 or body.get("user", {}).get("email") != email:
            steps.append(fail_step("me", f"unexpected /auth/me response: {status} {body}"))
            return flow_result("auth", steps), FlowResult(
                name="order",
                success=False,
                detail="blocked by failed auth flow",
                steps=[fail_step("blocked", "auth flow failed at /auth/me")],
            ), runtime
        steps.append(pass_step("me", body["user"]["id"]))

        auth_flow = flow_result("auth", steps)
        if not auth_flow.success:
            return auth_flow, FlowResult(
                name="order",
                success=False,
                detail="blocked by failed auth flow",
                steps=[fail_step("blocked", "auth flow failed")],
            ), runtime

        order_steps: list[StepResult] = []
        try:
            partner_owner_token, partner_owner_context = login(DEFAULT_PARTNER_OWNER_EMAIL, DEFAULT_PARTNER_OWNER_PASSWORD)
            runtime["partner_owner_token"] = partner_owner_token
            runtime["partner_owner_context"] = partner_owner_context
            order_steps.append(pass_step("partner_owner_login", DEFAULT_PARTNER_OWNER_EMAIL))
        except Exception as exc:
            order_steps.append(fail_step("partner_owner_login", str(exc)))
            return auth_flow, flow_result("order", order_steps), runtime

        address_payload = {
            "user_id": runtime["customer_id"],
            "label": "Staging Smoke",
            "contact_name": register_payload["name"],
            "contact_phone": phone,
            "address_line_1": "123 Avenue Staging",
            "address_line_2": "Bloc A",
            "city": "Kinshasa",
            "commune": "Gombe",
            "zone": "Centre Ville",
            "reference_point": "Porte bleue",
            "is_default": True,
        }
        status, body = api_request("POST", "/users/me/addresses", address_payload, token=customer_token)
        if status != 201 or "id" not in body:
            order_steps.append(fail_step("create_address", f"expected 201, got {status}: {body}"))
            return auth_flow, flow_result("order", order_steps), runtime
        runtime["address_id"] = body["id"]
        order_steps.append(pass_step("create_address", str(body["id"])))

        preferred_partner_ids = []
        if runtime["partner_owner_context"].get("primary_partner_id"):
            preferred_partner_ids.append(str(runtime["partner_owner_context"]["primary_partner_id"]))
        preferred_partner_ids.extend(str(item) for item in runtime["partner_owner_context"].get("partner_ids", []))

        try:
            partner, service = choose_catalog_service(preferred_partner_ids)
        except Exception as exc:
            order_steps.append(fail_step("catalog", str(exc)))
            return auth_flow, flow_result("order", order_steps), runtime
        runtime["partner"] = partner
        runtime["service"] = service
        order_steps.append(
            pass_step(
                "catalog",
                f"{partner.get('name', partner.get('id'))} / {service.get('service_type_name', service.get('id'))}",
            )
        )

        pricing_payload = {
            "partner_id": partner["id"],
            "items": [
                {
                    "service_id": service["id"],
                    "item_name": service.get("service_type_name") or service.get("name") or "Staging service",
                    "quantity": 1,
                    "notes": "verify_staging_flows.py",
                }
            ],
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
            "promo_code": None,
        }
        status, body = api_request("POST", "/pricing/estimate", pricing_payload, token=customer_token)
        if status != 200 or "total" not in body:
            order_steps.append(fail_step("pricing", f"expected 200, got {status}: {body}"))
            return auth_flow, flow_result("order", order_steps), runtime
        runtime["pricing_estimate"] = body
        order_steps.append(pass_step("pricing", f"{body['total']} {body.get('currency', 'N/A')}"))

        order_payload = {
            "partner_id": partner["id"],
            "pickup_address_id": runtime["address_id"],
            "delivery_address_id": runtime["address_id"],
            "items": [
                {
                    "service_id": service["id"],
                    "item_name": service.get("service_type_name") or service.get("name") or "Staging service",
                    "quantity": "1.00",
                    "unit_price": str(service.get("base_price") or "0"),
                    "notes": "staging flow order",
                    "detected_by_ai": False,
                }
            ],
            "currency": body.get("currency", "CDF"),
            "pickup_time_slot": "09:00-12:00",
            "special_instructions": "staging flow proof",
            "express": False,
            "pickup_requested": True,
            "delivery_requested": True,
            "promo_code": None,
        }
        status, body = api_request(
            "POST",
            "/orders",
            order_payload,
            token=customer_token,
            headers={"Idempotency-Key": f"staging-flow-{uuid4().hex[:12]}"},
        )
        if status != 201 or "id" not in body:
            order_steps.append(fail_step("create_order", f"expected 201, got {status}: {body}"))
            return auth_flow, flow_result("order", order_steps), runtime
        runtime["order"] = body
        order_steps.append(pass_step("create_order", f"{body['order_number']} / {body['status']}"))
        return auth_flow, flow_result("order", order_steps), runtime
    except Exception as exc:
        steps.append(fail_step("unexpected_exception", f"{type(exc).__name__}: {exc}"))
        return flow_result("auth", steps), FlowResult(
            name="order",
            success=False,
            detail="blocked by unexpected auth/bootstrap exception",
            steps=[fail_step("blocked", str(exc))],
        ), runtime


def run_payment_flow(runtime: dict[str, Any]) -> FlowResult:
    steps: list[StepResult] = []
    try:
        partner_owner_token = runtime.get("partner_owner_token")
        partner_owner_context = runtime.get("partner_owner_context")
        if not partner_owner_token or not partner_owner_context:
            partner_owner_token, partner_owner_context = login(DEFAULT_PARTNER_OWNER_EMAIL, DEFAULT_PARTNER_OWNER_PASSWORD)
            runtime["partner_owner_token"] = partner_owner_token
            runtime["partner_owner_context"] = partner_owner_context
        steps.append(pass_step("partner_owner_login", DEFAULT_PARTNER_OWNER_EMAIL))

        customer_token = runtime["customer_token"]
        order = runtime["order"]
        payment_payload = {
            "order_id": order["id"],
            "payment_method": "cash_on_delivery",
            "amount_expected": float(order["total_amount"]),
            "currency": order.get("currency", "CDF"),
            "provider_name": None,
            "expires_at": None,
            "payment_metadata": {"source": "verify_staging_flows.py", "provider_mode": PAYMENT_PROVIDER_MODE},
        }
        status, body = api_request("POST", "/payments/intents", payment_payload, token=customer_token)
        if status != 201 or "id" not in body:
            steps.append(fail_step("create_payment_intent", f"expected 201, got {status}: {body}"))
            return flow_result("payment", steps)
        runtime["payment_intent"] = body
        steps.append(pass_step("create_payment_intent", f"{body['id']} / {body['status']}"))

        confirm_payload = {
            "confirmed_by_user_id": runtime["customer_id"],
            "amount_paid": float(order["total_amount"]),
            "notes": "staging flow cash confirmation",
        }
        status, body = api_request(
            "POST",
            f"/payments/intents/{runtime['payment_intent']['id']}/confirm-cash",
            confirm_payload,
            token=partner_owner_token,
        )
        if status != 200:
            steps.append(fail_step("confirm_cash", f"expected 200, got {status}: {body}"))
            return flow_result("payment", steps)
        steps.append(pass_step("confirm_cash", body.get("status", "confirmed")))
        return flow_result("payment", steps)
    except Exception as exc:
        steps.append(fail_step("unexpected_exception", f"{type(exc).__name__}: {exc}"))
        return flow_result("payment", steps)


def run_logistics_flow(runtime: dict[str, Any]) -> FlowResult:
    steps: list[StepResult] = []
    try:
        admin_token, _ = login(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
        logistics_token, _ = login(DEFAULT_LOGISTICS_EMAIL, DEFAULT_LOGISTICS_PASSWORD)
        driver_token, driver_context = login(DEFAULT_DRIVER_EMAIL, DEFAULT_DRIVER_PASSWORD)
        driver_user = driver_context["user"]
        partner_owner_token = runtime.get("partner_owner_token")
        if not partner_owner_token:
            partner_owner_token, partner_owner_context = login(DEFAULT_PARTNER_OWNER_EMAIL, DEFAULT_PARTNER_OWNER_PASSWORD)
            runtime["partner_owner_token"] = partner_owner_token
            runtime["partner_owner_context"] = partner_owner_context

        steps.append(pass_step("admin_login", DEFAULT_ADMIN_EMAIL))
        steps.append(pass_step("logistics_login", DEFAULT_LOGISTICS_EMAIL))
        steps.append(pass_step("driver_login", DEFAULT_DRIVER_EMAIL))

        driver_id = ensure_driver_exists(admin_token, str(driver_user["id"]))
        runtime["driver_id"] = driver_id
        steps.append(pass_step("ensure_driver", driver_id))

        status, body = api_request(
            "POST",
            f"/logistics/drivers/{driver_id}/location",
            {"latitude": -4.325, "longitude": 15.322},
            token=driver_token,
        )
        if status != 200:
            steps.append(fail_step("driver_location", f"expected 200, got {status}: {body}"))
            return flow_result("logistics", steps)
        steps.append(pass_step("driver_location", "location updated"))

        task_payload = {
            "order_id": runtime["order"]["id"],
            "task_type": "pickup",
            "pickup_location_type": "customer",
            "dropoff_location_type": "partner",
            "scheduled_at": None,
        }
        status, body = api_request("POST", "/logistics/tasks/pickup", task_payload, token=partner_owner_token)
        if status != 201 or "id" not in body:
            steps.append(fail_step("create_pickup_task", f"expected 201, got {status}: {body}"))
            return flow_result("logistics", steps)
        runtime["task"] = body
        steps.append(pass_step("create_pickup_task", body["id"]))

        status, body = api_request(
            "POST",
            f"/logistics/tasks/{runtime['task']['id']}/assign",
            {"driver_id": driver_id},
            token=logistics_token,
        )
        if status != 200:
            steps.append(fail_step("assign_driver", f"expected 200, got {status}: {body}"))
            return flow_result("logistics", steps)
        steps.append(pass_step("assign_driver", body.get("status", "driver_assigned")))

        for action in ["accept", "start", "complete"]:
            payload = {}
            if action == "complete":
                payload = {
                    "proof_note": "staging logistics completion",
                    "proof_photo_url": "https://example.com/staging-proof.jpg",
                }
            status, body = api_request(
                "POST",
                f"/logistics/tasks/{runtime['task']['id']}/{action}",
                payload,
                token=driver_token,
            )
            if status != 200:
                steps.append(fail_step(action, f"expected 200, got {status}: {body}"))
                return flow_result("logistics", steps)
            steps.append(pass_step(action, body.get("status", action)))

        status, body = api_request("GET", "/logistics/tasks?page=1&page_size=50", token=driver_token)
        if status != 200:
            steps.append(fail_step("list_driver_tasks", f"expected 200, got {status}: {body}"))
            return flow_result("logistics", steps)
        found = any(item.get("id") == runtime["task"]["id"] for item in body.get("tasks", []))
        if not found:
            steps.append(fail_step("list_driver_tasks", "created task not visible in driver task list"))
            return flow_result("logistics", steps)
        steps.append(pass_step("list_driver_tasks", "created task visible"))
        return flow_result("logistics", steps)
    except Exception as exc:
        steps.append(fail_step("unexpected_exception", f"{type(exc).__name__}: {exc}"))
        return flow_result("logistics", steps)


def run_dispute_refund_flow(runtime: dict[str, Any]) -> FlowResult:
    steps: list[StepResult] = []
    try:
        admin_token, _ = login(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
        partner_owner_token = runtime.get("partner_owner_token")
        if not partner_owner_token:
            partner_owner_token, partner_owner_context = login(DEFAULT_PARTNER_OWNER_EMAIL, DEFAULT_PARTNER_OWNER_PASSWORD)
            runtime["partner_owner_token"] = partner_owner_token
            runtime["partner_owner_context"] = partner_owner_context
        driver_token, _ = login(DEFAULT_DRIVER_EMAIL, DEFAULT_DRIVER_PASSWORD)
        customer_token = runtime["customer_token"]
        order = runtime["order"]
        requested_amount = float(order["total_amount"])

        dispute_payload = {
            "order_id": order["id"],
            "category": "quality_issue",
            "title": "Staging quality issue",
            "description": "Created by verify_staging_flows.py",
            "refund_requested": True,
            "requested_amount": requested_amount,
        }
        status, body = api_request("POST", "/disputes", dispute_payload, token=customer_token)
        if status != 201 or "id" not in body:
            steps.append(fail_step("create_dispute", f"expected 201, got {status}: {body}"))
            return flow_result("dispute_refund", steps)
        runtime["dispute"] = body
        refund_requests = body.get("refund_requests") or []
        if not refund_requests:
            steps.append(fail_step("create_dispute", "dispute created without refund request"))
            return flow_result("dispute_refund", steps)
        runtime["refund_request_id"] = refund_requests[0]["id"]
        steps.append(pass_step("create_dispute", body["id"]))
        steps.append(pass_step("refund_request_created", runtime["refund_request_id"]))

        status, body = api_request("GET", f"/disputes/{runtime['dispute']['id']}", token=partner_owner_token)
        if status != 200:
            steps.append(fail_step("partner_read_dispute", f"expected 200, got {status}: {body}"))
            return flow_result("dispute_refund", steps)
        steps.append(pass_step("partner_read_dispute", body.get("status", "visible")))

        status, body = api_request("GET", f"/disputes/{runtime['dispute']['id']}", token=driver_token)
        if status != 403:
            steps.append(fail_step("driver_forbidden_dispute", f"expected 403, got {status}: {body}"))
            return flow_result("dispute_refund", steps)
        steps.append(pass_step("driver_forbidden_dispute", "403 confirmed"))

        status, body = api_request(
            "POST",
            f"/refunds/requests/{runtime['refund_request_id']}/approve",
            {"approved_amount": requested_amount, "notes": "staging approval"},
            token=admin_token,
        )
        if status != 200:
            steps.append(fail_step("approve_refund", f"expected 200, got {status}: {body}"))
            return flow_result("dispute_refund", steps)
        steps.append(pass_step("approve_refund", body.get("status", "approved")))

        status, body = api_request(
            "POST",
            f"/refunds/requests/{runtime['refund_request_id']}/process",
            token=admin_token,
        )
        if status != 200:
            steps.append(fail_step("process_refund", f"expected 200, got {status}: {body}"))
            return flow_result("dispute_refund", steps)
        steps.append(pass_step("process_refund", body.get("status", "processed")))
        return flow_result("dispute_refund", steps)
    except Exception as exc:
        steps.append(fail_step("unexpected_exception", f"{type(exc).__name__}: {exc}"))
        return flow_result("dispute_refund", steps)


def preflight() -> tuple[bool, list[str]]:
    issues: list[str] = []
    if not API_BASE_URL:
        issues.append("STAGING_API_BASE_URL missing")
    if not STAGING_DATABASE_URL:
        issues.append("STAGING_DATABASE_URL missing")
    if not STAGING_DATABASE_URL_SYNC:
        issues.append("STAGING_DATABASE_URL_SYNC missing")
    if issues:
        return False, issues

    async_identity = parse_db_identity(STAGING_DATABASE_URL)
    sync_identity = parse_db_identity(STAGING_DATABASE_URL_SYNC)
    if async_identity != sync_identity:
        issues.append(
            "STAGING_DATABASE_URL and STAGING_DATABASE_URL_SYNC do not point to the same host/db/user"
        )
    return len(issues) == 0, issues


def print_preflight() -> None:
    print("Staging flow verification")
    print("========================")
    print(f"API base: {API_BASE_URL or '<missing>'}")
    print(f"Async DB : {mask(STAGING_DATABASE_URL) if STAGING_DATABASE_URL else '<missing>'}")
    print(f"Sync DB  : {mask(STAGING_DATABASE_URL_SYNC) if STAGING_DATABASE_URL_SYNC else '<missing>'}")
    print(f"Provider : {PAYMENT_PROVIDER_MODE}")


def print_flow(flow: FlowResult) -> None:
    print(f"\n[{flow.name}] {'PASS' if flow.success else 'FAIL'}")
    for step in flow.steps:
        mark = "PASS" if step.success else "FAIL"
        print(f"- {mark} {step.name}: {step.detail}")


def main() -> int:
    print_preflight()
    preflight_ok, issues = preflight()
    if not preflight_ok:
        print("\nPreflight")
        for issue in issues:
            print(f"- FAIL {issue}")
        print("\nVerdict")
        print("NO-GO: staging target is not coherently configured.")
        return 1

    auth_flow, order_flow, runtime = run_auth_and_order_flow()
    payment_flow = run_payment_flow(runtime) if auth_flow.success and order_flow.success else FlowResult(
        name="payment",
        success=False,
        detail="blocked by failed auth/order flow",
        steps=[fail_step("blocked", "auth/order flow failed earlier")],
    )
    logistics_flow = run_logistics_flow(runtime) if payment_flow.success else FlowResult(
        name="logistics",
        success=False,
        detail="blocked by failed payment flow",
        steps=[fail_step("blocked", "payment flow failed earlier")],
    )
    dispute_refund_flow = run_dispute_refund_flow(runtime) if payment_flow.success else FlowResult(
        name="dispute_refund",
        success=False,
        detail="blocked by failed payment flow",
        steps=[fail_step("blocked", "payment flow failed earlier")],
    )

    flows = [auth_flow, order_flow, payment_flow, logistics_flow, dispute_refund_flow]

    for flow in flows:
        print_flow(flow)

    passed = sum(1 for flow in flows if flow.success)
    total = len(flows)

    print("\nSummary")
    print(f"Flows passed: {passed}/{total}")

    failed = [flow for flow in flows if not flow.success]
    if failed:
        print("\nVerdict")
        print("NO-GO: staging cannot execute all critical flows yet.")
        print("Blocking reasons:")
        for flow in failed:
            print(f"- {flow.name}: {flow.detail}")
        return 1

    print("\nVerdict")
    print("GO: staging executed all critical flows successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
