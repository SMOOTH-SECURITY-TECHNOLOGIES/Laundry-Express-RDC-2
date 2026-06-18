from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_sync_db,
    get_user_partner_ids_sync,
    is_admin_user,
    is_partner_user,
    user_has_partner_access_sync,
)
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderEstimateRequest,
    OrderEstimateResponse,
    OrderResponse,
    OrderListResponse,
    PublicOrderSocialProofResponse,
    OrderStatusUpdateRequest,
    OrderCancelRequest,
)
from app.services.order_service import OrderService
from app.services.notification_service import NotificationService
from app.services.logistics_marketplace_service import LogisticsMarketplaceService

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_notification_metadata(order, page: str = "tracking") -> dict:
    return {
        "orderId": str(order.id),
        "orderNumber": order.order_number,
        "partnerId": str(order.partner_id),
        "page": page,
    }


def _notify_order_created(db: Session, order) -> None:
    service = NotificationService(db)
    metadata = _order_notification_metadata(order, page="partner-dashboard")
    partner_recipients = service.partner_staff_user_ids(order.partner_id)
    service.create_many(
        user_ids=partner_recipients,
        title="Nouvelle commande",
        message=f"La commande {order.order_number} attend votre confirmation.",
        notification_type="newOrder",
        metadata=metadata,
    )
    service.create_many(
        user_ids=service.admin_user_ids(),
        title="Nouvelle commande client",
        message=f"La commande {order.order_number} a ete creee.",
        notification_type="orderCreated",
        metadata={**metadata, "page": "admin", "section": "orders"},
    )
    service.create(
        user_id=order.customer_id,
        title="Commande creee",
        message=f"Votre commande {order.order_number} a ete transmise au partenaire.",
        notification_type="orderStatusChange",
        metadata=_order_notification_metadata(order),
    )


def _notify_order_status_changed(db: Session, order, new_status: str) -> None:
    service = NotificationService(db)
    status_label = str(new_status).replace("_", " ")
    metadata = _order_notification_metadata(order)
    service.create(
        user_id=order.customer_id,
        title="Mise a jour de commande",
        message=f"Votre commande {order.order_number} est maintenant: {status_label}.",
        notification_type="orderStatusChange",
        metadata=metadata,
    )

    if str(new_status) in {"ready_for_delivery", "pickup_scheduled", "confirmed"}:
        service.create_many(
            user_ids=service.logistics_manager_user_ids(),
            title="Action logistique requise",
            message=f"La commande {order.order_number} necessite une coordination logistique.",
            notification_type="logisticsActionRequired",
            metadata={**metadata, "page": "logistics-dashboard"},
        )

    if str(new_status) in {"cancelled", "failed", "disputed"}:
        service.create_many(
            user_ids=service.admin_user_ids(),
            title="Commande a surveiller",
            message=f"La commande {order.order_number} est passee au statut {status_label}.",
            notification_type="orderException",
            metadata={**metadata, "page": "admin", "section": "orders"},
        )


@router.get("/social-proof", response_model=list[PublicOrderSocialProofResponse])
def get_public_order_social_proof(
    limit: int = Query(10, ge=1, le=20, description="Nombre maximum d'éléments"),
    db: Session = Depends(get_sync_db),
):
    """Retourner des commandes récentes anonymisées pour le social proof public."""
    repository = OrderService(db).repository
    orders = repository.list_recent_public_social_proof(limit=limit)

    results: list[PublicOrderSocialProofResponse] = []
    for order in orders:
        raw_name = (order.customer_name or order.pickup_contact_name or "").strip()
        first_name = raw_name.split()[0] if raw_name else "Client"
        commune = (order.pickup_commune or "Kinshasa").strip()
        results.append(
            PublicOrderSocialProofResponse(
                order_id=order.id,
                order_number=order.order_number,
                customer_first_name=first_name,
                commune=commune,
                created_at=order.created_at,
            )
        )

    return results


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    response: Response,
    idempotency_key_header: Optional[str] = Header(default=None, alias="Idempotency-Key"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Créer une nouvelle commande"""
    service = OrderService(db)
    effective_order_data = order_data.copy(
        update={"idempotency_key": order_data.idempotency_key or idempotency_key_header}
    )

    # Valider les articles
    errors = service.validate_order_items(effective_order_data.items)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors},
        )

    try:
        order, created = service.create_order(
            customer_id=current_user.id,
            order_data=effective_order_data,
            current_user_id=current_user.id,
        )
        if not created:
            response.status_code = status.HTTP_200_OK
        else:
            _notify_order_created(db, order)
            db.commit()
            db.refresh(order)
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=OrderListResponse)
def list_orders(
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de la page"),
    status: Optional[str] = Query(None, description="Filtrer par statut"),
    partner_id: Optional[UUID] = Query(None, description="Filtrer par partenaire"),
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Lister les commandes de l'utilisateur connecté"""
    service = OrderService(db)

    if is_admin_user(current_user):
        orders, total = service.list_all_orders(
            page=page,
            page_size=page_size,
            status=status,
            partner_id=partner_id,
        )
    elif is_partner_user(current_user):
        if partner_id and not user_has_partner_access_sync(db, current_user, partner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé à ce partenaire",
            )

        partner_ids = list(get_user_partner_ids_sync(db, current_user.id))
        effective_partner_id = partner_id or (partner_ids[0] if partner_ids else None)
        if not effective_partner_id:
            return OrderListResponse(orders=[], total=0, page=page, page_size=page_size)

        orders, total = service.list_orders_for_partner(
            partner_id=effective_partner_id,
            page=page,
            page_size=page_size,
            status=status,
        )
    else:
        orders, total = service.list_orders_for_customer(
            customer_id=current_user.id,
            page=page,
            page_size=page_size,
            status=status,
            partner_id=partner_id,
        )

    return OrderListResponse(
        orders=orders,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Récupérer une commande spécifique"""
    service = OrderService(db)

    order = service.get_order(
        order_id=order_id,
        user_id=current_user.id,
        is_admin=is_admin_user(current_user),
    )

    if not order and is_partner_user(current_user):
        raw_order = service.repository.get_by_id(order_id)
        if raw_order and user_has_partner_access_sync(db, current_user, raw_order.partner_id):
            order = raw_order

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée",
        )

    return order


@router.post("/estimate", response_model=OrderEstimateResponse)
def estimate_order_price(
    estimate_data: OrderEstimateRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Estimer le prix d'une commande"""
    service = OrderService(db)

    # Valider les articles
    errors = service.validate_order_items(estimate_data.items)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors},
        )

    try:
        return service.estimate_order_price(estimate_data, customer_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: UUID,
    cancel_data: OrderCancelRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Annuler une commande"""
    service = OrderService(db)

    try:
        order = service.cancel_order(
            order_id=order_id,
            cancel_data=cancel_data,
            user_id=current_user.id,
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commande non trouvée",
            )

        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur",
        )


@router.post("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: UUID,
    status_data: OrderStatusUpdateRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Mettre à jour le statut d'une commande (pour partenaires/admins)"""
    service = OrderService(db)
    order = service.repository.get_by_id(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée",
        )

    if is_admin_user(current_user):
        pass
    elif is_partner_user(current_user):
        if not user_has_partner_access_sync(db, current_user, order.partner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission refusée",
            )
    elif order.customer_id == current_user.id and status_data.new_status.value == "cancelled":
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission refusée",
        )

    try:
        order = service.transition_order_status(
            order_id=order_id,
            status_data=status_data,
            changed_by_user_id=current_user.id,
        )

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commande non trouvée",
            )

        _notify_order_status_changed(db, order, status_data.new_status.value)
        LogisticsMarketplaceService(db).handle_order_status_change(order, status_data.new_status)
        db.commit()
        db.refresh(order)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur",
        )


@router.get("/{order_id}/statistics")
def get_order_statistics(
    order_id: UUID,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Obtenir des statistiques sur une commande"""
    service = OrderService(db)

    # Vérifier l'accès à la commande
    order = service.get_order(
        order_id=order_id,
        user_id=current_user.id,
        is_admin=False,  # TODO: Implémenter la logique admin
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commande non trouvée",
        )

    # Pour le MVP, retourner des statistiques simples
    return {
        "order_id": order_id,
        "status": order.status,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "item_count": len(order.items),
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }
