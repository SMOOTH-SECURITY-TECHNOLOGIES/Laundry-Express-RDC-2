from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db
from app.models.user import User
from app.services.pricing_service import PricingService
from app.schemas.pricing import (
    PricingEstimateRequest,
    PricingEstimateResponse,
    PriceCalculationInput,
    PriceCalculationResult,
)

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.post("/estimate", response_model=PricingEstimateResponse)
def estimate_order_price(
    estimate_request: PricingEstimateRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Estimer le prix d'une commande"""
    service = PricingService(db)
    effective_request = estimate_request.model_copy(update={"customer_id": current_user.id})

    try:
        return service.estimate_order_price(effective_request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'estimation du prix",
        )


@router.post("/calculate", response_model=PriceCalculationResult)
def calculate_order_price(
    calculation_input: PriceCalculationInput,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Calculer le prix d'une commande (pour OrderService)"""
    service = PricingService(db)
    effective_input = calculation_input.model_copy(update={"customer_id": current_user.id})

    try:
        return service.calculate_order_price(effective_input)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du calcul du prix",
        )


@router.get("/partners/{partner_id}/summary")
def get_pricing_summary(
    partner_id: str,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Obtenir un résumé de la tarification d'un partenaire"""
    # TODO: Vérifier que l'utilisateur est le partenaire ou admin
    service = PricingService(db)

    try:
        from uuid import UUID
        partner_uuid = UUID(partner_id)
        return service.get_pricing_summary(partner_uuid)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de partenaire invalide",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du résumé",
        )


@router.post("/validate")
def validate_order_items(
    partner_id: str,
    items: list,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    """Valider les articles d'une commande"""
    # TODO: Implémenter la validation avec les schémas appropriés
    # Pour le MVP, retourner une validation simple
    from uuid import UUID
    from app.schemas.order import OrderItemCreate

    try:
        partner_uuid = UUID(partner_id)
        
        # Convertir les items
        order_items = []
        for item in items:
            order_items.append(OrderItemCreate(**item))
        
        service = PricingService(db)
        errors = service.validate_order_items(partner_uuid, order_items)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la validation",
        )
