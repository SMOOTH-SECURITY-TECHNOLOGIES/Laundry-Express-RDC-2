from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.blog import BlogAnalytics, BlogCategory, BlogLead, BlogPost, BlogSEO, BlogTag
from app.schemas.blog_dashboard import (
    BlogAiSuggestion, BlogCalendarDay, BlogCategoryItem, BlogDashboardResponse,
    BlogKpiResponse, BlogPostDetailResponse, BlogPostListItem, BlogSeoDistribution,
    BlogTagItem, BlogTopPost, BlogTrendPoint,
)
from app.services.blog_ai_service import BlogAIService
from app.services.blog_service import BlogService


class BlogDashboardService:
    def __init__(self, db: Session):
        self.db = db
        BlogService(db).seed_if_empty()

    def get_dashboard(self, days: int = 30) -> BlogDashboardResponse:
        posts = self.db.query(BlogPost).order_by(BlogPost.updated_at.desc()).all()
        published = sum(1 for p in posts if p.status == "published")
        drafts = sum(1 for p in posts if p.status == "draft")
        scheduled = sum(1 for p in posts if p.status == "scheduled")
        monthly_views = sum(p.views_count or 0 for p in posts)
        leads = int(self.db.query(func.count(BlogLead.id)).scalar() or 0)
        if not leads:
            leads = sum(p.lead_score or 0 for p in posts)
        conversions = int(self.db.query(func.coalesce(func.sum(BlogAnalytics.conversions), 0)).scalar() or 0)
        avg_seo = round(sum(p.seo_score or 0 for p in posts) / max(len(posts), 1), 1)

        kpis = BlogKpiResponse(
            published_posts=published, published_change=0, published_sparkline=self._spark(published, 7),
            drafts=drafts, drafts_change=0, drafts_sparkline=self._spark(drafts, 7),
            scheduled_posts=scheduled, scheduled_change=0, scheduled_sparkline=self._spark(scheduled, 7),
            monthly_views=monthly_views, monthly_views_change=0, monthly_views_sparkline=self._spark(monthly_views, 7),
            leads_generated=leads, leads_change=0, leads_sparkline=self._spark(leads, 7),
            conversions=conversions, conversions_change=0, conversions_sparkline=self._spark(conversions, 7),
            avg_seo_score=avg_seo, seo_change=0, seo_sparkline=self._spark_f(avg_seo, 7),
        )

        seo_dist = self._seo_distribution(posts)
        top = sorted(posts, key=lambda p: p.views_count or 0, reverse=True)[:5]
        trends = self._trends(days)
        cats = self.db.query(BlogCategory).order_by(BlogCategory.post_count.desc()).all()
        tags = self.db.query(BlogTag).order_by(BlogTag.post_count.desc()).limit(10).all()

        return BlogDashboardResponse(
            kpis=kpis,
            posts=[self._to_item(p) for p in posts],
            categories=[BlogCategoryItem(id=str(c.id), name=c.name, slug=c.slug, post_count=c.post_count or 0, color=c.color or "#3B82F6") for c in cats],
            tags=[BlogTagItem(id=str(t.id), name=t.name, slug=t.slug, post_count=t.post_count or 0) for t in tags],
            seo_distribution=seo_dist,
            top_posts=[BlogTopPost(
                post_id=str(p.id), title=p.title, views=p.views_count or 0,
                ctr=float(self.db.query(func.avg(BlogAnalytics.ctr)).filter(BlogAnalytics.post_id == p.id).scalar() or 2.5),
                leads=p.lead_score or 0, seo_score=p.seo_score or 0,
            ) for p in top],
            trends=trends,
            ai_suggestions=[BlogAiSuggestion(**s) for s in BlogAIService().suggestions(posts)],
            calendar=self._calendar(),
            source="backend",
        )

    def get_post(self, post_id: str) -> BlogPostDetailResponse | None:
        p = self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not p:
            return None
        item = self._to_item(p)
        seo = self.db.query(BlogSEO).filter(BlogSEO.post_id == p.id).first()
        return BlogPostDetailResponse(
            **item.model_dump(),
            content=p.content or "",
            reading_time=p.reading_time or 5,
            content_blocks=p.content_blocks or [],
            tags=[t.name for t in (p.tags or [])],
            seo={"seo_title": seo.seo_title, "focus_keyword": seo.focus_keyword, "score": seo.score} if seo else {},
            revisions=[{"id": str(r.id), "note": r.note} for r in (p.revisions or [])[:5]],
            related_posts=[],
            ai_content={"outline": (p.ai_content.outline if p.ai_content else None) or []},
        )

    def get_analytics(self) -> dict:
        dash = self.get_dashboard()
        return {
            "top_posts": [t.model_dump() for t in dash.top_posts],
            "trends": [t.model_dump() for t in dash.trends],
            "total_views": dash.kpis.monthly_views,
            "total_leads": dash.kpis.leads_generated,
            "conversions": dash.kpis.conversions,
        }

    def _to_item(self, p: BlogPost) -> BlogPostListItem:
        return BlogPostListItem(
            id=str(p.id), slug=p.slug, title=p.title,
            excerpt=p.excerpt or "",
            author_name=p.author.name if p.author else "Rédaction",
            author_avatar=p.author.avatar if p.author else None,
            category=p.category.name if p.category else "—",
            category_color=p.category.color if p.category else "#6B7280",
            status=p.status, status_label=BlogService.status_label(p.status),
            seo_score=p.seo_score or 0, views_count=p.views_count or 0,
            comments_count=p.comments_count or 0,
            published_at=p.published_at.isoformat() if p.published_at else None,
            featured_image=p.featured_image,
        )

    def _seo_distribution(self, posts: list[BlogPost]) -> list[BlogSeoDistribution]:
        buckets = [
            ("Excellent (90-100)", 90, 100, "#22C55E"),
            ("Bon (70-89)", 70, 89, "#3B82F6"),
            ("Moyen (50-69)", 50, 69, "#F59E0B"),
            ("Faible (<50)", 0, 49, "#EF4444"),
        ]
        total = max(len(posts), 1)
        out = []
        for label, lo, hi, color in buckets:
            cnt = sum(1 for p in posts if lo <= (p.seo_score or 0) <= hi)
            out.append(BlogSeoDistribution(label=label, count=cnt, percent=round(cnt / total * 100, 1), color=color))
        return out

    def _trends(self, days: int) -> list[BlogTrendPoint]:
        now = datetime.now(timezone.utc)
        out = []
        for i in range(min(days, 30)):
            d = now - timedelta(days=days - 1 - i)
            views = int(self.db.query(func.coalesce(func.sum(BlogAnalytics.views), 0)).filter(
                func.date(BlogAnalytics.date) == d.date(),
            ).scalar() or 0)
            leads = int(self.db.query(func.coalesce(func.sum(BlogAnalytics.leads), 0)).filter(
                func.date(BlogAnalytics.date) == d.date(),
            ).scalar() or 0)
            out.append(BlogTrendPoint(date=d.strftime("%d/%m"), views=views, leads=leads))
        return out

    def _calendar(self) -> list[BlogCalendarDay]:
        now = datetime.now(timezone.utc)
        out = []
        for i in range(30):
            d = now + timedelta(days=i)
            cnt = sum(1 for p in self.db.query(BlogPost).filter(BlogPost.status == "scheduled").all()
                      if p.scheduled_at and p.scheduled_at.date() == d.date())
            out.append(BlogCalendarDay(date=d.strftime("%Y-%m-%d"), post_count=cnt))
        return out

    def _spark(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _spark_f(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
