from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.payment_gateway_ops import (
    PaymentGatewayCashFlow, PaymentGatewayHealth, PaymentGatewayIncident,
    PaymentGatewayProvider, PaymentGatewayReconciliation, PaymentGatewayRefund,
    PaymentGatewaySettlement, PaymentGatewayTransaction, PaymentGatewayWebhook,
)

STATUS_LABELS = {
    "online": "En ligne", "degraded": "Dégradé", "maintenance": "Maintenance", "offline": "Hors ligne",
}
TX_STATUS = {
    "success": "Réussi", "pending": "En attente", "cancelled": "Annulé",
    "expired": "Expiré", "declined": "Refusé", "refunded": "Remboursé",
}
SETTLEMENT_STATUS = {"scheduled": "Prévu", "in_progress": "En cours", "completed": "Effectué", "delayed": "Retardé"}
RECON_STATUS = {"match": "Match", "missing_provider": "Missing Provider", "missing_internal": "Missing Internal", "amount_mismatch": "Amount Mismatch"}


class PaymentGatewaysOpsService:
    def __init__(self, db: Session):
        self.db = db

    def seed_if_empty(self) -> None:
        if self.db.query(PaymentGatewayProvider).count() > 0:
            return
        now = datetime.now(timezone.utc)

        gateways = [
            PaymentGatewayProvider(slug="flutterwave", name="Flutterwave", channel="Mobile Money", logo_key="flutterwave", status="online", volume=1245, revenue=18200, commission=1820, success_rate=98.7),
            PaymentGatewayProvider(slug="mtn", name="MTN Mobile Money", channel="Mobile Money", logo_key="mtn", status="online", volume=980, revenue=12100, commission=1210, success_rate=97.2),
            PaymentGatewayProvider(slug="orange", name="Orange Money", channel="Mobile Money", logo_key="orange", status="degraded", volume=720, revenue=8400, commission=840, success_rate=94.5, last_incident_at=now - timedelta(hours=4)),
            PaymentGatewayProvider(slug="visa", name="Visa / Mastercard", channel="Carte bancaire", logo_key="visa", status="online", volume=540, revenue=9600, commission=480, success_rate=99.1),
            PaymentGatewayProvider(slug="paypal", name="PayPal", channel="Virement", logo_key="paypal", status="online", volume=210, revenue=3200, commission=160, success_rate=98.0),
            PaymentGatewayProvider(slug="cash", name="Cash", channel="Espèces", logo_key="cash", status="online", volume=890, revenue=6400, commission=0, success_rate=100.0),
            PaymentGatewayProvider(slug="airtel", name="Airtel Money", channel="Mobile Money", logo_key="airtel", status="maintenance", volume=0, revenue=0, commission=0, success_rate=0, last_incident_at=now - timedelta(hours=1)),
            PaymentGatewayProvider(slug="vodacom", name="Vodacom M-Pesa", channel="Mobile Money", logo_key="vodacom", status="offline", volume=0, revenue=0, commission=0, success_rate=0, last_incident_at=now - timedelta(days=1)),
        ]
        self.db.add_all(gateways)

        txs = [
            PaymentGatewayTransaction(reference="PAY-88421", client_name="Marie K.", gateway_slug="flutterwave", amount=45.0, status="success", channel="Mobile Money"),
            PaymentGatewayTransaction(reference="PAY-88420", client_name="Jean P.", gateway_slug="mtn", amount=28.5, status="pending", channel="Mobile Money"),
            PaymentGatewayTransaction(reference="PAY-88419", client_name="Sophie M.", gateway_slug="visa", amount=120.0, status="success", channel="Carte bancaire"),
            PaymentGatewayTransaction(reference="PAY-88418", client_name="Paul T.", gateway_slug="orange", amount=35.0, status="declined", channel="Mobile Money"),
            PaymentGatewayTransaction(reference="PAY-88417", client_name="Alice B.", gateway_slug="cash", amount=22.0, status="success", channel="Espèces"),
            PaymentGatewayTransaction(reference="PAY-88416", client_name="David L.", gateway_slug="paypal", amount=89.0, status="refunded", channel="Virement"),
        ]
        for t in txs:
            t.created_at = now - timedelta(hours=txs.index(t) * 2)
        self.db.add_all(txs)

        incidents = [
            PaymentGatewayIncident(incident_type="payment_failed", title="Échecs paiement Orange Money", severity="high", gateway_slug="orange", impact="42 transactions", occurred_at=now - timedelta(hours=4)),
            PaymentGatewayIncident(incident_type="settlement_delay", title="Retard settlement Flutterwave", severity="medium", gateway_slug="flutterwave", impact="2 400 $", occurred_at=now - timedelta(days=1)),
            PaymentGatewayIncident(incident_type="cash_transit", title="Cash en transit > 24h", severity="medium", impact="5 chauffeurs", occurred_at=now - timedelta(hours=12)),
            PaymentGatewayIncident(incident_type="kyc_expired", title="KYC expiré — compte MTN", severity="low", gateway_slug="mtn", impact="Limitation volume", occurred_at=now - timedelta(days=2)),
            PaymentGatewayIncident(incident_type="webhook_failed", title="Webhook payment_failed — 12 erreurs", severity="critical", gateway_slug="flutterwave", impact="Réconciliation bloquée", occurred_at=now - timedelta(minutes=30)),
        ]
        self.db.add_all(incidents)

        settlements = [
            PaymentGatewaySettlement(gateway_slug="flutterwave", scheduled_at=now + timedelta(days=1), amount=8200, status="scheduled"),
            PaymentGatewaySettlement(gateway_slug="mtn", scheduled_at=now + timedelta(days=2), amount=5400, status="in_progress"),
            PaymentGatewaySettlement(gateway_slug="orange", scheduled_at=now - timedelta(days=1), amount=3100, status="delayed"),
            PaymentGatewaySettlement(gateway_slug="visa", scheduled_at=now - timedelta(days=3), amount=4800, status="completed"),
        ]
        self.db.add_all(settlements)

        webhooks = [
            PaymentGatewayWebhook(gateway_slug="flutterwave", endpoint="https://api.laundryexpress.cd/webhooks/flutterwave", last_call_at=now - timedelta(minutes=5), success_count=8420, error_count=12, retry_count=3, events=["payment_success", "payment_failed", "refund_created"]),
            PaymentGatewayWebhook(gateway_slug="mtn", endpoint="https://api.laundryexpress.cd/webhooks/mtn", last_call_at=now - timedelta(minutes=15), success_count=5200, error_count=4, retry_count=1, events=["payment_success", "payout_sent"]),
        ]
        self.db.add_all(webhooks)

        reconciliations = [
            PaymentGatewayReconciliation(reference="PAY-88390", provider_amount=45.0, internal_amount=45.0, status="match", gateway_slug="flutterwave"),
            PaymentGatewayReconciliation(reference="PAY-88388", provider_amount=28.5, internal_amount=None, status="missing_internal", gateway_slug="mtn"),
            PaymentGatewayReconciliation(reference="PAY-88385", provider_amount=None, internal_amount=35.0, status="missing_provider", gateway_slug="orange"),
            PaymentGatewayReconciliation(reference="PAY-88380", provider_amount=120.0, internal_amount=115.0, status="amount_mismatch", gateway_slug="visa"),
        ]
        self.db.add_all(reconciliations)

        health = [
            PaymentGatewayHealth(gateway_slug="flutterwave", uptime=99.8, latency_ms=240, error_rate=0.3, success_rate=98.7, status="healthy"),
            PaymentGatewayHealth(gateway_slug="mtn", uptime=99.2, latency_ms=380, error_rate=0.8, success_rate=97.2, status="healthy"),
            PaymentGatewayHealth(gateway_slug="orange", uptime=96.5, latency_ms=520, error_rate=2.1, success_rate=94.5, status="degraded"),
            PaymentGatewayHealth(gateway_slug="visa", uptime=99.9, latency_ms=180, error_rate=0.1, success_rate=99.1, status="healthy"),
            PaymentGatewayHealth(gateway_slug="paypal", uptime=98.5, latency_ms=420, error_rate=0.5, success_rate=98.0, status="healthy"),
        ]
        self.db.add_all(health)

        refunds = [
            PaymentGatewayRefund(client_name="David L.", amount=89.0, reason="Commande annulée", status="completed", gateway_slug="paypal"),
            PaymentGatewayRefund(client_name="Claire N.", amount=32.0, reason="Service non conforme", status="pending", gateway_slug="flutterwave"),
            PaymentGatewayRefund(client_name="Marc D.", amount=18.5, reason="Double paiement", status="pending", gateway_slug="mtn"),
        ]
        self.db.add_all(refunds)

        self.db.add(PaymentGatewayCashFlow(
            period="current", cash_received=48250, cash_withdrawn=32560, cash_in_transit=2460, cash_net=18150,
            data_points={"7d": [12, 15, 14, 18, 16, 20, 18], "30d": [10, 12, 14, 16, 18, 20, 22], "90d": [8, 10, 12, 14, 16, 18, 20]},
        ))
        self.db.commit()

    @staticmethod
    def status_label(st: str) -> str:
        return STATUS_LABELS.get(st, st)

    @staticmethod
    def tx_status_label(st: str) -> str:
        return TX_STATUS.get(st, st)
