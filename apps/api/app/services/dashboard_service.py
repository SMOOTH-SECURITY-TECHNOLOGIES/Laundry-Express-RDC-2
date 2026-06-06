from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.catalog import PartnerService
from app.models.order import Order, OrderStatus
from app.models.partner import Partner, PartnerOperatingHours
from app.models.promotion import PromoCode
from app.schemas.dashboard import (
    DashboardMeta,
    PartnerDashboardSummaryResponse,
    PartnerOnboardingSummary,
    PartnerOperationalState,
    PartnerOrdersSummary,
    PartnerPricingSummarySection,
    PartnerSummarySection,
)
from app.services.pricing_service import PricingService


KINSHASA_TZ = ZoneInfo("Africa/Kinshasa")
SOURCE_VERSION = "partner-dashboard-summary-v1"


class DashboardService:
    """Agrège les données nécessaires au dashboard partenaire."""

    def __init__(self, db: Session):
        self.db = db
        self.pricing_service = PricingService(db)

    def get_partner_dashboard_summary(
        self, partner_id: UUID
    ) -> PartnerDashboardSummaryResponse:
        partner = self._get_partner_or_raise(partner_id)
        onboarding = self._build_onboarding_summary(partner_id, partner)
        orders_summary = self._build_orders_summary(partner_id)
        pricing_summary = self._build_pricing_summary(partner_id)
        operational_state = self._build_operational_state(
            partner=partner,
            onboarding=onboarding,
        )

        return PartnerDashboardSummaryResponse(
            partner=PartnerSummarySection(
                id=partner.id,
                name=partner.name,
                is_featured=bool(partner.is_featured),
                currency="CDF",
                onboarding=onboarding,
            ),
            orders=orders_summary,
            pricing=pricing_summary,
            operational_state=operational_state,
            meta=DashboardMeta(
                generated_at=datetime.now(KINSHASA_TZ),
                timezone="Africa/Kinshasa",
                source_version=SOURCE_VERSION,
            ),
        )

    def _get_partner_or_raise(self, partner_id: UUID) -> Partner:
        partner = self.db.query(Partner).filter(Partner.id == partner_id).first()
        if partner is None:
            raise ValueError("Partenaire introuvable")
        return partner

    def _build_onboarding_summary(
        self, partner_id: UUID, partner: Partner
    ) -> PartnerOnboardingSummary:
        has_working_hours = (
            self.db.query(PartnerOperatingHours)
            .filter(
                PartnerOperatingHours.partner_id == partner_id,
                PartnerOperatingHours.is_closed.is_(False),
            )
            .count()
            > 0
        )

        has_services = (
            self.db.query(PartnerService)
            .filter(
                PartnerService.partner_id == partner_id,
                PartnerService.is_available.is_(True),
            )
            .count()
            > 0
        )

        # NOTE: Le modèle Partner actuel ne porte pas encore de champ video_url.
        # On renvoie False explicitement jusqu'à ajout de cette donnée en base.
        has_video = False

        has_promotion = (
            self.db.query(PromoCode)
            .filter(
                PromoCode.partner_id == partner_id,
                PromoCode.is_active.is_(True),
            )
            .count()
            > 0
        )

        completed_steps = sum(
            [has_working_hours, has_services, has_video, has_promotion]
        )

        return PartnerOnboardingSummary(
            has_working_hours=has_working_hours,
            has_services=has_services,
            has_video=has_video,
            has_promotion=has_promotion,
            completed_steps=completed_steps,
        )

    def _build_orders_summary(self, partner_id: UUID) -> PartnerOrdersSummary:
        now = datetime.now(KINSHASA_TZ)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month = now.replace(
                year=now.year + 1,
                month=1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )
        else:
            next_month = now.replace(
                month=now.month + 1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )

        pending_new_orders = (
            self.db.query(func.count(Order.id))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.PENDING_CONFIRMATION,
            )
            .scalar()
            or 0
        )

        active_orders = (
            self.db.query(func.count(Order.id))
            .filter(
                Order.partner_id == partner_id,
                Order.status.notin_(
                    [
                        OrderStatus.COMPLETED,
                        OrderStatus.CANCELLED,
                        OrderStatus.FAILED,
                    ]
                ),
            )
            .scalar()
            or 0
        )

        completed_orders_this_month = (
            self.db.query(func.count(Order.id))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.COMPLETED,
                Order.completed_at.isnot(None),
                Order.completed_at >= month_start,
                Order.completed_at < next_month,
            )
            .scalar()
            or 0
        )

        revenue_this_month = (
            self.db.query(func.coalesce(func.sum(Order.total_amount), 0))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.COMPLETED,
                Order.completed_at.isnot(None),
                Order.completed_at >= month_start,
                Order.completed_at < next_month,
            )
            .scalar()
            or Decimal("0.00")
        )

        average_order_value = (
            self.db.query(func.coalesce(func.avg(Order.total_amount), 0))
            .filter(
                Order.partner_id == partner_id,
                Order.status == OrderStatus.COMPLETED,
            )
            .scalar()
            or Decimal("0.00")
        )

        return PartnerOrdersSummary(
            pending_new_orders=int(pending_new_orders),
            active_orders=int(active_orders),
            completed_orders_this_month=int(completed_orders_this_month),
            revenue_this_month=Decimal(str(revenue_this_month)),
            average_order_value=Decimal(str(average_order_value)),
        )

    def _build_pricing_summary(
        self, partner_id: UUID
    ) -> PartnerPricingSummarySection:
        summary = self.pricing_service.get_pricing_summary(partner_id)
        return PartnerPricingSummarySection(
            services_count=int(summary["services_count"]),
            rules_count=int(summary["rules_count"]),
            average_price=Decimal(str(summary["average_price"])),
            min_price=Decimal(str(summary["min_price"])),
            max_price=Decimal(str(summary["max_price"])),
            has_express=bool(summary["has_express"]),
            has_pickup_fee=bool(summary["has_pickup_fee"]),
            has_delivery_fee=bool(summary["has_delivery_fee"]),
            has_bulk_discount=bool(summary["has_bulk_discount"]),
        )

    def _build_operational_state(
        self,
        partner: Partner,
        onboarding: PartnerOnboardingSummary,
    ) -> PartnerOperationalState:
        accepting_orders = bool(partner.is_accepting_orders)

        if not accepting_orders:
            order_intake_status = "paused"
        elif bool(partner.is_featured):
            order_intake_status = "featured"
        else:
            order_intake_status = "live"

        has_data_gaps = not onboarding.has_services or not onboarding.has_video

        return PartnerOperationalState(
            order_intake_status=order_intake_status,
            accepting_orders=accepting_orders,
            has_data_gaps=has_data_gaps,
        )
