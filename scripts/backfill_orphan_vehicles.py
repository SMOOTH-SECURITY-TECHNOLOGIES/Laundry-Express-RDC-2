#!/usr/bin/env python3
"""
backfill_orphan_vehicles.py

Assigne delivery_company_id aux véhicules historiques sans compagnie.
Stratégie:
  1. Si driver_id → compagnie active du chauffeur (première trouvée)
  2. Sinon → Kin Express Logistics (slug kin-express-logistics) si présent

Usage:
    python scripts/backfill_orphan_vehicles.py
    python scripts/backfill_orphan_vehicles.py --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.models.logistics import Vehicle  # noqa: E402
from app.models.marketplace import CompanyDriver, DeliveryCompany  # noqa: E402

DATABASE_URL = os.getenv(
    "API_SMOKE_DATABASE_URL",
    "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    fallback = db.query(DeliveryCompany).filter(DeliveryCompany.slug == "kin-express-logistics").first()
    if not fallback:
        print("Kin Express Logistics introuvable — backfill impossible")
        return 1

    orphans = db.query(Vehicle).filter(Vehicle.delivery_company_id.is_(None)).all()
    print(f"Véhicules orphelins: {len(orphans)}")

    updated = 0
    for vehicle in orphans:
        target_company_id = fallback.id
        if vehicle.driver_id:
            link = (
                db.query(CompanyDriver)
                .filter(CompanyDriver.driver_id == vehicle.driver_id, CompanyDriver.is_active == True)
                .order_by(CompanyDriver.created_at.asc())
                .first()
            )
            if link:
                target_company_id = link.company_id

        print(f"  {vehicle.plate} → company {target_company_id}")
        if not args.dry_run:
            vehicle.delivery_company_id = target_company_id
            updated += 1

    if args.dry_run:
        print(f"Dry-run: {len(orphans)} véhicule(s) seraient mis à jour")
        return 0

    db.commit()
    print(f"Backfill terminé: {updated} véhicule(s) mis à jour")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
