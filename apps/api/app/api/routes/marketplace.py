from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, get_current_admin, get_current_marketplace_operator
from app.models.user import User
from app.schemas.marketplace import (
    DeliveryCompanyCreate,
    DeliveryCompanyUpdate,
    DeliveryCompanyResponse,
    DeliveryCompanyListResponse,
    CompanyServiceZoneCreate,
    CompanyServiceZoneResponse,
    CompanyDriverCreate,
    CompanyDriverResponse,
    MarketTaskPublicResponse,
    MarketTaskClaimedResponse,
    MarketTaskListResponse,
    DispatchResultResponse,
    ClaimResultResponse,
    DispatchTaskRequest,
    TaskClaimRequest,
    AssignInternalDriverRequest,
    AssignCompanyDriverRequest,
    TaskExpireRequest,
    TaskFallbackRequest
)
from app.services.hybrid_dispatch_service import HybridDispatchService
from app.models.logistics import TaskType, DeliveryTaskStatus

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


# ===== Delivery Company Routes =====

@router.get("/companies", response_model=DeliveryCompanyListResponse)
def list_companies(
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    is_active: Optional[bool] = Query(None, description="Filtrer par actif/inactif"),
    supports_pickup: Optional[bool] = Query(None, description="Filtrer par support pickup"),
    supports_delivery: Optional[bool] = Query(None, description="Filtrer par support delivery"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Lister les compagnies de livraison (admin uniquement)"""
    skip = (page - 1) * page_size
    service = HybridDispatchService(db)
    
    companies, total = service.marketplace_repo.list_companies(
        status=status,
        is_active=is_active,
        supports_pickup=supports_pickup,
        supports_delivery=supports_delivery,
        skip=skip,
        limit=page_size
    )
    
    return DeliveryCompanyListResponse(
        companies=companies,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/companies/{company_id}", response_model=DeliveryCompanyResponse)
def get_company(
    company_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Obtenir une compagnie par son ID"""
    service = HybridDispatchService(db)
    company = service.marketplace_repo.get_company(company_id)
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    return company


@router.post("/companies", response_model=DeliveryCompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: DeliveryCompanyCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Créer une nouvelle compagnie (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Vérifier si le slug existe déjà
    existing = service.marketplace_repo.get_company_by_slug(company_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une compagnie avec ce slug existe déjà"
        )
    
    company = service.marketplace_repo.create_company(company_data.dict())
    
    return company


@router.patch("/companies/{company_id}", response_model=DeliveryCompanyResponse)
def update_company(
    company_id: UUID,
    company_data: DeliveryCompanyUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Mettre à jour une compagnie (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Filtrer les champs non nuls
    update_data = {k: v for k, v in company_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune donnée à mettre à jour"
        )
    
    company = service.marketplace_repo.update_company(company_id, update_data)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    return company


# ===== Company Service Zones Routes =====

@router.get("/companies/{company_id}/zones", response_model=List[CompanyServiceZoneResponse])
def list_company_service_zones(
    company_id: UUID,
    city: Optional[str] = Query(None, description="Filtrer par ville"),
    is_active: Optional[bool] = Query(None, description="Filtrer par actif/inactif"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Lister les zones de service d'une compagnie"""
    service = HybridDispatchService(db)
    
    # Vérifier que la compagnie existe
    company = service.marketplace_repo.get_company(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    zones, _ = service.marketplace_repo.list_company_service_zones(
        company_id=company_id,
        city=city,
        is_active=is_active
    )
    
    return zones


@router.post("/companies/{company_id}/zones", response_model=CompanyServiceZoneResponse, status_code=status.HTTP_201_CREATED)
def create_service_zone(
    company_id: UUID,
    zone_data: CompanyServiceZoneCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Créer une zone de service pour une compagnie (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Vérifier que la compagnie existe
    company = service.marketplace_repo.get_company(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    zone_data_dict = zone_data.dict()
    zone_data_dict["company_id"] = company_id
    
    zone = service.marketplace_repo.add_service_zone(zone_data_dict)
    
    return zone


# ===== Company Drivers Routes =====

@router.get("/companies/{company_id}/drivers", response_model=List[CompanyDriverResponse])
def list_company_drivers(
    company_id: UUID,
    is_active: Optional[bool] = Query(None, description="Filtrer par actif/inactif"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Lister les chauffeurs d'une compagnie"""
    service = HybridDispatchService(db)
    
    # Vérifier que la compagnie existe
    company = service.marketplace_repo.get_company(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    drivers, _ = service.marketplace_repo.list_company_drivers(
        company_id=company_id,
        is_active=is_active
    )
    
    return drivers


@router.post("/companies/{company_id}/drivers", response_model=CompanyDriverResponse, status_code=status.HTTP_201_CREATED)
def add_company_driver(
    company_id: UUID,
    driver_data: CompanyDriverCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Ajouter un chauffeur à une compagnie (admin uniquement)"""
    service = HybridDispatchService(db)
    
    # Vérifier que la compagnie existe
    company = service.marketplace_repo.get_company(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compagnie non trouvée"
        )
    
    # Vérifier que le chauffeur n'est pas déjà dans cette compagnie
    existing = service.marketplace_repo.get_company_driver(company_id, driver_data.driver_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce chauffeur est déjà dans cette compagnie"
        )
    
    driver = service.marketplace_repo.add_company_driver(company_id, driver_data.driver_id)
    
    return driver


# ===== Marketplace Tasks Routes =====

@router.get("/tasks", response_model=MarketTaskListResponse)
def list_market_tasks(
    task_type: Optional[TaskType] = Query(None, description="Filtrer par type de tâche"),
    city: Optional[str] = Query(None, description="Filtrer par ville"),
    status: Optional[DeliveryTaskStatus] = Query(None, description="Filtrer par statut"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_marketplace_operator),
):
    """Lister les tâches marketplace disponibles"""
    skip = (page - 1) * page_size
    service = HybridDispatchService(db)
    
    company_id = None
    
    tasks, total = service.get_market_tasks_for_company(
        company_id=company_id,
        task_type=task_type,
        city=city,
        skip=skip,
        limit=page_size
    )
    
    # Convertir en réponse publique (masquer les données sensibles)
    public_tasks = []
    for task in tasks:
        public_task = MarketTaskPublicResponse(
            id=task.id,
            task_type=task.task_type,
            status=task.status,
            pickup_location_type=task.pickup_location_type,
            dropoff_location_type=task.dropoff_location_type,
            scheduled_at=task.scheduled_at,
            market_opened_at=task.market_opened_at,
            market_expires_at=task.market_expires_at,
            # Ces champs seraient remplis avec des données dérivées de la commande
            pickup_city=None,
            dropoff_city=None,
            estimated_weight_kg=None,
            estimated_volume_m3=None,
            proposed_price=None,
            special_instructions=None
        )
        public_tasks.append(public_task)
    
    return MarketTaskListResponse(
        tasks=public_tasks,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/tasks/{task_id}", response_model=MarketTaskPublicResponse)
def get_market_task(
    task_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_marketplace_operator),
):
    """Obtenir une tâche marketplace par son ID (vue publique)"""
    service = HybridDispatchService(db)
    task = service.marketplace_repo.get_market_task(task_id)
    
    if not task or not task.market_visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou non visible"
        )
    
    # Vérifier que la tâche n'est pas expirée
    if task.market_expires_at and task.market_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette tâche a expiré"
        )
    
    # Retourner la vue publique
    return MarketTaskPublicResponse(
        id=task.id,
        task_type=task.task_type,
        status=task.status,
        pickup_location_type=task.pickup_location_type,
        dropoff_location_type=task.dropoff_location_type,
        scheduled_at=task.scheduled_at,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        # Ces champs seraient remplis avec des données dérivées de la commande
        pickup_city=None,
        dropoff_city=None,
        estimated_weight_kg=None,
        estimated_volume_m3=None,
        proposed_price=None,
        special_instructions=None
    )


@router.post("/tasks/{task_id}/claim", response_model=ClaimResultResponse)
def claim_market_task(
    task_id: UUID,
    claim_data: TaskClaimRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_marketplace_operator),
):
    """Claimer une tâche marketplace"""
    service = HybridDispatchService(db)
    
    try:
        task = service.claim_market_task(task_id, claim_data.company_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return ClaimResultResponse(
        task_id=task.id,
        claimed_by_company_id=task.claimed_by_company_id,
        claimed_at=task.claimed_at,
        status=task.status,
        message="Tâche claimée avec succès"
    )


@router.get("/tasks/{task_id}/claimed", response_model=MarketTaskClaimedResponse)
def get_claimed_task(
    task_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_marketplace_operator),
):
    """Obtenir les détails complets d'une tâche après claim"""
    service = HybridDispatchService(db)
    
    # Obtenir la tâche avec les détails de la commande
    task_with_order = service.marketplace_repo.get_task_with_order_details(task_id)
    if not task_with_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée"
        )
    
    task, order = task_with_order
    
    # Retourner la vue complète
    return MarketTaskClaimedResponse(
        id=task.id,
        task_type=task.task_type,
        status=task.status,
        claimed_by_company_id=task.claimed_by_company_id,
        claimed_at=task.claimed_at,
        order_id=order.id,
        pickup_address=order.pickup_address if hasattr(order, 'pickup_address') else "Adresse non disponible",
        dropoff_address=order.delivery_address if hasattr(order, 'delivery_address') else "Adresse non disponible",
        customer_name=order.customer_name if hasattr(order, 'customer_name') else "Client",
        customer_phone=order.customer_phone if hasattr(order, 'customer_phone') else "Non disponible",
        customer_notes=order.customer_notes if hasattr(order, 'customer_notes') else None,
        order_items_count=len(order.items) if hasattr(order, 'items') else 0,
        total_weight_kg=None,  # À calculer à partir des items
        total_volume_m3=None   # À calculer à partir des items
    )


# ===== Dispatch Operations Routes =====

@router.post("/tasks/{task_id}/dispatch", response_model=DispatchResultResponse)
def dispatch_task(
    task_id: UUID,
    dispatch_data: DispatchTaskRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Dispatcher une tâche selon la stratégie configurée (admin uniquement)"""
    service = HybridDispatchService(db)
    
    try:
        task = service.dispatch_task(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return DispatchResultResponse(
        task_id=task.id,
        status=task.status,
        dispatch_mode=task.dispatch_mode,
        assigned_company_id=task.assigned_company_id,
        assigned_driver_id=task.driver_id,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        message="Tâche dispatchée avec succès"
    )


@router.post("/tasks/{task_id}/assign-internal", response_model=DispatchResultResponse)
def assign_internal_driver(
    task_id: UUID,
    assign_data: AssignInternalDriverRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Assigner manuellement un chauffeur interne à une tâche (admin uniquement)"""
    service = HybridDispatchService(db)
    
    try:
        task = service.assign_internal_driver(task_id, assign_data.driver_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return DispatchResultResponse(
        task_id=task.id,
        status=task.status,
        dispatch_mode=task.dispatch_mode,
        assigned_company_id=task.assigned_company_id,
        assigned_driver_id=task.driver_id,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        message="Chauffeur interne assigné avec succès"
    )


@router.post("/tasks/{task_id}/assign-company", response_model=DispatchResultResponse)
def assign_company_driver(
    task_id: UUID,
    assign_data: AssignCompanyDriverRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Assigner manuellement un chauffeur d'une compagnie à une tâche (admin uniquement)"""
    service = HybridDispatchService(db)
    
    try:
        task = service.assign_company_driver(task_id, assign_data.company_id, assign_data.driver_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return DispatchResultResponse(
        task_id=task.id,
        status=task.status,
        dispatch_mode=task.dispatch_mode,
        assigned_company_id=task.assigned_company_id,
        assigned_driver_id=task.driver_id,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        message="Chauffeur de compagnie assigné avec succès"
    )


@router.post("/tasks/{task_id}/expire", response_model=DispatchResultResponse)
def expire_market_task(
    task_id: UUID,
    expire_data: TaskExpireRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Expirer manuellement une tâche marketplace (admin uniquement)"""
    service = HybridDispatchService(db)
    
    try:
        task = service.expire_market_task(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return DispatchResultResponse(
        task_id=task.id,
        status=task.status,
        dispatch_mode=task.dispatch_mode,
        assigned_company_id=task.assigned_company_id,
        assigned_driver_id=task.driver_id,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        message="Tâche marketplace expirée"
    )


@router.post("/tasks/{task_id}/fallback", response_model=DispatchResultResponse)
def fallback_to_internal(
    task_id: UUID,
    fallback_data: TaskFallbackRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_admin),  # Admin only
):
    """Fallback vers un chauffeur interne après échec du marketplace (admin uniquement)"""
    service = HybridDispatchService(db)
    
    try:
        task = service.fallback_to_internal(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return DispatchResultResponse(
        task_id=task.id,
        status=task.status,
        dispatch_mode=task.dispatch_mode,
        assigned_company_id=task.assigned_company_id,
        assigned_driver_id=task.driver_id,
        market_opened_at=task.market_opened_at,
        market_expires_at=task.market_expires_at,
        message="Fallback vers chauffeur interne effectué"
    )
