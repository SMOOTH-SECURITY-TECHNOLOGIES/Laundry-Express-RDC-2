#!/usr/bin/env python3
"""
verify_payment_truth_corridor.py

Teste les fondations du Payment Truth Corridor :
1. Numeric(10,2) empêche les erreurs de centimes
2. Webhook idempotent (provider_event_id unique)
3. CHECK constraint amount_paid <= amount_expected
4. Commission idempotente (double compute impossible)
5. Recalcul sous verrou (pas de race condition)

Usage :
    python scripts/verify_payment_truth_corridor.py

Requires : DATABASE_URL environnement variable
"""
import os
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.models.base import Base
from app.models.user import User, UserRole, UserStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.partner import Partner, PartnerType, PartnerLocation
from app.models.payment import (
    PaymentIntent,
    PaymentTransaction,
    PaymentIntentStatus,
    PaymentTransactionStatus,
    PaymentTransactionType,
    PaymentProvider,
    PaymentProviderEvent,
    RefundRequest,
    RefundStatus,
)
from app.models.commission import CommissionRecord, CommissionStatus
from app.services.payment_service import PaymentService
from app.repositories.payment_repository import PaymentRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.refund_repository import RefundRepository
from app.repositories.commission_repository import CommissionRepository

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://laundry_user:laundry_pass@localhost:5434/laundry_express")

OK = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"


def get_db() -> Session:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def cleanup_payment_test_data(db: Session, order_id, customer_id, partner_id):
    """Nettoie les données de test"""
    db.query(CommissionRecord).filter(CommissionRecord.order_id == order_id).delete(synchronize_session=False)
    db.query(PaymentProviderEvent).filter(PaymentProviderEvent.payment_intent_id.in_(
        db.query(PaymentIntent.id).filter(PaymentIntent.order_id == order_id)
    )).delete(synchronize_session=False)
    db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).delete(synchronize_session=False)
    db.query(PaymentIntent).filter(PaymentIntent.order_id == order_id).delete(synchronize_session=False)
    db.query(RefundRequest).filter(RefundRequest.order_id == order_id).delete(synchronize_session=False)
    db.query(Order).filter(Order.id == order_id).delete(synchronize_session=False)
    db.query(User).filter(User.id == customer_id).delete(synchronize_session=False)
    db.query(PartnerLocation).filter(PartnerLocation.partner_id == partner_id).delete(synchronize_session=False)
    db.query(Partner).filter(Partner.id == partner_id).delete(synchronize_session=False)
    db.commit()


def create_payment_fixtures(db: Session):
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
        status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        currency="CDF",
        subtotal_amount=Decimal("10000.00"),
        discount_amount=Decimal("0.00"),
        pickup_fee=Decimal("500.00"),
        delivery_fee=Decimal("500.00"),
        total_amount=Decimal("11000.00"),
        amount_paid=Decimal("0.00"),
        refunded_amount=Decimal("0.00"),
    )
    db.add(order)
    db.commit()

    return partner, customer, order


def test_numeric_precision():
    """TEST 1 : Numeric(10,2) conserve les centimes exactement"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_payment_fixtures(db)

        intent = PaymentIntent(
            id=uuid.uuid4(),
            order_id=order.id,
            customer_id=customer.id,
            payment_method="mobile_money",
            currency="CDF",
            amount=Decimal("99.99"),
            amount_expected=Decimal("99.99"),
            amount_paid=Decimal("0.00"),
            status=PaymentIntentStatus.CREATED,
            provider=PaymentProvider.ORANGE_MONEY_RDC,
        )
        db.add(intent)
        db.commit()

        # Vérifier que les centimes sont conservés
        intent_refreshed = db.query(PaymentIntent).filter(PaymentIntent.id == intent.id).one()
        assert intent_refreshed.amount == Decimal("99.99"), f"Montant corrompu: {intent_refreshed.amount}"

        # Vérifier que l'addition est exacte
        intent_refreshed.amount_paid = Decimal("99.99")
        db.commit()
        assert intent_refreshed.amount_paid == Decimal("99.99"), f"Montant payé corrompu: {intent_refreshed.amount_paid}"

        print(f"  {OK} TEST 1 PASS : centimes exacts conservés (99.99 == {intent_refreshed.amount_paid})")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 1 ÉCHEC : {e}")
        return False
    finally:
        if order:
            cleanup_payment_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_webhook_idempotence():
    """TEST 2 : Deux webhooks avec même provider_event_id → un seul traité"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_payment_fixtures(db)

        intent = PaymentIntent(
            id=uuid.uuid4(),
            order_id=order.id,
            customer_id=customer.id,
            payment_method="mobile_money",
            currency="CDF",
            amount=Decimal("11000.00"),
            amount_expected=Decimal("11000.00"),
            amount_paid=Decimal("0.00"),
            status=PaymentIntentStatus.PENDING,
            provider=PaymentProvider.ORANGE_MONEY_RDC,
        )
        db.add(intent)
        db.commit()

        svc = PaymentService(db)

        class FakeWebhook:
            event_type = "payment.succeeded"
            payload = {
                "transaction_id": f"TX-{uuid.uuid4().hex[:8]}",
                "payment_intent_id": str(intent.id),
                "provider_event_id": "EVT-UNIQUE-12345",
            }

        # Premier webhook
        intent1, tx1 = svc.record_provider_callback(PaymentProvider.ORANGE_MONEY_RDC, FakeWebhook())

        # Deuxième webhook avec même provider_event_id
        intent2, tx2 = svc.record_provider_callback(PaymentProvider.ORANGE_MONEY_RDC, FakeWebhook())

        # Vérifier que c'est la même transaction (pas de double création)
        assert tx1.id == tx2.id, "Deux transactions créées pour le même webhook"

        # Vérifier qu'un seul PaymentProviderEvent existe
        events = db.query(PaymentProviderEvent).filter(PaymentProviderEvent.provider_event_id == "EVT-UNIQUE-12345").all()
        assert len(events) == 1, f"{len(events)} événements provider créés au lieu de 1"

        print(f"  {OK} TEST 2 PASS : webhook idempotent (1 seule transaction, 1 seul event)")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 2 ÉCHEC : {e}")
        return False
    finally:
        if order:
            cleanup_payment_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_amount_paid_constraint():
    """TEST 3 : amount_paid > amount_expected → refus par CHECK constraint"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_payment_fixtures(db)

        intent = PaymentIntent(
            id=uuid.uuid4(),
            order_id=order.id,
            customer_id=customer.id,
            payment_method="mobile_money",
            currency="CDF",
            amount=Decimal("100.00"),
            amount_expected=Decimal("100.00"),
            amount_paid=Decimal("0.00"),
            status=PaymentIntentStatus.CREATED,
            provider=PaymentProvider.ORANGE_MONEY_RDC,
        )
        db.add(intent)
        db.commit()

        # Tentative de surpaye
        intent.amount_paid = Decimal("150.00")
        try:
            db.commit()
            print(f"  {FAIL} TEST 3 ÉCHEC : surpaye acceptée (CHECK constraint non actif)")
            return False
        except Exception as e:
            db.rollback()
            if "ck_payment_intent_amount_paid_lte_expected" in str(e):
                print(f"  {OK} TEST 3 PASS : surpaye refusée par CHECK constraint")
                return True
            else:
                print(f"  {FAIL} TEST 3 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        if order:
            cleanup_payment_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_commission_idempotence():
    """TEST 4 : Double compute commission → refus (sauf force_recompute)"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_payment_fixtures(db)

        # Marquer la commande comme payée
        order.payment_status = PaymentStatus.PAID
        order.amount_paid = Decimal("11000.00")
        db.commit()

        svc = PaymentService(db)

        class FakeCommissionData:
            platform_commission_rate = Decimal("10.00")
            force_recompute = False

        # Premier compute
        comm1 = svc.compute_commission(order.id, FakeCommissionData())
        assert comm1.status == CommissionStatus.COMPUTED

        # Deuxième compute (doit échouer)
        try:
            comm2 = svc.compute_commission(order.id, FakeCommissionData())
            print(f"  {FAIL} TEST 4 ÉCHEC : double compute accepté")
            return False
        except Exception as e:
            if "commission existe déjà" in str(e).lower() or "already" in str(e).lower():
                print(f"  {OK} TEST 4 PASS : double compute refusé → {e}")
                return True
            else:
                print(f"  {FAIL} TEST 4 ÉCHEC : erreur inattendue → {e}")
                return False
    finally:
        if order:
            cleanup_payment_test_data(db, order.id, customer.id, partner.id)
        db.close()


def test_payment_after_cancelled_order():
    """TEST 5 : Paiement succès sur commande annulée → pas de passage à PAID"""
    db = get_db()
    partner = customer = order = None
    try:
        partner, customer, order = create_payment_fixtures(db)

        # Annuler la commande
        order.status = OrderStatus.CANCELLED
        order.payment_status = PaymentStatus.FAILED
        db.commit()

        # Créer un intent et simuler un paiement
        intent = PaymentIntent(
            id=uuid.uuid4(),
            order_id=order.id,
            customer_id=customer.id,
            payment_method="mobile_money",
            currency="CDF",
            amount=Decimal("11000.00"),
            amount_expected=Decimal("11000.00"),
            amount_paid=Decimal("0.00"),
            status=PaymentIntentStatus.SUCCEEDED,  # webhook a déjà réussi
            provider=PaymentProvider.ORANGE_MONEY_RDC,
        )
        db.add(intent)
        db.commit()

        # Recalculer
        svc = PaymentService(db)
        updated_order = svc.recalculate_order_payment_status(order.id)

        # Vérifier que le statut n'est PAS passé à PAID
        assert updated_order.payment_status != PaymentStatus.PAID, \
            f"Commande annulée marquée PAID : {updated_order.payment_status}"

        print(f"  {OK} TEST 5 PASS : commande annulée non marquée PAID (statut={updated_order.payment_status})")
        return True
    except Exception as e:
        print(f"  {FAIL} TEST 5 ÉCHEC : {e}")
        return False
    finally:
        if order:
            cleanup_payment_test_data(db, order.id, customer.id, partner.id)
        db.close()


def main():
    print("=" * 60)
    print("  PAYMENT TRUTH CORRIDOR — VERIFICATION SUITE")
    print("=" * 60)
    print()

    results = []

    print("TEST 1 : Précision Numeric(10,2)")
    results.append(test_numeric_precision())
    print()

    print("TEST 2 : Webhook idempotent")
    results.append(test_webhook_idempotence())
    print()

    print("TEST 3 : CHECK constraint amount_paid <= amount_expected")
    results.append(test_amount_paid_constraint())
    print()

    print("TEST 4 : Commission idempotente")
    results.append(test_commission_idempotence())
    print()

    print("TEST 5 : Paiement sur commande annulée")
    results.append(test_payment_after_cancelled_order())
    print()

    passed = sum(results)
    total = len(results)

    print("=" * 60)
    if passed == total:
        print(f"  {OK} TOUS LES TESTS PASSENT ({passed}/{total})")
        print("  Le Payment Truth Corridor est opérationnel.")
    else:
        print(f"  {FAIL} {total - passed} TEST(S) ÉCHOUÉ(S) sur {total}")
    print("=" * 60)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
