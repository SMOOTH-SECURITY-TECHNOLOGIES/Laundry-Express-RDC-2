from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.catalog import (
    PartnerService,
    PricingRule,
    PricingMode,
    RuleType,
    PriceAdjustmentType,
)
from app.models.loyalty import LoyaltySettingsConfig
from app.models.order import Order
from app.models.referral import ReferralReviewStatus, ReferralSettingsConfig
from app.models.user import User
from app.repositories.catalog_repository import CatalogRepository
from app.schemas.pricing import (
    PricingEstimateRequest,
    PricingEstimateResponse,
    PricingBreakdownItem,
    PricingAdjustmentLine,
    PricingEstimateItemInput,
    PriceCalculationInput,
    PriceCalculationResult,
)
from app.schemas.order import OrderItemCreate
from app.services.loyalty_service import LoyaltyService
from app.services.promotion_service import PromotionService


class PricingService:
    """Service de tarification pour les commandes"""

    def __init__(self, db: Session):
        self.db = db
        self.repository = CatalogRepository(db)

    def _get_loyalty_settings(self) -> tuple[bool, int, int]:
        config = (
            self.db.query(LoyaltySettingsConfig)
            .filter(LoyaltySettingsConfig.key == "site")
            .first()
        )
        if config is None:
            return True, 10, 100
        return bool(config.is_enabled), int(config.points_per_dollar), int(config.points_to_dollar)

    def _get_customer(self, customer_id: UUID | None) -> User | None:
        if customer_id is None:
            return None
        return self.db.query(User).filter(User.id == customer_id).first()

    def _get_referral_settings(self) -> tuple[bool, int, Decimal]:
        config = (
            self.db.query(ReferralSettingsConfig)
            .filter(ReferralSettingsConfig.key == "site")
            .first()
        )
        if config is None:
            return True, 500, Decimal("5.00")
        return (
            bool(config.is_enabled),
            int(config.referrer_bonus_points),
            Decimal(str(config.referee_discount_amount)),
        )

    @staticmethod
    def _is_referral_review_blocking(review_status: str | None) -> bool:
        return (review_status or "").strip().lower() in {
            "reviewed_high_risk",
            "high_risk",
            "blocked",
        }

    def _is_referrer_blocked(self, referrer_user_id: UUID | None) -> bool:
        if referrer_user_id is None:
            return False
        review = (
            self.db.query(ReferralReviewStatus)
            .filter(ReferralReviewStatus.referrer_user_id == referrer_user_id)
            .first()
        )
        return self._is_referral_review_blocking(getattr(review, "review_status", None))

    def _customer_is_new(self, customer_id: UUID | None) -> bool:
        if customer_id is None:
            return False
        return (
            self.db.query(Order)
            .filter(Order.customer_id == customer_id)
            .count()
            == 0
        )

    def _apply_promo_code(
        self,
        subtotal: Decimal,
        estimate_request: PricingEstimateRequest,
        adjustments: List[PricingAdjustmentLine],
    ) -> Decimal:
        if not estimate_request.promo_code:
            return Decimal("0")

        promo_service = PromotionService(self.db)
        service_ids = {str(item.service_id) for item in estimate_request.items}
        promo = promo_service.validate_promo_for_checkout(
            estimate_request.promo_code,
            partner_id=estimate_request.partner_id,
            subtotal=subtotal,
            customer_id=estimate_request.customer_id,
            service_ids=service_ids,
        )
        discount_amount = promo_service.calculate_discount(promo, subtotal)

        adjustments.append(
            PricingAdjustmentLine(
                name=f"Promo {promo.code}",
                description=promo.description or f"Code promo {promo.code}",
                adjustment_type="discount",
                amount=discount_amount,
                rule_type="promo_code",
            )
        )
        return discount_amount

    def _apply_loyalty_redemption(
        self,
        subtotal: Decimal,
        estimate_request: PricingEstimateRequest,
        adjustments: List[PricingAdjustmentLine],
        current_discount_total: Decimal,
    ) -> tuple[Decimal, int]:
        if estimate_request.loyalty_points_to_redeem <= 0:
            return Decimal("0"), 0

        is_enabled, _, points_to_dollar = self._get_loyalty_settings()
        if not is_enabled:
            raise ValueError("Le programme de fidelite est desactive")
        if points_to_dollar <= 0:
            raise ValueError("Configuration de fidelite invalide")

        customer = self._get_customer(estimate_request.customer_id)
        if customer is None:
            raise ValueError("Utilisateur introuvable pour l'utilisation des points fidelite")

        LoyaltyService(self.db).apply_expiration(user_id=customer.id)
        self.db.refresh(customer)
        available_points = int(getattr(customer, "loyalty_points", 0) or 0)
        if available_points <= 0:
            raise ValueError("Aucun point fidelite disponible")

        points_to_use = min(int(estimate_request.loyalty_points_to_redeem), available_points)
        remaining_total = max(Decimal("0.00"), subtotal - current_discount_total)
        raw_discount = (Decimal(points_to_use) / Decimal(points_to_dollar)).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
        discount_amount = min(raw_discount, remaining_total)
        actual_points_used = int(
            (discount_amount * Decimal(points_to_dollar)).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
        )

        if discount_amount <= 0 or actual_points_used <= 0:
            raise ValueError("Montant de reduction fidelite invalide")

        adjustments.append(
            PricingAdjustmentLine(
                name="Points fidelite",
                description=f"{actual_points_used} points utilises",
                adjustment_type="discount",
                amount=discount_amount,
                rule_type="loyalty_points",
            )
        )
        return discount_amount, actual_points_used

    def _apply_referral_discount(
        self,
        subtotal: Decimal,
        estimate_request: PricingEstimateRequest,
        adjustments: List[PricingAdjustmentLine],
        current_discount_total: Decimal,
    ) -> Decimal:
        customer = self._get_customer(estimate_request.customer_id)
        if customer is None:
            return Decimal("0")

        if not getattr(customer, "referred_by_user_id", None):
            return Decimal("0")
        if getattr(customer, "referral_discount_used_at", None):
            return Decimal("0")
        if self._is_referrer_blocked(getattr(customer, "referred_by_user_id", None)):
            return Decimal("0")

        is_enabled, _, referee_discount_amount = self._get_referral_settings()
        if not is_enabled or referee_discount_amount <= 0:
            return Decimal("0")

        remaining_total = max(Decimal("0.00"), subtotal - current_discount_total)
        discount_amount = min(
            referee_discount_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            remaining_total,
        )
        if discount_amount <= 0:
            return Decimal("0")

        adjustments.append(
            PricingAdjustmentLine(
                name="Referral discount",
                description="Referral first-order discount applied",
                adjustment_type="discount",
                amount=discount_amount,
                rule_type="referral_discount",
            )
        )
        return discount_amount

    # === Calcul de prix ===

    def calculate_item_price(
        self, partner_service: PartnerService, quantity: float, item_name: str
    ) -> Tuple[Decimal, Decimal]:
        """Calculer le prix d'un article"""
        base_price = Decimal(str(partner_service.base_price))

        if partner_service.pricing_mode == PricingMode.UNIT:
            unit_price = base_price
            line_total = unit_price * Decimal(str(quantity))
        elif partner_service.pricing_mode == PricingMode.KG:
            # Pour le MVP, on considère que quantity est en kg
            unit_price = base_price
            line_total = unit_price * Decimal(str(quantity))
        else:  # FIXED
            unit_price = base_price
            line_total = base_price  # Prix fixe indépendant de la quantité

        # Arrondir à 2 décimales
        line_total = line_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        unit_price = unit_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return unit_price, line_total

    def apply_pricing_rule(
        self, amount: Decimal, rule: PricingRule, quantity: Optional[int] = None
    ) -> Decimal:
        """Appliquer une règle de tarification à un montant"""
        adjustment_value = Decimal(str(rule.price_adjustment_value))

        if rule.price_adjustment_type == PriceAdjustmentType.FIXED:
            adjustment = adjustment_value
        else:  # PERCENTAGE
            adjustment = (amount * adjustment_value) / Decimal('100')

        # Arrondir à 2 décimales
        adjustment = adjustment.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Pour les remises, l'ajustement est négatif
        if rule.rule_type in [RuleType.BULK_DISCOUNT]:
            adjustment = -adjustment

        return adjustment

    def estimate_order_price(self, estimate_request: PricingEstimateRequest) -> PricingEstimateResponse:
        """Estimer le prix d'une commande avec breakdown détaillé"""
        from decimal import Decimal

        items: List[PricingBreakdownItem] = []
        adjustments: List[PricingAdjustmentLine] = []
        
        subtotal = Decimal('0')
        surcharge_total = Decimal('0')
        discount_total = Decimal('0')
        fee_total = Decimal('0')

        # Valider et calculer chaque article
        for item_input in estimate_request.items:
            # Récupérer le service partenaire
            partner_service = self.repository.get_partner_service_by_ids(
                estimate_request.partner_id, item_input.service_id
            )

            if not partner_service:
                raise ValueError(f"Service {item_input.service_id} non trouvé pour le partenaire")

            if not partner_service.is_available:
                raise ValueError(f"Service {item_input.service_id} n'est pas disponible")

            # Calculer le prix de l'article
            unit_price, line_total = self.calculate_item_price(
                partner_service, item_input.quantity, item_input.item_name
            )

            # Ajouter au subtotal
            subtotal += line_total

            # Ajouter au breakdown des articles
            items.append(
                PricingBreakdownItem(
                    item_name=item_input.item_name,
                    service_id=item_input.service_id,
                    quantity=item_input.quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                    pricing_mode=partner_service.pricing_mode.value,
                    notes=item_input.notes,
                )
            )

        # Récupérer les règles de tarification applicables
        applicable_rules = self.repository.get_pricing_rules_for_order(
            partner_id=estimate_request.partner_id,
            express=estimate_request.express,
            pickup_requested=estimate_request.pickup_requested,
            delivery_requested=estimate_request.delivery_requested,
        )

        # Appliquer les règles
        express_applied = False
        pickup_fee_applied = False
        delivery_fee_applied = False
        minimum_order_fee_applied = False

        for rule in applicable_rules:
            adjustment_amount = Decimal('0')
            description = None

            if rule.rule_type == RuleType.EXPRESS_SURCHARGE and estimate_request.express:
                adjustment_amount = self.apply_pricing_rule(subtotal, rule)
                surcharge_total += adjustment_amount
                express_applied = True
                description = "Surcharge express"

            elif rule.rule_type == RuleType.PICKUP_FEE and estimate_request.pickup_requested:
                adjustment_amount = self.apply_pricing_rule(Decimal('1'), rule)  # Frais fixe
                fee_total += adjustment_amount
                pickup_fee_applied = True
                description = "Frais de pickup"

            elif rule.rule_type == RuleType.DELIVERY_FEE and estimate_request.delivery_requested:
                adjustment_amount = self.apply_pricing_rule(Decimal('1'), rule)  # Frais fixe
                fee_total += adjustment_amount
                delivery_fee_applied = True
                description = "Frais de livraison"

            elif rule.rule_type == RuleType.BULK_DISCOUNT:
                # Vérifier les conditions de quantité
                total_quantity = sum(item.quantity for item in estimate_request.items)
                if (rule.min_quantity is None or total_quantity >= rule.min_quantity) and \
                   (rule.max_quantity is None or total_quantity <= rule.max_quantity):
                    adjustment_amount = self.apply_pricing_rule(subtotal, rule, total_quantity)
                    discount_total += adjustment_amount
                    description = f"Remise quantité ({total_quantity} articles)"

            elif rule.rule_type == RuleType.MINIMUM_ORDER_FEE:
                # Vérifié après calcul du total
                pass

            elif rule.rule_type == RuleType.FRAGILE_FABRIC_SURCHARGE:
                # Pour le MVP, on applique à tous les articles
                adjustment_amount = self.apply_pricing_rule(subtotal, rule)
                surcharge_total += adjustment_amount
                description = "Surcharge tissus fragiles"

            # Ajouter l'ajustement au breakdown
            if adjustment_amount != Decimal('0'):
                adjustment_type = "surcharge" if adjustment_amount > 0 else "discount"
                if rule.rule_type in [RuleType.PICKUP_FEE, RuleType.DELIVERY_FEE]:
                    adjustment_type = "fee"

                adjustments.append(
                    PricingAdjustmentLine(
                        name=rule.rule_type.value.replace('_', ' ').title(),
                        description=description,
                        adjustment_type=adjustment_type,
                        amount=abs(adjustment_amount),
                        rule_type=rule.rule_type.value,
                    )
                )

        # Calculer le total
        promo_discount = self._apply_promo_code(subtotal, estimate_request, adjustments)
        discount_total += promo_discount
        referral_discount = self._apply_referral_discount(
            subtotal,
            estimate_request,
            adjustments,
            discount_total,
        )
        discount_total += referral_discount
        loyalty_discount, loyalty_points_redeemed = self._apply_loyalty_redemption(
            subtotal,
            estimate_request,
            adjustments,
            discount_total,
        )
        discount_total += loyalty_discount
        total = subtotal + surcharge_total + fee_total - discount_total

        # Appliquer le minimum order fee si nécessaire
        for rule in applicable_rules:
            if rule.rule_type == RuleType.MINIMUM_ORDER_FEE and total < Decimal(str(rule.price_adjustment_value)):
                minimum_fee = Decimal(str(rule.price_adjustment_value))
                fee_adjustment = minimum_fee - total
                
                if fee_adjustment > 0:
                    fee_total += fee_adjustment
                    total = minimum_fee
                    minimum_order_fee_applied = True

                    adjustments.append(
                        PricingAdjustmentLine(
                            name="Frais minimum de commande",
                            description=f"Total inférieur au minimum de {minimum_fee}",
                            adjustment_type="fee",
                            amount=fee_adjustment,
                            rule_type=RuleType.MINIMUM_ORDER_FEE.value,
                        )
                    )

        # Arrondir les totaux
        subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        surcharge_total = surcharge_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        discount_total = discount_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        fee_total = fee_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total = total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Générer une explication
        explanation_lines = []
        if express_applied:
            explanation_lines.append("Surcharge express appliquée")
        if pickup_fee_applied:
            explanation_lines.append("Frais de pickup appliqués")
        if delivery_fee_applied:
            explanation_lines.append("Frais de livraison appliqués")
        if minimum_order_fee_applied:
            explanation_lines.append("Frais minimum de commande appliqué")
        if discount_total > 0:
            explanation_lines.append(f"Remise de {discount_total} appliquée")

        explanation = "; ".join(explanation_lines) if explanation_lines else "Aucune règle spéciale appliquée"
        if estimate_request.promo_code and promo_discount > 0:
            explanation = f"{explanation}; Code promo {estimate_request.promo_code.upper()} appliqué"
        if referral_discount > 0:
            explanation = f"{explanation}; Remise parrainage appliquee"
        if loyalty_discount > 0:
            explanation = f"{explanation}; {loyalty_points_redeemed} points fidelite utilises"

        return PricingEstimateResponse(
            subtotal=subtotal,
            surcharge_total=surcharge_total,
            discount_total=discount_total,
            fee_total=fee_total,
            total=total,
            currency="CDF",
            items=items,
            adjustments=adjustments,
            partner_id=estimate_request.partner_id,
            express_applied=express_applied,
            pickup_fee_applied=pickup_fee_applied,
            delivery_fee_applied=delivery_fee_applied,
            minimum_order_fee_applied=minimum_order_fee_applied,
            explanation=explanation,
        )

    def calculate_order_price(self, calculation_input: PriceCalculationInput) -> PriceCalculationResult:
        """Calculer le prix d'une commande (pour OrderService)"""
        # Convertir OrderItemCreate en PricingEstimateItemInput
        estimate_items = []
        for item in calculation_input.items:
            estimate_items.append(
                PricingEstimateItemInput(
                    service_id=item.service_id,
                    quantity=item.quantity,
                    item_name=item.item_name,
                    notes=item.notes,
                )
            )

        # Créer la requête d'estimation
        estimate_request = PricingEstimateRequest(
            partner_id=calculation_input.partner_id,
            items=estimate_items,
            express=calculation_input.express,
            pickup_requested=calculation_input.pickup_requested,
            delivery_requested=calculation_input.delivery_requested,
            promo_code=calculation_input.promo_code,
            loyalty_points_to_redeem=calculation_input.loyalty_points_to_redeem,
            customer_id=calculation_input.customer_id,
        )

        # Obtenir l'estimation
        estimate = self.estimate_order_price(estimate_request)
        promo_discount = sum(
            adjustment.amount
            for adjustment in estimate.adjustments
            if adjustment.rule_type == "promo_code"
        )
        loyalty_discount = sum(
            adjustment.amount
            for adjustment in estimate.adjustments
            if adjustment.rule_type == "loyalty_points"
        )
        referral_discount = sum(
            adjustment.amount
            for adjustment in estimate.adjustments
            if adjustment.rule_type == "referral_discount"
        )
        loyalty_points_redeemed = 0
        for adjustment in estimate.adjustments:
            if adjustment.rule_type == "loyalty_points" and adjustment.description:
                digits = "".join(ch for ch in adjustment.description if ch.isdigit())
                if digits:
                    loyalty_points_redeemed = int(digits)
                    break

        promo_meta: dict[str, str] = {}
        if estimate_request.promo_code:
            promo = PromotionService(self.db).get_promo_by_code(estimate_request.promo_code)
            if promo is not None:
                promo_meta = {
                    "promo_code": promo.code,
                    "promo_code_id": str(promo.id),
                }

        # Convertir en résultat pour OrderService
        return PriceCalculationResult(
            subtotal_amount=estimate.subtotal,
            discount_amount=estimate.discount_total,
            pickup_fee=sum(
                adjustment.amount
                for adjustment in estimate.adjustments
                if adjustment.rule_type == RuleType.PICKUP_FEE.value
            ),
            delivery_fee=sum(
                adjustment.amount
                for adjustment in estimate.adjustments
                if adjustment.rule_type == RuleType.DELIVERY_FEE.value
            ),
            total_amount=estimate.total,
            currency=estimate.currency,
            calculation_breakdown={
                "subtotal": float(estimate.subtotal),
                "surcharges": float(estimate.surcharge_total),
                "discounts": float(estimate.discount_total),
                "promo_discount": float(promo_discount),
                "referral_discount": float(referral_discount),
                "loyalty_discount": float(loyalty_discount),
                "loyalty_points_redeemed": loyalty_points_redeemed,
                "loyalty_points_earned": 0,
                "fees": float(estimate.fee_total),
                "total": float(estimate.total),
                "explanation": estimate.explanation,
                "promotion_consumed": False,
                **promo_meta,
            },
        )

    # === Validation ===

    def validate_order_items(
        self, partner_id: UUID, items: List[OrderItemCreate]
    ) -> List[str]:
        """Valider les articles d'une commande"""
        errors = []

        for i, item in enumerate(items):
            # Vérifier l'existence du service
            partner_service = self.repository.get_partner_service_by_ids(
                partner_id, item.service_id
            )

            if not partner_service:
                errors.append(f"Article {i+1}: Service {item.service_id} non trouvé")
                continue

            # Vérifier la disponibilité
            if not partner_service.is_available:
                errors.append(f"Article {i+1}: Service {partner_service.service_category.name} - {partner_service.service_type.name} n'est pas disponible")

            # Vérifier la quantité
            if item.quantity <= 0:
                errors.append(f"Article {i+1}: La quantité doit être positive")

            # Vérifier le nom
            if not item.item_name or len(item.item_name.strip()) == 0:
                errors.append(f"Article {i+1}: Le nom de l'article est requis")

        return errors

    # === Utilitaires ===

    def get_pricing_summary(self, partner_id: UUID) -> dict:
        """Obtenir un résumé de la tarification d'un partenaire"""
        services = self.repository.list_partner_services(
            partner_id=partner_id, available_only=True, active_only=True
        )
        rules = self.repository.list_pricing_rules(
            partner_id=partner_id, active_only=True
        )

        # Calculer les prix moyens
        if services:
            avg_price = sum(float(s.base_price) for s in services) / len(services)
            min_price = min(float(s.base_price) for s in services)
            max_price = max(float(s.base_price) for s in services)
        else:
            avg_price = min_price = max_price = 0

        return {
            "services_count": len(services),
            "rules_count": len(rules),
            "average_price": avg_price,
            "min_price": min_price,
            "max_price": max_price,
            "has_express": any(r.rule_type == RuleType.EXPRESS_SURCHARGE for r in rules),
            "has_pickup_fee": any(r.rule_type == RuleType.PICKUP_FEE for r in rules),
            "has_delivery_fee": any(r.rule_type == RuleType.DELIVERY_FEE for r in rules),
            "has_bulk_discount": any(r.rule_type == RuleType.BULK_DISCOUNT for r in rules),
        }
