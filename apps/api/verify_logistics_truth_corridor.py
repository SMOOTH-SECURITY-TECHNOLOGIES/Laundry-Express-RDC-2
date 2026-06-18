#!/usr/bin/env python3
"""
verify_logistics_truth_corridor.py

Teste les fondations du Logistics Truth Corridor :
1. Contrainte unique (order_id, task_type) empêche les doublons
2. Assignation atomique avec SELECT FOR UPDATE empêche les races
3. complete_task sans preuve → refus
4. complete_task avec preuve → OK + driver libéré
5. fail_task sans reason → refus
6. Timeline enregistrée à chaque transition

Usage :
    python scripts/verify_logistics_truth_corridor.py

Requires : DATABASE_URL environnement variable (ou valeur par défaut localhost)
"""
import os
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal

# Inject project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.partner import Partner, PartnerType, PartnerLocation
from app.models.logistics import Driver, DriverStatus, DeliveryTask, DeliveryTaskStatus, TaskType
from app.models.operational import OperationalProof, OperationalTimeline, TimelineEventType
from app.services.dispatch_service import DispatchService
from app.repositories.logistics_repository import LogisticsRepository
from app.repositories.order_repository import OrderRepository

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express")

# Couleurs terminal
OK = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m⚠\033[0m"


def get_db() -> Session:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def cleanup_test_data(db: Session, order_id=None, driver_id=None, user_id=None, partner_id=None):
    """Nettoie les données de test"""
    if order_id:
        db.query(OperationalTimeline).filter(OperationalTimeline.order_id == order_id).delete(synchronize_session=False)
        db.query(OperationalProof).filter(OperationalProof.order_id == order_id).delete(synchronize_session=False)
        db.query(DeliveryTask).filter(DeliveryTask.order_id == order_id).delete(synchronize_session=False)
        db.query(Order).filter(Order.id == order_id).delete(synchronize_session=False)
    if driver_id:
        db.query(Driver).filter(Driver.id == driver_id).delete(synchronize_session=False)
    if user_id:
        db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    if partner_id:
        db.query(PartnerLocation).filter(PartnerLocation.partner_id == partner_id).delete(synchronize_session=False)
        db.query(Partner).filter(Partner.id == partner_id).delete(synchronize_session=False)
    db.commit()


def create_test_fixtures(db: Session):
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
        email=f"test_customer_{uuid.uuid4().hex[:8]}@example.com",
        phone=f"+243999{uuid.uuid4().hex[:6]}",
        password_hash="fakehash",
        name="Test Customer",
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
    )
    db.add(customer)
    db.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=f"ORD-TEST-{uuid.uuid4().hex[:6].upper()}",
        customer_id=customer.id,
        partner_id=partner.id,
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PAID,
        currency="CDF",
        subtotal_amount=Decimal("10000.00"),
        discount_amount=Decimal("0.00"),
        pickup_fee=Decimal("500.00"),
        delivery_fee=Decimal("500.00"),
        total_amount=Decimal("11000.00"),
        amount_paid=Decimal("11000.00"),
        refunded_amount=Decimal("0.00"),
    )
    db.add(order)
    db.flush()

    driver_user = User(
        id=uuid.uuid4(),
        email=f"test_driver_{uuid.uuid4().hex[:8]}@example.com",
        phone=f"+243888{uuid.uuid4().hex[:6]}",
        password_hash="fakehash",
        name="Test Driver",
        role=UserRole.DRIVER,
        status=UserStatus.ACTIVE,
    )
    db.add(driver_user)
    db.flush()

    driver = Driver(
        id=uuid.uuid4(),
        user_id=driver_user.id,
        status=DriverStatus.ACTIVE,
        is_available=True,
        vehicle_type="moto",
    )
    db.add(driver)
    db.commit()

    return partner, customer, order, driver


def test_unique_constraint_order_task_type():
    """TEST 1 : Deux tasks pickup pour le même order → échec DB"""
    db = get_db()
    partner = customer = order = driver = None
    try:
        partner, customer, order, driver = create_test_fixtures(db)

        # Créer première task pickup
        repo = LogisticsRepository(db)
        task1 = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task1)

        # Tentative de créer une deuxième task pickup pour le même order
        task2 = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        try:
            repo.create_delivery_task(task2)
            db.commit()
            print(f"  {FAIL} TEST 1 ÉCHEC : doublon accepté (contrainte unique non active)")
            return False
        except Exception as e:
            db.rollback()
            if "uniq_delivery_tasks_order_task_type" in str(e) or "unique constraint" in str(e).lower():
                print(f"  {OK} TEST 1 PASS : doublon correctement rejeté par la contrainte DB")
                return True
            else:
                print(f"  {FAIL} TEST 1 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        cleanup_test_data(db, order.id, driver.id, driver.user_id, partner.id)
        db.close()


def test_atomic_driver_assignment():
    """TEST 2 : Deux threads tentent d'assigner le même driver → un seul gagne"""
    db = get_db()
    partner = customer = order = driver = None
    try:
        partner, customer, order, driver = create_test_fixtures(db)

        # Créer deux tasks distinctes
        repo = LogisticsRepository(db)
        task1 = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task1)

        order2 = Order(
            id=uuid.uuid4(),
            order_number=f"ORD-TEST-{uuid.uuid4().hex[:6].upper()}",
            customer_id=customer.id,
            partner_id=partner.id,
            status=OrderStatus.CONFIRMED,
            payment_status=PaymentStatus.PAID,
            currency="CDF",
            subtotal_amount=Decimal("5000.00"),
            discount_amount=Decimal("0.00"),
            pickup_fee=Decimal("500.00"),
            delivery_fee=Decimal("500.00"),
            total_amount=Decimal("6000.00"),
            amount_paid=Decimal("6000.00"),
            refunded_amount=Decimal("0.00"),
        )
        db.add(order2)
        db.flush()

        task2 = DeliveryTask(
            order_id=order2.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task2)
        db.commit()

        results = {"success": 0, "failure": 0, "errors": []}

        def try_assign(task_id):
            d = get_db()
            try:
                svc = DispatchService(d)
                svc.assign_driver_to_task(task_id, driver.id)
                d.commit()
                results["success"] += 1
            except Exception as e:
                d.rollback()
                results["failure"] += 1
                results["errors"].append(str(e))
            finally:
                d.close()

        # Exécution concurrente
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(try_assign, task1.id), executor.submit(try_assign, task2.id)]
            for f in as_completed(futures):
                f.result()

        if results["success"] == 1 and results["failure"] == 1:
            print(f"  {OK} TEST 2 PASS : une seule assignation a réussi, l'autre a échoué (race condition bloquée)")
            return True
        else:
            print(f"  {FAIL} TEST 2 ÉCHEC : {results['success']} succès, {results['failure']} échecs")
            for err in results["errors"]:
                print(f"      → {err}")
            return False
    finally:
        db = get_db()
        db.query(OperationalTimeline).filter(OperationalTimeline.order_id.in_([order.id, order2.id])).delete(synchronize_session=False)
        db.query(OperationalProof).filter(OperationalProof.order_id.in_([order.id, order2.id])).delete(synchronize_session=False)
        db.query(DeliveryTask).filter(DeliveryTask.order_id.in_([order.id, order2.id])).delete(synchronize_session=False)
        db.query(Order).filter(Order.id == order2.id).delete()
        db.query(Order).filter(Order.id == order.id).delete()
        db.query(Driver).filter(Driver.id == driver.id).delete()
        db.query(User).filter(User.id.in_([customer.id, driver.user_id])).delete(synchronize_session=False)
        db.query(PartnerLocation).filter(PartnerLocation.partner_id == partner.id).delete(synchronize_session=False)
        db.query(Partner).filter(Partner.id == partner.id).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_complete_task_requires_proof():
    """TEST 3 : complete_task sans preuve → refus"""
    db = get_db()
    partner = customer = order = driver = None
    try:
        partner, customer, order, driver = create_test_fixtures(db)

        repo = LogisticsRepository(db)
        task = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task)
        db.commit()

        svc = DispatchService(db)
        svc.assign_driver_to_task(task.id, driver.id)
        db.commit()

        # Simuler acceptation + démarrage
        task = db.query(DeliveryTask).filter(DeliveryTask.id == task.id).with_for_update().one()
        task.status = DeliveryTaskStatus.IN_PROGRESS
        db.commit()

        # Tentative de compléter SANS preuve
        class FakeCompleteData:
            proof_photo_url = None
            proof_note = None
            actor_name = "driver"

        try:
            svc = DispatchService(db)
            svc.complete_task(task.id, driver.id, FakeCompleteData())
            db.commit()
            print(f"  {FAIL} TEST 3 ÉCHEC : complétion acceptée sans preuve")
            return False
        except ValueError as e:
            db.rollback()
            if "preuve" in str(e).lower() or "proof" in str(e).lower():
                print(f"  {OK} TEST 3 PASS : complétion refusée sans preuve → {e}")
                return True
            else:
                print(f"  {FAIL} TEST 3 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        cleanup_test_data(db, order.id, driver.id, driver.user_id, partner.id)
        db.close()


def test_complete_task_with_proof():
    """TEST 4 : complete_task avec preuve → OK + driver libéré + timeline"""
    db = get_db()
    partner = customer = order = driver = None
    try:
        partner, customer, order, driver = create_test_fixtures(db)

        repo = LogisticsRepository(db)
        task = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task)
        db.commit()

        svc = DispatchService(db)
        svc.assign_driver_to_task(task.id, driver.id)
        db.commit()

        # Démarrer la tâche
        task = db.query(DeliveryTask).filter(DeliveryTask.id == task.id).with_for_update().one()
        task.status = DeliveryTaskStatus.IN_PROGRESS
        db.commit()

        # Compléter AVEC preuve
        class FakeCompleteData:
            proof_photo_url = "https://s3.example.com/proof-123.jpg"
            proof_note = "Colis récupéré, client présent"
            actor_name = "driver"

        svc = DispatchService(db)
        result = svc.complete_task(task.id, driver.id, FakeCompleteData())
        db.commit()

        # Vérifications
        assert result.status == DeliveryTaskStatus.COMPLETED, "Statut devrait être COMPLETED"

        driver_refreshed = db.query(Driver).filter(Driver.id == driver.id).one()
        assert driver_refreshed.is_available is True, "Driver devrait être libéré"

        proofs = db.query(OperationalProof).filter(OperationalProof.task_id == task.id).all()
        assert len(proofs) >= 1, "Une preuve devrait exister"

        timelines = db.query(OperationalTimeline).filter(OperationalTimeline.task_id == task.id).all()
        assert len(timelines) >= 1, "Une timeline devrait exister"

        print(f"  {OK} TEST 4 PASS : complétion OK, driver libéré, {len(proofs)} preuve(s), {len(timelines)} timeline(s)")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 4 ÉCHEC : {e}")
        return False
    finally:
        cleanup_test_data(db, order.id, driver.id, driver.user_id, partner.id)
        db.close()


def test_fail_task_requires_reason():
    """TEST 5 : fail_task sans reason → refus"""
    db = get_db()
    partner = customer = order = driver = None
    try:
        partner, customer, order, driver = create_test_fixtures(db)

        repo = LogisticsRepository(db)
        task = DeliveryTask(
            order_id=order.id,
            task_type=TaskType.PICKUP,
            status=DeliveryTaskStatus.PENDING,
        )
        repo.create_delivery_task(task)
        db.commit()

        svc = DispatchService(db)
        svc.assign_driver_to_task(task.id, driver.id)
        db.commit()

        # Démarrer
        task = db.query(DeliveryTask).filter(DeliveryTask.id == task.id).with_for_update().one()
        task.status = DeliveryTaskStatus.IN_PROGRESS
        db.commit()

        class FakeFailData:
            reason = "   "  # vide après strip
            actor_name = "driver"

        try:
            svc = DispatchService(db)
            svc.fail_task(task.id, driver.id, FakeFailData())
            db.commit()
            print(f"  {FAIL} TEST 5 ÉCHEC : échec accepté sans raison valide")
            return False
        except ValueError as e:
            db.rollback()
            if "raison" in str(e).lower() or "reason" in str(e).lower():
                print(f"  {OK} TEST 5 PASS : échec refusé sans raison → {e}")
                return True
            else:
                print(f"  {FAIL} TEST 5 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        cleanup_test_data(db, order.id, driver.id, driver.user_id, partner.id)
        db.close()


def main():
    print("=" * 60)
    print("  LOGISTICS TRUTH CORRIDOR — VERIFICATION SUITE")
    print("=" * 60)
    print()

    results = []

    print("TEST 1 : Contrainte unique (order_id, task_type)")
    results.append(test_unique_constraint_order_task_type())
    print()

    print("TEST 2 : Assignation atomique (concurrent driver assignment)")
    results.append(test_atomic_driver_assignment())
    print()

    print("TEST 3 : complete_task sans preuve → refus")
    results.append(test_complete_task_requires_proof())
    print()

    print("TEST 4 : complete_task avec preuve → OK + driver libéré + timeline")
    results.append(test_complete_task_with_proof())
    print()

    print("TEST 5 : fail_task sans reason → refus")
    results.append(test_fail_task_requires_reason())
    print()

    passed = sum(results)
    total = len(results)

    print("=" * 60)
    if passed == total:
        print(f"  {OK} TOUS LES TESTS PASSENT ({passed}/{total})")
        print("  Le Logistics Truth Corridor est opérationnel.")
    else:
        print(f"  {FAIL} {total - passed} TEST(S) ÉCHOUÉ(S) sur {total}")
        print("  Voir les détails ci-dessus.")
    print("=" * 60)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
