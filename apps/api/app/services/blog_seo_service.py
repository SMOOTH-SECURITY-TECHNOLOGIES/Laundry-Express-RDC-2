import re

from app.models.blog import BlogPost, BlogSEO


class BlogSEOService:
    def calc_score(self, post: BlogPost, seo: BlogSEO | None) -> int:
        score = 0
        content = post.content or ""
        word_count = len(content.split())
        if 800 <= word_count <= 3000:
            score += 15
        elif word_count >= 400:
            score += 8
        if seo and seo.focus_keyword:
            kw = seo.focus_keyword.lower()
            density = content.lower().count(kw) / max(word_count, 1) * 100
            if 0.5 <= density <= 2.5:
                score += 15
            elif density > 0:
                score += 5
        if re.search(r"^#\s", content, re.M) or "##" in content:
            score += 10
        title = (seo.seo_title if seo else None) or post.title
        if title and len(title) <= 60:
            score += 10
        desc = (seo.seo_description if seo else None) or post.excerpt or ""
        if 50 <= len(desc) <= 160:
            score += 15
        if post.featured_image:
            score += 10
        if seo and seo.canonical_url:
            score += 5
        if "http" in content:
            score += 10
        if seo and seo.schema_markup:
            score += 10
        return min(100, score)

    def audit(self, post: BlogPost, seo: BlogSEO | None) -> dict:
        score = self.calc_score(post, seo)
        checklist = [
            {"label": "Mot clé principal", "ok": bool(seo and seo.focus_keyword)},
            {"label": "Meta description", "ok": bool(seo and seo.seo_description and len(seo.seo_description) >= 50)},
            {"label": "Titres H1/H2", "ok": "##" in (post.content or "")},
            {"label": "Image featured", "ok": bool(post.featured_image)},
            {"label": "Longueur article", "ok": len((post.content or "").split()) >= 400},
            {"label": "Schema.org", "ok": bool(seo and seo.schema_markup)},
            {"label": "Open Graph", "ok": bool(seo and seo.og_title and seo.og_image)},
        ]
        recs = []
        if not (seo and seo.focus_keyword):
            recs.append("Ajouter un mot clé principal")
        if len((post.content or "").split()) < 800:
            recs.append("Allonger l'article (objectif 800+ mots)")
        if not (seo and seo.schema_markup):
            recs.append("Ajouter le schema Article + FAQPage")
        return {"score": score, "checklist": checklist, "recommendations": recs}

    def build_schema(self, post: BlogPost, seo: BlogSEO | None) -> dict:
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.excerpt or (seo.seo_description if seo else ""),
            "image": post.featured_image,
            "datePublished": post.published_at.isoformat() if post.published_at else None,
            "author": {"@type": "Organization", "name": "Laundry Express RDC"},
        }
