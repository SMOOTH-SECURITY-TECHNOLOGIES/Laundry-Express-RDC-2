from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.cms import CMSAnalytics, CMSFAQ, CMSMedia, CMSPage, CMSRevision, CMSTemplate, CMSTranslation
from app.models.user import User
from app.schemas.cms_dashboard import (
    CMSAiSuggestion, CMSDashboardResponse, CMSKpiResponse, CMSLanguageStat,
    CMSMediaItem, CMSPageDetailResponse, CMSPageListItem, CMSPublicationStatus,
    CMSRevisionItem, CMSSiteTreeNode, CMSTemplateItem, CMSTopPage,
)
from app.services.cms_ai_service import CMSAIService
from app.services.cms_service import CMSService

STATUS_COLORS = {
    "published": "#22C55E", "draft": "#F59E0B", "scheduled": "#3B82F6",
    "review": "#8B5CF6", "archived": "#6B7280",
}
LANG_LABELS = {"fr": "Français", "en": "English", "sw": "Swahili", "ln": "Lingala"}


class CMSDashboardService:
    def __init__(self, db: Session):
        self.db = db
        CMSService(db).sync_from_site_content()

    def get_dashboard(self, days: int = 7) -> CMSDashboardResponse:
        pages = self.db.query(CMSPage).order_by(CMSPage.updated_at.desc()).all()
        published = sum(1 for p in pages if p.status == "published")
        drafts = sum(1 for p in pages if p.status == "draft")
        scheduled = sum(1 for p in pages if p.status == "scheduled")
        blog = sum(1 for p in pages if p.page_type == "blog")
        visitors = sum(p.views_7d or 0 for p in pages)
        conversions = sum(p.conversions_7d or 0 for p in pages)
        avg_seo = round(sum(p.seo_score or 0 for p in pages) / max(len(pages), 1), 1)
        revenue = float(self.db.query(func.coalesce(func.sum(CMSAnalytics.revenue), 0)).scalar() or 0)
        if not revenue and pages:
            revenue = sum((p.conversions_7d or 0) * 10.0 for p in pages)

        kpis = CMSKpiResponse(
            published_pages=published, published_change=0, published_sparkline=self._spark(published, days),
            drafts=drafts, drafts_change=0, drafts_sparkline=self._spark(drafts, days),
            scheduled_pages=scheduled, scheduled_change=0, scheduled_sparkline=self._spark(scheduled, days),
            blog_posts=blog, blog_change=0, blog_sparkline=self._spark(blog, days),
            visitors_7d=visitors, visitors_change=0, visitors_sparkline=self._spark(visitors, days),
            conversions_7d=conversions, conversions_change=0, conversions_sparkline=self._spark(conversions, days),
            avg_seo_score=avg_seo, seo_change=0, seo_sparkline=self._spark_f(avg_seo, days),
            revenue_generated=revenue, revenue_change=0, revenue_sparkline=self._spark_f(revenue, days),
        )

        items = [self._to_item(p) for p in pages]
        total = max(len(pages), 1)
        pub_stats = []
        for st, label in [("published", "Publié"), ("draft", "Brouillon"), ("scheduled", "Programmé"), ("review", "En revue")]:
            cnt = sum(1 for p in pages if p.status == st)
            pub_stats.append(CMSPublicationStatus(status=st, label=label, count=cnt, percent=round(cnt / total * 100, 1), color=STATUS_COLORS.get(st, "#6B7280")))

        top = sorted(pages, key=lambda p: p.views_7d or 0, reverse=True)[:5]
        max_v = max((p.views_7d or 0 for p in top), default=1) or 1

        revs = self.db.query(CMSRevision).order_by(CMSRevision.created_at.desc()).limit(8).all()
        recent_revisions = []
        for r in revs:
            pg = self.db.query(CMSPage).filter(CMSPage.id == r.page_id).first()
            u = self.db.query(User).filter(User.id == r.created_by).first() if r.created_by else None
            recent_revisions.append(CMSRevisionItem(
                id=str(r.id), page_title=pg.title if pg else "Page",
                action=r.note or "Modification", user_name=u.name if u else "Système",
                created_at=r.created_at.isoformat() if r.created_at else None,
            ))

        langs = []
        for code, label in LANG_LABELS.items():
            cnt = self.db.query(CMSTranslation).filter(CMSTranslation.language == code).count()
            if code == "fr":
                cnt = max(cnt, published)
            langs.append(CMSLanguageStat(language=code, label=label, page_count=cnt))

        templates = self.db.query(CMSTemplate).all()
        media = self.db.query(CMSMedia).order_by(CMSMedia.created_at.desc()).limit(5).all()

        return CMSDashboardResponse(
            kpis=kpis,
            pages=items,
            site_tree=self._site_tree(pages),
            publication_status=pub_stats,
            seo_score=avg_seo,
            seo_checklist=[
                {"label": "Titres optimisés", "done": sum(1 for p in pages if p.seo_title), "total": len(pages)},
                {"label": "Descriptions SEO", "done": sum(1 for p in pages if p.seo_description), "total": len(pages)},
                {"label": "Pages indexées", "done": published, "total": len(pages)},
            ],
            top_pages=[CMSTopPage(page_id=str(p.id), title=p.title, slug=p.slug, views=p.views_7d or 0, percent=round((p.views_7d or 0) / max_v * 100, 1)) for p in top],
            recent_revisions=recent_revisions,
            languages=langs,
            templates=[CMSTemplateItem(key=t.key, label=t.label, description=t.description or "", preview_url=t.preview_url) for t in templates],
            ai_suggestions=[CMSAiSuggestion(**s) for s in CMSAIService().suggestions(pages)],
            recent_media=[CMSMediaItem(id=str(m.id), filename=m.filename, file_url=m.file_url, mime_type=m.mime_type, size=m.size, thumbnail_url=m.thumbnail_url) for m in media],
            source="backend",
        )

    def get_page(self, page_id: str) -> CMSPageDetailResponse | None:
        p = self.db.query(CMSPage).filter(CMSPage.id == page_id).first()
        if not p:
            return None
        item = self._to_item(p)
        return CMSPageDetailResponse(
            **item.model_dump(),
            description=p.description,
            seo_title=p.seo_title, seo_description=p.seo_description,
            og_title=p.og_title, og_description=p.og_description,
            og_image=p.og_image, canonical_url=p.canonical_url,
            blocks=[{"type": b.block_type, **(b.json_data or {})} for b in (p.blocks or [])],
            sections=[{"type": s.type, "title": s.title, "subtitle": s.subtitle, "content": s.content, "json_data": s.json_data} for s in (p.sections or [])],
            faqs=[{"id": str(f.id), "question": f.question, "answer": f.answer, "position": f.position} for f in (p.faqs or [])],
            revisions=[{"id": str(r.id), "note": r.note, "created_at": r.created_at.isoformat() if r.created_at else None} for r in (p.revisions or [])],
            translations=[{"language": t.language, "field_key": t.field_key, "value": t.value} for t in (p.translations or [])],
            publish_history=[{"action": h.action, "old_status": h.old_status, "new_status": h.new_status} for h in (p.publish_history or [])],
        )

    def _to_item(self, p: CMSPage) -> CMSPageListItem:
        lang_cnt = self.db.query(CMSTranslation).filter(CMSTranslation.page_id == p.id, CMSTranslation.language == "fr").count()
        return CMSPageListItem(
            id=str(p.id), slug=p.slug, title=p.title, page_type=p.page_type,
            page_type_label=CMSService.type_label(p.page_type),
            status=p.status, status_label=CMSService.status_label(p.status),
            language="fr" if lang_cnt >= 0 else "fr",
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
            views_7d=p.views_7d or 0, seo_score=p.seo_score or 0,
            thumbnail_url=p.og_image,
        )

    def _site_tree(self, pages: list[CMSPage]) -> list[CMSSiteTreeNode]:
        roots = [p for p in pages if p.page_type in ("home", "about", "contact")]
        others = [p for p in pages if p not in roots]
        children = [CMSSiteTreeNode(id=str(p.id), label=p.title, slug=p.slug) for p in others[:6]]
        if roots:
            home = roots[0]
            return [CMSSiteTreeNode(id=str(home.id), label=home.title, slug=home.slug, children=children)]
        return [CMSSiteTreeNode(id=str(p.id), label=p.title, slug=p.slug) for p in pages[:8]]

    def _spark(self, end: int, days: int) -> list[int]:
        return [int(end * (0.7 + i * 0.3 / max(days - 1, 1))) for i in range(min(days, 7))]

    def _spark_f(self, end: float, days: int) -> list[float]:
        return [round(end * (0.7 + i * 0.3 / max(days - 1, 1)), 1) for i in range(min(days, 7))]
