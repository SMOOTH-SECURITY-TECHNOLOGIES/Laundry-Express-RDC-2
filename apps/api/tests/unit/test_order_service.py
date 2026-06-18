import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4

import pytest

from app.models.order import OrderStatus, PaymentStatus
from app.schemas.order import (
    OrderCancelRequest,
    OrderCreate,
    OrderItemCreate,
    OrderStatusUpdateRequest,
)
from app.services.order_service import OrderService


def make_order_item(**overrides):
    data = {
        "service_id": uuid4(),
        "item_name": "Chemise",
        "quantity": Decimal("2.00"),
        "unit_price": Decimal("1500.00"),
        "notes": "A repasser",
        "detected_by_ai": False,
    }
    data.update(overrides)
    return OrderItemCreate(**data)


def make_order_create(**overrides):
    data = {
        "partner_id": uuid4(),
        "pickup_address_id": uuid4(),
        "delivery_address_id": uuid4(),
        "items": [make_order_item()],
        "currency": "CDF",
        "special_instructions": "Sonner 2 fois",
        "express": False,
        "pickup_requested": True,
        "delivery_requested": True,
        "idempotency_key": "idem-key-12345678",
    }
    data.update(overrides)
    return OrderCreate(**data)


class TestOrderService:
    def setup_method(self):
        self.mock_db = Mock()
        self.mock_repo = Mock()
        self.mock_db.rollback = Mock()
        self.mock_db.begin_nested.return_value.__enter__ = Mock(return_value=None)
        self.mock_db.begin_nested.return_value.__exit__ = Mock(return_value=None)
        self.service = OrderService(self.mock_db)
        self.service.repository = self.mock_repo
        self.customer_id = uuid4()
        self.user_id = uuid4()
        self.order_id = uuid4()

    def configure_locked_order(self, order):
        query = self.mock_db.query.return_value
        query.filter.return_value.with_for_update.return_value.one_or_none.return_value = order

    def test_is_valid_transition_valid(self):
        assert self.service.is_valid_transition(
            OrderStatus.DRAFT,
            OrderStatus.PENDING_CONFIRMATION,
        ) is True

    def test_is_valid_transition_invalid(self):
        assert self.service.is_valid_transition(
            OrderStatus.DRAFT,
            OrderStatus.COMPLETED,
        ) is False

    def test_create_order_success(self):
        order_data = make_order_create()
        pricing_result = SimpleNamespace(
            subtotal_amount=Decimal("3000.00"),
            discount_amount=Decimal("0.00"),
            pickup_fee=Decimal("500.00"),
            delivery_fee=Decimal("1000.00"),
            total_amount=Decimal("4500.00"),
            currency="CDF",
            calculation_breakdown={"total": 4500.0},
        )

        self.mock_repo.get_by_customer_and_idempotency_key.return_value = None
        self.mock_repo.generate_order_number.return_value = "ORD-20260318-ABCDE"
        created_order = {}

        def persist_order(order):
            created_order["order"] = order
            return order

        self.mock_repo.create.side_effect = persist_order
        self.mock_repo.create_item.side_effect = lambda item: item
        self.mock_repo.create_status_history.return_value = Mock()
        self.mock_repo.create_event.return_value = Mock()
        self.mock_repo.get_by_id.side_effect = lambda _order_id: created_order.get("order")

        with patch("app.services.order_service.PricingService") as pricing_service_cls:
            pricing_service_cls.return_value.calculate_order_price.return_value = pricing_result

            order, created = self.service.create_order(
                customer_id=self.customer_id,
                order_data=order_data,
                current_user_id=self.user_id,
            )

        assert created is True
        assert order.customer_id == self.customer_id
        assert order.payment_status == PaymentStatus.PENDING
        assert order.total_amount == Decimal("4500.00")
        assert order.idempotency_key == order_data.idempotency_key
        self.mock_repo.create.assert_called_once()
        self.mock_repo.create_item.assert_called_once()
        self.mock_repo.create_status_history.assert_called_once()
        self.mock_repo.create_event.assert_called_once()

    def test_create_order_returns_existing_order_for_same_idempotency_key(self):
        existing_order = Mock()
        self.mock_repo.get_by_customer_and_idempotency_key.return_value = existing_order

        order, created = self.service.create_order(
            customer_id=self.customer_id,
            order_data=make_order_create(),
            current_user_id=self.user_id,
        )

        assert order is existing_order
        assert created is False
        self.mock_repo.generate_order_number.assert_not_called()

    def test_create_order_rolls_back_when_item_creation_fails(self):
        order_data = make_order_create()
        pricing_result = SimpleNamespace(
            subtotal_amount=Decimal("3000.00"),
            discount_amount=Decimal("0.00"),
            pickup_fee=Decimal("500.00"),
            delivery_fee=Decimal("1000.00"),
            total_amount=Decimal("4500.00"),
            currency="CDF",
            calculation_breakdown={"total": 4500.0},
        )

        self.mock_repo.get_by_customer_and_idempotency_key.return_value = None
        self.mock_repo.generate_order_number.return_value = "ORD-20260318-ABCDE"
        self.mock_repo.create.side_effect = lambda order: order
        self.mock_repo.create_item.side_effect = RuntimeError("boom")

        with patch("app.services.order_service.PricingService") as pricing_service_cls:
            pricing_service_cls.return_value.calculate_order_price.return_value = pricing_result

            with pytest.raises(RuntimeError, match="boom"):
                self.service.create_order(
                    customer_id=self.customer_id,
                    order_data=order_data,
                    current_user_id=self.user_id,
                )

        self.mock_db.rollback.assert_called_once()

    def test_get_order_customer_access(self):
        mock_order = Mock()
        mock_order.customer_id = self.customer_id
        self.mock_repo.get_by_id.return_value = mock_order

        result = self.service.get_order(
            order_id=self.order_id,
            user_id=self.customer_id,
            is_admin=False,
        )

        assert result is mock_order

    def test_get_order_admin_access(self):
        mock_order = Mock()
        mock_order.customer_id = uuid4()
        self.mock_repo.get_by_id.return_value = mock_order

        result = self.service.get_order(
            order_id=self.order_id,
            user_id=self.user_id,
            is_admin=True,
        )

        assert result is mock_order

    def test_transition_order_status_success(self):
        mock_order = Mock()
        mock_order.id = self.order_id
        mock_order.status = OrderStatus.DRAFT
        mock_order.version = 1
        self.configure_locked_order(mock_order)

        result = self.service.transition_order_status(
            order_id=self.order_id,
            status_data=OrderStatusUpdateRequest(
                new_status=OrderStatus.PENDING_CONFIRMATION,
                change_reason="Client a confirme",
            ),
            changed_by_user_id=self.user_id,
        )

        assert result is mock_order
        assert mock_order.status == OrderStatus.PENDING_CONFIRMATION
        assert mock_order.version == 2
        assert self.mock_db.add.call_count == 3
        self.mock_db.flush.assert_called_once()

    def test_transition_order_status_invalid(self):
        mock_order = Mock()
        mock_order.id = self.order_id
        mock_order.status = OrderStatus.DRAFT
        mock_order.version = 1
        self.configure_locked_order(mock_order)

        with pytest.raises(ValueError, match="Transition invalide"):
            self.service.transition_order_status(
                order_id=self.order_id,
                status_data=OrderStatusUpdateRequest(
                    new_status=OrderStatus.COMPLETED,
                    change_reason="Test",
                ),
                changed_by_user_id=self.user_id,
            )

    def test_cancel_order_success(self):
        mock_order = Mock()
        self.mock_repo.can_cancel.return_value = True
        self.service.transition_order_status = Mock(return_value=mock_order)

        result = self.service.cancel_order(
            order_id=self.order_id,
            cancel_data=OrderCancelRequest(reason="Changement de plan"),
            user_id=self.user_id,
        )

        assert result is mock_order
        self.service.transition_order_status.assert_called_once()

    def test_reassignment_recommendation_does_not_mutate_cancelled_order(self):
        original_partner_id = uuid4()
        candidate_id = uuid4()
        mock_order = SimpleNamespace(id=self.order_id, partner_id=original_partner_id)
        candidate = SimpleNamespace(id=candidate_id, name="Partner alternatif", rating=4.5)

        self.mock_db.query.return_value.filter.return_value.all.return_value = [candidate]
        self.service._required_service_type_ids = Mock(return_value={uuid4()})
        self.service._service_coverage_score = Mock(return_value=1.0)
        self.service._partner_active_order_count = Mock(return_value=1)

        self.service._record_reassignment_recommendation(mock_order)

        assert mock_order.partner_id == original_partner_id
        added_event = self.mock_db.add.call_args.args[0]
        assert added_event.event_type == "REASSIGNMENT_RECOMMENDED"
        payload = json.loads(added_event.event_data)
        assert payload["from_partner"] == str(original_partner_id)
        assert payload["candidates"][0]["partner_id"] == str(candidate_id)
        self.mock_db.flush.assert_called_once()

    def test_update_payment_status_success(self):
        mock_order = Mock()
        mock_order.id = self.order_id
        mock_order.payment_status = PaymentStatus.PENDING
        self.mock_repo.get_by_id.return_value = mock_order
        self.mock_repo.update.return_value = mock_order

        result = self.service.update_payment_status(
            order_id=self.order_id,
            payment_status=PaymentStatus.PAID,
            notes="Paiement recu",
        )

        assert result is mock_order
        assert mock_order.payment_status == PaymentStatus.PAID
        self.mock_repo.create_event.assert_called_once()
