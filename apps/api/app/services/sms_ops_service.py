from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.sms_ops import (
    SmsAlert, SmsCampaign, SmsCreditLedger, SmsLog, SmsMessage, SmsOtpRecord,
    SmsProvider, SmsSender, SmsSettings, SmsTemplate, SmsWebhook,
)

MSG_TYPE = {"transaction": "Transactionnel", "otp": "OTP", "marketing": "Marketing", "notification": "Notification"}
MSG_STATUS = {"pending": "En attente", "queued": "En file", "sent": "Envoyé", "delivered": "Livré", "failed": "Échoué"}
CAMP_STATUS = {"draft": "Brouillon", "scheduled": "Planifiée", "sending": "En cours", "completed": "Terminée", "cancelled": "Annulée", "active": "Active"}
CAMP_TYPE = {"marketing": "Marketing", "notification": "Notification"}
CAT_LABEL = {"otp": "OTP", "transaction": "Transaction", "reminder": "Rappel", "marketing": "Marketing", "notification": "Notification"}
APPROVAL = {"approved": "Approuvé", "pending": "En attente", "rejected": "Refusé"}
OTP_STATUS = {"pending": "En attente", "validated": "Validé", "expired": "Expiré", "failed": "Échoué"}
MOVEMENT = {"recharge": "Recharge", "usage": "Consommation", "adjustment": "Ajustement"}
OPERATOR_COLORS = {"airtel": "#EF4444", "orange": "#F97316", "vodacom": "#DC2626", "africell": "#8B5CF6", "onafriq": "#3B82F6", "twilio": "#22C55E", "other": "#6B7280"}


class SmsOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(SmsProvider).count() > 0:
            return
        now = datetime.now(timezone.utc)

        providers = [
            SmsProvider(slug="airtel", name="Airtel RDC", provider_type="airtel", delivery_rate=98.2, cost_per_sms=0.019, avg_delivery_ms=2800),
            SmsProvider(slug="orange", name="Orange RDC", provider_type="orange", delivery_rate=97.5, cost_per_sms=0.020, avg_delivery_ms=3100),
            SmsProvider(slug="vodacom", name="Vodacom RDC", provider_type="vodacom", delivery_rate=96.8, cost_per_sms=0.021, avg_delivery_ms=3400),
            SmsProvider(slug="africell", name="Africell RDC", provider_type="africell", delivery_rate=95.4, cost_per_sms=0.022, avg_delivery_ms=3600),
            SmsProvider(slug="onafriq", name="Onafriq", provider_type="onafriq", delivery_rate=97.0, cost_per_sms=0.020, avg_delivery_ms=2900),
            SmsProvider(slug="twilio", name="Twilio (fallback)", provider_type="twilio", delivery_rate=99.1, cost_per_sms=0.035, avg_delivery_ms=2200),
        ]
        self.db.add_all(providers)
        self.db.flush()

        senders = [
            SmsSender(name="LAUNDRY", sender_id="LAUNDRY", approved=True, active=True, approval_status="approved", volume=84200, delivery_rate=98.1),
            SmsSender(name="OTP", sender_id="OTP", approved=True, active=True, approval_status="approved", volume=42000, delivery_rate=99.2),
            SmsSender(name="SERVICE", sender_id="SERVICE", approved=True, active=True, approval_status="approved", volume=28000, delivery_rate=97.5),
            SmsSender(name="PROMO", sender_id="PROMO", approved=True, active=True, approval_status="approved", volume=12400, delivery_rate=94.8),
            SmsSender(name="ALERT", sender_id="ALERT", approved=False, active=False, approval_status="pending", volume=0, delivery_rate=0),
        ]
        self.db.add_all(senders)
        self.db.flush()

        templates = [
            SmsTemplate(name="OTP Code", category="otp", content="Votre code Laundry Express : {{otp_code}}. Valide 5 min.", usage_count=42000, delivery_rate=99.1),
            SmsTemplate(name="Confirmation Commande", category="transaction", content="Commande {{order_id}} confirmée. Montant : {{amount}} CDF.", usage_count=28000, delivery_rate=98.2),
            SmsTemplate(name="Livraison en cours", category="transaction", content="Votre commande {{order_id}} est en livraison.", usage_count=18200, delivery_rate=97.8),
            SmsTemplate(name="Rappel paiement", category="reminder", content="Bonjour {{name}}, finalisez le paiement de {{amount}} CDF.", usage_count=8400, delivery_rate=96.5),
            SmsTemplate(name="Promo Week-End", category="marketing", content="-20% ce week-end chez {{partner}} !", usage_count=6200, delivery_rate=94.2),
        ]
        self.db.add_all(templates)
        self.db.flush()

        campaigns = [
            SmsCampaign(name="Promo Kinshasa", campaign_type="marketing", status="active", message="Profitez de -20%", target_count=4200, sent_count=4200, delivered_count=4100, failed_count=100, reply_count=420, audience="Clients actifs Kinshasa"),
            SmsCampaign(name="Réactivation 30j", campaign_type="marketing", status="completed", message="Revenez chez nous", target_count=1800, sent_count=1800, delivered_count=1750, failed_count=50, reply_count=180, audience="Clients dormants"),
            SmsCampaign(name="Alerte livraison", campaign_type="notification", status="sending", message="Votre livraison arrive", target_count=840, sent_count=620, delivered_count=600, failed_count=20, reply_count=0, audience="Commandes du jour"),
            SmsCampaign(name="OTP batch", campaign_type="notification", status="scheduled", message="Code OTP", target_count=0, scheduled_at=now + timedelta(days=1), audience="Nouveaux inscrits"),
        ]
        self.db.add_all(campaigns)

        messages = [
            SmsMessage(reference="SMS-88421", recipient_name="Marie K.", phone_number="+243812345678", sender_name="LAUNDRY", message_type="transaction", status="delivered", operator_slug="airtel", cost=0.019, message="Commande ORD-8821 confirmée.", provider_message_id="AT-88421"),
            SmsMessage(reference="SMS-88420", recipient_name="Jean P.", phone_number="+243998765432", sender_name="OTP", message_type="otp", status="delivered", operator_slug="orange", cost=0.020, message="Code: 482910", provider_message_id="OR-88420"),
            SmsMessage(reference="SMS-88419", recipient_name="Sophie M.", phone_number="+243821112233", sender_name="SERVICE", message_type="notification", status="delivered", operator_slug="vodacom", cost=0.021, message="Chauffeur assigné.", provider_message_id="VD-88419"),
            SmsMessage(reference="SMS-88418", recipient_name="Paul T.", phone_number="+243975556677", sender_name="PROMO", message_type="marketing", status="failed", operator_slug="africell", cost=0.022, message="Promo -20%", provider_message_id=None),
            SmsMessage(reference="SMS-88417", recipient_name="Alice B.", phone_number="+243854443322", sender_name="LAUNDRY", message_type="transaction", status="sent", operator_slug="onafriq", cost=0.020, message="Livraison terminée.", provider_message_id="ON-88417"),
            SmsMessage(reference="SMS-88416", recipient_name="David L.", phone_number="+243902221188", sender_name="OTP", message_type="otp", status="delivered", operator_slug="twilio", cost=0.035, message="Code: 739201", provider_message_id="TW-88416"),
        ]
        for i, m in enumerate(messages):
            m.sent_at = now - timedelta(minutes=i * 12)
            if m.status == "delivered":
                m.delivered_at = m.sent_at + timedelta(seconds=30)
        self.db.add_all(messages)
        self.db.flush()

        self.db.add_all([
            SmsCreditLedger(provider_slug="onafriq", movement_type="recharge", amount=50000, balance_after=125680, note="Recharge mensuelle"),
            SmsCreditLedger(provider_slug="onafriq", movement_type="usage", amount=-24580, balance_after=101100, note="Consommation jour"),
            SmsCreditLedger(provider_slug="onafriq", movement_type="adjustment", amount=500, balance_after=125680, note="Ajustement crédit promo"),
        ])

        otps = [
            SmsOtpRecord(phone_number="+243812345678", code_masked="****10", status="validated", expires_at=now + timedelta(minutes=5), validated_at=now - timedelta(minutes=2)),
            SmsOtpRecord(phone_number="+243998765432", code_masked="****20", status="pending", expires_at=now + timedelta(minutes=3)),
            SmsOtpRecord(phone_number="+243821112233", code_masked="****33", status="expired", expires_at=now - timedelta(minutes=10)),
        ]
        self.db.add_all(otps)

        alerts = [
            SmsAlert(alert_type="high_failures", title="Échecs en hausse", severity="high", count=12),
            SmsAlert(alert_type="low_credits", title="Crédits faibles", severity="medium", count=2),
            SmsAlert(alert_type="slow_delivery", title="Délai de livraison élevé", severity="medium", count=3),
            SmsAlert(alert_type="webhook_error", title="Webhook en erreur", severity="critical", count=5),
            SmsAlert(alert_type="degraded_operator", title="Opérateur dégradé — Africell", severity="high", count=1),
        ]
        self.db.add_all(alerts)

        self.db.add(SmsWebhook(
            endpoint="https://api.laundryexpress.cd/webhooks/sms/provider",
            secret_masked="sms_whsec_••••",
            last_call_at=now, success_count=84200, error_count=18, consecutive_errors=0,
        ))

        for ref, m in zip(["SMS-88421", "SMS-88420", "SMS-88418"], messages[:3]):
            self.db.add(SmsLog(
                reference=ref, phone_number=m.phone_number, event_type="send",
                request_json={"to": m.phone_number, "from": m.sender_name},
                response_json={"status": m.status, "provider_id": m.provider_message_id},
                provider_id=m.provider_message_id, status=m.status,
            ))

        self.db.add(SmsSettings(key="global", value_json={
            "auto_recharge": True, "alert_threshold": 500, "default_sender": "LAUNDRY",
            "providers": ["onafriq", "orange", "airtel", "vodacom", "africell", "twilio"],
        }))
        self.db.commit()

    @staticmethod
    def msg_type_label(t: str) -> str:
        return MSG_TYPE.get(t, t)

    @staticmethod
    def msg_status_label(s: str) -> str:
        return MSG_STATUS.get(s, s)

    @staticmethod
    def camp_status_label(s: str) -> str:
        return CAMP_STATUS.get(s, s)

    @staticmethod
    def camp_type_label(t: str) -> str:
        return CAMP_TYPE.get(t, t)

    @staticmethod
    def cat_label(c: str) -> str:
        return CAT_LABEL.get(c, c)

    @staticmethod
    def approval_label(s: str) -> str:
        return APPROVAL.get(s, s)

    @staticmethod
    def otp_status_label(s: str) -> str:
        return OTP_STATUS.get(s, s)

    @staticmethod
    def movement_label(m: str) -> str:
        return MOVEMENT.get(m, m)

    @staticmethod
    def operator_color(slug: str) -> str:
        return OPERATOR_COLORS.get(slug, OPERATOR_COLORS["other"])
