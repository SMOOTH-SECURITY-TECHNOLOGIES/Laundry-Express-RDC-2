from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

from app.models.loyalty import LoyaltyLedgerEntry
from app.services.loyalty_service import LoyaltyService


def query_mock(*, first=None, scalar=None):
    query = Mock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.first.return_value = first
    query.scalar.return_value = scalar
    return query


def test_behavioral_bonus_is_idempotent_by_user_and_entry_type():
    user_id = uuid4()
    user = SimpleNamespace(id=user_id, loyalty_points=25)
    db = Mock()
    db.query.side_effect = [
        query_mock(first=user),
        query_mock(first=None),
        query_mock(scalar=3),
        query_mock(first=SimpleNamespace(points_expiry_days=None)),
        query_mock(first=object()),
        query_mock(first=object()),
    ]

    awarded = LoyaltyService(db).check_behavioral_bonuses(
        user_id,
        as_of=datetime(2026, 6, 17, tzinfo=timezone.utc),
    )

    assert awarded == [
        {
            "type": "bonus_3_orders_15d",
            "points": 50,
            "description": "3 commandes en 15 jours",
            "completed_orders": 3,
            "window_days": 15,
        }
    ]
    assert user.loyalty_points == 75
    ledger_entries = [call.args[0] for call in db.add.call_args_list if isinstance(call.args[0], LoyaltyLedgerEntry)]
    assert len(ledger_entries) == 1
    assert ledger_entries[0].entry_type == "bonus_3_orders_15d"
    assert ledger_entries[0].points_delta == 50
    assert ledger_entries[0].balance_after == 75
    db.flush.assert_called_once()
