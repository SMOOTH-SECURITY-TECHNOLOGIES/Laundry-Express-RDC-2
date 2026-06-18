from typing import List, Optional
from uuid import UUID

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, get_current_admin, is_admin_user
from app.core.config import settings
from app.core.database import SyncSessionLocal
from app.repositories.order_repository import OrderRepository
from app.models.user import User, UserProfile, UserRole
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
    AvailableDriverResponse,
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleListResponse,
    TripResponse,
    TripListResponse,
    TrackingPointResponse,
    TrackingPointListResponse,
    MaintenanceEventResponse,
    MaintenanceEventListResponse,
)
from app.services.dispatch_service import DispatchService
from app.services.notification_service import NotificationService
from app.services.logistics_marketplace_service import LogisticsMarketplaceService
from app.services.hybrid_dispatch_service import HybridDispatchService
from app.services.logistics_live_hub import (
    channel_for_task_status,
    flush_pending_events,
    publish_logistics_event,
    register_connection,
    unregister_connection,
)
from app.services.logistics_fleet_service import LogisticsFleetService
from app.services.logistics_fleet_errors import FleetAccessError, FleetNotFoundError, FleetValidationError
from app.services.logistics_live_service import LogisticsLiveService
from app.models.logistics import Driver, DriverStatus, TaskType, DeliveryTask, DeliveryTaskStatus, Vehicle, VehicleStatus, DriverLocation, VehicleMaintenanceStatus

router = APIRouter(prefix="/logistics", tags=["logistics"])


def _authenticate_logistics_ws(token: str | None) -> bool:
    if not token:
        return False
    try:
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return True
    except JWTError:
        return False


def _publish_task_event(task) -> None:
    status_value = task.status.value if hasattr(task.status, "value") else str(task.status)
    publish_logistics_event(
        channel_for_task_status(status_value),
        {
            "taskId": str(task.id),
            "orderId": str(task.order_id),
            "status": status_value,
            "driverId": str(task.driver_id) if task.driver_id else None,
        },
    )


def _ensure_logistics_operator(current_user: User) -> None:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LOGISTICS_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs et managers logistiques"
        )


def _operator_company_id(current_user: User) -> Optional[UUID]:
    if current_user.role == UserRole.LOGISTICS_MANAGER:
        return getattr(current_user, "delivery_company_id", None)
    return None


def _fleet_service(db: Session) -> LogisticsFleetService:
    return LogisticsFleetService(db)


def _raise_fleet_http_error(exc: Exception) -> None:
    if isinstance(exc, FleetAccessError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if isinstance(exc, FleetNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, FleetValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    raise exc


def _task_notification_metadata(task, page: str = "logistics-dashboard") -> dict:
    task_type = task.task_type.value if hasattr(task.task_type, "value") else str(task.task_type)
    return {
        "orderId": str(task.order_id),
        "taskId": str(task.id),
        "taskType": task_type,
        "page": page,
    }


def _notify_task_created(db: Session, task) -> None:
    service = NotificationService(db)
    order = OrderRepository(db).get_order_by_id(task.order_id)
    order_number = getattr(order, "order_number", str(task.order_id))
    task_type = task.task_type.value if hasattr(task.task_type, "value") else str(task.task_type)
    service.create_many(
        user_ids=service.logistics_manager_user_ids(),
        title="Nouvelle mission logistique",
        message=f"Mission {task_type} creee pour la commande {order_number}.",
        notification_type="logisticsTaskCreated",
        metadata=_task_notification_metadata(task),
    )
    if order:
        service.create(
            user_id=order.customer_id,
            title="Logistique en preparation",
            message=f"La mission {task_type} de votre commande {order_number} est en preparation.",
            notification_type="deliveryUpdate",
            metadata={**_task_notification_metadata(task, page="tracking"), "orderNumber": order_number},
        )


def _notify_task_assigned(db: Session, task) -> None:
    service = NotificationService(db)
    order = OrderRepository(db).get_order_by_id(task.order_id)
    driver = task.driver or db.query(Driver).filter(Driver.id == task.driver_id).first()
    order_number = getattr(order, "order_number", str(task.order_id))
    if driver:
        service.create(
            user_id=driver.user_id,
            title="Nouvelle mission assignee",
            message=f"Une mission vous a ete assignee pour la commande {order_number}.",
            notification_type="driverMissionAssigned",
            metadata=_task_notification_metadata(task, page="driver-dashboard"),
        )
    if order:
        service.create(
            user_id=order.customer_id,
            title="Chauffeur assigne",
            message=f"Un chauffeur a ete assigne a votre commande {order_number}.",
            notification_type="deliveryUpdate",
            metadata={**_task_notification_metadata(task, page="tracking"), "orderNumber": order_number},
        )


def _notify_task_progress(db: Session, task, event: str) -> None:
    service = NotificationService(db)
    order = OrderRepository(db).get_order_by_id(task.order_id)
    if not order:
        return

    messages = {
        "accepted": "Le chauffeur a accepte la mission.",
        "started": "Le chauffeur est en route.",
        "completed": "La mission logistique est terminee.",
        "failed": "Une mission logistique a rencontre un probleme.",
        "cancelled": "Une mission logistique a ete annulee.",
    }
    message = messages.get(event, "Mise a jour logistique.")
    service.create(
        user_id=order.customer_id,
        title="Suivi de livraison",
        message=f"{message} Commande {order.order_number}.",
        notification_type="deliveryUpdate",
        metadata={**_task_notification_metadata(task, page="tracking"), "orderNumber": order.order_number},
    )
    service.create_many(
        user_ids=service.logistics_manager_user_ids(),
        title="Mise a jour mission",
        message=f"{message} Commande {order.order_number}.",
        notification_type="logisticsTaskUpdate",
        metadata={**_task_notification_metadata(task), "orderNumber": order.order_number},
    )
    if event in {"completed", "failed"}:
        service.create_many(
            user_ids=service.partner_staff_user_ids(order.partner_id),
            title="Mise a jour logistique",
            message=f"{message} Commande {order.order_number}.",
            notification_type="logisticsTaskUpdate",
            metadata={**_task_notification_metadata(task, page="partner-dashboard"), "orderNumber": order.order_number},
        )


def _build_driver_response(driver, db: Session) -> DriverResponse:
    user = db.query(User).filter(User.id == driver.user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == driver.user_id).first()
    return DriverResponse(
        id=driver.id,
        user_id=driver.user_id,
        user_name=getattr(user, "name", None),
        user_email=getattr(user, "email", None),
        user_phone=getattr(user, "phone", None),
        avatar_url=getattr(profile, "avatar_url", None),
        vehicle_type=driver.vehicle_type,
        license_number=driver.license_number,
        status=driver.status,
        is_available=driver.is_available,
        rating_avg=driver.rating_avg,
        rating_count=driver.rating_count,
        created_at=driver.created_at,
        updated_at=driver.updated_at,
    )


def _driver_display_name(driver: Optional[Driver], db: Session) -> Optional[str]:
    if not driver:
        return None
    user = db.query(User).filter(User.id == driver.user_id).first()
    return getattr(user, "name", None) or getattr(user, "email", None)


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
        claimed_by_company_id=getattr(task, "claimed_by_company_id", None),
        market_visible=bool(getattr(task, "market_visible", False)),
        market_expires_at=getattr(task, "market_expires_at", None),
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
    fleet = _fleet_service(db)
    company_id = _operator_company_id(current_user)
    if company_id:
        company_driver_ids = fleet.company_driver_ids(company_id)
        drivers = [driver for driver in drivers if driver.id in company_driver_ids]
        total = len(drivers)
    
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


@router.get("/drivers/me", response_model=DriverResponse)
def get_my_driver_profile(
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Permet à un chauffeur d'obtenir son propre profil"""
    service = DispatchService(db)
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil chauffeur non trouvé"
        )
    return _build_driver_response(driver, db)


@router.patch("/drivers/me/availability")
def update_my_availability(
    body: dict,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Permet à un chauffeur de modifier sa propre disponibilité"""
    service = DispatchService(db)
    driver = service.get_driver_by_user_id(current_user.id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil chauffeur non trouvé"
        )
    available = body.get("available")
    if available is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le champ 'available' est requis"
        )
    driver.is_available = bool(available)
    service.logistics_repo.update_driver(driver)
    publish_logistics_event(
        "driver.availability",
        {"driverId": str(driver.id), "isAvailable": driver.is_available},
    )
    return {"available": driver.is_available}


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),  # Authenticated users
):
    """Obtenir un chauffeur par son ID"""
    _ensure_logistics_operator(current_user)
    service = DispatchService(db)
    fleet = _fleet_service(db)
    driver = service.get_driver(driver_id)
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chauffeur non trouvé"
        )

    try:
        fleet.ensure_driver_company_access(current_user, driver_id)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)
    
    return _build_driver_response(driver, db)


@router.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un chauffeur (compte + profil + rattachement compagnie)."""
    _ensure_logistics_operator(current_user)
    fleet = _fleet_service(db)

    try:
        driver = fleet.provision_driver(current_user, driver_data)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as e:
        _raise_fleet_http_error(e)
    
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
    fleet = _fleet_service(db)
    try:
        fleet.ensure_driver_company_access(current_user, driver_id)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)

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

    publish_logistics_event(
        "driver.location",
        {
            "driverId": str(driver_id),
            "lat": location.latitude,
            "lng": location.longitude,
        },
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
    marketplace_service = LogisticsMarketplaceService(db)
    company_id = _operator_company_id(current_user)
    service_communes = (
        marketplace_service.get_company_service_communes(company_id)
        if company_id
        else None
    )
    
    # Pour les chauffeurs, filtrer automatiquement par leur ID
    if current_user.role == UserRole.DRIVER:
        driver_service = DispatchService(db)
        driver = driver_service.get_driver_by_user_id(current_user.id)
        if driver:
            driver_id = driver.id
    
    if company_id and current_user.role == UserRole.LOGISTICS_MANAGER:
        tasks, total = marketplace_service.list_tasks_for_operator(
            company_id=company_id,
            service_communes=service_communes,
            driver_id=driver_id,
            order_id=order_id,
            task_type=task_type,
            status=status,
            skip=skip,
            limit=page_size,
        )
    else:
        dispatch_service = DispatchService(db)
        tasks, total = dispatch_service.list_tasks(
            driver_id, order_id, task_type, status, skip, page_size
        )
    
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

    marketplace_service = LogisticsMarketplaceService(db)
    order = OrderRepository(db).get_by_id(task_data.order_id)
    if order:
        task = marketplace_service._open_task_to_marketplace(task, order)
        marketplace_service._notify_companies_for_market_task(task, order)
    _notify_task_created(db, task)
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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

    marketplace_service = LogisticsMarketplaceService(db)
    order = OrderRepository(db).get_by_id(task_data.order_id)
    if order:
        task = marketplace_service._open_task_to_marketplace(task, order)
        marketplace_service._notify_companies_for_market_task(task, order)
    _notify_task_created(db, task)
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
    return _build_task_response(task, db)


@router.post("/tasks/{task_id}/claim", response_model=DeliveryTaskResponse)
def claim_task_for_company(
    task_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Claimer une mission marketplace pour la compagnie de l'opérateur."""
    _ensure_logistics_operator(current_user)
    company_id = _operator_company_id(current_user)
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune compagnie logistique liée à ce compte.",
        )

    hybrid = HybridDispatchService(db)
    try:
        task = hybrid.claim_market_task(task_id, company_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
        task = service.assign_driver_to_task(
            task_id,
            assign_data.driver_id,
            company_id=_operator_company_id(current_user),
        )
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
    _notify_task_assigned(db, task)
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_assigned(db, task)
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_progress(db, task, "accepted")
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_progress(db, task, "started")
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_progress(db, task, "completed")
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_progress(db, task, "failed")
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
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
    _notify_task_progress(db, task, "cancelled")
    db.commit()
    db.refresh(task)
    _publish_task_event(task)
    return task


# ===== Vehicle Routes =====

def _build_vehicle_response(vehicle: Vehicle) -> VehicleResponse:
    return VehicleResponse(
        id=vehicle.id,
        delivery_company_id=vehicle.delivery_company_id,
        plate=vehicle.plate,
        type=vehicle.type,
        status=vehicle.status,
        driver_id=vehicle.driver_id,
        assigned_driver_name=vehicle.assigned_driver_name,
        zone=vehicle.zone or "",
        location=vehicle.location or "",
        last_known_location=vehicle.last_known_location,
        mileage_km=vehicle.mileage_km,
        insurance_expires_at=vehicle.insurance_expires_at,
        maintenance={
            "status": vehicle.maintenance_status,
            "nextServiceAtKm": vehicle.maintenance_next_service_km,
            "notes": vehicle.maintenance_notes,
        },
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
    )


@router.get("/vehicles", response_model=VehicleListResponse)
def list_vehicles(
    status: Optional[VehicleStatus] = Query(None, description="Filtrer par statut"),
    type: Optional[str] = Query(None, description="Filtrer par type"),
    zone: Optional[str] = Query(None, description="Filtrer par zone"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les véhicules de la flotte"""
    _ensure_logistics_operator(current_user)
    skip = (page - 1) * page_size
    fleet = _fleet_service(db)

    query = fleet.apply_vehicle_company_filter(db.query(Vehicle), current_user)
    if status:
        query = query.filter(Vehicle.status == status)
    if type:
        query = query.filter(Vehicle.type == type)
    if zone:
        query = query.filter(Vehicle.zone == zone)

    total = query.count()
    vehicles = query.order_by(Vehicle.created_at.desc()).offset(skip).limit(page_size).all()

    return VehicleListResponse(
        vehicles=[_build_vehicle_response(v) for v in vehicles],
    )


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Obtenir un véhicule par son ID"""
    _ensure_logistics_operator(current_user)
    fleet = _fleet_service(db)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule non trouvé"
        )
    try:
        fleet.ensure_vehicle_company_access(current_user, vehicle)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)
    return _build_vehicle_response(vehicle)


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un nouveau véhicule"""
    _ensure_logistics_operator(current_user)
    fleet = _fleet_service(db)

    try:
        vehicle = fleet.create_vehicle_for_operator(current_user, vehicle_data)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)

    return _build_vehicle_response(vehicle)


@router.patch("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: UUID,
    vehicle_data: VehicleUpdate,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour un véhicule"""
    _ensure_logistics_operator(current_user)
    fleet = _fleet_service(db)

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule non trouvé"
        )
    try:
        fleet.ensure_vehicle_company_access(current_user, vehicle)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)

    update_data = vehicle_data.model_dump(exclude_unset=True)
    requested_company_id = update_data.pop("delivery_company_id", None)
    try:
        fleet.reject_cross_company_field_change(current_user, requested_company_id, vehicle.delivery_company_id)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)

    company_id = _operator_company_id(current_user)
    if company_id and update_data.get("driver_id"):
        try:
            fleet.ensure_driver_in_company(company_id, update_data["driver_id"])
        except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
            _raise_fleet_http_error(exc)

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return _build_vehicle_response(vehicle)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Supprimer un véhicule"""
    _ensure_logistics_operator(current_user)
    fleet = _fleet_service(db)

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Véhicule non trouvé"
        )
    try:
        fleet.ensure_vehicle_company_access(current_user, vehicle)
    except (FleetAccessError, FleetNotFoundError, FleetValidationError, ValueError) as exc:
        _raise_fleet_http_error(exc)

    db.delete(vehicle)
    db.commit()


# ===== Trip Routes =====

def _map_task_status_to_logistics(task_status) -> str:
    mapping = {
        DeliveryTaskStatus.PENDING: "pending",
        DeliveryTaskStatus.OPEN_MARKET: "pending",
        DeliveryTaskStatus.CLAIMED: "assigned",
        DeliveryTaskStatus.DRIVER_ASSIGNED: "assigned",
        DeliveryTaskStatus.ACCEPTED: "assigned",
        DeliveryTaskStatus.IN_PROGRESS: "in_transit",
        DeliveryTaskStatus.COMPLETED: "delivered",
        DeliveryTaskStatus.FAILED: "failed",
        DeliveryTaskStatus.CANCELLED: "cancelled",
        DeliveryTaskStatus.EXPIRED: "cancelled",
    }
    return mapping.get(task_status, "pending")


def _task_statuses_for_logistics_status(logistics_status: str) -> list[DeliveryTaskStatus]:
    mapping = {
        "pending": [DeliveryTaskStatus.PENDING, DeliveryTaskStatus.OPEN_MARKET],
        "assigned": [
            DeliveryTaskStatus.CLAIMED,
            DeliveryTaskStatus.DRIVER_ASSIGNED,
            DeliveryTaskStatus.ACCEPTED,
        ],
        "in_transit": [DeliveryTaskStatus.IN_PROGRESS],
        "delivered": [DeliveryTaskStatus.COMPLETED],
        "failed": [DeliveryTaskStatus.FAILED],
        "cancelled": [DeliveryTaskStatus.CANCELLED, DeliveryTaskStatus.EXPIRED],
    }
    return mapping.get(logistics_status, [])


def _build_trip_response(task, db: Session) -> TripResponse:
    order = OrderRepository(db).get_by_id(task.order_id)
    driver = None
    vehicle = None
    if task.driver_id:
        driver = db.query(Driver).filter(Driver.id == task.driver_id).first()
        if driver:
            vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()

    pickup_commune = getattr(order, "pickup_commune", None) or ""
    delivery_commune = getattr(getattr(order, "delivery_address", None), "commune", None) or ""

    return TripResponse(
        id=task.id,
        taskId=task.id,
        status=_map_task_status_to_logistics(task.status),
        origin=pickup_commune or "N/A",
        destination=delivery_commune or "N/A",
        customerName=getattr(order, "customer_name", None),
        driverName=_driver_display_name(driver, db),
        vehiclePlate=getattr(vehicle, "plate", None) if vehicle else None,
        estimatedDurationMinutes=25,
        etaMinutes=15,
        distanceKm=5.0,
    )


@router.get("/trips", response_model=TripListResponse)
def list_trips(
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(50, ge=1, le=200, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les trajets (dérivés des tâches de livraison)"""
    _ensure_logistics_operator(current_user)
    skip = (page - 1) * page_size

    query = db.query(DeliveryTask)
    if status:
        task_statuses = _task_statuses_for_logistics_status(status)
        if task_statuses:
            query = query.filter(DeliveryTask.status.in_(task_statuses))
        else:
            query = query.filter(DeliveryTask.status == status)

    total = query.count()
    tasks = query.order_by(DeliveryTask.created_at.desc()).offset(skip).limit(page_size).all()

    return TripListResponse(
        trips=[_build_trip_response(task, db) for task in tasks],
    )


# ===== Tracking Point Routes =====

@router.get("/tracking-points", response_model=TrackingPointListResponse)
def list_tracking_points(
    trip_id: Optional[UUID] = Query(None, description="Filtrer par trajet"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(100, ge=1, le=500, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les points de suivi (dérivés des localisations chauffeur)"""
    _ensure_logistics_operator(current_user)
    skip = (page - 1) * page_size

    locations = db.query(DriverLocation).order_by(DriverLocation.recorded_at.desc()).offset(skip).limit(page_size).all()

    tracking_points = []
    for loc in locations:
        driver = db.query(Driver).filter(Driver.id == loc.driver_id).first()
        vehicle = None
        if driver:
            vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()

        tracking_points.append(TrackingPointResponse(
            id=loc.id,
            tripId=loc.driver_id,
            kind="driver",
            label=f"Position chauffeur",
            latitude=loc.latitude,
            longitude=loc.longitude,
            recordedAt=loc.recorded_at.isoformat() if loc.recorded_at else "",
            status="in_transit",
            driverName=_driver_display_name(driver, db),
            vehiclePlate=getattr(vehicle, "plate", None) if vehicle else None,
        ))

    return TrackingPointListResponse(
        tracking_points=tracking_points,
    )


# ===== Maintenance Event Routes =====

def _build_maintenance_response(vehicle: Vehicle) -> Optional[MaintenanceEventResponse]:
    if vehicle.maintenance_status == VehicleMaintenanceStatus.OK and not vehicle.insurance_expires_at:
        return None

    maintenance_status_map = {
        VehicleMaintenanceStatus.OK: "done",
        VehicleMaintenanceStatus.SCHEDULED: "scheduled",
        VehicleMaintenanceStatus.IN_PROGRESS: "in_progress",
        VehicleMaintenanceStatus.OVERDUE: "overdue",
    }

    from datetime import datetime, timezone
    alert = None
    if vehicle.insurance_expires_at and vehicle.insurance_expires_at < datetime.now(timezone.utc):
        alert = "insurance_expired"
    elif vehicle.maintenance_status == VehicleMaintenanceStatus.OVERDUE:
        alert = "maintenance_overdue"

    return MaintenanceEventResponse(
        id=vehicle.id,
        vehicleId=vehicle.id,
        vehiclePlate=vehicle.plate,
        title=f"Maintenance {vehicle.plate}",
        type="preventive",
        status=maintenance_status_map.get(vehicle.maintenance_status, "scheduled"),
        dueDate=vehicle.insurance_expires_at.isoformat() if vehicle.insurance_expires_at else "",
        cost=0.0,
        nextControlAt=vehicle.insurance_expires_at.isoformat() if vehicle.insurance_expires_at else "",
        alert=alert,
        vehicleAvailable=vehicle.status not in [VehicleStatus.IN_TRANSIT, VehicleStatus.DELAYED],
        costEstimate=0.0,
    )


@router.get("/maintenance-events", response_model=MaintenanceEventListResponse)
def list_maintenance_events(
    vehicle_id: Optional[UUID] = Query(None, description="Filtrer par véhicule"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(50, ge=1, le=200, description="Taille de page"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les événements de maintenance (dérivés des véhicules)"""
    _ensure_logistics_operator(current_user)
    skip = (page - 1) * page_size
    fleet = _fleet_service(db)

    query = fleet.apply_vehicle_company_filter(db.query(Vehicle), current_user)
    if vehicle_id:
        query = query.filter(Vehicle.id == vehicle_id)

    vehicles = query.order_by(Vehicle.created_at.desc()).offset(skip).limit(page_size).all()

    events = []
    for v in vehicles:
        event = _build_maintenance_response(v)
        if event:
            events.append(event)

    return MaintenanceEventListResponse(
        maintenance_events=events,
    )


@router.websocket("/live")
async def logistics_live_feed(websocket: WebSocket):
    """Flux WebSocket temps réel logistique (missions, GPS, disponibilité)."""
    await websocket.accept()
    token = websocket.query_params.get("token")
    if not _authenticate_logistics_ws(token):
        await websocket.close(code=4401, reason="Unauthorized")
        return

    await register_connection(websocket)
    db = SyncSessionLocal()
    service = LogisticsLiveService(db)
    last_poll = LogisticsLiveService.default_since()

    try:
        await websocket.send_json(service.build_snapshot())
        await flush_pending_events()

        while True:
            await asyncio.sleep(15)
            await flush_pending_events()
            for event in service.poll_events(last_poll):
                await websocket.send_json(event)
            last_poll = datetime.now(timezone.utc)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.send_json({"type": "error", "message": "live_feed_unavailable"})
        except Exception:
            pass
    finally:
        await unregister_connection(websocket)
        db.close()
