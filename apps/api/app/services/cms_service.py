import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.cms import (
    CMSBlock, CMSFAQ, CMSMedia, CMSPage, CMSPageStatus, CMSPublishHistory,
    CMSRevision, CMSSEO, CMSSection, CMSTemplate,
)
from app.models.content import SiteContentConfig
from app.services.cms_ai_service import CMSAIService

SITE_CONTENT_KEY = "default"
TYPE_LABELS = {
    "home": "Accueil", "landing": "Landing", "service": "Service", "partner": "Partenaire",
    "blog": "Blog", "faq": "FAQ", "about": "À propos", "contact": "Contact", "legal": "Légal", "custom": "Custom",
}
STATUS_LABELS = {
    "draft": "Brouillon", "review": "En revue", "scheduled": "Programmé",
    "published": "Publié", "archived": "Archivé",
}
DEFAULT_PAGES = [
    ("", "Accueil", "home", "published"),
    ("/services", "Services", "service", "published"),
    ("/tarifs", "Tarifs", "landing", "published"),
    ("/comment-ca-marche", "Comment ça marche", "about", "published"),
    ("/faq", "FAQ", "faq", "published"),
    ("/blog", "Blog", "blog", "published"),
    ("/partenaires", "Partenaires", "partner", "published"),
    ("/contact", "Contact", "contact", "published"),
]
DEFAULT_NAV = [
    ("header", "Accueil", "/", 0), ("header", "Services", "/services", 1),
    ("header", "Tarifs", "/tarifs", 2), ("header", "FAQ", "/faq", 3),
    ("footer", "Contact", "/contact", 0), ("footer", "Blog", "/blog", 1),
]
DEFAULT_TEMPLATES = [
    ("landing", "Landing Page", "Page marketing conversion"),
    ("service", "Service Page", "Présentation d'un service"),
    ("pricing", "Pricing Page", "Grille tarifaire"),
    ("blog", "Blog Post", "Article de blog"),
]


class CMSService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = CMSAIService()

    def sync_from_site_content(self) -> int:
        if self.db.query(CMSPage).count() > 0:
            return 0
        config = self.db.query(SiteContentConfig).filter(SiteContentConfig.key == SITE_CONTENT_KEY).first()
        data = (config.content_data if config else {}) or {}
        hero = data.get("hero", {})
        now = datetime.now(timezone.utc)
        count = 0
        for slug, title, ptype, status in DEFAULT_PAGES:
            page = CMSPage(
                id=uuid.uuid4(), slug=slug or "/", title=title, page_type=ptype, status=status,
                description=hero.get("subtitle", "") if ptype == "home" else f"Page {title}",
                seo_title=f"{title} | Laundry Express RDC",
                seo_description=hero.get("subtitle", title),
                published_at=now if status == "published" else None,
                seo_score=75 + count * 2,
                views_7d=max(100, 5000 - count * 400),
            )
            self.db.add(page)
            self.db.flush()
            if ptype == "home" and hero:
                self.db.add(CMSSection(
                    page_id=page.id, type="hero", position=0, title=hero.get("title", title),
                    subtitle=hero.get("subtitle"), json_data=self.ai.generate_hero(page),
                ))
                for i, step in enumerate(data.get("howItWorksSteps", [])):
                    self.db.add(CMSSection(
                        page_id=page.id, type="how_it_works", position=i + 1,
                        title=step.get("title"), content=step.get("description"),
                        json_data={"step_icon": step.get("icon", "sparkles"), "step_order": i},
                    ))
            if ptype == "faq":
                for i, item in enumerate(data.get("faq", [])):
                    self.db.add(CMSFAQ(
                        page_id=page.id, question=item.get("question", ""),
                        answer=item.get("answer", ""), position=i,
                    ))
            seo = self.ai.generate_seo(page)
            self.db.add(CMSSEO(page_id=page.id, **{k: seo.get(k) for k in ("seo_title", "seo_description", "keywords", "og_title", "og_description")}, score=page.seo_score))
            self._save_revision(page, None, "Import initial")
            count += 1
        from app.models.cms import CMSNavigation
        for menu, label, url, pos in DEFAULT_NAV:
            self.db.add(CMSNavigation(menu_type=menu, label=label, url=url, position=pos))
        for key, label, desc in DEFAULT_TEMPLATES:
            if not self.db.query(CMSTemplate).filter(CMSTemplate.key == key).first():
                self.db.add(CMSTemplate(key=key, label=label, description=desc))
        self.db.commit()
        return count

    def create_page(self, data: dict, actor_id: uuid.UUID) -> CMSPage:
        page = CMSPage(
            id=uuid.uuid4(), slug=data["slug"], title=data["title"],
            page_type=data.get("page_type", "custom"), description=data.get("description"),
            template=data.get("template", "default"), status=CMSPageStatus.DRAFT.value,
            created_by=actor_id, updated_by=actor_id,
        )
        seo = self.ai.generate_seo(page)
        page.seo_title = seo["seo_title"]
        page.seo_description = seo["seo_description"]
        page.seo_score = 60
        self.db.add(page)
        self.db.flush()
        self.db.add(CMSSEO(page_id=page.id, seo_title=seo["seo_title"], seo_description=seo["seo_description"], score=60))
        self.db.add(CMSBlock(page_id=page.id, block_type="hero", position=0, json_data=self.ai.generate_hero(page)))
        self._save_revision(page, actor_id, "Création")
        self.db.commit()
        return page

    def update_page(self, page_id: uuid.UUID, data: dict, actor_id: uuid.UUID) -> CMSPage:
        page = self.db.query(CMSPage).filter(CMSPage.id == page_id).first()
        if not page:
            raise ValueError("Page introuvable")
        for k in ("title", "slug", "description", "page_type", "status", "template",
                  "seo_title", "seo_description", "og_title", "og_description", "og_image", "canonical_url"):
            if k in data and data[k] is not None:
                setattr(page, k, data[k])
        page.updated_by = actor_id
        if data.get("blocks"):
            self.db.query(CMSBlock).filter(CMSBlock.page_id == page.id).delete()
            for i, b in enumerate(data["blocks"]):
                self.db.add(CMSBlock(page_id=page.id, block_type=b.get("type", "rich_text"), position=i, json_data=b))
        if data.get("sections"):
            self.db.query(CMSSection).filter(CMSSection.page_id == page.id).delete()
            for i, s in enumerate(data["sections"]):
                self.db.add(CMSSection(page_id=page.id, type=s.get("type", "content"), position=i, title=s.get("title"), json_data=s))
        self._save_revision(page, actor_id, "Mise à jour")
        self.db.commit()
        return page

    def publish(self, page_id: uuid.UUID, actor_id: uuid.UUID) -> CMSPage:
        page = self.db.query(CMSPage).filter(CMSPage.id == page_id).first()
        if not page:
            raise ValueError("Page introuvable")
        old = page.status
        page.status = CMSPageStatus.PUBLISHED.value
        page.published_at = datetime.now(timezone.utc)
        self.db.add(CMSPublishHistory(page_id=page.id, action="publish", old_status=old, new_status=page.status, actor_id=actor_id))
        self._save_revision(page, actor_id, "Publication")
        self.db.commit()
        return page

    def rollback(self, page_id: uuid.UUID, revision_id: uuid.UUID, actor_id: uuid.UUID) -> CMSPage:
        page = self.db.query(CMSPage).filter(CMSPage.id == page_id).first()
        rev = self.db.query(CMSRevision).filter(CMSRevision.id == revision_id, CMSRevision.page_id == page_id).first()
        if not page or not rev:
            raise ValueError("Page ou révision introuvable")
        snap = rev.snapshot
        for k in ("title", "slug", "description", "page_type", "status", "seo_title", "seo_description"):
            if k in snap:
                setattr(page, k, snap[k])
        page.updated_by = actor_id
        self.db.add(CMSPublishHistory(page_id=page.id, action="rollback", old_status=page.status, new_status=snap.get("status"), actor_id=actor_id))
        self.db.commit()
        return page

    def create_faq(self, data: dict) -> CMSFAQ:
        pid = data.get("page_id")
        page_id = uuid.UUID(pid) if pid else None
        faq = CMSFAQ(
            page_id=page_id, question=data["question"], answer=data["answer"],
            position=data.get("position", 0), published=data.get("published", True),
        )
        self.db.add(faq)
        self.db.commit()
        return faq

    def create_media(self, data: dict, actor_id: uuid.UUID) -> CMSMedia:
        base = data["file_url"]
        media = CMSMedia(
            filename=data["filename"], file_url=base, mime_type=data.get("mime_type"),
            size=data.get("size"), alt_text=data.get("alt_text"), uploaded_by=actor_id,
            thumbnail_url=base, medium_url=base, large_url=base, webp_url=base,
        )
        self.db.add(media)
        self.db.commit()
        return media

    def upsert_seo(self, data: dict) -> CMSSEO:
        page_id = uuid.UUID(data["page_id"]) if isinstance(data["page_id"], str) else data["page_id"]
        seo = self.db.query(CMSSEO).filter(CMSSEO.page_id == page_id).first()
        if not seo:
            seo = CMSSEO(page_id=page_id)
            self.db.add(seo)
        for k in ("seo_title", "seo_description", "keywords", "canonical_url", "og_title",
                  "og_description", "og_image", "og_type", "twitter_card", "schema_json"):
            if k in data and data[k] is not None:
                setattr(seo, k, data[k])
        seo.score = self._calc_seo_score(seo)
        page = self.db.query(CMSPage).filter(CMSPage.id == page_id).first()
        if page:
            page.seo_score = seo.score
        self.db.commit()
        return seo

    def _save_revision(self, page: CMSPage, actor_id: uuid.UUID | None, note: str) -> None:
        snap = {
            "title": page.title, "slug": page.slug, "description": page.description,
            "page_type": page.page_type, "status": page.status,
            "seo_title": page.seo_title, "seo_description": page.seo_description,
        }
        self.db.add(CMSRevision(page_id=page.id, snapshot=snap, created_by=actor_id, note=note))

    def _calc_seo_score(self, seo: CMSSEO) -> int:
        score = 0
        if seo.seo_title and len(seo.seo_title) <= 60:
            score += 25
        if seo.seo_description and 50 <= len(seo.seo_description) <= 160:
            score += 25
        if seo.keywords:
            score += 15
        if seo.og_title and seo.og_image:
            score += 20
        if seo.canonical_url:
            score += 15
        return min(100, score)

    @staticmethod
    def type_label(t: str) -> str:
        return TYPE_LABELS.get(t, t)

    @staticmethod
    def status_label(s: str) -> str:
        return STATUS_LABELS.get(s, s)
