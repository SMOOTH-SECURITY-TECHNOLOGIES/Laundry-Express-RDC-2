from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.email_ops import (
    EmailAlert, EmailAutomation, EmailBounce, EmailCampaign, EmailDeliverability,
    EmailInvoiceLog, EmailMessage, EmailSettings, EmailTemplate, EmailUnsubscribe, EmailWebhook,
)

TYPE_LABELS = {
    "transactional": "Transactionnel", "marketing": "Marketing", "invoice": "Facture",
    "support": "Support", "notification": "Notification", "security": "Sécurité",
}
STATUS_LABELS = {
    "sent": "Envoyé", "delivered": "Livré", "opened": "Ouvert", "clicked": "Cliqué",
    "bounce": "Bounce", "failed": "Échec", "unsubscribed": "Désabonné",
}
CAMP_STATUS = {"draft": "Brouillon", "scheduled": "Programmé", "sending": "Envoi", "completed": "Terminé", "paused": "Pause", "active": "Actif"}
TEMPLATE_TYPE = {"transactional": "Transactionnel", "marketing": "Marketing", "invoice": "Facture", "support": "Support", "notification": "Notification", "security": "Sécurité"}
BOUNCE_TYPE = {"hard_bounce": "Hard bounce", "soft_bounce": "Soft bounce", "spam_complaint": "Spam complaint", "blocked": "Blocked", "invalid_mailbox": "Invalid mailbox"}
HEALTH = {"healthy": "Healthy", "warning": "Warning", "critical": "Critical"}
UNSUB_TYPE = {"marketing": "Marketing", "campaign": "Campagne", "all": "Tous"}


class EmailOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(EmailTemplate).count() > 0:
            return
        now = datetime.now(timezone.utc).isoformat()

        templates = [
            EmailTemplate(name="confirmation_commande", template_type="transactional", subject="Confirmation commande {{order_id}}", body_html="<p>Bonjour {{customer_name}}, votre commande est confirmée.</p>", usage_count=28400, open_rate=62.4, click_rate=18.2),
            EmailTemplate(name="paiement_reussi", template_type="transactional", subject="Paiement reçu — {{amount}}", usage_count=18200, open_rate=58.1, click_rate=12.4),
            EmailTemplate(name="facture_client", template_type="invoice", subject="Facture {{invoice_url}}", usage_count=12400, open_rate=71.2, click_rate=42.8),
            EmailTemplate(name="remboursement_traite", template_type="transactional", subject="Remboursement traité", usage_count=4200, open_rate=54.0, click_rate=8.1),
            EmailTemplate(name="chauffeur_assigne", template_type="notification", subject="Chauffeur en route", usage_count=9800, open_rate=48.2, click_rate=22.1),
            EmailTemplate(name="commande_terminee", template_type="transactional", subject="Commande livrée", usage_count=14200, open_rate=52.8, click_rate=14.6),
            EmailTemplate(name="demande_avis", template_type="marketing", subject="Votre avis compte", usage_count=8400, open_rate=38.4, click_rate=9.2),
            EmailTemplate(name="bienvenue_client", template_type="marketing", subject="Bienvenue chez Laundry Express", usage_count=6200, open_rate=44.1, click_rate=11.8),
            EmailTemplate(name="relance_paiement", template_type="transactional", subject="Finalisez votre paiement", usage_count=3800, open_rate=41.2, click_rate=16.4),
            EmailTemplate(name="newsletter", template_type="marketing", subject="Actualités Laundry Express", usage_count=12400, open_rate=32.8, click_rate=6.4),
            EmailTemplate(name="promotion", template_type="marketing", subject="Offre spéciale -20%", usage_count=9200, open_rate=28.4, click_rate=8.8),
            EmailTemplate(name="securite_compte", template_type="security", subject="Alerte sécurité compte", usage_count=2100, open_rate=72.4, click_rate=24.2),
        ]
        self.db.add_all(templates)

        campaigns = [
            EmailCampaign(name="Promo Week-End Kinshasa", audience="Clients actifs", status="completed", sent_count=12400, opened_count=4760, clicked_count=1140, conversions=420, revenue=8400, roi=4.2),
            EmailCampaign(name="Réactivation 30j", audience="Clients inactifs", status="sending", sent_count=6200, opened_count=1860, clicked_count=420, conversions=84, revenue=1680, roi=2.8),
            EmailCampaign(name="Newsletter Juin", audience="Tous les clients", status="scheduled", sent_count=0, scheduled_at=now),
        ]
        self.db.add_all(campaigns)

        automations = [
            EmailAutomation(name="Bienvenue nouveau client", trigger_key="signup", template_name="bienvenue_client", status="active", volume_30d=1240, open_rate=44.1, click_rate=11.8),
            EmailAutomation(name="Confirmation commande", trigger_key="order_created", template_name="confirmation_commande", status="active", volume_30d=4200, open_rate=62.4, click_rate=18.2),
            EmailAutomation(name="Relance paiement échoué", trigger_key="payment_failed", template_name="relance_paiement", status="active", volume_30d=840, open_rate=41.2, click_rate=16.4),
            EmailAutomation(name="Demande avis après livraison", trigger_key="delivery_completed", template_name="demande_avis", status="active", volume_30d=2800, open_rate=38.4, click_rate=9.2),
            EmailAutomation(name="Client inactif 30j", trigger_key="inactive_30d", template_name="promotion", status="active", volume_30d=620, open_rate=28.4, click_rate=8.8),
        ]
        self.db.add_all(automations)

        messages = [
            EmailMessage(reference="EML-88421", recipient_email="marie.k@email.com", recipient_name="Marie K.", subject="Confirmation commande ORD-8821", message_type="transactional", template_name="confirmation_commande", status="opened", open_rate=100, click_rate=0, domain="gmail.com", sent_at=now, provider_message_id="re_88421"),
            EmailMessage(reference="EML-88420", recipient_email="jean.p@yahoo.com", recipient_name="Jean P.", subject="Facture INV-2401", message_type="invoice", template_name="facture_client", status="clicked", open_rate=100, click_rate=100, domain="yahoo.com", sent_at=now, provider_message_id="re_88420"),
            EmailMessage(reference="EML-88419", recipient_email="sophie.m@outlook.com", recipient_name="Sophie M.", subject="Promo Week-End", message_type="marketing", template_name="promotion", status="delivered", open_rate=0, click_rate=0, domain="outlook.com", sent_at=now),
            EmailMessage(reference="EML-88418", recipient_email="invalid@badomain.xyz", recipient_name="Paul T.", subject="Newsletter", message_type="marketing", template_name="newsletter", status="bounce", domain="badomain.xyz", sent_at=now),
            EmailMessage(reference="EML-88417", recipient_email="alice.b@gmail.com", recipient_name="Alice B.", subject="Chauffeur assigné", message_type="notification", template_name="chauffeur_assigne", status="clicked", open_rate=100, click_rate=100, domain="gmail.com", sent_at=now),
            EmailMessage(reference="EML-88416", recipient_email="david.l@email.com", recipient_name="David L.", subject="Alerte sécurité", message_type="security", template_name="securite_compte", status="opened", open_rate=100, click_rate=50, domain="email.com", sent_at=now),
        ]
        self.db.add_all(messages)

        self.db.add_all([
            EmailBounce(email="invalid@badomain.xyz", bounce_type="hard_bounce", reason="Domain not found", provider_code="550", occurred_at=now),
            EmailBounce(email="spam@test.com", bounce_type="spam_complaint", reason="User marked as spam", provider_code="complaint", occurred_at=now),
            EmailBounce(email="full@mailbox.com", bounce_type="soft_bounce", reason="Mailbox full", provider_code="452", occurred_at=now),
        ])

        self.db.add_all([
            EmailUnsubscribe(email="optout@email.com", unsubscribe_type="marketing", reason="Trop de promotions"),
            EmailUnsubscribe(email="user@yahoo.com", unsubscribe_type="campaign", reason="Campagne non pertinente"),
        ])

        self.db.add_all([
            EmailInvoiceLog(invoice_ref="INV-2401", recipient_email="jean.p@yahoo.com", status="opened", opened=True, downloaded=True),
            EmailInvoiceLog(invoice_ref="INV-2402", recipient_email="partner@pressing.cd", status="sent", opened=False, downloaded=False, reminder_count=1),
            EmailInvoiceLog(invoice_ref="INV-2403", recipient_email="failed@badomain.xyz", status="failed", opened=False, downloaded=False),
        ])

        self.db.add_all([
            EmailDeliverability(domain="laundryexpress.cd", health_status="healthy", bounce_rate=0.8, spam_complaints=0.02, reputation_score=96.2, delivery_rate=99.4, open_rate=38.4, click_rate=9.2),
            EmailDeliverability(domain="mail.laundryexpress.cd", health_status="warning", bounce_rate=2.1, spam_complaints=0.08, reputation_score=82.4, delivery_rate=97.2, open_rate=32.1, click_rate=7.4),
            EmailDeliverability(domain="notifications.laundryexpress.cd", health_status="healthy", bounce_rate=0.4, spam_complaints=0.01, reputation_score=98.1, delivery_rate=99.8, open_rate=42.8, click_rate=11.2),
        ])

        self.db.add_all([
            EmailAlert(alert_type="high_bounce", title="Taux de bounce élevé", severity="high", count=3),
            EmailAlert(alert_type="webhook_error", title="Webhook en erreur", severity="critical", count=1),
            EmailAlert(alert_type="domain_warning", title="Domaine dégradé", severity="medium", count=1),
            EmailAlert(alert_type="invoice_failure", title="Échecs envoi factures", severity="medium", count=2),
        ])

        self.db.add(EmailWebhook(
            endpoint="https://api.laundryexpress.cd/webhooks/email/resend",
            secret_masked="whsec_email_••••",
            last_call_at=now, success_count=542180, error_count=12,
            events=["email.sent", "email.delivered", "email.opened", "email.clicked", "email.bounced", "email.complained", "email.unsubscribed"],
        ))

        self.db.add(EmailSettings(key="global", value_json={
            "provider": "resend", "from_email": "noreply@laundryexpress.cd",
            "reply_to": "support@laundryexpress.cd", "marketing_opt_out_required": True,
        }))
        self.db.commit()

    @staticmethod
    def type_label(t: str) -> str:
        return TYPE_LABELS.get(t, t)

    @staticmethod
    def status_label(s: str) -> str:
        return STATUS_LABELS.get(s, s)

    @staticmethod
    def camp_status_label(s: str) -> str:
        return CAMP_STATUS.get(s, s)

    @staticmethod
    def template_type_label(t: str) -> str:
        return TEMPLATE_TYPE.get(t, t)

    @staticmethod
    def bounce_type_label(t: str) -> str:
        return BOUNCE_TYPE.get(t, t)

    @staticmethod
    def health_label(h: str) -> str:
        return HEALTH.get(h, h)

    @staticmethod
    def unsub_type_label(t: str) -> str:
        return UNSUB_TYPE.get(t, t)
