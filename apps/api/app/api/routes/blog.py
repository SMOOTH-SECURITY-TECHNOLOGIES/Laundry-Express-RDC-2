from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_sync_db
from app.schemas.blog_public import PublicBlogListResponse, PublicBlogPostDetail
from app.services.blog_public_service import BlogPublicService

router = APIRouter(prefix="/blog", tags=["blog"])


@router.get("/posts", response_model=PublicBlogListResponse)
def list_posts(category: str | None = Query(default=None), db: Session = Depends(get_sync_db)):
    return BlogPublicService(db).list_posts(category_slug=category)


@router.get("/posts/{slug}", response_model=PublicBlogPostDetail)
def get_post(slug: str, db: Session = Depends(get_sync_db)):
    post = BlogPublicService(db).get_post(slug)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article introuvable")
    return post
