from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.promotion import PromoCode, PromoCodeUsage, PromoDiscountType
from app.services.audit_service import AuditService


class PromotionValidationError(ValueError):
    def __init__(self, reason: str, message: str):
        super().__init__(message)
        self.reason = reason


class PromotionService:
    REJECTION_MESSAGES = {
        "invalid_code": "Code promo invalide ou inactif",
        "inactive": "Code promo invalide ou inactif",
        "promotion_not_started": "Ce code promo n'est pas encore actif",
        "promotion_expired": "Ce code promo a expiré",
        "wrong_partner": "Ce code promo ne s'applique pas à ce partenaire",
        "min_order_not_met": "Le montant minimum pour ce code promo n'est pas atteint",
        "new_users_only": "Ce code promo est réservé aux nouveaux clients",
        "wrong_services": "Ce code promo ne s'applique pas aux services sélectionnés",
        "max_usage_exceeded": "Ce code promo a atteint sa limite d'utilisation",
        "per_customer_limit_exceeded": "Vous avez déjà utilisé ce code promo",
    }

    def __init__(self, db: Session):
        self.db = db

    def get_promo_by_code(self, code: str) -> PromoCode | None:
        normalized = (code or "").strip().upper()
        if not normalized:
            return None
        return self.db.query(PromoCode).filter(PromoCode.code == normalized).first()

    @staticmethod
    def _parse_date(value: str | None) -> date | None:
        if not value:
            return None
        raw = value.strip()
        if "T" in raw:
            raw = raw.split("T", 1)[0]
        return date.fromisoformat(raw)

    def _is_within_date_window(self, promo: PromoCode) -> tuple[bool, str | None]:
        today = date.today()
        if promo.start_date:
            start = self._parse_date(promo.start_date)
            if start and today < start:
                return False, "promotion_not_started"
        if promo.end_date:
            end = self._parse_date(promo.end_date)
            if end and today > end:
                return False, "promotion_expired"
        return True, None

    def _customer_is_new(self, customer_id: UUID | None) -> bool:
        if customer_id is None:
            return False
        return self.db.query(Order).filter(Order.customer_id == customer_id).count() == 0

    def count_consumed_usages(self, promo_id: UUID) -> int:
        return (
            self.db.query(PromoCodeUsage)
            .filter(PromoCodeUsage.promo_code_id == promo_id)
            .count()
        )

    def count_customer_usages(self, promo_id: UUID, customer_id: UUID) -> int:
        return (
            self.db.query(PromoCodeUsage)
            .filter(
                PromoCodeUsage.promo_code_id == promo_id,
                PromoCodeUsage.customer_id == customer_id,
            )
            .count()
        )

    def has_order_consumption(self, order_id: UUID) -> bool:
        return (
            self.db.query(PromoCodeUsage.id)
            .filter(PromoCodeUsage.order_id == order_id)
            .first()
            is not None
        )

    def _log_rejection(
        self,
        *,
        customer_id: UUID | None,
        promo_code: str,
        reason: str,
        partner_id: UUID | None,
        promo: PromoCode | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        if customer_id is None:
            return
        payload = {
            "promo_code": promo_code.upper(),
            "reason": reason,
            "partner_id": str(partner_id) if partner_id else None,
        }
        if details:
            payload.update(details)
        AuditService(self.db).log_event(
            user_id=customer_id,
            action="promotion_rejected",
            resource_type="promo_code",
            resource_id=promo.id if promo is not None else None,
            details=payload,
        )
        self.db.commit()

    def validate_promo_for_checkout(
        self,
        promo_code: str,
        *,
        partner_id: UUID,
        subtotal: Decimal,
        customer_id: UUID | None,
        service_ids: set[str],
        log_rejection: bool = True,
    ) -> PromoCode:
        promo = self.get_promo_by_code(promo_code)
        reason: str | None = None

        if promo is None:
            reason = "invalid_code"
        elif not promo.is_active:
            reason = "inactive"
        else:
            ok, date_reason = self._is_within_date_window(promo)
            if not ok:
                reason = date_reason
            elif promo.partner_id and promo.partner_id != partner_id:
                reason = "wrong_partner"
            elif promo.min_order_value is not None and subtotal < Decimal(str(promo.min_order_value)):
                reason = "min_order_not_met"
            elif promo.is_for_new_users_only and not self._customer_is_new(customer_id):
                reason = "new_users_only"
            else:
                applicable_services = {str(service_id) for service_id in promo.applicable_services_list}
                if applicable_services and applicable_services.isdisjoint(service_ids):
                    reason = "wrong_services"
                elif promo.max_usage is not None and self.count_consumed_usages(promo.id) >= int(promo.max_usage):
                    reason = "max_usage_exceeded"
                elif (
                    promo.usage_limit_per_customer is not None
                    and customer_id is not None
                    and self.count_customer_usages(promo.id, customer_id) >= int(promo.usage_limit_per_customer)
                ):
                    reason = "per_customer_limit_exceeded"

        if reason:
            if log_rejection:
                self._log_rejection(
                    customer_id=customer_id,
                    promo_code=promo_code,
                    reason=reason,
                    partner_id=partner_id,
                    promo=promo,
                    details={"subtotal": str(subtotal)},
                )
            raise PromotionValidationError(reason, self.REJECTION_MESSAGES.get(reason, "Code promo refusé"))

        return promo

    @staticmethod
    def calculate_discount(promo: PromoCode, subtotal: Decimal) -> Decimal:
        if promo.discount_type == PromoDiscountType.PERCENTAGE.value:
            discount_amount = (subtotal * Decimal(str(promo.discount_value))) / Decimal("100")
        else:
            discount_amount = Decimal(str(promo.discount_value))
        return min(discount_amount, subtotal).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def log_promotion_applied(
        self,
        *,
        customer_id: UUID,
        order_id: UUID,
        promo: PromoCode,
        discount_applied: Decimal,
        order_total: Decimal,
    ) -> None:
        if self._audit_already_logged(order_id, "promotion_applied"):
            return
        AuditService(self.db).log_event(
            user_id=customer_id,
            action="promotion_applied",
            resource_type="promo_code",
            resource_id=order_id,
            details={
                "order_id": str(order_id),
                "promo_code": promo.code,
                "discount_applied": str(discount_applied),
                "order_total": str(order_total),
            },
        )

    def consume_for_paid_order(self, order: Order) -> PromoCodeUsage | None:
        breakdown = dict(order.calculation_breakdown or {})
        promo_code = breakdown.get("promo_code")
        if not promo_code:
            return None
        if breakdown.get("promotion_consumed"):
            return None
        if self.has_order_consumption(order.id):
            return None

        promo = self.get_promo_by_code(str(promo_code))
        if promo is None:
            return None

        discount_applied = Decimal(str(breakdown.get("promo_discount", 0) or 0))
        now = datetime.now(timezone.utc)

        usage = PromoCodeUsage(
            id=uuid4(),
            promo_code_id=promo.id,
            order_id=order.id,
            customer_id=order.customer_id,
            discount_applied=discount_applied,
            consumed_at=now.isoformat(),
        )
        self.db.add(usage)

        promo.usage_count = int(promo.usage_count or 0) + 1
        self.db.add(promo)

        breakdown["promotion_consumed"] = True
        order.calculation_breakdown = breakdown
        self.db.add(order)

        if not self._audit_already_logged(order.id, "promotion_consumed"):
            AuditService(self.db).log_event(
                user_id=order.customer_id,
                action="promotion_consumed",
                resource_type="promo_code",
                resource_id=order.id,
                details={
                    "order_id": str(order.id),
                    "promo_code": promo.code,
                    "discount_applied": str(discount_applied),
                    "amount_paid": str(order.amount_paid),
                },
            )

        return usage

    def _audit_already_logged(self, resource_id: UUID, action: str) -> bool:
        from app.models.admin import AuditLog

        return (
            self.db.query(AuditLog.id)
            .filter(
                AuditLog.resource_id == resource_id,
                AuditLog.action == action,
            )
            .first()
            is not None
        )
