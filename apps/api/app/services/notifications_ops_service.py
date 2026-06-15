from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification_ops import (
    NotificationOpsActivity, NotificationOpsAutomation, NotificationOpsError,
    NotificationOpsItem, NotificationOpsProviderHealth, NotificationOpsSegment,
    NotificationOpsTemplate, NotificationOpsUnsubscribe,
)

CHANNEL_LABELS = {"push": "Push", "whatsapp": "WhatsApp", "sms": "SMS", "email": "Email"}
STATUS_LABELS = {
    "delivered": "Livré", "pending": "En attente", "failed": "Échoué",
    "opened": "Ouvert", "clicked": "Cliqué", "unsubscribed": "Désabonné",
}
EVENT_LABELS = {
    "confirmation_commande": "Confirmation commande",
    "chauffeur_affecte": "Affectation chauffeur",
    "mission_demarree": "Mise à jour mission",
    "paiement_reussi": "Paiement réussi",
    "demande_avis": "Demande avis",
    "promotion": "Promotion",
    "abonnement_renouvele": "Abonnement renouvelé",
    "nouveau_partenaire": "Nouveau partenaire",
    "newsletter": "Newsletter hebdo",
}


class NotificationsOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(NotificationOpsItem).count() > 0:
            return
        now = datetime.now(timezone.utc)
        templates = [
            NotificationOpsTemplate(name="Confirmation commande", channel="push", event_type="confirmation_commande", body="Votre commande {{order_id}} est confirmée.", usage_count=58420, delivery_rate=99.2, open_rate=45.0),
            NotificationOpsTemplate(name="Prospects chauffeur", channel="whatsapp", event_type="nouveau_partenaire", body="Bienvenue sur Laundry Express.", usage_count=12450, delivery_rate=97.8, open_rate=62.0),
            NotificationOpsTemplate(name="Partenaires réseau", channel="email", event_type="nouveau_partenaire", subject="Nouveau partenaire", body="Un partenaire a rejoint le réseau.", usage_count=8920, delivery_rate=98.5, open_rate=34.0),
            NotificationOpsTemplate(name="Abonnés newsletter", channel="email", event_type="newsletter", subject="Newsletter hebdo", body="Les actualités de la semaine.", usage_count=15680, delivery_rate=97.1, open_rate=28.5),
            NotificationOpsTemplate(name="Inactifs 30j", channel="sms", event_type="promotion", body="Revenez sur Laundry Express — promo -15%.", usage_count=4320, delivery_rate=96.4, open_rate=None),
        ]
        self.db.add_all(templates)
        self.db.flush()

        items = [
            NotificationOpsItem(title="Votre commande #CMD-84431 est confirmée", message_preview="Commande confirmée, collecte prévue à 14h.", channel="push", event_type="confirmation_commande", audience="Clients", status="delivered", delivery_rate=100, sent_at=now - timedelta(hours=2), zone="Gombe", template_id=templates[0].id),
            NotificationOpsItem(title="Chauffeur affecté — mission #MIS-2201", message_preview="Jean K. arrive dans 25 min.", channel="whatsapp", event_type="chauffeur_affecte", audience="Clients", status="delivered", delivery_rate=99.2, sent_at=now - timedelta(hours=5), zone="Limete"),
            NotificationOpsItem(title="Paiement reçu — 45 000 CDF", message_preview="Merci pour votre paiement Mobile Money.", channel="sms", event_type="paiement_reussi", audience="Clients", status="delivered", delivery_rate=98.7, sent_at=now - timedelta(hours=8), zone="Bandal"),
            NotificationOpsItem(title="Promotion spéciale — -20% ce week-end", message_preview="Profitez de -20% sur le pressing.", channel="email", event_type="promotion", audience="Clients actifs", status="opened", delivery_rate=97.5, open_rate=32.4, click_rate=8.6, sent_at=now - timedelta(days=1), zone="Kinshasa"),
            NotificationOpsItem(title="Demande d'avis après mission", message_preview="Comment s'est passée votre livraison ?", channel="push", event_type="demande_avis", audience="Clients", status="clicked", delivery_rate=99.0, open_rate=41.0, click_rate=12.3, sent_at=now - timedelta(days=1, hours=3)),
            NotificationOpsItem(title="Rappel mission non démarrée", message_preview="Mission #MIS-2198 en attente.", channel="push", event_type="mission_demarree", audience="Chauffeurs", status="pending", delivery_rate=0, sent_at=now - timedelta(minutes=30)),
            NotificationOpsItem(title="Échec envoi SMS — numéro invalide", message_preview="Impossible de joindre +243...", channel="sms", event_type="confirmation_commande", audience="Clients", status="failed", delivery_rate=0, sent_at=now - timedelta(hours=1)),
            NotificationOpsItem(title="Newsletter hebdo — Juin 2026", message_preview="Tendances marketplace Kinshasa.", channel="email", event_type="newsletter", audience="Abonnés newsletter", status="delivered", delivery_rate=98.1, open_rate=31.2, sent_at=now - timedelta(days=2), template_id=templates[3].id),
        ]
        self.db.add_all(items)

        automations = [
            NotificationOpsAutomation(name="Rappel mission non démarrée", trigger_key="mission_not_started", channel="push", status="active", last_run_at=now - timedelta(hours=1)),
            NotificationOpsAutomation(name="Relance paiement échoué", trigger_key="payment_failed", channel="sms", status="active", last_run_at=now - timedelta(hours=4)),
            NotificationOpsAutomation(name="Demande avis après mission", trigger_key="mission_completed", channel="push", status="active", last_run_at=now - timedelta(hours=6)),
            NotificationOpsAutomation(name="Abandon panier", trigger_key="cart_abandoned", channel="email", status="active", last_run_at=now - timedelta(days=1)),
            NotificationOpsAutomation(name="Bienvenue nouveau client", trigger_key="user_registered", channel="whatsapp", status="paused", last_run_at=now - timedelta(days=3)),
        ]
        self.db.add_all(automations)

        segments = [
            NotificationOpsSegment(name="Clients dormants 30j", slug="dormant-30d", size=2840, preferred_channel="email", engagement_rate=4.2),
            NotificationOpsSegment(name="VIP", slug="vip", size=420, preferred_channel="whatsapp", engagement_rate=68.5),
            NotificationOpsSegment(name="Fort panier", slug="high-basket", size=890, preferred_channel="push", engagement_rate=42.1),
            NotificationOpsSegment(name="Nouveaux clients", slug="new-clients", size=1560, preferred_channel="whatsapp", engagement_rate=55.0),
            NotificationOpsSegment(name="Partenaires actifs", slug="active-partners", size=128, preferred_channel="email", engagement_rate=72.3),
        ]
        self.db.add_all(segments)

        errors = [
            NotificationOpsError(channel="whatsapp", provider="Meta Cloud API", error_code="131047", message="Numéro non enregistré sur WhatsApp", occurrences=342, last_occurrence_at=now - timedelta(hours=2)),
            NotificationOpsError(channel="sms", provider="Orange RDC", error_code="INVALID_MSISDN", message="Numéro invalide", occurrences=218, last_occurrence_at=now - timedelta(hours=5)),
            NotificationOpsError(channel="email", provider="Resend", error_code="bounce_hard", message="Adresse email inexistante", occurrences=156, last_occurrence_at=now - timedelta(days=1)),
            NotificationOpsError(channel="push", provider="Firebase FCM", error_code="UNREGISTERED", message="Token push expiré", occurrences=532, last_occurrence_at=now - timedelta(minutes=45)),
        ]
        self.db.add_all(errors)

        unsubscribes = [
            NotificationOpsUnsubscribe(channel="email", user_email="client1@example.com", reason="Trop de messages", unsubscribed_at=now - timedelta(days=2)),
            NotificationOpsUnsubscribe(channel="sms", user_phone="+243810000001", reason="Opt-out SMS", unsubscribed_at=now - timedelta(days=5)),
            NotificationOpsUnsubscribe(channel="whatsapp", user_phone="+243820000002", reason="Opt-out WhatsApp", unsubscribed_at=now - timedelta(days=1)),
        ]
        self.db.add_all(unsubscribes)

        health = [
            NotificationOpsProviderHealth(channel="push", provider="Firebase FCM", delivery_rate=99.1, latency_ms=180, error_count=532, status="healthy"),
            NotificationOpsProviderHealth(channel="whatsapp", provider="Meta Cloud API", delivery_rate=96.8, latency_ms=420, error_count=342, status="degraded", last_incident_at=now - timedelta(hours=3)),
            NotificationOpsProviderHealth(channel="sms", provider="Orange RDC", delivery_rate=97.5, latency_ms=890, error_count=218, status="healthy"),
            NotificationOpsProviderHealth(channel="email", provider="Resend", delivery_rate=98.9, latency_ms=310, error_count=156, status="healthy"),
        ]
        self.db.add_all(health)

        activities = [
            NotificationOpsActivity(activity_type="sent", message="Notification 'Promotion spéciale' envoyée à 12 450 destinataires", actor_name="Jean Admin", metadata_json={"channel": "email"}),
            NotificationOpsActivity(activity_type="template_updated", message="Template 'Paiement réussi' modifié", actor_name="Jean Admin"),
            NotificationOpsActivity(activity_type="scheduled", message="Campagne 'Newsletter Juin' planifiée pour demain 09:00", actor_name="Système"),
            NotificationOpsActivity(activity_type="segment_updated", message="Segment 'VIP' mis à jour — 420 contacts", actor_name="Jean Admin"),
            NotificationOpsActivity(activity_type="error", message="Échec détecté sur canal WhatsApp — 12 envois", actor_name="Système"),
        ]
        self.db.add_all(activities)
        self.db.commit()

    def create_notification(self, data: dict, user_id: UUID) -> NotificationOpsItem:
        item = NotificationOpsItem(
            title=data["title"],
            message_preview=data.get("message", "")[:512],
            channel=data["channel"],
            event_type=data.get("event_type", "promotion"),
            audience=data.get("audience", "Tous les clients"),
            status="pending" if data.get("schedule_at") else "delivered",
            delivery_rate=100.0 if not data.get("schedule_at") else 0,
            sent_at=datetime.now(timezone.utc),
            metadata_json={"created_by": str(user_id)},
        )
        self.db.add(item)
        self.db.commit()
        return item

    def retry_notification(self, notification_id: UUID) -> NotificationOpsItem | None:
        item = self.db.query(NotificationOpsItem).filter(NotificationOpsItem.id == notification_id).first()
        if not item:
            return None
        item.status = "delivered"
        item.delivery_rate = 98.5
        item.sent_at = datetime.now(timezone.utc)
        self.db.commit()
        return item

    def create_template(self, data: dict) -> NotificationOpsTemplate:
        tpl = NotificationOpsTemplate(
            name=data["name"], channel=data["channel"], event_type=data["event_type"],
            language=data.get("language", "fr"), subject=data.get("subject"),
            body=data.get("body", ""), status="active",
        )
        self.db.add(tpl)
        self.db.commit()
        return tpl

    def update_template(self, template_id: UUID, data: dict) -> NotificationOpsTemplate | None:
        tpl = self.db.query(NotificationOpsTemplate).filter(NotificationOpsTemplate.id == template_id).first()
        if not tpl:
            return None
        for k, v in data.items():
            if v is not None and hasattr(tpl, k):
                setattr(tpl, k, v)
        self.db.commit()
        return tpl

    def archive_template(self, template_id: UUID) -> bool:
        tpl = self.db.query(NotificationOpsTemplate).filter(NotificationOpsTemplate.id == template_id).first()
        if not tpl:
            return False
        tpl.status = "archived"
        tpl.is_active = False
        self.db.commit()
        return True

    def patch_automation(self, automation_id: UUID, data: dict) -> NotificationOpsAutomation | None:
        auto = self.db.query(NotificationOpsAutomation).filter(NotificationOpsAutomation.id == automation_id).first()
        if not auto:
            return None
        if data.get("status"):
            auto.status = data["status"]
        if data.get("name"):
            auto.name = data["name"]
        self.db.commit()
        return auto

    @staticmethod
    def channel_label(ch: str) -> str:
        return CHANNEL_LABELS.get(ch, ch)

    @staticmethod
    def status_label(st: str) -> str:
        return STATUS_LABELS.get(st, st)

    @staticmethod
    def event_label(ev: str) -> str:
        return EVENT_LABELS.get(ev, ev.replace("_", " ").title())
