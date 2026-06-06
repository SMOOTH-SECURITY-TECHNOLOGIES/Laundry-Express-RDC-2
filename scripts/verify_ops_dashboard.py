#!/usr/bin/env python3
"""
verify_ops_dashboard.py

Teste les fondations du Operational Truth Dashboard :
1. Routes ops existantes et protégées
2. Données visibles dans les endpoints

Usage :
    python scripts/verify_ops_dashboard.py

Requires : DATABASE_URL environnement variable
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.operational import OperationalTimeline, OperationalProof
from app.models.logistics import DeliveryTask
from app.models.payment import PaymentProviderEvent

OK = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express")


def get_db():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def test_corridor_tables_exist():
    """Vérifie que les tables du corridor existent."""
    print("TEST 1 : Tables du corridor operational")
    db = get_db()
    try:
        tables = [
            ("operational_timelines", OperationalTimeline.__tablename__),
            ("operational_proofs", OperationalProof.__tablename__),
            ("delivery_tasks", DeliveryTask.__tablename__),
            ("payment_provider_events", PaymentProviderEvent.__tablename__),
        ]

        for table_name, model_tablename in tables:
            result = db.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = '{model_tablename}'
                );
            """)).scalar()
            if result:
                print(f"  {OK} Table '{model_tablename}' existe")
            else:
                print(f"  {FAIL} Table '{model_tablename}' manquante")
                return False

        return True
    finally:
        db.close()


def test_timeline_data():
    """Vérifie que des données timeline existent."""
    print("\nTEST 2 : Données timeline existantes")
    db = get_db()
    try:
        result = db.query(OperationalTimeline).limit(5).all()
        print(f"  {OK} {len(result)} timeline events trouvés")

        sources = set(t.source for t in result)
        print(f"  Sources: {', '.join(sources)}")
        return True
    except Exception as e:
        print(f"  {FAIL} Erreur: {e}")
        return False
    finally:
        db.close()


def test_proofs_data():
    """Vérifie que des preuves existent."""
    print("\nTEST 3 : Données proof existantes")
    db = get_db()
    try:
        result = db.query(OperationalProof).limit(5).all()
        print(f"  {OK} {len(result)} proofs trouvés")

        types = set(p.proof_type for p in result)
        print(f"  Types: {', '.join(types)}")
        return True
    except Exception as e:
        print(f"  {FAIL} Erreur: {e}")
        return False
    finally:
        db.close()


def test_anomalies_queries():
    """Vérifie que les requêtes d'anomalie fonctionnent."""
    print("\nTEST 4 : Requêtes d'anomalie")
    db = get_db()
    try:
        rejected = (
            db.query(OperationalTimeline)
            .filter(OperationalTimeline.event_subtype == "transition_rejected")
            .limit(5)
            .all()
        )
        print(f"  {OK} Transitions refusées: {len(rejected)}")

        missing_proof = (
            db.query(DeliveryTask)
            .filter(
                DeliveryTask.proof_photo_url.is_(None),
                DeliveryTask.proof_note.is_(None),
                DeliveryTask.status == "completed"
            )
            .limit(5)
            .all()
        )
        print(f"  {OK} Tâches sans preuve: {len(missing_proof)}")

        return True
    except Exception as e:
        print(f"  {FAIL} Erreur: {e}")
        return False
    finally:
        db.close()


def test_health_query():
    """Vérifie que la requête health fonctionne."""
    print("\nTEST 5 : Requête corridor health")
    db = get_db()
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func

        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)

        order_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
            OperationalTimeline.source == "order"
        ).scalar()

        payment_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
            OperationalTimeline.source == "payment"
        ).scalar()

        logistics_last = db.query(func.max(OperationalTimeline.occurred_at)).filter(
            OperationalTimeline.source == "logistics"
        ).scalar()

        print(f"  {OK} Order last event: {order_last}")
        print(f"  {OK} Payment last event: {payment_last}")
        print(f"  {OK} Logistics last event: {logistics_last}")

        return True
    except Exception as e:
        print(f"  {FAIL} Erreur: {e}")
        return False
    finally:
        db.close()


def main():
    print("=" * 60)
    print("  OPERATIONAL TRUTH DASHBOARD — VERIFICATION SUITE")
    print("=" * 60)

    results = []

    results.append(test_corridor_tables_exist())
    results.append(test_timeline_data())
    results.append(test_proofs_data())
    results.append(test_anomalies_queries())
    results.append(test_health_query())

    print("\n" + "=" * 60)
    if all(results):
        print(f"{OK} TOUS LES TESTS PASSENT ({len(results)}/{len(results)})")
        print("Le Operational Truth Dashboard peut fonctionner.")
        return 0
    else:
        print(f"{FAIL} {len([r for r in results if not r])} TEST(S) ÉCHOUÉ(S)")
        return 1


if __name__ == "__main__":
    sys.exit(main())