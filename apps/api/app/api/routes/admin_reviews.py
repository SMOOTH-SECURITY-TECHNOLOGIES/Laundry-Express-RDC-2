from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.reviews_dashboard import (
    ReviewDetailResponse, ReviewReplyRequest, ReviewsDashboardResponse, ReviewsExportRequest,
)
from app.services.audit_service import AuditService
from app.services.reviews_dashboard_service import ReviewsDashboardService

router = APIRouter(prefix="/admin/reviews", tags=["admin-reviews"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=ReviewsDashboardResponse)
def get_dashboard(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard(days=days)


@router.get("")
def list_reviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().reviews


@router.get("/sentiment")
def sentiment(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().sentiment


@router.get("/trends")
def trends(
    days: int = Query(default=7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard(days=days).trends


@router.get("/channels")
def channels(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().channels


@router.get("/partners")
def partners(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().top_partners


@router.get("/drivers")
def drivers(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().top_drivers


@router.get("/issues")
def issues(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().issues


@router.get("/insights")
def insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return ReviewsDashboardService(db).get_dashboard().insights


@router.post("/export")
def export_reviews(
    payload: ReviewsExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    reviews = ReviewsDashboardService(db).get_dashboard().reviews
    AuditService(db).log_event(user_id=current_user.id, action="export", resource_type="reviews", details={"format": payload.format, "count": len(reviews)})
    db.commit()
    return {"filename": f"reviews_export.{payload.format}", "count": len(reviews), "format": payload.format}


@router.get("/{review_id}", response_model=ReviewDetailResponse)
def get_review(review_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = ReviewsDashboardService(db).get_review(review_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Avis introuvable")
    return detail


@router.post("/{review_id}/reply")
def reply_review(
    review_id: str,
    payload: ReviewReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_sync_db),
):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="reviews", details={"review_id": review_id, "action": "reply"})
    db.commit()
    return {"review_id": review_id, "status": "replied", "content": payload.content}


@router.post("/{review_id}/escalate")
def escalate_review(review_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="reviews", details={"review_id": review_id, "action": "escalate"})
    db.commit()
    return {"review_id": review_id, "status": "investigation"}


@router.post("/{review_id}/report")
def report_review(review_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="reviews", details={"review_id": review_id, "action": "report"})
    db.commit()
    return {"review_id": review_id, "status": "flagged"}
