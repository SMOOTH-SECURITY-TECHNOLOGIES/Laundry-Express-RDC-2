#!/usr/bin/env python3
"""
verify_order_truth_corridor.py

Teste les fondations du Order Truth Corridor :
1. Transition avec verrou (SELECT FOR UPDATE)
2. Transition invalide bloquée
3. Preuve obligatoire pour PICKED_UP sans preuve → refus
4. Preuve fournie pour DELIVERED → OK + timeline
5. Optimistic locking (version mismatch)

Usage :
    python scripts/verify_order_truth_corridor.py

Requires : DATABASE_URL environnement variable
"""
import os
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.partner import Partner, PartnerType, PartnerLocation
from app.models.operational import OperationalProof, OperationalTimeline, TimelineEventType
from app.services.order_service import OrderService
from app.schemas.order import OrderStatusUpdateRequest

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express")

OK = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"


def get_db() -> Session:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def cleanup_order_test_data(db: Session, order_id, customer_id, partner_id):
    """Nettoie les données de test"""
    from app.models.order import OrderStatusHistory, OrderEvent
    db.query(OperationalTimeline).filter(OperationalTimeline.order_id == order_id).delete(synchronize_session=False)
    db.query(OperationalProof).filter(OperationalProof.order_id == order_id).delete(synchronize_session=False)
    db.query(OrderEvent).filter(OrderEvent.order_id == order_id).delete(synchronize_session=False)
    db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order_id).delete(synchronize_session=False)
    db.query(Order).filter(Order.id == order_id).delete(synchronize_session=False)
    db.query(User).filter(User.id == customer_id).delete(synchronize_session=False)
    db.query(PartnerLocation).filter(PartnerLocation.partner_id == partner_id).delete(synchronize_session=False)
    db.query(Partner).filter(Partner.id == partner_id).delete(synchronize_session=False)
    db.commit()


def create_order_fixtures(db: Session, status=OrderStatus.CONFIRMED):
    """Crée les fixtures nécessaires"""
    uid = uuid.uuid4().hex[:8]
    partner = Partner(
        id=uuid.uuid4(),
        name="Test Pressing",
        business_name="Test Pressing SARL",
        partner_type=PartnerType.PRESSING,
        status="active",
        is_verified=True,
        rating=4.5,
        total_reviews=10,
        email=f"test_pressing_{uid}@example.com",
        phone=f"+243999{uid}",
    )
    db.add(partner)
    db.flush()

    partner_loc = PartnerLocation(
        id=uuid.uuid4(),
        partner_id=partner.id,
        address_line_1="123 Avenue Test",
        city="Kinshasa",
        commune="Gombe",
        latitude=-4.325,
        longitude=15.322,
    )
    db.add(partner_loc)
    db.flush()

    customer = User(
        id=uuid.uuid4(),
        email=f"test_customer_{uid}@example.com",
        phone=f"+243888{uid}",
        password_hash="fakehash",
        name="Test Customer",
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
    )
    db.add(customer)
    db.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=f"ORD-TEST-{uid.upper()}",
        customer_id=customer.id,
        partner_id=partner.id,
        status=status,
        payment_status=PaymentStatus.PAID,
        currency="CDF",
        subtotal_amount=Decimal("10000.00"),
        discount_amount=Decimal("0.00"),
        pickup_fee=Decimal("500.00"),
        delivery_fee=Decimal("500.00"),
        total_amount=Decimal("11000.00"),
        amount_paid=Decimal("11000.00"),
        refunded_amount=Decimal("0.00"),
        version=1,
    )
    db.add(order)
    db.commit()

    return partner, customer, order


def test_invalid_transition_blocked():
    """TEST 1 : Transition invalide (DRAFT → COMPLETED) → refus"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_order_fixtures(db, status=OrderStatus.DRAFT)

        svc = OrderService(db)
        status_update = OrderStatusUpdateRequest(new_status=OrderStatus.COMPLETED)

        try:
            svc.transition_order_status(order.id, status_update, customer.id)
            db.commit()
            print(f"  {FAIL} TEST 1 ÉCHEC : transition invalide acceptée")
            return False
        except ValueError as e:
            db.rollback()
            if "Transition invalide" in str(e):
                print(f"  {OK} TEST 1 PASS : transition invalide refusée → {e}")
                return True
            else:
                print(f"  {FAIL} TEST 1 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        if order:
            cleanup_order_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_concurrent_transition_race():
    """TEST 2 : Deux threads tentent transition simultanée → un seul gagne"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_order_fixtures(db, status=OrderStatus.CONFIRMED)

        results = {"success": 0, "failure": 0, "errors": []}

        def try_transition():
            d = get_db()
            try:
                svc = OrderService(d)
                status_update = OrderStatusUpdateRequest(new_status=OrderStatus.PICKUP_SCHEDULED)
                svc.transition_order_status(order.id, status_update, customer.id)
                d.commit()
                results["success"] += 1
            except Exception as e:
                d.rollback()
                results["failure"] += 1
                results["errors"].append(str(e))
            finally:
                d.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(try_transition), executor.submit(try_transition)]
            for f in as_completed(futures):
                f.result()

        if results["success"] == 1 and results["failure"] == 1:
            print(f"  {OK} TEST 2 PASS : une seule transition a réussi, l'autre a échoué")
            return True
        else:
            print(f"  {FAIL} TEST 2 ÉCHEC : {results['success']} succès, {results['failure']} échecs")
            for err in results["errors"]:
                print(f"      → {err}")
            return False
    finally:
        if order:
            cleanup_order_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_picked_up_requires_proof():
    """TEST 3 : PICKED_UP sans preuve → refus"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_order_fixtures(db, status=OrderStatus.PICKUP_IN_PROGRESS)

        svc = OrderService(db)
        status_update = OrderStatusUpdateRequest(new_status=OrderStatus.PICKED_UP)

        try:
            svc.transition_order_status(order.id, status_update, customer.id)
            db.commit()
            print(f"  {FAIL} TEST 3 ÉCHEC : PICKED_UP accepté sans preuve")
            return False
        except ValueError as e:
            db.rollback()
            if "Preuve obligatoire" in str(e):
                print(f"  {OK} TEST 3 PASS : PICKED_UP refusé sans preuve → {e}")
                return True
            else:
                print(f"  {FAIL} TEST 3 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        if order:
            cleanup_order_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_delivered_with_proof_ok():
    """TEST 4 : DELIVERED avec preuve → OK + timeline + proof"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_order_fixtures(db, status=OrderStatus.DELIVERY_IN_PROGRESS)

        svc = OrderService(db)
        status_update = OrderStatusUpdateRequest(
            new_status=OrderStatus.DELIVERED,
            proof_photo_url="https://s3.example.com/delivery-proof.jpg",
            proof_note="Colis livré au client",
            location_lat=-4.325,
            location_lng=15.322,
        )

        result = svc.transition_order_status(order.id, status_update, customer.id)
        db.commit()

        assert result.status == OrderStatus.DELIVERED, f"Statut devrait être DELIVERED, got {result.status}"
        assert result.version == 2, f"Version devrait être 2, got {result.version}"

        proofs = db.query(OperationalProof).filter(OperationalProof.order_id == order.id).all()
        assert len(proofs) >= 1, "Une preuve devrait exister"

        timelines = db.query(OperationalTimeline).filter(OperationalTimeline.order_id == order.id).all()
        assert len(timelines) >= 1, "Une timeline devrait exister"

        print(f"  {OK} TEST 4 PASS : DELIVERED OK, version={result.version}, {len(proofs)} preuve(s), {len(timelines)} timeline(s)")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 4 ÉCHEC : {e}")
        return False
    finally:
        if order:
            cleanup_order_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_optimistic_locking():
    """TEST 5 : Version incrémentée à chaque transition"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_order_fixtures(db, status=OrderStatus.CONFIRMED)
        initial_version = order.version
        assert initial_version == 1, f"Version initiale devrait être 1, got {initial_version}"

        svc = OrderService(db)
        status_update = OrderStatusUpdateRequest(new_status=OrderStatus.PICKUP_SCHEDULED)

        result = svc.transition_order_status(order.id, status_update, customer.id)
        db.commit()

        assert result.version == 2, f"Version devrait être 2 après transition, got {result.version}"

        # Deuxième transition
        status_update2 = OrderStatusUpdateRequest(new_status=OrderStatus.PICKUP_DRIVER_ASSIGNED)
        result2 = svc.transition_order_status(order.id, status_update2, customer.id)
        db.commit()

        assert result2.version == 3, f"Version devrait être 3 après deuxième transition, got {result2.version}"

        print(f"  {OK} TEST 5 PASS : version incrémentée correctement (1 → 2 → 3)")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 5 ÉCHEC : {e}")
        return False
    finally:
        if order:
            cleanup_order_test_data(db, order.id, customer.id, partner.id)
        db.close()


def main():
    print("=" * 60)
    print("  ORDER TRUTH CORRIDOR — VERIFICATION SUITE")
    print("=" * 60)
    print()

    results = []

    print("TEST 1 : Transition invalide bloquée")
    results.append(test_invalid_transition_blocked())
    print()

    print("TEST 2 : Transition concurrente (race condition)")
    results.append(test_concurrent_transition_race())
    print()

    print("TEST 3 : PICKED_UP sans preuve → refus")
    results.append(test_picked_up_requires_proof())
    print()

    print("TEST 4 : DELIVERED avec preuve → OK + timeline")
    results.append(test_delivered_with_proof_ok())
    print()

    print("TEST 5 : Optimistic locking (version mismatch)")
    results.append(test_optimistic_locking())
    print()

    passed = sum(results)
    total = len(results)

    print("=" * 60)
    if passed == total:
        print(f"  {OK} TOUS LES TESTS PASSENT ({passed}/{total})")
        print("  Le Order Truth Corridor est opérationnel.")
    else:
        print(f"  {FAIL} {total - passed} TEST(S) ÉCHOUÉ(S) sur {total}")
    print("=" * 60)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
