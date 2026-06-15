import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.blog import (
    BlogAIContent, BlogAnalytics, BlogAuthor, BlogCalendar, BlogCategory,
    BlogPost, BlogPostStatus, BlogRevision, BlogSEO, BlogTag, BlogView, blog_post_tags,
)
from app.services.blog_ai_service import BlogAIService
from app.services.blog_seo_service import BlogSEOService

STATUS_LABELS = {
    "draft": "Brouillon", "review": "En révision", "scheduled": "Programmé",
    "published": "Publié", "archived": "Archivé",
}
DEFAULT_CATEGORIES = [
    ("marketplace", "Marketplace", "#3B82F6"),
    ("logistique", "Logistique", "#22C55E"),
    ("livraison", "Livraison", "#F59E0B"),
    ("business", "Business", "#8B5CF6"),
    ("marketing", "Marketing", "#EC4899"),
    ("paiement", "Paiement", "#06B6D4"),
    ("guides", "Guides", "#6366F1"),
    ("actualites", "Actualités", "#EF4444"),
]
DEFAULT_TAGS = ["kinshasa", "rdc", "livraison", "marketplace", "paiement", "mobile-money", "business", "seo", "whatsapp"]
SAMPLE_POSTS = [
    ("nettoyage-sec-gombe", "Nettoyage à sec à Gombe : guide complet 2026", "marketplace", "published", 4200, 82, 45),
    ("livraison-rapide-kinshasa", "Livraison rapide à Kinshasa : tout savoir", "livraison", "published", 3800, 78, 38),
    ("mobile-money-marketplace", "Mobile Money et marketplace en RDC", "paiement", "published", 2900, 85, 52),
    ("devenir-partenaire-laundry", "Devenir partenaire Laundry Express", "business", "published", 2100, 76, 67),
    ("seo-local-kinshasa", "SEO local Kinshasa : attirer des clients", "marketing", "published", 1800, 88, 41),
    ("logistique-derniere-mile", "Logistique last-mile en RDC", "logistique", "review", 0, 65, 0),
    ("crm-pme-rdc", "CRM pour PME congolaises", "business", "draft", 0, 55, 0),
    ("whatsapp-business-rdc", "WhatsApp Business pour la livraison", "marketing", "scheduled", 0, 70, 0),
]


class BlogService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = BlogAIService()
        self.seo_svc = BlogSEOService()

    def seed_if_empty(self) -> int:
        if self.db.query(BlogPost).count() > 0:
            return 0
        now = datetime.now(timezone.utc)
        cats: dict[str, BlogCategory] = {}
        for slug, name, color in DEFAULT_CATEGORIES:
            c = BlogCategory(id=uuid.uuid4(), slug=slug, name=name, color=color)
            self.db.add(c)
            cats[slug] = c
        self.db.flush()
        tags: dict[str, BlogTag] = {}
        for t in DEFAULT_TAGS:
            tag = BlogTag(id=uuid.uuid4(), slug=t, name=t.replace("-", " ").title())
            self.db.add(tag)
            tags[t] = tag
        author = BlogAuthor(id=uuid.uuid4(), name="Jean Admin", role="Rédacteur en chef", bio="Expert marketplace RDC")
        self.db.add(author)
        self.db.flush()
        count = 0
        for slug, title, cat_slug, status, views, seo_sc, leads in SAMPLE_POSTS:
            cat = cats.get(cat_slug)
            content = f"## Introduction\n\n{title} — analyse complète pour le marché congolais.\n\n## Points clés\n\n- Kinshasa\n- Croissance\n- Laundry Express\n\n## Conclusion\n\nContactez-nous pour en savoir plus."
            post = BlogPost(
                id=uuid.uuid4(), slug=slug, title=title,
                excerpt=f"Guide complet : {title.lower()}",
                content=content, author_id=author.id, category_id=cat.id if cat else None,
                status=status, reading_time=max(3, len(content.split()) // 200),
                views_count=views, seo_score=seo_sc, lead_score=leads,
                published_at=now - timedelta(days=count * 3) if status == "published" else None,
                scheduled_at=now + timedelta(days=7) if status == "scheduled" else None,
                comments_count=count % 5,
                content_blocks=[{"type": "paragraph", "text": content[:200]}],
            )
            self.db.add(post)
            self.db.flush()
            seo_data = self.ai.generate(title)
            seo = BlogSEO(
                post_id=post.id, seo_title=seo_data["seo"]["seo_title"],
                seo_description=seo_data["seo"]["seo_description"],
                focus_keyword=seo_data["seo"]["focus_keyword"],
                secondary_keywords=seo_data["seo"]["secondary_keywords"],
                schema_markup=self.seo_svc.build_schema(post, None),
                score=seo_sc,
            )
            self.db.add(seo)
            self.db.add(BlogAIContent(post_id=post.id, outline=seo_data["outline"], faq=seo_data["faq"], cta=seo_data["cta"], visibility_score=self.ai.visibility_score(post, True, True)))
            for i in range(min(views // 500, 10)):
                self.db.add(BlogView(post_id=post.id, visitor_id=f"v{i}", source="organic"))
            for day in range(30):
                d = now - timedelta(days=day)
                self.db.add(BlogAnalytics(
                    post_id=post.id, date=d,
                    views=max(0, views // 30 + (day % 5) * 10),
                    unique_visitors=max(0, views // 40),
                    ctr=round(2.5 + (day % 3), 1),
                    leads=max(0, leads // 30),
                    conversions=max(0, leads // 60),
                ))
            if cat:
                cat.post_count += 1
            for tslug in DEFAULT_TAGS[:3]:
                self.db.execute(blog_post_tags.insert().values(post_id=post.id, tag_id=tags[tslug].id))
                tags[tslug].post_count += 1
            if status == "scheduled":
                self.db.add(BlogCalendar(post_id=post.id, title=title, scheduled_at=post.scheduled_at, campaign="SEO Q2"))
            self._revision(post, None, "Seed initial")
            count += 1
        self.db.commit()
        return count

    def create_post(self, data: dict, actor_id: uuid.UUID) -> BlogPost:
        post = BlogPost(
            id=uuid.uuid4(), slug=data["slug"], title=data["title"],
            excerpt=data.get("excerpt"), content=data.get("content", ""),
            author_id=uuid.UUID(data["author_id"]) if data.get("author_id") else None,
            category_id=uuid.UUID(data["category_id"]) if data.get("category_id") else None,
            featured_image=data.get("featured_image"),
            status=BlogPostStatus.DRAFT.value,
            reading_time=max(3, len((data.get("content") or "").split()) // 200),
        )
        gen = self.ai.generate(data["title"])
        seo = BlogSEO(
            post_id=post.id, seo_title=gen["seo"]["seo_title"],
            seo_description=gen["seo"]["seo_description"],
            focus_keyword=gen["seo"]["focus_keyword"],
            schema_markup=self.seo_svc.build_schema(post, None),
        )
        seo.score = self.seo_svc.calc_score(post, seo)
        post.seo_score = seo.score
        self.db.add(post)
        self.db.flush()
        self.db.add(seo)
        self.db.add(BlogAIContent(post_id=post.id, outline=gen["outline"], faq=gen["faq"], cta=gen["cta"]))
        self._revision(post, actor_id, "Création")
        self.db.commit()
        return post

    def update_post(self, post_id: uuid.UUID, data: dict, actor_id: uuid.UUID) -> BlogPost:
        post = self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise ValueError("Article introuvable")
        for k in ("title", "slug", "excerpt", "content", "status"):
            if k in data and data[k] is not None:
                setattr(post, k, data[k])
        if data.get("content_blocks"):
            post.content_blocks = data["content_blocks"]
        seo = self.db.query(BlogSEO).filter(BlogSEO.post_id == post.id).first()
        post.seo_score = self.seo_svc.calc_score(post, seo)
        if seo:
            seo.score = post.seo_score
        self._revision(post, actor_id, "Mise à jour")
        self.db.commit()
        return post

    def publish(self, post_id: uuid.UUID, actor_id: uuid.UUID) -> BlogPost:
        post = self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise ValueError("Article introuvable")
        post.status = BlogPostStatus.PUBLISHED.value
        post.published_at = datetime.now(timezone.utc)
        self._revision(post, actor_id, "Publication")
        self.db.commit()
        return post

    def schedule(self, post_id: uuid.UUID, scheduled_at: datetime, actor_id: uuid.UUID) -> BlogPost:
        post = self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise ValueError("Article introuvable")
        post.status = BlogPostStatus.SCHEDULED.value
        post.scheduled_at = scheduled_at
        self.db.add(BlogCalendar(post_id=post.id, title=post.title, scheduled_at=scheduled_at))
        self._revision(post, actor_id, "Programmation")
        self.db.commit()
        return post

    def generate_ai(self, topic: str, language: str = "fr") -> dict:
        return self.ai.generate(topic, language)

    def seo_audit(self, post_id: uuid.UUID) -> dict:
        post = self.db.query(BlogPost).filter(BlogPost.id == post_id).first()
        seo = self.db.query(BlogSEO).filter(BlogSEO.post_id == post_id).first()
        if not post:
            raise ValueError("Article introuvable")
        result = self.seo_svc.audit(post, seo)
        post.seo_score = result["score"]
        if seo:
            seo.score = result["score"]
        self.db.commit()
        return {"post_id": str(post_id), **result}

    def _revision(self, post: BlogPost, actor_id: uuid.UUID | None, note: str) -> None:
        self.db.add(BlogRevision(
            post_id=post.id,
            snapshot={"title": post.title, "slug": post.slug, "status": post.status, "content": (post.content or "")[:500]},
            created_by=actor_id, note=note,
        ))

    @staticmethod
    def status_label(s: str) -> str:
        return STATUS_LABELS.get(s, s)
