from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.exceptions import ValidationError
from app.models.user import User
from app.schemas.customer_support import CustomerClaimCreateRequest, CustomerClaimResponse
from app.services.customer_claims_service import CustomerClaimsService

router = APIRouter(prefix="/claims", tags=["claims"])


@router.post("", response_model=CustomerClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    payload: CustomerClaimCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerClaimsService(db)
    try:
        CustomerClaimsService.ensure_customer_role(current_user)
        claim = service.create_claim(current_user.id, payload.model_dump())
        return service.build_claim_response(claim)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=list[CustomerClaimResponse])
def list_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerClaimsService(db)
    if is_admin_user(current_user):
        from app.models.claim import Claim
        claims = db.query(Claim).order_by(Claim.updated_at.desc()).limit(200).all()
    else:
        claims = service.list_claims_for_customer(current_user.id)
    return [service.build_claim_response(claim) for claim in claims]


@router.get("/{claim_id}", response_model=CustomerClaimResponse)
def get_claim(
    claim_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = CustomerClaimsService(db)
    if is_admin_user(current_user):
        from app.models.claim import Claim
        claim = db.query(Claim).filter(Claim.id == claim_id).first()
    else:
        claim = service.get_claim_for_customer(claim_id, current_user.id)

    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réclamation introuvable")
    return service.build_claim_response(claim)
