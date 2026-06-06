import json
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from urllib import error, request
from uuid import uuid4

import pytest
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.exceptions import PaymentError
from app.models.catalog import (
    PartnerService,
    PriceAdjustmentType,
    PricingMode,
    PricingRule,
    RuleType,
    ServiceCategory,
    ServiceType,
)
from app.models.customer import CustomerAddress
from app.models.order import Order, OrderEvent, OrderItem, OrderStatusHistory, PaymentStatus
from app.models.partner import Partner, PartnerStatus, PartnerType
from app.models.payment import PaymentMethod
from app.models.user import User, UserRole, UserStatus
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.payment import PaymentIntentCreate
from app.services.auth_service import AuthService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService


LOCAL_DATABASE_URL = "postgresql://laundry_user:laundry_pass@localhost:5433/laundry_express"
API_BASE_URL = "http://localhost:18000/api/v1"
JWT_SECRET = "development-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

engine = create_engine(LOCAL_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def api_post(path: str, payload: dict, token: str | None = None, headers: dict | None = None):
    body = json.dumps(payload).encode("utf-8")
    final_headers = {"Content-Type": "application/json"}
    if token:
        final_headers["Authorization"] = f"Bearer {token}"
    if headers:
        final_headers.update(headers)

    req = request.Request(f"{API_BASE_URL}{path}", data=body, headers=final_headers, method="POST")
    try:
        with request.urlopen(req, timeout=30) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            parsed = {"raw": payload}
        return exc.code, parsed


def create_access_token(user_id, role: UserRole = UserRole.CUSTOMER) -> str:
    return jwt.encode(
        {
            "sub": str(user_id),
            "role": role.value,
            "type": "access",
            "exp": 2524608000,
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def make_order_payload(partner_id, service_id, pickup_address_id, delivery_address_id, **overrides):
    payload = {
        "partner_id": str(partner_id),
        "pickup_address_id": str(pickup_address_id),
        "delivery_address_id": str(delivery_address_id),
        "items": [
            {
                "service_id": str(service_id),
                "item_name": "Chemise validation",
                "quantity": "2.00",
                "unit_price": "1500.00",
                "notes": "Validation",
                "detected_by_ai": False,
            }
        ],
        "currency": "CDF",
        "special_instructions": "Validation orders",
        "express": False,
        "pickup_requested": True,
        "delivery_requested": True,
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def validation_context():
    slug = uuid4().hex[:8]
    session = SessionLocal()

    user = User(
        email=f"orders-{slug}@example.com",
        phone=f"+24381{slug[:7]}",
        password_hash=AuthService(None).hash_password("Validation123"),
        name=f"Orders Validation {slug}",
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
        is_phone_verified=True,
        is_2fa_enabled=False,
    )
    session.add(user)
    session.flush()

    address = CustomerAddress(
        user_id=user.id,
        label="home",
        contact_name=user.name,
        contact_phone=user.phone,
        address_line_1="12 Avenue Test",
        city="Kinshasa",
        commune="Gombe",
        zone="Centre",
        reference_point="Porte bleue",
        instructions="Appeler avant d'arriver",
        is_default=True,
    )
    session.add(address)

    partner = Partner(
        name=f"Partner {slug}",
        business_name=f"Laundry {slug}",
        tax_id=f"TAX-{slug}",
        partner_type=PartnerType.LAUNDRY.value,
        status=PartnerStatus.ACTIVE.value,
        email=f"partner-{slug}@example.com",
        phone=f"+24382{slug[:7]}",
        is_verified=True,
        is_featured=False,
        is_accepting_orders=True,
    )
    session.add(partner)
    session.flush()

    category = ServiceCategory(
        name=f"Chemise {slug}",
        slug=f"chemise-{slug}",
        description="Categorie de validation",
        is_active=True,
    )
    service_type = ServiceType(
        name=f"Lavage {slug}",
        slug=f"lavage-{slug}",
        description="Type de validation",
        is_active=True,
    )
    session.add_all([category, service_type])
    session.flush()

    partner_service = PartnerService(
        partner_id=partner.id,
        service_category_id=category.id,
        service_type_id=service_type.id,
        base_price=Decimal("1500.00"),
        pricing_mode=PricingMode.UNIT,
        estimated_turnaround_hours=24,
        is_available=True,
    )
    pickup_rule = PricingRule(
        partner_id=partner.id,
        rule_type=RuleType.PICKUP_FEE,
        service_category_id=None,
        service_type_id=None,
        min_quantity=None,
        max_quantity=None,
        price_adjustment_type=PriceAdjustmentType.FIXED,
        price_adjustment_value=Decimal("500.00"),
        is_active=True,
    )
    delivery_rule = PricingRule(
        partner_id=partner.id,
        rule_type=RuleType.DELIVERY_FEE,
        service_category_id=None,
        service_type_id=None,
        min_quantity=None,
        max_quantity=None,
        price_adjustment_type=PriceAdjustmentType.FIXED,
        price_adjustment_value=Decimal("1000.00"),
        is_active=True,
    )
    session.add_all([partner_service, pickup_rule, delivery_rule])
    session.commit()
    user_id = user.id
    partner_id = partner.id
    service_id = partner_service.id
    address_id = address.id
    session.close()

    context = {
        "user_id": user_id,
        "partner_id": partner_id,
        "service_id": service_id,
        "address_id": address_id,
        "token": create_access_token(user_id),
    }

    try:
        yield context
    finally:
        cleanup = SessionLocal()
        order_ids = [
            order_id
            for (order_id,) in cleanup.query(Order.id).filter(Order.customer_id == context["user_id"]).all()
        ]
        if order_ids:
            cleanup.query(OrderEvent).filter(OrderEvent.order_id.in_(order_ids)).delete(synchronize_session=False)
            cleanup.query(OrderStatusHistory).filter(OrderStatusHistory.order_id.in_(order_ids)).delete(synchronize_session=False)
            cleanup.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
            cleanup.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)

        cleanup.query(PricingRule).filter(PricingRule.partner_id == context["partner_id"]).delete(synchronize_session=False)
        cleanup.query(PartnerService).filter(PartnerService.partner_id == context["partner_id"]).delete(synchronize_session=False)
        cleanup.query(ServiceCategory).filter(ServiceCategory.slug == f"chemise-{slug}").delete(synchronize_session=False)
        cleanup.query(ServiceType).filter(ServiceType.slug == f"lavage-{slug}").delete(synchronize_session=False)
        cleanup.query(CustomerAddress).filter(CustomerAddress.user_id == context["user_id"]).delete(synchronize_session=False)
        cleanup.query(Partner).filter(Partner.id == context["partner_id"]).delete(synchronize_session=False)
        cleanup.query(User).filter(User.id == context["user_id"]).delete(synchronize_session=False)
        cleanup.commit()
        cleanup.close()


class TestOrdersStabilityReal:
    def test_http_order_creation_supports_idempotency(self, validation_context):
        payload = make_order_payload(
            validation_context["partner_id"],
            validation_context["service_id"],
            validation_context["address_id"],
            validation_context["address_id"],
        )

        no_key_status, no_key_body = api_post("/orders", payload, token=validation_context["token"])
        assert no_key_status == 201, no_key_body

        idem_key = f"idem-{uuid4().hex}"
        first_status, first_body = api_post(
            "/orders",
            payload,
            token=validation_context["token"],
            headers={"Idempotency-Key": idem_key},
        )
        second_status, second_body = api_post(
            "/orders",
            payload,
            token=validation_context["token"],
            headers={"Idempotency-Key": idem_key},
        )

        assert first_status == 201, first_body
        assert second_status == 200, second_body
        assert first_body["id"] == second_body["id"]
        assert first_body["pickup_fee"] == "500.00"
        assert first_body["delivery_fee"] == "1000.00"

        session = SessionLocal()
        try:
            persisted = session.query(Order).filter(Order.idempotency_key == idem_key).all()
            assert len(persisted) == 1
        finally:
            session.close()

    def test_http_concurrent_requests_with_same_idempotency_key_create_one_order(self, validation_context):
        idem_key = f"concurrent-{uuid4().hex}"
        payload = make_order_payload(
            validation_context["partner_id"],
            validation_context["service_id"],
            validation_context["address_id"],
            validation_context["address_id"],
        )

        def submit():
            return api_post(
                "/orders",
                payload,
                token=validation_context["token"],
                headers={"Idempotency-Key": idem_key},
            )

        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(lambda _: submit(), range(4)))

        statuses = [status for status, _ in results]
        bodies = [body for _, body in results]

        assert all(status in {200, 201} for status in statuses), results
        returned_ids = {body["id"] for body in bodies}
        assert len(returned_ids) == 1

        session = SessionLocal()
        try:
            persisted = session.query(Order).filter(Order.idempotency_key == idem_key).all()
            assert len(persisted) == 1
        finally:
            session.close()

    def test_transaction_rolls_back_on_mid_chain_failure(self, validation_context):
        session = SessionLocal()
        service = OrderService(session)
        service.repository.generate_order_number = lambda: f"ORD-ROLLBACK-{uuid4().hex[:8].upper()}"

        real_create_item = service.repository.create_item
        counter = {"count": 0}

        def flaky_create_item(item):
            counter["count"] += 1
            if counter["count"] == 2:
                raise RuntimeError("forced item creation failure")
            return real_create_item(item)

        service.repository.create_item = flaky_create_item

        order_data = OrderCreate(
            partner_id=validation_context["partner_id"],
            pickup_address_id=validation_context["address_id"],
            delivery_address_id=validation_context["address_id"],
            items=[
                OrderItemCreate(
                    service_id=validation_context["service_id"],
                    item_name="Chemise A",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("1500.00"),
                ),
                OrderItemCreate(
                    service_id=validation_context["service_id"],
                    item_name="Chemise B",
                    quantity=Decimal("1.00"),
                    unit_price=Decimal("1500.00"),
                ),
            ],
            idempotency_key=f"rollback-{uuid4().hex}",
            pickup_requested=True,
            delivery_requested=True,
        )

        with pytest.raises(RuntimeError, match="forced item creation failure"):
            service.create_order(validation_context["user_id"], order_data, validation_context["user_id"])

        session.close()

        verify = SessionLocal()
        try:
            assert verify.query(Order).filter(Order.idempotency_key == order_data.idempotency_key).count() == 0
            assert (
                verify.query(OrderItem)
                .join(Order, Order.id == OrderItem.order_id)
                .filter(Order.idempotency_key == order_data.idempotency_key)
                .count()
                == 0
            )
        finally:
            verify.close()

    def test_payment_guard_blocks_new_intent_for_paid_order(self, validation_context):
        session = SessionLocal()
        paid_order = Order(
            order_number=f"ORD-PAID-{uuid4().hex[:8].upper()}",
            customer_id=validation_context["user_id"],
            partner_id=validation_context["partner_id"],
            pickup_address_id=validation_context["address_id"],
            delivery_address_id=validation_context["address_id"],
            status="draft",
            payment_status=PaymentStatus.PAID,
            currency="CDF",
            subtotal_amount=Decimal("3000.00"),
            discount_amount=Decimal("0.00"),
            pickup_fee=Decimal("500.00"),
            delivery_fee=Decimal("1000.00"),
            total_amount=Decimal("4500.00"),
            amount_paid=Decimal("4500.00"),
            refunded_amount=Decimal("0.00"),
            express=False,
            pickup_requested=True,
            delivery_requested=True,
        )
        session.add(paid_order)
        session.commit()

        service = PaymentService(session)
        with pytest.raises(PaymentError, match="déjà soldée"):
            service.create_payment_intent(
                PaymentIntentCreate(
                    order_id=paid_order.id,
                    payment_method=PaymentMethod.MOBILE_MONEY,
                    amount_expected=4500.0,
                    currency="CDF",
                ),
                validation_context["user_id"],
            )

        session.delete(paid_order)
        session.commit()
        session.close()
