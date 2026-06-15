from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.whatsapp_ops import (
    WhatsappAiMetrics, WhatsappAutomation, WhatsappCampaign, WhatsappConversation,
    WhatsappCostSnapshot, WhatsappNotification, WhatsappQuality, WhatsappSegment,
    WhatsappTemplate, WhatsappWebhook,
)

CONV_STATUS = {
    "new": "Nouveau", "open": "Ouvert", "ai": "IA", "waiting_client": "En attente client",
    "resolved": "Résolu", "escalated": "Escaladé",
}
META_STATUS = {"approved": "Approved", "pending": "Pending", "rejected": "Rejected", "disabled": "Disabled"}
CAT_LABELS = {"marketing": "Marketing", "utility": "Utility", "authentication": "Authentication"}
NOTIF_STATUS = {"delivered": "Délivré", "pending": "En attente", "failed": "Échoué", "read": "Lu"}
EVENT_LABELS = {
    "order_created": "Commande créée", "payment_success": "Paiement réussi",
    "driver_assigned": "Chauffeur assigné", "mission_started": "Mission démarrée",
    "delivery_completed": "Livraison terminée", "refund_processed": "Remboursement traité",
    "review_request": "Demande avis", "loyalty": "Fidélité", "referral": "Parrainage",
}
CAMP_TYPES = {"broadcast": "Broadcast", "promo": "Promo", "reactivation": "Réactivation", "loyalty": "Fidélité", "referral": "Parrainage"}


class WhatsappOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(WhatsappConversation).count() > 0:
            return
        now = datetime.now(timezone.utc)

        conversations = [
            WhatsappConversation(client_name="Marie Kabila", phone="+243 81 234 5678", last_message="Où en est ma commande #ORD-8821 ?", channel="whatsapp", assigned_to="Sophie M.", status="open", wait_time_sec=420, messages_json=[{"from": "client", "text": "Où en est ma commande #ORD-8821 ?", "at": now.isoformat()}], linked_orders=["ORD-8821"], linked_tickets=["TK-2401"], ai_suggestions=["Votre commande est en cours de livraison, arrivée estimée 14h30."]),
            WhatsappConversation(client_name="Jean Mukendi", phone="+243 99 876 5432", last_message="Merci pour la livraison rapide !", channel="whatsapp", assigned_to="IA Assistant", status="ai", wait_time_sec=0, messages_json=[{"from": "client", "text": "Merci pour la livraison rapide !", "at": now.isoformat()}], linked_orders=["ORD-8815"]),
            WhatsappConversation(client_name="Paul Tshisekedi", phone="+243 82 111 2233", last_message="Je veux un remboursement", channel="whatsapp", assigned_to="Marc D.", status="escalated", wait_time_sec=1860, messages_json=[{"from": "client", "text": "Je veux un remboursement", "at": now.isoformat()}], linked_tickets=["TK-2404"], internal_notes=["Escaladé niveau 2 — montant 12 000 CDF"]),
            WhatsappConversation(client_name="Alice B.", phone="+243 97 555 6677", last_message="Bonjour, je souhaite commander", channel="whatsapp", assigned_to=None, status="new", wait_time_sec=120, messages_json=[{"from": "client", "text": "Bonjour, je souhaite commander", "at": now.isoformat()}]),
            WhatsappConversation(client_name="David L.", phone="+243 85 444 3322", last_message="D'accord, j'attends", channel="whatsapp", assigned_to="Sophie M.", status="waiting_client", wait_time_sec=0, messages_json=[{"from": "agent", "text": "Pouvez-vous confirmer votre adresse ?", "at": now.isoformat()}]),
            WhatsappConversation(client_name="Claire N.", phone="+243 90 222 1188", last_message="Problème résolu, merci", channel="whatsapp", assigned_to="IA Assistant", status="resolved", wait_time_sec=0, messages_json=[{"from": "client", "text": "Problème résolu, merci", "at": now.isoformat()}]),
        ]
        for c in conversations:
            c.created_at = now - timedelta(minutes=conversations.index(c) * 15)
        self.db.add_all(conversations)

        templates = [
            WhatsappTemplate(name="order_confirmation", category="utility", language="fr", meta_status="approved", usage_count=8420, delivery_rate=98.2, body="Votre commande {{1}} est confirmée."),
            WhatsappTemplate(name="delivery_update", category="utility", language="fr", meta_status="approved", usage_count=6200, delivery_rate=97.5, body="Votre livraison arrive dans {{1}} minutes."),
            WhatsappTemplate(name="promo_weekend", category="marketing", language="fr", meta_status="approved", usage_count=4200, delivery_rate=94.1, body="Profitez de -20% ce week-end !"),
            WhatsappTemplate(name="otp_verification", category="authentication", language="fr", meta_status="approved", usage_count=3100, delivery_rate=99.1, body="Votre code : {{1}}"),
            WhatsappTemplate(name="loyalty_reward", category="marketing", language="fr", meta_status="pending", usage_count=0, delivery_rate=0, body="Félicitations ! Vous avez gagné {{1}} points."),
            WhatsappTemplate(name="reactivation_offer", category="marketing", language="fr", meta_status="rejected", usage_count=0, delivery_rate=0, body="Revenez chez nous avec -15%"),
        ]
        self.db.add_all(templates)

        campaigns = [
            WhatsappCampaign(name="Promo Week-End Kinshasa", campaign_type="promo", template_name="promo_weekend", audience="Clients actifs", status="active", sent=4200, delivered=4050, opened=2280, replies=840, clicks=420, conversions=168),
            WhatsappCampaign(name="Réactivation 30j", campaign_type="reactivation", template_name="reactivation_offer", audience="Clients dormants", status="active", sent=1800, delivered=1720, opened=620, replies=180, clicks=90, conversions=36),
            WhatsappCampaign(name="Fidélité VIP", campaign_type="loyalty", template_name="loyalty_reward", audience="VIP", status="paused", sent=420, delivered=410, opened=380, replies=120, clicks=60, conversions=42),
        ]
        self.db.add_all(campaigns)

        automations = [
            WhatsappAutomation(name="Bienvenue client", trigger_type="signup", status="active", runs_count=1240, success_rate=96.2, nodes_json=[{"type": "trigger"}, {"type": "whatsapp"}]),
            WhatsappAutomation(name="Rappel commande", trigger_type="order_pending", status="active", runs_count=3200, success_rate=94.8, nodes_json=[{"type": "trigger"}, {"type": "wait"}, {"type": "whatsapp"}]),
            WhatsappAutomation(name="Demande avis", trigger_type="delivery_completed", status="active", runs_count=2800, success_rate=92.1, nodes_json=[{"type": "trigger"}, {"type": "whatsapp"}]),
            WhatsappAutomation(name="Abandon panier", trigger_type="cart_abandoned", status="active", runs_count=840, success_rate=78.5, nodes_json=[{"type": "trigger"}, {"type": "condition"}, {"type": "whatsapp"}]),
        ]
        self.db.add_all(automations)

        notifications = [
            WhatsappNotification(event_type="order_created", template_name="order_confirmation", recipient="Marie K.", status="delivered"),
            WhatsappNotification(event_type="payment_success", template_name="order_confirmation", recipient="Jean P.", status="delivered"),
            WhatsappNotification(event_type="driver_assigned", template_name="delivery_update", recipient="Sophie M.", status="read"),
            WhatsappNotification(event_type="delivery_completed", template_name="delivery_update", recipient="Paul T.", status="delivered"),
            WhatsappNotification(event_type="refund_processed", template_name="order_confirmation", recipient="David L.", status="pending"),
            WhatsappNotification(event_type="review_request", template_name="delivery_update", recipient="Claire N.", status="failed"),
        ]
        for n in notifications:
            n.created_at = now - timedelta(hours=notifications.index(n) * 3)
        self.db.add_all(notifications)

        self.db.add(WhatsappWebhook(
            endpoint="https://api.laundryexpress.cd/webhooks/whatsapp",
            secret_masked="whsec_••••••••",
            last_call_at=now.isoformat(),
            success_count=84200, error_count=24, retry_count=6,
            events=["message_received", "message_sent", "template_status", "conversation_started", "conversation_closed"],
        ))

        self.db.add(WhatsappQuality(
            quality_rating="high", messaging_limit="10 000/jour", phone_status="connected",
            verification_status="verified",
            alerts_json=[
                {"type": "spam_risk", "severity": "medium", "message": "Taux de réponse marketing légèrement élevé"},
                {"type": "quality_drop", "severity": "low", "message": "Surveiller le template promo_weekend"},
            ],
        ))

        self.db.add(WhatsappCostSnapshot(
            period="current", total_today=42.80, total_week=285.40, total_month=1240.00,
            marketing_cost=18.20, utility_cost=19.40, auth_cost=5.20,
            cost_per_conversation=0.033, trend=5.3, forecast=1350.00,
            data_points={"day": [2.1, 2.8, 3.2, 4.1, 5.0, 5.8, 6.2], "week": [28, 32, 35, 38, 40, 42, 45], "month": [980, 1020, 1080, 1120, 1180, 1220, 1240]},
        ))

        self.db.add(WhatsappAiMetrics(
            ai_conversations_pct=72.0, human_escalations=186, ai_confidence=87.4,
            resolution_rate=68.2, resolved_without_human=924, cost_saved=4200.0, satisfaction=4.6,
            prompts_json={"system": "Assistant Laundry Express — support commandes et livraisons Kinshasa"},
        ))

        segments = [
            WhatsappSegment(slug="new_clients", name="Nouveaux clients", size=4200, engagement=62.0, conversion=18.0),
            WhatsappSegment(slug="active_clients", name="Clients actifs", size=12800, engagement=84.0, conversion=42.0),
            WhatsappSegment(slug="dormant_clients", name="Clients dormants", size=6400, engagement=12.0, conversion=4.0),
            WhatsappSegment(slug="vip", name="VIP", size=840, engagement=92.0, conversion=68.0),
            WhatsappSegment(slug="partners", name="Partenaires", size=320, engagement=78.0, conversion=55.0),
            WhatsappSegment(slug="drivers", name="Chauffeurs", size=180, engagement=88.0, conversion=0.0),
        ]
        self.db.add_all(segments)
        self.db.commit()

    @staticmethod
    def conv_status_label(st: str) -> str:
        return CONV_STATUS.get(st, st)

    @staticmethod
    def meta_status_label(st: str) -> str:
        return META_STATUS.get(st, st)

    @staticmethod
    def category_label(cat: str) -> str:
        return CAT_LABELS.get(cat, cat)

    @staticmethod
    def event_label(ev: str) -> str:
        return EVENT_LABELS.get(ev, ev)

    @staticmethod
    def notif_status_label(st: str) -> str:
        return NOTIF_STATUS.get(st, st)

    @staticmethod
    def camp_type_label(t: str) -> str:
        return CAMP_TYPES.get(t, t)

    @staticmethod
    def wait_label(sec: int) -> str:
        if sec < 60:
            return f"{sec}s"
        if sec < 3600:
            return f"{sec // 60} min"
        return f"{sec // 3600}h {(sec % 3600) // 60}min"

    @staticmethod
    def quality_label(r: str) -> str:
        return {"high": "High", "medium": "Medium", "low": "Low", "flagged": "Flagged"}.get(r, r)
