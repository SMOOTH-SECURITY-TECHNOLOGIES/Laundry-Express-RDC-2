from app.models.claim import Claim


class ClaimAISummaryService:
    TYPE_CAUSES = {
        "delivery": "Retard ou problème de livraison",
        "payment": "Échec ou contestation de paiement",
        "refund": "Demande de remboursement",
        "driver": "Incident impliquant un chauffeur",
        "partner": "Problème lié au partenaire",
        "quality": "Qualité du service non conforme",
        "account": "Problème de compte client",
        "fraud": "Suspicion de fraude",
        "sla": "Violation SLA",
        "other": "Réclamation générale",
    }

    def generate(self, claim: Claim, financial_impact: float = 0) -> str:
        cause = self.TYPE_CAUSES.get(claim.type, "Réclamation")
        actors = []
        if claim.partner_id:
            actors.append("partenaire")
        if claim.driver_id:
            actors.append("chauffeur")
        actor_txt = ", ".join(actors) if actors else "client"
        risk = "élevé" if claim.priority in ("critical", "high") else "modéré"
        action = "Escalader et proposer remboursement" if claim.priority == "critical" else "Analyser et répondre sous SLA"
        return (
            f"Cause probable : {cause}. Acteurs : {actor_txt}. "
            f"Impact financier estimé : {financial_impact:.0f} $. Risque : {risk}. "
            f"Action recommandée : {action}. "
            f"{claim.description[:200]}"
        )

    def risk_score(self, claim: Claim, financial_impact: float = 0) -> float:
        base = {"low": 10, "medium": 35, "high": 65, "critical": 90}.get(claim.priority, 35)
        if financial_impact > 10000:
            base = min(100, base + 15)
        if claim.type in ("fraud", "payment", "refund"):
            base = min(100, base + 10)
        return float(base)
