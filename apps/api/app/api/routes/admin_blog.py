from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.blog_dashboard import (
    BlogAIGenerateRequest, BlogAIGenerateResponse, BlogDashboardResponse,
    BlogPostCreateRequest, BlogPostDetailResponse, BlogPostUpdateRequest,
    BlogScheduleRequest, BlogSEOAuditRequest, BlogSEOAuditResponse,
)
from app.services.audit_service import AuditService
from app.services.blog_dashboard_service import BlogDashboardService
from app.services.blog_service import BlogService

router = APIRouter(prefix="/admin/blog", tags=["admin-blog"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=BlogDashboardResponse)
def get_dashboard(days: int = Query(default=30, ge=1, le=365), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return BlogDashboardService(db).get_dashboard(days=days)


@router.get("/posts")
def list_posts(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return BlogDashboardService(db).get_dashboard().posts


@router.post("/posts")
def create_post(payload: BlogPostCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    post = BlogService(db).create_post(payload.model_dump(), current_user.id)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="blog_posts", details={"post_id": str(post.id)})
    db.commit()
    return {"id": str(post.id), "slug": post.slug, "title": post.title}


@router.get("/posts/{post_id}", response_model=BlogPostDetailResponse)
def get_post(post_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = BlogDashboardService(db).get_post(post_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return detail


@router.put("/posts/{post_id}")
def update_post(post_id: str, payload: BlogPostUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        post = BlogService(db).update_post(UUID(post_id), payload.model_dump(exclude_none=True), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(post.id), "status": post.status}


@router.post("/posts/{post_id}/publish")
def publish_post(post_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        post = BlogService(db).publish(UUID(post_id), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(post.id), "status": post.status}


@router.post("/posts/{post_id}/schedule")
def schedule_post(post_id: str, payload: BlogScheduleRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        scheduled = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        post = BlogService(db).schedule(UUID(post_id), scheduled, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(post.id), "status": post.status, "scheduled_at": post.scheduled_at.isoformat() if post.scheduled_at else None}


@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return BlogDashboardService(db).get_analytics()


@router.post("/ai/generate", response_model=BlogAIGenerateResponse)
def ai_generate(payload: BlogAIGenerateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    result = BlogService(db).generate_ai(payload.topic, payload.language)
    return BlogAIGenerateResponse(**result)


@router.post("/seo/audit", response_model=BlogSEOAuditResponse)
def seo_audit(payload: BlogSEOAuditRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        result = BlogService(db).seo_audit(UUID(payload.post_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return BlogSEOAuditResponse(**result)
