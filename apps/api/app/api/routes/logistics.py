from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, get_current_admin, is_admin_user
from app.repositories.order_repository import OrderRepository
from app.models.user import User, UserRole
from app.schemas.logistics import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    DriverListResponse,
    DriverLocationCreate,
    DriverLocationResponse,
    DeliveryTaskCreate,
    DeliveryTaskResponse,
    TaskListResponse,
    TaskAssignRequest,
    TaskAcceptRequest,
    TaskStartRequest,
    TaskCompleteRequest,
    TaskFailRequest,
    TaskCancelRequest,
    AvailableDriverResponse
)
from app.services.dispatch_service import DispatchService
from app.models.logistics import DriverStatus, TaskType, DeliveryTaskStatus

router = APIRouter(prefix="/logistics", tags=["logistics"])


def _ensure_logistics_operator(current_user: User) -> None:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LOGISTICS_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs et managers logistiques"
        )


def _build_driver_response(driver, db: Session) -> DriverResponse:
    user = db.query(User).filter(User.id == driver.user_id).first()
    return DriverResponse(
        id=driver.id,
        user_id=driver.user_id,
        user_name=getattr(user, "name", None),
        user_email=getattr(user, "email", None),
        user_phone=getattr(user, "phone", None),
        vehicle_type=driver.vehicle_type,
        license_number=driver.license_number,
        status=driver.status,
        is_available=driver.is_available,
        rating_avg=driver.rating_avg,
        rating_count=driver.rating_count,
        created_at=driver.created_at,
        updated_at=driver.updated_at,
    )


def _format_address_line(address) -> Optional[str]:
    if not address:
        return None

    parts = [
        getattr(address, "address_line_1", None),
        getattr(address, "address_line_2", None),
        getattr(address, "zone", None),
        getattr(address, "reference_point", None),
    ]
    formatted = ", ".join(part for part in parts if part)
    return formatted or None


def _build_task_response(task, db: Session) -> DeliveryTaskResponse:
    order = OrderRepository(db).get_by_id(task.order_id)

    return DeliveryTaskResponse(
        id=task.id,
        order_id=task.order_id,
        order_number=getattr(order, "order_number", None),
        driver_id=task.driver_id,
        task_type=task.task_type,
        status=task.status,
        customer_name=getattr(order, "customer_name", None),
        customer_phone=getattr(order, "customer_phone", None),
        pickup_contact_name=getattr(order, "pickup_contact_name", None),
        pickup_contact_phone=getattr(order, "pickup_contact_phone", None),
        pickup_address_label=getattr(getattr(order, "pickup_address", None), "label", None),
        pickup_address_line=_format_address_line(getattr(order, "pickup_address", None)),
        pickup_commune=getattr(order, "pickup_commune", None),
        delivery_address_label=getattr(getattr(order, "delivery_address", None), "label", None),
        delivery_address_line=_format_address_line(getattr(order, "delivery_address", None)),
        delivery_commune=getattr(getattr(order, "delivery_address", None), "commune", None),
        partner_name=getattr(getattr(order, "partner", None), "name", None),
        pickup_location_type=task.pickup_location_type,
        dropoff_location_type=task.dropoff_location_type,
        scheduled_at=task.scheduled_at,
        assigned_at=task.assigned_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        proof_photo_url=task.proof_photo_url,
        proof_note=task.proof_note,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


# ===== Driver Routes =====

@router.get("/drivers", response_model=DriverListResponse)
def list_drivers(
    status: Optional[DriverStatus] = Query(None, description="Filtrer par statut"),
    is_available: Optional[bool] = Query(None, description="Filtrer par disponibilité"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les chauffeurs"""
    _ensure_logistics_operator(current_user)
    skip = (page - 1) * page_size
    service = DispatchService(db)
    
    drivers, total = service.list_drivers(status, is_available, skip, page_size)
    
    return DriverListResponse(
        drivers=[_build_driver_response(driver, db) for driver in drivers],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/drivers/available", response_model=List[AvailableDriverResponse])
def list_available_drivers(
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Lister les chauffeurs disponibles avec leurs localisations"""
    service = DispatchService(db)
    available = service.list_available_drivers_with_locations()
    return [
        AvailableDriverResponse(
            driver=_build_driver_response(item.driver, db),
            last_location=item.last_location,
        )
        for item in available
    ]


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Obtenir un chauffeur par son ID"""
    service = DispatchService(db)
    driver = service.get_driver(driver_id)
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé"
        )
    
    return _build_driver_response(driver, db)


@router.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un nouveau chauffeur"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    
    try:
        driver = service.create_driver(driver_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return _build_driver_response(driver, db)


@router.patch("/drivers/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: UUID,
    driver_data: DriverUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour un chauffeur"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    
    driver = service.update_driver(driver_id, driver_data)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé"
        )
    
    return _build_driver_response(driver, db)


@router.post("/drivers/{driver_id}/location", response_model=DriverLocationResponse)
def update_driver_location(
    driver_id: UUID,
    location_data: DriverLocationCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Mettre à jour la localisation d'un chauffeur"""
    # Vérifier que l'utilisateur est le chauffeur ou un admin
    service = DispatchService(db)
    driver = service.get_driver(driver_id)
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé"
        )
    
    # Vérifier les permissions
    if not is_admin_user(current_user) and driver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à mettre à jour la localisation de ce chauffeur"
        )
    
    location = service.update_driver_location(driver_id, location_data)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de mettre à jour la localisation"
        )
    
    return location


# ===== Task Routes =====

@router.get("/tasks", response_model=TaskListResponse)
def list_tasks(
    driver_id: Optional[UUID] = Query(None, description="Filtrer par chauffeur"),
    order_id: Optional[UUID] = Query(None, description="Filtrer par commande"),
    task_type: Optional[TaskType] = Query(None, description="Filtrer par type de tâche"),
    status: Optional[DeliveryTaskStatus] = Query(None, description="Filtrer par statut"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Lister les tâches de livraison"""
    skip = (page - 1) * page_size
    service = DispatchService(db)
    
    # Pour les chauffeurs, filtrer automatiquement par leur ID
    if current_user.role == UserRole.DRIVER:
        driver = service.get_driver_by_user_id(current_user.id)
        if driver:
            driver_id = driver.id
    
    tasks, total = service.list_tasks(driver_id, order_id, task_type, status, skip, page_size)
    
    return TaskListResponse(
        tasks=[_build_task_response(task, db) for task in tasks],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/tasks/{task_id}", response_model=DeliveryTaskResponse)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Obtenir une tâche par son ID"""
    service = DispatchService(db)
    task = service.get_task(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/pickup", response_model=DeliveryTaskResponse, status_code=status.HTTP_201_CREATED)
def create_pickup_task(
    task_data: DeliveryTaskCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users (partners/admins)
):
    """Créer une tâche de pickup pour une commande"""
    # Vérifier que l'utilisateur est un partenaire ou admin
    if current_user.role not in [UserRole.PARTNER_OWNER, UserRole.PARTNER_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les partenaires et administrateurs peuvent créer des tâches de pickup"
        )
    
    service = DispatchService(db)
    
    try:
        task = service.create_pickup_task(task_data.order_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/delivery", response_model=DeliveryTaskResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_task(
    task_data: DeliveryTaskCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users (partners/admins)
):
    """Créer une tâche de delivery pour une commande"""
    # Vérifier que l'utilisateur est un partenaire ou admin
    if current_user.role not in [UserRole.PARTNER_OWNER, UserRole.PARTNER_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les partenaires et administrateurs peuvent créer des tâches de delivery"
        )
    
    service = DispatchService(db)
    
    try:
        task = service.create_delivery_task(task_data.order_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/assign", response_model=DeliveryTaskResponse)
def assign_driver_to_task(
    task_id: UUID,
    assign_data: TaskAssignRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Assigner manuellement un chauffeur à une tâche"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    
    try:
        task = service.assign_driver_to_task(task_id, assign_data.driver_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/auto-assign", response_model=DeliveryTaskResponse)
def auto_assign_driver_to_task(
    task_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Assigner automatiquement un chauffeur disponible à une tâche"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    
    try:
        task = service.auto_assign_driver_to_task(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/accept", response_model=DeliveryTaskResponse)
def accept_task(
    task_id: UUID,
    accept_data: TaskAcceptRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Accepter une tâche assignée (chauffeur uniquement)"""
    # Vérifier que l'utilisateur est un chauffeur
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les chauffeurs peuvent accepter des tâches"
        )
    
    service = DispatchService(db)
    
    # Obtenir le chauffeur de l'utilisateur
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé pour cet utilisateur"
        )
    
    try:
        task = service.accept_task(task_id, driver.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/start", response_model=DeliveryTaskResponse)
def start_task(
    task_id: UUID,
    start_data: TaskStartRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Démarrer une tâche acceptée (chauffeur uniquement)"""
    # Vérifier que l'utilisateur est un chauffeur
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les chauffeurs peuvent démarrer des tâches"
        )
    
    service = DispatchService(db)
    
    # Obtenir le chauffeur de l'utilisateur
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé pour cet utilisateur"
        )
    
    try:
        task = service.start_task(task_id, driver.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/complete", response_model=DeliveryTaskResponse)
def complete_task(
    task_id: UUID,
    complete_data: TaskCompleteRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Compléter une tâche en cours (chauffeur uniquement)"""
    # Vérifier que l'utilisateur est un chauffeur
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les chauffeurs peuvent compléter des tâches"
        )
    
    service = DispatchService(db)
    
    # Obtenir le chauffeur de l'utilisateur
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé pour cet utilisateur"
        )
    
    try:
        task = service.complete_task(task_id, driver.id, complete_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/fail", response_model=DeliveryTaskResponse)
def fail_task(
    task_id: UUID,
    fail_data: TaskFailRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Marquer une tâche comme échouée (chauffeur uniquement)"""
    # Vérifier que l'utilisateur est un chauffeur
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les chauffeurs peuvent marquer des tâches comme échouées"
        )
    
    service = DispatchService(db)
    
    # Obtenir le chauffeur de l'utilisateur
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé pour cet utilisateur"
        )
    
    try:
        task = service.fail_task(task_id, driver.id, fail_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/cancel", response_model=DeliveryTaskResponse)
def cancel_task(
    task_id: UUID,
    cancel_data: TaskCancelRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Annuler une tâche"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    
    try:
        task = service.cancel_task(task_id, cancel_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée ou statut invalide"
        )
    
    return task
