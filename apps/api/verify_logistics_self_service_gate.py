#!/usr/bin/env python3
"""
verify_logistics_self_service_gate.py

Gate HTTP pour le self-service logistique multi-tenant :
  1. Escalade de privilèges (403)
  2. Suppression cross-company (404)
  3. Chauffeur orphelin (reclaim CompanyDriver)
  4. Concurrence email (1 succès, 1 échec)
  5. Inventaire véhicules orphelins (delivery_company_id NULL)

Usage:
    python scripts/verify_logistics_self_service_gate.py
"""

from __future__ import annotations

import json
import random
import os
import sys
import threading
import time
from pathlib import Path
from urllib import error, request
from uuid import uuid4

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
sys.path.insert(0, str(ROOT / "scripts"))

from local_test_credentials import load_local_test_credentials  # noqa: E402
from app.models.logistics import Vehicle  # noqa: E402
from app.models.marketplace import CompanyDriver, DeliveryCompany  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:18000/api/v1").rstrip("/")
DATABASE_URL = os.getenv(
    "API_SMOKE_DATABASE_URL",
    "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express",
)

OK = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"


def random_phone() -> str:
    return "+243" + "".join(str(random.randint(0, 9)) for _ in range(9))


def api_request(method: str, path: str, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(f"{API_BASE_URL}{path}", data=body, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"detail": raw}
        return exc.code, parsed


def login(email: str, password: str) -> str:
    status, body = api_request("POST", "/auth/login", {"email": email, "password": password})
    if status != 200:
        raise RuntimeError(f"login failed for {email}: {status} {body}")
    return body["access_token"]


def get_company_ids(db) -> tuple[str, str, str]:
    kin = db.query(DeliveryCompany).filter(DeliveryCompany.slug == "kin-express-logistics").first()
    rapid = db.query(DeliveryCompany).filter(DeliveryCompany.slug == "rapid-courrier-rdc").first()
    if not kin or not rapid:
        raise RuntimeError("Seed companies kin-express-logistics / rapid-courrier-rdc introuvables")
    kin_manager = (
        db.query(User)
        .filter(User.email == "logistics@laundryexpress.cd", User.role == UserRole.LOGISTICS_MANAGER)
        .first()
    )
    if not kin_manager or not kin_manager.delivery_company_id:
        raise RuntimeError("Manager Kin Express sans delivery_company_id")
    if str(kin_manager.delivery_company_id) != str(kin.id):
        raise RuntimeError("Manager Kin Express lié à une compagnie inattendue")
    return str(kin.id), str(rapid.id), str(kin_manager.delivery_company_id)


def test_privilege_escalation(kin_token: str, rapid_company_id: str) -> bool:
    print("TEST 1 — Escalade de privilèges (POST driver + PATCH vehicle)")
    status, body = api_request(
        "POST",
        "/logistics/drivers",
        {
            "delivery_company_id": rapid_company_id,
            "name": "Escalade Test",
            "email": f"escalade-{uuid4().hex[:8]}@kinexpress.cd",
            "phone": random_phone(),
            "password": "driverpass123",
            "vehicle_type": "Moto",
        },
        token=kin_token,
    )
    if status != 403:
        print(f"  {FAIL} POST /logistics/drivers cross-company → {status} {body}")
        return False
    print(f"  {OK} POST /logistics/drivers cross-company → 403")

    plate = f"ESC-{uuid4().hex[:6].upper()}"
    status, vehicle = api_request(
        "POST",
        "/logistics/vehicles",
        {
            "plate": plate,
            "type": "moto",
            "location": "Gombe",
            "zone": "Gombe",
        },
        token=kin_token,
    )
    if status != 201:
        print(f"  {FAIL} setup vehicle Kin → {status} {body}")
        return False

    status, body = api_request(
        "PATCH",
        f"/logistics/vehicles/{vehicle['id']}",
        {"delivery_company_id": rapid_company_id, "zone": "Limete"},
        token=kin_token,
    )
    if status != 403:
        print(f"  {FAIL} PATCH vehicle cross-company → {status} {body}")
        return False
    print(f"  {OK} PATCH /logistics/vehicles cross-company → 403")
    return True


def test_cross_company_delete(rapid_token: str, kin_token: str) -> bool:
    print("TEST 2 — Suppression véhicule d'une autre compagnie")
    plate = f"KIN-{uuid4().hex[:6].upper()}"
    status, vehicle = api_request(
        "POST",
        "/logistics/vehicles",
        {"plate": plate, "type": "moto", "location": "Gombe", "zone": "Gombe"},
        token=kin_token,
    )
    if status != 201:
        print(f"  {FAIL} setup Kin vehicle → {status} {vehicle}")
        return False

    status, body = api_request("DELETE", f"/logistics/vehicles/{vehicle['id']}", token=rapid_token)
    if status in {403, 404}:
        print(f"  {OK} DELETE cross-company → {status}")
        status_check, _ = api_request("GET", f"/logistics/vehicles/{vehicle['id']}", token=kin_token)
        if status_check != 200:
            print(f"  {FAIL} véhicule Kin supprimé par erreur")
            return False
        print(f"  {OK} véhicule Kin toujours présent côté propriétaire")
        return True

    print(f"  {FAIL} DELETE cross-company → {status} {body}")
    return False


def test_orphan_driver_reclaim(db, kin_token: str, kin_company_id: str) -> bool:
    print("TEST 3 — Chauffeur orphelin (CompanyDriver supprimé, User/Driver conservés)")
    email = f"orphan-{uuid4().hex[:8]}@kinexpress.cd"
    phone = random_phone()
    status, created = api_request(
        "POST",
        "/logistics/drivers",
        {
            "name": "Orphan Driver",
            "email": email,
            "phone": phone,
            "password": "driverpass123",
            "vehicle_type": "Moto",
            "license_number": f"ORPH-{uuid4().hex[:4].upper()}",
        },
        token=kin_token,
    )
    if status != 201:
        print(f"  {FAIL} create driver → {status} {created}")
        return False

    driver_id = created["id"]
    link = (
        db.query(CompanyDriver)
        .filter(CompanyDriver.company_id == kin_company_id, CompanyDriver.driver_id == driver_id)
        .first()
    )
    if not link:
        print(f"  {FAIL} CompanyDriver initial introuvable")
        return False
    db.delete(link)
    db.commit()
    print(f"  {OK} CompanyDriver supprimé (orphan simulé)")

    status, reclaimed = api_request(
        "POST",
        "/logistics/drivers",
        {
            "name": "Orphan Driver",
            "email": email,
            "phone": phone,
            "password": "driverpass123",
            "vehicle_type": "Moto",
        },
        token=kin_token,
    )
    if status != 201:
        print(f"  {FAIL} reclaim driver → {status} {reclaimed}")
        return False

    relink = (
        db.query(CompanyDriver)
        .filter(CompanyDriver.company_id == kin_company_id, CompanyDriver.driver_id == driver_id)
        .first()
    )
    if not relink or not relink.is_active:
        print(f"  {FAIL} CompanyDriver non recréé")
        return False
    print(f"  {OK} reclaim → CompanyDriver recréé pour le même Driver/User")
    return True


def test_concurrent_email(kin_token: str) -> bool:
    print("TEST 4 — Concurrence (même email, 2 requêtes parallèles)")
    email = f"john-{uuid4().hex[:8]}@driver.cd"
    phone = random_phone()
    payload = {
        "name": "John Concurrent",
        "email": email,
        "phone": phone,
        "password": "driverpass123",
        "vehicle_type": "Moto",
    }
    results: list[int] = []

    def worker():
        status, _ = api_request("POST", "/logistics/drivers", payload, token=kin_token)
        results.append(status)

    t1 = threading.Thread(target=worker)
    t2 = threading.Thread(target=worker)
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    successes = sum(1 for code in results if code == 201)
    failures = sum(1 for code in results if code != 201)
    if successes == 1 and failures == 1:
        print(f"  {OK} concurrence → 1x201, 1x{[c for c in results if c != 201][0]}")
        return True
    print(f"  {FAIL} concurrence → résultats {results}")
    return False


def test_orphan_vehicles_inventory(db) -> bool:
    print("TEST 5 — Inventaire véhicules orphelins (delivery_company_id NULL)")
    total = db.query(func.count(Vehicle.id)).scalar() or 0
    orphans = db.query(func.count(Vehicle.id)).filter(Vehicle.delivery_company_id.is_(None)).scalar() or 0
    print(f"  INFO total véhicules={total}, orphelins={orphans}")
    if orphans > 5:
        print(f"  {FAIL} {orphans} véhicules orphelins — lancer scripts/backfill_orphan_vehicles.py")
        return False
    if orphans > 0:
        print(f"  {OK} {orphans} orphelin(s) tolérable(s) — backfill recommandé avant prod")
    else:
        print(f"  {OK} aucun véhicule orphelin")
    return True


def run_gate_tests() -> tuple[int, int]:
    """Exécute les 5 tests de sécurité self-service. Retourne (passed, total)."""
    print("=" * 64)
    print("  PHASE 1 — LOGISTICS SELF-SERVICE SECURITY GATE")
    print(f"  API: {API_BASE_URL}")
    print("=" * 64)

    creds = load_local_test_credentials()
    kin_token = login(creds["logistics_manager"]["email"], creds["logistics_manager"]["password"])
    rapid_token = login("logistics2@rapidcourrier.cd", creds["logistics_manager"]["password"])

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        kin_company_id, rapid_company_id, _ = get_company_ids(db)
        results = [
            test_privilege_escalation(kin_token, rapid_company_id),
            test_cross_company_delete(rapid_token, kin_token),
            test_orphan_driver_reclaim(db, kin_token, kin_company_id),
            test_concurrent_email(kin_token),
            test_orphan_vehicles_inventory(db),
        ]
    finally:
        db.close()

    passed = sum(results)
    total = len(results)
    print()
    print("-" * 64)
    if passed == total:
        print(f"  {OK} PHASE 1 OK ({passed}/{total})")
    else:
        print(f"  {FAIL} PHASE 1 FAILED ({passed}/{total})")
    print("-" * 64)
    return passed, total


def main() -> int:
    passed, total = run_gate_tests()
    print("=" * 64)
    if passed == total:
        print(f"  {OK} GATE OK ({passed}/{total})")
    else:
        print(f"  {FAIL} GATE FAILED ({passed}/{total})")
    print("=" * 64)
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
