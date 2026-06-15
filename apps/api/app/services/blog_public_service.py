from sqlalchemy.orm import Session

from app.models.blog import BlogCategory, BlogPost, BlogSEO, BlogPostStatus
from app.schemas.blog_public import PublicBlogListResponse, PublicBlogPostDetail, PublicBlogPostItem
from app.services.blog_service import BlogService


class BlogPublicService:
    def __init__(self, db: Session):
        self.db = db
        BlogService(db).seed_if_empty()

    def list_posts(self, category_slug: str | None = None) -> PublicBlogListResponse:
        query = (
            self.db.query(BlogPost)
            .filter(BlogPost.status == BlogPostStatus.PUBLISHED.value)
            .order_by(BlogPost.published_at.desc().nullslast(), BlogPost.updated_at.desc())
        )
        if category_slug:
            query = query.join(BlogCategory).filter(BlogCategory.slug == category_slug)

        posts = query.all()
        categories = self.db.query(BlogCategory).order_by(BlogCategory.name).all()
        return PublicBlogListResponse(
            posts=[self._to_item(p) for p in posts],
            categories=[
                {
                    "id": str(c.id),
                    "name": c.name,
                    "slug": c.slug,
                    "post_count": c.post_count or 0,
                    "color": c.color or "#3B82F6",
                }
                for c in categories
            ],
            source="backend",
        )

    def get_post(self, slug: str) -> PublicBlogPostDetail | None:
        post = (
            self.db.query(BlogPost)
            .filter(BlogPost.slug == slug, BlogPost.status == BlogPostStatus.PUBLISHED.value)
            .first()
        )
        if not post:
            return None

        post.views_count = (post.views_count or 0) + 1
        self.db.commit()

        item = self._to_item(post)
        seo = self.db.query(BlogSEO).filter(BlogSEO.post_id == post.id).first()
        return PublicBlogPostDetail(
            **item.model_dump(),
            content=post.content or "",
            tags=[t.name for t in (post.tags or [])],
            seo_title=seo.seo_title if seo else post.title,
            seo_description=seo.seo_description if seo else (post.excerpt or ""),
        )

    def _to_item(self, post: BlogPost) -> PublicBlogPostItem:
        return PublicBlogPostItem(
            id=str(post.id),
            slug=post.slug,
            title=post.title,
            excerpt=post.excerpt or "",
            author_name=post.author.name if post.author else "Rédaction",
            author_avatar=post.author.avatar if post.author else None,
            category=post.category.name if post.category else "Actualités",
            category_color=post.category.color if post.category else "#3B82F6",
            reading_time=post.reading_time or 5,
            views_count=post.views_count or 0,
            published_at=post.published_at.isoformat() if post.published_at else None,
            featured_image=post.featured_image,
        )
