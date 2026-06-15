from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db
from app.models.user import User
from app.repositories.catalog_repository import CatalogRepository
from app.schemas.partner_profile import PartnerPublicProfileResponse
from app.services.partner_profile_service import PartnerProfileService
from app.schemas.catalog import (
    ServiceCategoryCreate,
    ServiceCategoryResponse,
    ServiceCategoryUpdate,
    ServiceTypeCreate,
    ServiceTypeResponse,
    ServiceTypeUpdate,
    PartnerServiceCreate,
    PartnerServiceResponse,
    PartnerServiceUpdate,
    PricingRuleCreate,
    PricingRuleResponse,
    PricingRuleUpdate,
    CatalogListResponse,
    CatalogPartnerSummaryResponse,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _partner_service_response(service) -> PartnerServiceResponse:
    """Serialize a PartnerService ORM row for API responses."""
    return PartnerServiceResponse(
        id=service.id,
        partner_id=service.partner_id,
        service_category_id=service.service_category_id,
        service_type_id=service.service_type_id,
        service_category_name=service.service_category.name if service.service_category else None,
        service_type_name=service.service_type.name if service.service_type else None,
        base_price=service.base_price,
        pricing_mode=service.pricing_mode,
        estimated_turnaround_hours=service.estimated_turnaround_hours,
        is_available=service.is_available,
        created_at=str(service.created_at),
        updated_at=str(service.updated_at),
    )


# === Catalogue public ===

@router.get("", response_model=CatalogListResponse)
def get_catalog(
    db: Session = Depends(get_sync_db),
):
    """Obtenir le catalogue complet (public)"""
    repository = CatalogRepository(db)

    categories = repository.list_service_categories(active_only=True)
    service_types = repository.list_service_types(active_only=True)

    return CatalogListResponse(
        service_categories=[
            ServiceCategoryResponse(
                id=category.id,
                name=category.name,
                slug=category.slug,
                description=category.description,
                is_active=category.is_active,
                created_at=str(category.created_at),
                updated_at=str(category.updated_at),
            )
            for category in categories
        ],
        service_types=[
            ServiceTypeResponse(
                id=service_type.id,
                name=service_type.name,
                slug=service_type.slug,
                description=service_type.description,
                is_active=service_type.is_active,
                created_at=str(service_type.created_at),
                updated_at=str(service_type.updated_at),
            )
            for service_type in service_types
        ],
    )


@router.get("/partners", response_model=List[CatalogPartnerSummaryResponse])
def list_public_partners(
    db: Session = Depends(get_sync_db),
):
    """Lister les partenaires publics disponibles pour le MVP frontend"""
    repository = CatalogRepository(db)
    partners = repository.list_public_partners()

    response: List[CatalogPartnerSummaryResponse] = []
    for partner in partners:
        primary_location = next((location for location in partner.locations if location.is_primary), None)
        if primary_location is None and partner.locations:
            primary_location = partner.locations[0]

        available_service_count = sum(1 for service in partner.services if service.is_available)

        response.append(
            CatalogPartnerSummaryResponse(
                id=partner.id,
                name=partner.name,
                business_name=partner.business_name,
                partner_type=partner.partner_type,
                status=partner.status,
                is_verified=partner.is_verified,
                is_featured=partner.is_featured,
                is_accepting_orders=partner.is_accepting_orders,
                rating=partner.rating,
                total_reviews=partner.total_reviews,
                city=primary_location.city if primary_location else None,
                commune=primary_location.commune if primary_location else None,
                address_line_1=primary_location.address_line_1 if primary_location else None,
                address_line_2=primary_location.address_line_2 if primary_location else None,
                latitude=primary_location.latitude if primary_location else None,
                longitude=primary_location.longitude if primary_location else None,
                available_service_count=available_service_count,
            )
        )

    return response


@router.get("/categories", response_model=List[ServiceCategoryResponse])
def list_service_categories(
    active_only: bool = True,
    db: Session = Depends(get_sync_db),
):
    """Lister les catégories de service (public)"""
    repository = CatalogRepository(db)
    return repository.list_service_categories(active_only=active_only)


@router.get("/categories/{category_id}", response_model=ServiceCategoryResponse)
def get_service_category(
    category_id: UUID,
    db: Session = Depends(get_sync_db),
):
    """Obtenir une catégorie de service par son ID (public)"""
    repository = CatalogRepository(db)
    category = repository.get_service_category_by_id(category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie de service non trouvée",
        )

    return category


@router.get("/service-types", response_model=List[ServiceTypeResponse])
def list_service_types(
    active_only: bool = True,
    db: Session = Depends(get_sync_db),
):
    """Lister les types de service (public)"""
    repository = CatalogRepository(db)
    return repository.list_service_types(active_only=active_only)


@router.get("/service-types/{type_id}", response_model=ServiceTypeResponse)
def get_service_type(
    type_id: UUID,
    db: Session = Depends(get_sync_db),
):
    """Obtenir un type de service par son ID (public)"""
    repository = CatalogRepository(db)
    service_type = repository.get_service_type_by_id(type_id)

    if not service_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de service non trouvé",
        )

    return service_type


@router.get("/partners/{partner_id}/public-profile", response_model=PartnerPublicProfileResponse)
def get_partner_public_profile(
    partner_id: UUID,
    db: Session = Depends(get_sync_db),
):
    """Profil public d'un partenaire (photos, horaires, adresse) — sans authentification."""
    service = PartnerProfileService(db)
    try:
        return service.get_public_partner_profile(partner_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du profil public partenaire",
        ) from exc


@router.get("/partners/{partner_id}/services", response_model=List[PartnerServiceResponse])
def list_partner_services(
    partner_id: UUID,
    available_only: bool = True,
    active_only: bool = True,
    db: Session = Depends(get_sync_db),
):
    """Lister les services d'un partenaire (public)"""
    repository = CatalogRepository(db)
    services = repository.list_partner_services(
        partner_id=partner_id,
        available_only=available_only,
        active_only=active_only,
    )
    return [_partner_service_response(service) for service in services]


@router.get("/partners/{partner_id}/services/{service_id}", response_model=PartnerServiceResponse)
def get_partner_service(
    partner_id: UUID,
    service_id: UUID,
    db: Session = Depends(get_sync_db),
):
    """Obtenir un service partenaire par son ID (public)"""
    repository = CatalogRepository(db)
    service = repository.get_partner_service_by_ids(partner_id, service_id)

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service partenaire non trouvé",
        )

    return _partner_service_response(service)


# === Administration (partenaires) ===

@router.post("/partners/{partner_id}/services", response_model=PartnerServiceResponse, status_code=status.HTTP_201_CREATED)
def create_partner_service(
    partner_id: UUID,
    service_data: PartnerServiceCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un service partenaire (partenaire uniquement)"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    repository = CatalogRepository(db)

    # Vérifier que la catégorie existe
    category = repository.get_service_category_by_id(service_data.service_category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Catégorie de service non trouvée",
        )

    # Vérifier que le type existe
    service_type = repository.get_service_type_by_id(service_data.service_type_id)
    if not service_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de service non trouvé",
        )

    # Créer le service
    from app.models.catalog import PartnerService
    partner_service = PartnerService(
        partner_id=partner_id,
        service_category_id=service_data.service_category_id,
        service_type_id=service_data.service_type_id,
        base_price=service_data.base_price,
        pricing_mode=service_data.pricing_mode,
        estimated_turnaround_hours=service_data.estimated_turnaround_hours,
        is_available=service_data.is_available,
    )

    created = repository.create_partner_service(partner_service)
    created.service_category = category
    created.service_type = service_type
    return _partner_service_response(created)


@router.patch("/partners/{partner_id}/services/{service_id}", response_model=PartnerServiceResponse)
def update_partner_service(
    partner_id: UUID,
    service_id: UUID,
    service_data: PartnerServiceUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour un service partenaire (partenaire uniquement)"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    repository = CatalogRepository(db)

    # Récupérer le service
    service = repository.get_partner_service_by_ids(partner_id, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service partenaire non trouvé",
        )

    # Mettre à jour les champs
    update_data = service_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    updated = repository.update_partner_service(service)
    return _partner_service_response(updated)


@router.get("/partners/{partner_id}/pricing-rules", response_model=List[PricingRuleResponse])
def list_partner_pricing_rules(
    partner_id: UUID,
    active_only: bool = True,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les règles de tarification d'un partenaire (partenaire uniquement)"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    repository = CatalogRepository(db)
    return repository.list_pricing_rules(
        partner_id=partner_id,
        active_only=active_only,
    )


@router.post("/partners/{partner_id}/pricing-rules", response_model=PricingRuleResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_rule(
    partner_id: UUID,
    rule_data: PricingRuleCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer une règle de tarification (partenaire uniquement)"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    repository = CatalogRepository(db)

    # Vérifier les références si fournies
    if rule_data.service_category_id:
        category = repository.get_service_category_by_id(rule_data.service_category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Catégorie de service non trouvée",
            )

    if rule_data.service_type_id:
        service_type = repository.get_service_type_by_id(rule_data.service_type_id)
        if not service_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Type de service non trouvé",
            )

    # Créer la règle
    from app.models.catalog import PricingRule
    pricing_rule = PricingRule(
        partner_id=partner_id,
        rule_type=rule_data.rule_type,
        service_category_id=rule_data.service_category_id,
        service_type_id=rule_data.service_type_id,
        min_quantity=rule_data.min_quantity,
        max_quantity=rule_data.max_quantity,
        price_adjustment_type=rule_data.price_adjustment_type,
        price_adjustment_value=rule_data.price_adjustment_value,
        is_active=rule_data.is_active,
    )

    return repository.create_pricing_rule(pricing_rule)


@router.patch("/partners/{partner_id}/pricing-rules/{rule_id}", response_model=PricingRuleResponse)
def update_pricing_rule(
    partner_id: UUID,
    rule_id: UUID,
    rule_data: PricingRuleUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour une règle de tarification (partenaire uniquement)"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    repository = CatalogRepository(db)

    # Récupérer la règle
    rule = repository.get_pricing_rule_by_id(rule_id)
    if not rule or rule.partner_id != partner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle de tarification non trouvée",
        )

    # Mettre à jour les champs
    update_data = rule_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    return repository.update_pricing_rule(rule)


# === Administration (admin) ===

@router.post("/categories", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_service_category(
    category_data: ServiceCategoryCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer une catégorie de service (admin uniquement)"""
    # TODO: Vérifier que l'utilisateur est admin
    repository = CatalogRepository(db)

    # Vérifier l'unicité du slug
    existing = repository.get_service_category_by_slug(category_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une catégorie avec ce slug existe déjà",
        )

    # Créer la catégorie
    from app.models.catalog import ServiceCategory
    category = ServiceCategory(
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
        is_active=category_data.is_active,
    )

    return repository.create_service_category(category)


@router.patch("/categories/{category_id}", response_model=ServiceCategoryResponse)
def update_service_category(
    category_id: UUID,
    category_data: ServiceCategoryUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour une catégorie de service (admin uniquement)"""
    # TODO: Vérifier que l'utilisateur est admin
    repository = CatalogRepository(db)

    # Récupérer la catégorie
    category = repository.get_service_category_by_id(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie de service non trouvée",
        )

    # Vérifier l'unicité du slug si modifié
    if category_data.slug and category_data.slug != category.slug:
        existing = repository.get_service_category_by_slug(category_data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une catégorie avec ce slug existe déjà",
            )

    # Mettre à jour les champs
    update_data = category_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    return repository.update_service_category(category)


@router.post("/service-types", response_model=ServiceTypeResponse, status_code=status.HTTP_201_CREATED)
def create_service_type(
    type_data: ServiceTypeCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un type de service (admin uniquement)"""
    # TODO: Vérifier que l'utilisateur est admin
    repository = CatalogRepository(db)

    # Vérifier l'unicité du slug
    existing = repository.get_service_type_by_slug(type_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un type de service avec ce slug existe déjà",
        )

    # Créer le type
    from app.models.catalog import ServiceType
    service_type = ServiceType(
        name=type_data.name,
        slug=type_data.slug,
        description=type_data.description,
        is_active=type_data.is_active,
    )

    return repository.create_service_type(service_type)


@router.patch("/service-types/{type_id}", response_model=ServiceTypeResponse)
def update_service_type(
    type_id: UUID,
    type_data: ServiceTypeUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour un type de service (admin uniquement)"""
    # TODO: Vérifier que l'utilisateur est admin
    repository = CatalogRepository(db)

    # Récupérer le type
    service_type = repository.get_service_type_by_id(type_id)
    if not service_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de service non trouvé",
        )

    # Vérifier l'unicité du slug si modifié
    if type_data.slug and type_data.slug != service_type.slug:
        existing = repository.get_service_type_by_slug(type_data.slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un type de service avec ce slug existe déjà",
            )

    # Mettre à jour les champs
    update_data = type_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service_type, field, value)

    return repository.update_service_type(service_type)


@router.get("/order-add-ons")
def get_public_order_add_ons(db: Session = Depends(get_sync_db)):
    """Options complémentaires affichées au checkout (public)."""
    from app.services.order_addon_service import OrderAddOnService

    return OrderAddOnService(db).list_add_ons(active_only=True)
