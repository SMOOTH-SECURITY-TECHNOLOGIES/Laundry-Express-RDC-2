from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_sync_db, get_current_user
from app.models.user import User, UserRole
from app.models.payment import PaymentIntent, PaymentProvider
from app.schemas.payment import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    CashPaymentConfirmRequest,
    ProviderWebhookRequest,
    PaymentTransactionResponse,
    OrderPaymentSummary,
    WebhookResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/intents", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
def create_payment_intent(
    data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Créer une intention de paiement pour une commande"""
    if current_user.role not in [UserRole.CUSTOMER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les clients peuvent créer des intentions de paiement"
        )

    payment_service = PaymentService(db)
    try:
        intent = payment_service.create_payment_intent(data, current_user.id)
        return intent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/intents/{intent_id}/initiate", response_model=PaymentTransactionResponse)
def initiate_payment(
    intent_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Initier un paiement pour une intention de paiement"""
    payment_service = PaymentService(db)
    try:
        transaction = payment_service.initiate_payment(intent_id)
        return transaction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/intents/{intent_id}/confirm-cash", response_model=PaymentIntentResponse)
def confirm_cash_payment(
    intent_id: UUID,
    data: CashPaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Confirmer un paiement cash"""
    if current_user.role not in [
        UserRole.DRIVER,
        UserRole.ADMIN,
        UserRole.PARTNER_OWNER,
        UserRole.PARTNER_STAFF,
        UserRole.LOGISTICS_MANAGER,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les chauffeurs, partenaires ou administrateurs peuvent confirmer les paiements cash"
        )

    payment_service = PaymentService(db)
    try:
        intent, _ = payment_service.confirm_cash_payment(intent_id, data)
        return intent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/intents/{intent_id}", response_model=PaymentIntentResponse)
def get_payment_intent(
    intent_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir une intention de paiement par son ID"""
    payment_service = PaymentService(db)
    try:
        intent = payment_service.payment_repo.get_intent_by_id(intent_id)
        if not intent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intention de paiement non trouvée"
            )
        
        # Vérifier les permissions
        if current_user.role != UserRole.ADMIN and str(intent.customer_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette intention de paiement"
            )
        
        return intent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}/summary", response_model=OrderPaymentSummary)
def get_order_payment_summary(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Obtenir un résumé des paiements d'une commande"""
    payment_service = PaymentService(db)
    try:
        summary = payment_service.get_order_payment_summary(order_id)
        
        # Vérifier les permissions
        order = summary["order"]
        if current_user.role != UserRole.ADMIN and str(order.customer_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à cette commande"
            )
        
        return OrderPaymentSummary(
            order_id=order_id,
            total_amount=order.total_amount,
            amount_paid=order.amount_paid,
            amount_due=order.total_amount - order.amount_paid,
            payment_status=order.payment_status.value,
            payment_intents=summary["payment_intents"],
            transactions=summary["transactions"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/webhooks/{provider}", response_model=WebhookResponse)
def handle_payment_webhook(
    provider: str,
    data: ProviderWebhookRequest,
    db: Session = Depends(get_sync_db),
):
    """Gérer les webhooks des fournisseurs de paiement"""
    payment_service = PaymentService(db)
    try:
        provider_enum = PaymentProvider(provider.lower())
        
        intent, transaction = payment_service.record_provider_callback(provider_enum, data)
        
        return WebhookResponse(
            success=True,
            message="Webhook traité avec succès",
            payment_intent_id=intent.id,
            transaction_id=transaction.id if transaction else None,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fournisseur de paiement invalide: {provider}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/intents", response_model=List[PaymentIntentResponse])
def list_payment_intents(
    order_id: UUID = None,
    customer_id: UUID = None,
    status: str = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    """Lister les intentions de paiement (admin seulement)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent lister toutes les intentions de paiement"
        )

    payment_service = PaymentService(db)
    try:
        query = payment_service.payment_repo.db.query(PaymentIntent)

        if order_id:
            query = query.filter(PaymentIntent.order_id == order_id)

        if customer_id:
            query = query.filter(PaymentIntent.customer_id == customer_id)

        if status:
            query = query.filter(PaymentIntent.status == status)

        intents = query.order_by(PaymentIntent.created_at.desc()).limit(limit).all()
        return intents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
