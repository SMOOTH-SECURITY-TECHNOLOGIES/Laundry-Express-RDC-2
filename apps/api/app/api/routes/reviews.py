from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db
from app.exceptions import ValidationError
from app.models.user import User
from app.schemas.review import ReviewCreateRequest, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = ReviewService(db)
    try:
        ReviewService.ensure_customer_role(current_user)
        review = service.create_review(
            current_user.id,
            order_id=payload.order_id,
            rating=payload.rating,
            comment=payload.comment,
            title=payload.title,
        )
        return service.build_review_response(review)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/public", response_model=list[ReviewResponse])
def list_public_reviews(
    partner_id: Optional[UUID] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_sync_db),
):
    service = ReviewService(db)
    reviews = service.list_public_reviews(partner_id=partner_id, limit=limit)
    return [service.build_review_response(review, public=True) for review in reviews]


@router.get("/me", response_model=list[ReviewResponse])
def list_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    service = ReviewService(db)
    reviews = service.list_reviews_for_customer(current_user.id)
    return [service.build_review_response(review) for review in reviews]
