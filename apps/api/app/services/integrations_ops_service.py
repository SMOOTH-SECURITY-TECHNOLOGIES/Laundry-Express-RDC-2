from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.integrations_ops import (
    IntegrationsAlert,
    IntegrationsApiKey,
    IntegrationsApiLog,
    IntegrationsHealth,
    IntegrationsTrackingConfig,
    IntegrationsWebhook,
    IntegrationsWebhookDelivery,
)

KEY_TYPE = {"internal": "Internal", "partner": "Partner", "public": "Public", "admin": "Admin"}
KEY_STATUS = {"active": "Actif", "disabled": "Désactivé", "revoked": "Révoqué", "expired": "Expiré"}
WEBHOOK_STATUS = {"active": "Actif", "disabled": "Désactivé", "error": "Erreur"}
HEALTH = {"healthy": "Healthy", "warning": "Warning", "error": "Error", "critical": "Critical"}
EVENT_LABELS: dict[str, str] = {
    "orders.created": "Commande créée", "orders.updated": "Commande mise à jour",
    "orders.completed": "Commande terminée", "orders.cancelled": "Commande annulée",
    "payments.created": "Paiement créé", "payments.success": "Paiement réussi",
    "payments.failed": "Paiement échoué", "refunds.created": "Remboursement créé",
    "refunds.completed": "Remboursement terminé", "driver.assigned": "Chauffeur assigné",
    "driver.arrived": "Chauffeur arrivé", "ticket.created": "Ticket créé",
    "ticket.updated": "Ticket mis à jour", "review.created": "Avis créé",
    "notification.sent": "Notification envoyée",
}


class IntegrationsOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(IntegrationsApiKey).count() > 0:
            return
        now = datetime.now(timezone.utc).isoformat()

        keys = [
            IntegrationsApiKey(name="Production API", key_hash="le_live_••••••••", key_type="internal", scope="orders.read,orders.write,payments.read", status="active", created_by="Admin System", last_used_at=now),
            IntegrationsApiKey(name="Partner Pressing Kin", key_hash="le_partner_••••", key_type="partner", scope="orders.read,logistics.read", status="active", created_by="Jean M.", last_used_at=now),
            IntegrationsApiKey(name="Mobile App Public", key_hash="le_pub_••••••••", key_type="public", scope="orders.read,users.read", status="active", created_by="Dev Team", last_used_at=now),
            IntegrationsApiKey(name="Analytics Reader", key_hash="le_analytics_••••", key_type="internal", scope="analytics.read", status="active", created_by="Marketing", last_used_at=now),
            IntegrationsApiKey(name="Legacy Integration", key_hash="le_old_••••••••", key_type="partner", scope="orders.read", status="expired", created_by="Admin", last_used_at=now),
        ]
        self.db.add_all(keys)
        self.db.flush()

        webhooks = [
            IntegrationsWebhook(name="Order Events → ERP", url="https://erp.partner.cd/webhooks/orders", event="orders.created", secret="whsec_ord_••••", active=True, success_count=8420, failure_count=2, last_call_at=now),
            IntegrationsWebhook(name="Payment Success → Finance", url="https://finance.laundryexpress.cd/hooks/pay", event="payments.success", secret="whsec_pay_••••", active=True, success_count=6240, failure_count=0, last_call_at=now),
            IntegrationsWebhook(name="Driver Dispatch", url="https://dispatch.laundryexpress.cd/events", event="driver.assigned", secret="whsec_drv_••••", active=True, success_count=4180, failure_count=5, last_call_at=now),
            IntegrationsWebhook(name="Support Tickets", url="https://support.laundryexpress.cd/webhook", event="ticket.created", secret=None, active=True, success_count=1240, failure_count=1, last_call_at=now),
            IntegrationsWebhook(name="Zapier Automation", url="https://hooks.zapier.com/hooks/catch/12345", event="orders.completed", secret="whsec_zap_••••", active=False, success_count=2800, failure_count=12, last_call_at=now),
        ]
        self.db.add_all(webhooks)
        self.db.flush()

        for wh in webhooks[:3]:
            self.db.add(IntegrationsWebhookDelivery(
                webhook_id=wh.id, payload={"event": wh.event, "id": "evt_demo"},
                headers={"Content-Type": "application/json", "X-Signature": "sha256=abc123"},
                signature="sha256=abc123", response_body='{"ok":true}', status="success",
                duration_ms=124, attempts=1,
            ))

        tracking = [
            IntegrationsTrackingConfig(provider="gtm", config_json={"container_id": "GTM-XXXXXXX"}, enabled=True, health_status="healthy"),
            IntegrationsTrackingConfig(provider="meta", config_json={"pixel_id": "123456789012345"}, enabled=True, health_status="healthy"),
            IntegrationsTrackingConfig(provider="ga4", config_json={"measurement_id": "G-XXXXXXXX"}, enabled=True, health_status="healthy"),
            IntegrationsTrackingConfig(provider="tiktok", config_json={"pixel_id": "CXXXXXXXXXXXX"}, enabled=True, health_status="warning"),
            IntegrationsTrackingConfig(provider="linkedin", config_json={"partner_id": "1234567"}, enabled=False, health_status="error"),
        ]
        self.db.add_all(tracking)

        integrations = [
            IntegrationsHealth(integration_name="Onafriq", category="payments", status="healthy", last_sync_at=now, response_time_ms=98, uptime_pct=99.8),
            IntegrationsHealth(integration_name="Airtel Money", category="payments", status="healthy", last_sync_at=now, response_time_ms=112, uptime_pct=99.4),
            IntegrationsHealth(integration_name="Orange Money", category="payments", status="healthy", last_sync_at=now, response_time_ms=134, uptime_pct=98.9),
            IntegrationsHealth(integration_name="M-Pesa", category="payments", status="warning", last_sync_at=now, response_time_ms=420, uptime_pct=97.2),
            IntegrationsHealth(integration_name="PayPal", category="payments", status="healthy", last_sync_at=now, response_time_ms=156, uptime_pct=99.6),
            IntegrationsHealth(integration_name="WhatsApp Business", category="communication", status="warning", last_sync_at=now, response_time_ms=280, uptime_pct=98.5),
            IntegrationsHealth(integration_name="SMS Gateway", category="communication", status="healthy", last_sync_at=now, response_time_ms=88, uptime_pct=99.7),
            IntegrationsHealth(integration_name="Email Provider", category="communication", status="healthy", last_sync_at=now, response_time_ms=102, uptime_pct=99.9),
            IntegrationsHealth(integration_name="GTM", category="analytics", status="healthy", last_sync_at=now, response_time_ms=45, uptime_pct=100.0),
            IntegrationsHealth(integration_name="Meta Pixel", category="analytics", status="healthy", last_sync_at=now, response_time_ms=52, uptime_pct=99.8),
            IntegrationsHealth(integration_name="GA4", category="analytics", status="healthy", last_sync_at=now, response_time_ms=48, uptime_pct=99.9),
            IntegrationsHealth(integration_name="TikTok Pixel", category="analytics", status="warning", last_sync_at=now, response_time_ms=180, uptime_pct=96.4),
            IntegrationsHealth(integration_name="Slack", category="productivity", status="healthy", last_sync_at=now, response_time_ms=92, uptime_pct=99.5),
            IntegrationsHealth(integration_name="Zapier", category="productivity", status="healthy", last_sync_at=now, response_time_ms=210, uptime_pct=98.8),
            IntegrationsHealth(integration_name="Make", category="productivity", status="healthy", last_sync_at=now, response_time_ms=195, uptime_pct=99.1),
            IntegrationsHealth(integration_name="Webhook Generic", category="productivity", status="healthy", last_sync_at=now, response_time_ms=118, uptime_pct=99.3),
        ]
        self.db.add_all(integrations)

        logs = [
            IntegrationsApiLog(source="api", endpoint="POST /api/v1/orders", log_type="api", user_name="partner_api", integration_name="Partner Pressing Kin", status="success", response_time_ms=84, occurred_at=now),
            IntegrationsApiLog(source="webhook", endpoint="orders.created", log_type="webhook", integration_name="Order Events → ERP", status="success", response_time_ms=124, occurred_at=now),
            IntegrationsApiLog(source="api", endpoint="GET /api/v1/payments", log_type="api", user_name="finance_bot", status="success", response_time_ms=62, occurred_at=now),
            IntegrationsApiLog(source="webhook", endpoint="payments.success", log_type="webhook", integration_name="Payment Success → Finance", status="failed", response_time_ms=2100, occurred_at=now),
            IntegrationsApiLog(source="api", endpoint="POST /api/v1/drivers/assign", log_type="api", user_name="dispatch", status="success", response_time_ms=142, occurred_at=now),
        ]
        self.db.add_all(logs)

        self.db.add_all([
            IntegrationsAlert(alert_type="webhook_failure", title="Webhook en échec", severity="high", count=2),
            IntegrationsAlert(alert_type="api_latency", title="Latence API élevée", severity="medium", count=1),
            IntegrationsAlert(alert_type="tracking_failure", title="Tracking dégradé", severity="medium", count=2),
            IntegrationsAlert(alert_type="api_abuse", title="Trafic anormal détecté", severity="low", count=1),
        ])
        self.db.commit()

    @staticmethod
    def key_type_label(t: str) -> str:
        return KEY_TYPE.get(t, t)

    @staticmethod
    def key_status_label(s: str) -> str:
        return KEY_STATUS.get(s, s)

    @staticmethod
    def webhook_status_label(w) -> str:
        if not w.active:
            return "Désactivé"
        if w.failure_count >= 5:
            return "Erreur"
        return "Actif"

    @staticmethod
    def event_label(e: str) -> str:
        return EVENT_LABELS.get(e, e)

    @staticmethod
    def health_label(s: str) -> str:
        return HEALTH.get(s, s)
