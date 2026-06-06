from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest

from app.schemas.dashboard import (
    PartnerOnboardingSummary,
    PartnerOrdersSummary,
    PartnerPricingSummarySection,
)
from app.services.dashboard_service import DashboardService


@pytest.fixture
def mock_db_session():
    return Mock()


@pytest.fixture
def dashboard_service(mock_db_session):
    return DashboardService(mock_db_session)


class TestDashboardService:
    def test_build_operational_state_returns_paused_when_partner_not_accepting_orders(
        self, dashboard_service
    ):
        partner = SimpleNamespace(is_accepting_orders=False, is_featured=True)
        onboarding = PartnerOnboardingSummary(
            has_working_hours=True,
            has_services=True,
            has_video=True,
            has_promotion=True,
            completed_steps=4,
        )

        result = dashboard_service._build_operational_state(partner, onboarding)

        assert result.order_intake_status == "paused"
        assert result.accepting_orders is False
        assert result.has_data_gaps is False

    def test_build_operational_state_marks_data_gaps_when_video_is_missing(
        self, dashboard_service
    ):
        partner = SimpleNamespace(is_accepting_orders=True, is_featured=False)
        onboarding = PartnerOnboardingSummary(
            has_working_hours=True,
            has_services=True,
            has_video=False,
            has_promotion=True,
            completed_steps=3,
        )

        result = dashboard_service._build_operational_state(partner, onboarding)

        assert result.order_intake_status == "live"
        assert result.accepting_orders is True
        assert result.has_data_gaps is True

    def test_get_partner_dashboard_summary_composes_sections(self, dashboard_service, monkeypatch):
        partner_id = uuid4()
        partner = SimpleNamespace(
            id=partner_id,
            name="Partner Test",
            is_featured=True,
            is_accepting_orders=True,
        )
        onboarding = PartnerOnboardingSummary(
            has_working_hours=True,
            has_services=True,
            has_video=False,
            has_promotion=True,
            completed_steps=3,
        )
        orders = PartnerOrdersSummary(
            pending_new_orders=5,
            active_orders=12,
            completed_orders_this_month=8,
            revenue_this_month=Decimal("125.50"),
            average_order_value=Decimal("14.25"),
        )
        pricing = PartnerPricingSummarySection(
            services_count=10,
            rules_count=4,
            average_price=Decimal("8.75"),
            min_price=Decimal("4.00"),
            max_price=Decimal("15.00"),
            has_express=True,
            has_pickup_fee=False,
            has_delivery_fee=True,
            has_bulk_discount=False,
        )

        monkeypatch.setattr(
            dashboard_service,
            "_get_partner_or_raise",
            lambda incoming_partner_id: partner,
        )
        monkeypatch.setattr(
            dashboard_service,
            "_build_onboarding_summary",
            lambda incoming_partner_id, incoming_partner: onboarding,
        )
        monkeypatch.setattr(
            dashboard_service,
            "_build_orders_summary",
            lambda incoming_partner_id: orders,
        )
        monkeypatch.setattr(
            dashboard_service,
            "_build_pricing_summary",
            lambda incoming_partner_id: pricing,
        )

        summary = dashboard_service.get_partner_dashboard_summary(partner_id)

        assert summary.partner.id == partner_id
        assert summary.partner.name == "Partner Test"
        assert summary.partner.onboarding.completed_steps == 3
        assert summary.orders.pending_new_orders == 5
        assert summary.pricing.services_count == 10
        assert summary.operational_state.order_intake_status == "featured"
        assert summary.meta.timezone == "Africa/Kinshasa"
        assert summary.meta.source_version == "partner-dashboard-summary-v1"
        assert isinstance(summary.meta.generated_at, datetime)
