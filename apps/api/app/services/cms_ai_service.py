from app.models.cms import CMSPage


class CMSAIService:
    def generate_hero(self, page: CMSPage) -> dict:
        return {
            "type": "hero",
            "title": page.title or "Laundry Express RDC",
            "subtitle": page.description or "Marketplace de services à Kinshasa",
            "button_text": "Commencer",
            "button_url": "/order",
            "secondary_button": "En savoir plus",
            "background_image": page.og_image,
            "overlay_color": "rgba(0,0,0,0.4)",
        }

    def generate_faq(self, page: CMSPage) -> list[dict]:
        return [
            {"question": f"Comment fonctionne {page.title} ?", "answer": "Commandez en ligne, nous collectons et livrons."},
            {"question": "Quels sont les délais ?", "answer": "24 à 48h selon le service et la zone."},
        ]

    def generate_seo(self, page: CMSPage) -> dict:
        return {
            "seo_title": f"{page.title} | Laundry Express RDC",
            "seo_description": (page.description or page.title)[:160],
            "keywords": f"{page.page_type}, kinshasa, laundry express",
            "og_title": page.title,
            "og_description": page.description,
        }

    def improve_text(self, text: str) -> str:
        return text.strip().rstrip(".") + ". Optimisé pour la conversion."

    def translate(self, text: str, lang: str) -> str:
        prefixes = {"en": "[EN] ", "sw": "[SW] ", "ln": "[LN] ", "fr": ""}
        return f"{prefixes.get(lang, '')}{text}"

    def generate_cta(self, page: CMSPage) -> dict:
        return {"type": "cta", "title": "Prêt à commencer ?", "button": "Commander maintenant", "url": "/order"}

    def suggestions(self, pages: list[CMSPage]) -> list[dict]:
        out = []
        for p in pages[:3]:
            out.append({"id": str(p.id), "text": f"Optimiser le SEO de /{p.slug}", "category": "seo"})
        if pages:
            out.append({"id": "ai-hero", "text": f"Générer une section hero pour « {pages[0].title} »", "category": "hero"})
        return out
