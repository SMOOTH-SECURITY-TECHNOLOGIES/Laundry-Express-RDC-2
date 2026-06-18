"""Tests unitaires pour le service marketplace logistique."""

import unittest
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.models.order import OrderStatus, PaymentStatus
from app.services.logistics_marketplace_service import LogisticsMarketplaceService


class TestLogisticsMarketplaceService(unittest.TestCase):
    def test_paid_statuses_include_cash_pending(self):
        from app.services.logistics_marketplace_service import PAID_OR_COLLECTABLE_STATUSES
        self.assertIn(PaymentStatus.CASH_PENDING, PAID_OR_COLLECTABLE_STATUSES)
        self.assertIn(PaymentStatus.PAID, PAID_OR_COLLECTABLE_STATUSES)

    def test_handle_order_status_change_confirmed_triggers_pickup(self):
        db = MagicMock()
        service = LogisticsMarketplaceService(db)
        order = MagicMock()
        order.id = uuid4()

        with patch.object(service, "ensure_pickup_mission_for_order", return_value=MagicMock()) as pickup:
            result = service.handle_order_status_change(order, OrderStatus.CONFIRMED)
            pickup.assert_called_once_with(order.id)
            self.assertIsNotNone(result)

    def test_handle_order_status_change_ready_for_delivery_triggers_delivery(self):
        db = MagicMock()
        service = LogisticsMarketplaceService(db)
        order = MagicMock()
        order.id = uuid4()

        with patch.object(service, "ensure_delivery_mission_for_order", return_value=MagicMock()) as delivery:
            service.handle_order_status_change(order, OrderStatus.READY_FOR_DELIVERY)
            delivery.assert_called_once_with(order.id)


if __name__ == "__main__":
    unittest.main()
