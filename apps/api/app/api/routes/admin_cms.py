from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_sync_db, is_admin_user
from app.models.user import User
from app.schemas.cms_dashboard import (
    CMSDashboardResponse, CMSFAQRequest, CMSMediaRequest, CMSPageCreateRequest,
    CMSPageDetailResponse, CMSPageUpdateRequest, CMSSEORequest,
)
from app.services.audit_service import AuditService
from app.services.cms_dashboard_service import CMSDashboardService
from app.services.cms_service import CMSService

router = APIRouter(prefix="/admin/cms", tags=["admin-cms"])


def _require_admin(user: User) -> None:
    if not is_admin_user(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")


@router.get("/dashboard", response_model=CMSDashboardResponse)
def get_dashboard(days: int = Query(default=7, ge=1, le=365), current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CMSDashboardService(db).get_dashboard(days=days)


@router.get("/pages")
def list_pages(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CMSDashboardService(db).get_dashboard().pages


@router.post("/pages")
def create_page(payload: CMSPageCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    page = CMSService(db).create_page(payload.model_dump(), current_user.id)
    AuditService(db).log_event(user_id=current_user.id, action="create", resource_type="cms_pages", details={"page_id": str(page.id)})
    db.commit()
    return {"id": str(page.id), "slug": page.slug, "title": page.title}


@router.get("/pages/{page_id}", response_model=CMSPageDetailResponse)
def get_page(page_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    detail = CMSDashboardService(db).get_page(page_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Page introuvable")
    return detail


@router.put("/pages/{page_id}")
def update_page(page_id: str, payload: CMSPageUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        page = CMSService(db).update_page(UUID(page_id), payload.model_dump(exclude_none=True), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    AuditService(db).log_event(user_id=current_user.id, action="update", resource_type="cms_pages", details={"page_id": page_id})
    return {"id": str(page.id), "status": page.status}


@router.post("/pages/{page_id}/publish")
def publish_page(page_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        page = CMSService(db).publish(UUID(page_id), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(page.id), "status": page.status}


@router.post("/pages/{page_id}/rollback")
def rollback_page(page_id: str, revision_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    try:
        page = CMSService(db).rollback(UUID(page_id), UUID(revision_id), current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(page.id), "status": page.status}


@router.get("/faqs")
def list_faqs(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    from app.models.cms import CMSFAQ
    rows = db.query(CMSFAQ).order_by(CMSFAQ.position).all()
    return [{"id": str(f.id), "question": f.question, "answer": f.answer, "page_id": str(f.page_id) if f.page_id else None, "published": f.published} for f in rows]


@router.post("/faqs")
def create_faq(payload: CMSFAQRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    faq = CMSService(db).create_faq(payload.model_dump())
    return {"id": str(faq.id)}


@router.get("/media")
def list_media(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    return CMSDashboardService(db).get_dashboard().recent_media


@router.post("/media")
def upload_media(payload: CMSMediaRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    media = CMSService(db).create_media(payload.model_dump(), current_user.id)
    return {"id": str(media.id), "file_url": media.file_url}


@router.get("/seo")
def list_seo(current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    from app.models.cms import CMSSEO
    rows = db.query(CMSSEO).all()
    return [{"page_id": str(s.page_id), "seo_title": s.seo_title, "score": s.score} for s in rows]


@router.post("/seo")
def upsert_seo(payload: CMSSEORequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_sync_db)):
    _require_admin(current_user)
    seo = CMSService(db).upsert_seo(payload.model_dump())
    return {"page_id": str(seo.page_id), "score": seo.score}
