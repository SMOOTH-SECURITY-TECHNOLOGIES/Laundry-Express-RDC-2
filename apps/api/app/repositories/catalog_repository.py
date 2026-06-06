from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.models.catalog import (
    ServiceCategory,
    ServiceType,
    PartnerService,
    PricingRule,
    PricingMode,
    RuleType,
)
from app.models.partner import Partner, PartnerLocation, PartnerStatus


class CatalogRepository:
    """Repository pour les opérations sur le catalogue"""

    def __init__(self, db: Session):
        self.db = db

    # === Service Categories ===

    def create_service_category(self, category: ServiceCategory) -> ServiceCategory:
        """Créer une catégorie de service"""
        self.db.add(category)
        self.db.flush()
        return category

    def get_service_category_by_id(self, category_id: UUID) -> Optional[ServiceCategory]:
        """Récupérer une catégorie de service par son ID"""
        return (
            self.db.query(ServiceCategory)
            .filter(ServiceCategory.id == category_id)
            .first()
        )

    def get_service_category_by_slug(self, slug: str) -> Optional[ServiceCategory]:
        """Récupérer une catégorie de service par son slug"""
        return (
            self.db.query(ServiceCategory)
            .filter(ServiceCategory.slug == slug)
            .first()
        )

    def list_service_categories(self, active_only: bool = True) -> List[ServiceCategory]:
        """Lister les catégories de service"""
        query = self.db.query(ServiceCategory)

        if active_only:
            query = query.filter(ServiceCategory.is_active == True)

        return query.order_by(ServiceCategory.name).all()

    def update_service_category(self, category: ServiceCategory) -> ServiceCategory:
        """Mettre à jour une catégorie de service"""
        self.db.add(category)
        self.db.flush()
        return category

    # === Service Types ===

    def create_service_type(self, service_type: ServiceType) -> ServiceType:
        """Créer un type de service"""
        self.db.add(service_type)
        self.db.flush()
        return service_type

    def get_service_type_by_id(self, type_id: UUID) -> Optional[ServiceType]:
        """Récupérer un type de service par son ID"""
        return (
            self.db.query(ServiceType)
            .filter(ServiceType.id == type_id)
            .first()
        )

    def get_service_type_by_slug(self, slug: str) -> Optional[ServiceType]:
        """Récupérer un type de service par son slug"""
        return (
            self.db.query(ServiceType)
            .filter(ServiceType.slug == slug)
            .first()
        )

    def list_service_types(self, active_only: bool = True) -> List[ServiceType]:
        """Lister les types de service"""
        query = self.db.query(ServiceType)

        if active_only:
            query = query.filter(ServiceType.is_active == True)

        return query.order_by(ServiceType.name).all()

    def list_public_partners(self) -> List[Partner]:
        """Lister les partenaires actifs avec leurs services et localisation principale"""
        return (
            self.db.query(Partner)
            .options(
                joinedload(Partner.locations),
                joinedload(Partner.services).joinedload(PartnerService.service_category),
                joinedload(Partner.services).joinedload(PartnerService.service_type),
            )
            .filter(
                Partner.status == PartnerStatus.ACTIVE.value,
                Partner.is_accepting_orders == True,
            )
            .order_by(Partner.is_featured.desc(), Partner.rating.desc(), Partner.name.asc())
            .all()
        )

    def update_service_type(self, service_type: ServiceType) -> ServiceType:
        """Mettre à jour un type de service"""
        self.db.add(service_type)
        self.db.flush()
        return service_type

    # === Partner Services ===

    def create_partner_service(self, partner_service: PartnerService) -> PartnerService:
        """Créer un service partenaire"""
        self.db.add(partner_service)
        self.db.flush()
        return partner_service

    def get_partner_service_by_id(self, service_id: UUID) -> Optional[PartnerService]:
        """Récupérer un service partenaire par son ID"""
        return (
            self.db.query(PartnerService)
            .options(
                joinedload(PartnerService.service_category),
                joinedload(PartnerService.service_type),
            )
            .filter(PartnerService.id == service_id)
            .first()
        )

    def get_partner_service_by_ids(
        self, partner_id: UUID, service_id: UUID
    ) -> Optional[PartnerService]:
        """Récupérer un service partenaire par partner_id et service_id"""
        return (
            self.db.query(PartnerService)
            .options(
                joinedload(PartnerService.service_category),
                joinedload(PartnerService.service_type),
            )
            .filter(
                PartnerService.id == service_id,
                PartnerService.partner_id == partner_id,
            )
            .first()
        )

    def list_partner_services(
        self,
        partner_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        type_id: Optional[UUID] = None,
        available_only: bool = True,
        active_only: bool = True,
    ) -> List[PartnerService]:
        """Lister les services partenaires avec filtres"""
        query = self.db.query(PartnerService).options(
            joinedload(PartnerService.service_category),
            joinedload(PartnerService.service_type),
        )

        if partner_id:
            query = query.filter(PartnerService.partner_id == partner_id)

        if category_id:
            query = query.filter(PartnerService.service_category_id == category_id)

        if type_id:
            query = query.filter(PartnerService.service_type_id == type_id)

        if available_only:
            query = query.filter(PartnerService.is_available == True)

        if active_only:
            query = query.filter(
                PartnerService.service_category.has(is_active=True),
                PartnerService.service_type.has(is_active=True),
            )

        return query.order_by(PartnerService.base_price).all()

    def update_partner_service(self, partner_service: PartnerService) -> PartnerService:
        """Mettre à jour un service partenaire"""
        self.db.add(partner_service)
        self.db.flush()
        return partner_service

    def validate_service_availability(
        self, service_id: UUID, partner_id: UUID
    ) -> bool:
        """Valider qu'un service est disponible pour un partenaire"""
        service = self.get_partner_service_by_ids(partner_id, service_id)
        if not service:
            return False

        return (
            service.is_available
            and service.service_category.is_active
            and service.service_type.is_active
        )

    # === Pricing Rules ===

    def create_pricing_rule(self, pricing_rule: PricingRule) -> PricingRule:
        """Créer une règle de tarification"""
        self.db.add(pricing_rule)
        self.db.flush()
        return pricing_rule

    def get_pricing_rule_by_id(self, rule_id: UUID) -> Optional[PricingRule]:
        """Récupérer une règle de tarification par son ID"""
        return (
            self.db.query(PricingRule)
            .options(
                joinedload(PricingRule.service_category),
                joinedload(PricingRule.service_type),
            )
            .filter(PricingRule.id == rule_id)
            .first()
        )

    def list_pricing_rules(
        self,
        partner_id: Optional[UUID] = None,
        rule_type: Optional[RuleType] = None,
        service_category_id: Optional[UUID] = None,
        service_type_id: Optional[UUID] = None,
        active_only: bool = True,
    ) -> List[PricingRule]:
        """Lister les règles de tarification avec filtres"""
        query = self.db.query(PricingRule).options(
            joinedload(PricingRule.service_category),
            joinedload(PricingRule.service_type),
        )

        if partner_id:
            query = query.filter(PricingRule.partner_id == partner_id)

        if rule_type:
            query = query.filter(PricingRule.rule_type == rule_type)

        if service_category_id:
            query = query.filter(PricingRule.service_category_id == service_category_id)

        if service_type_id:
            query = query.filter(PricingRule.service_type_id == service_type_id)

        if active_only:
            query = query.filter(PricingRule.is_active == True)

        return query.order_by(PricingRule.created_at).all()

    def get_pricing_rules_for_order(
        self,
        partner_id: UUID,
        service_category_id: Optional[UUID] = None,
        service_type_id: Optional[UUID] = None,
        quantity: Optional[int] = None,
        express: bool = False,
        pickup_requested: bool = False,
        delivery_requested: bool = False,
    ) -> List[PricingRule]:
        """Récupérer les règles de tarification applicables à une commande"""
        query = self.db.query(PricingRule).filter(
            PricingRule.partner_id == partner_id,
            PricingRule.is_active == True,
        )

        # Filtres par type de règle
        rule_types = []

        if express:
            rule_types.append(RuleType.EXPRESS_SURCHARGE)

        if pickup_requested:
            rule_types.append(RuleType.PICKUP_FEE)

        if delivery_requested:
            rule_types.append(RuleType.DELIVERY_FEE)

        # Règles générales (sans service spécifique)
        rule_types.extend([
            RuleType.BULK_DISCOUNT,
            RuleType.MINIMUM_ORDER_FEE,
            RuleType.FRAGILE_FABRIC_SURCHARGE,
        ])

        if rule_types:
            query = query.filter(PricingRule.rule_type.in_(rule_types))

        # Filtres par service
        service_filters = []

        if service_category_id:
            service_filters.append(
                or_(
                    PricingRule.service_category_id == service_category_id,
                    PricingRule.service_category_id.is_(None),
                )
            )

        if service_type_id:
            service_filters.append(
                or_(
                    PricingRule.service_type_id == service_type_id,
                    PricingRule.service_type_id.is_(None),
                )
            )

        if service_filters:
            query = query.filter(and_(*service_filters))

        # Filtres par quantité
        if quantity is not None:
            query = query.filter(
                or_(
                    PricingRule.min_quantity.is_(None),
                    PricingRule.min_quantity <= quantity,
                ),
                or_(
                    PricingRule.max_quantity.is_(None),
                    PricingRule.max_quantity >= quantity,
                ),
            )

        return query.all()

    def update_pricing_rule(self, pricing_rule: PricingRule) -> PricingRule:
        """Mettre à jour une règle de tarification"""
        self.db.add(pricing_rule)
        self.db.flush()
        return pricing_rule

    # === Utilitaires ===

    def service_exists(self, service_id: UUID) -> bool:
        """Vérifier si un service existe"""
        return (
            self.db.query(PartnerService.id)
            .filter(PartnerService.id == service_id)
            .first()
            is not None
        )

    def get_catalog_summary(self, partner_id: Optional[UUID] = None) -> dict:
        """Obtenir un résumé du catalogue"""
        categories = self.list_service_categories(active_only=True)
        service_types = self.list_service_types(active_only=True)

        partner_services_count = 0
        if partner_id:
            partner_services = self.list_partner_services(
                partner_id=partner_id, available_only=True, active_only=True
            )
            partner_services_count = len(partner_services)

        return {
            "categories_count": len(categories),
            "service_types_count": len(service_types),
            "partner_services_count": partner_services_count,
        }
