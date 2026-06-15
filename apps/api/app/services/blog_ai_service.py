from app.models.blog import BlogPost


class BlogAIService:
    def generate(self, topic: str, language: str = "fr") -> dict:
        title = f"{topic} : guide complet pour les entreprises en RDC"
        outline = [
            f"Introduction — pourquoi {topic} compte à Kinshasa",
            "Contexte marché RDC et opportunités",
            "Bonnes pratiques et erreurs à éviter",
            "Comment Laundry Express aide les entreprises",
            "FAQ et prochaines étapes",
        ]
        content = "\n\n".join(f"## {h}\n\nContenu détaillé sur {topic.lower()} pour le marché congolais." for h in outline)
        return {
            "title": title,
            "outline": outline,
            "content": content,
            "faq": [
                {"question": f"Comment démarrer avec {topic} ?", "answer": "Commencez par définir vos objectifs et votre audience cible à Kinshasa."},
                {"question": f"Quel budget prévoir pour {topic} ?", "answer": "Le budget dépend de votre échelle ; un pilote peut démarrer avec un investissement modéré."},
            ],
            "seo": {
                "seo_title": title[:60],
                "seo_description": f"Découvrez tout sur {topic} en RDC. Guide pratique Laundry Express.",
                "focus_keyword": topic.lower().split()[0] if topic else "marketplace",
                "secondary_keywords": "kinshasa, rdc, business, croissance",
            },
            "cta": {"type": "cta", "title": "Prêt à passer à l'action ?", "button": "Devenir partenaire", "url": "/partenaires"},
        }

    def suggestions(self, posts: list[BlogPost]) -> list[dict]:
        topics = [
            "Comment créer une entreprise de livraison rentable en RDC",
            "Guide des taxes pour les entreprises en RDC",
            "Mobile Money : optimiser les paiements marketplace",
            "SEO local Kinshasa : attirer des clients organiques",
        ]
        out = []
        for i, t in enumerate(topics[:4]):
            out.append({"id": f"ai-{i}", "text": t, "category": "tendance"})
        if posts:
            kw = posts[0].title.split()[0] if posts[0].title else "marketplace"
            out.append({"id": "ai-kw", "text": f"Opportunité SEO : « {kw} Kinshasa »", "category": "seo"})
        return out

    def visibility_score(self, post: BlogPost, has_schema: bool, has_faq: bool) -> int:
        score = 30
        if post.seo_score >= 70:
            score += 25
        if has_schema:
            score += 20
        if has_faq:
            score += 15
        if post.views_count > 100:
            score += 10
        return min(100, score)
