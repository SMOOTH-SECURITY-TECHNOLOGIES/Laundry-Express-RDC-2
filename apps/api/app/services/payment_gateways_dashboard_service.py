from sqlalchemy.orm import Session

from app.models.payment_gateway_ops import (
    PaymentGatewayCashFlow, PaymentGatewayHealth, PaymentGatewayIncident,
    PaymentGatewayProvider, PaymentGatewayReconciliation, PaymentGatewayRefund,
    PaymentGatewaySettlement, PaymentGatewayTransaction, PaymentGatewayWebhook,
)
from app.schemas.payment_gateways_dashboard import (
    CashFlowResponse, ChannelPerformanceItem, CommissionSummary, FraudMetrics,
    GatewayOverviewItem, GatewayTransactionItem, IncidentItem, PaymentGatewayKpiResponse,
    PaymentGatewaysDashboardResponse, ProviderHealthItem, ReconciliationItem,
    RefundItem, RevenueDistributionItem, SettlementItem, SuccessRatePoint,
    TopPartnerItem, WebhookItem,
)
from app.services.payment_gateways_ops_service import PaymentGatewaysOpsService

REVENUE_COLORS = {"Carte bancaire": "#3B82F6", "Mobile Money": "#22C55E", "Espèces": "#F59E0B", "Virement": "#8B5CF6", "Autres": "#6B7280"}


class PaymentGatewaysDashboardService:
    def __init__(self, db: Session):
        self.db = db
        PaymentGatewaysOpsService(db).seed_if_empty()

    def get_dashboard(self, days: int = 30) -> PaymentGatewaysDashboardResponse:
        gateways = self.db.query(PaymentGatewayProvider).order_by(PaymentGatewayProvider.revenue.desc()).all()
        txs = self.db.query(PaymentGatewayTransaction).order_by(PaymentGatewayTransaction.created_at.desc()).limit(20).all()
        incidents = self.db.query(PaymentGatewayIncident).order_by(PaymentGatewayIncident.occurred_at.desc()).all()
        settlements = self.db.query(PaymentGatewaySettlement).order_by(PaymentGatewaySettlement.scheduled_at).all()
        webhooks = self.db.query(PaymentGatewayWebhook).all()
        reconciliations = self.db.query(PaymentGatewayReconciliation).all()
        health = self.db.query(PaymentGatewayHealth).all()
        refunds = self.db.query(PaymentGatewayRefund).order_by(PaymentGatewayRefund.created_at.desc()).all()
        cash = self.db.query(PaymentGatewayCashFlow).filter(PaymentGatewayCashFlow.period == "current").first()

        name_map = {g.slug: g.name for g in gateways}

        kpis = PaymentGatewayKpiResponse(
            revenue_trend=18.4,
            revenue_trend_sparkline=[14, 15, 16, 17, 17.5, 18, 18.4],
            revenue_today=1850, revenue_today_change=9, revenue_today_tx=138,
            revenue_week=11000, revenue_week_change=12, revenue_week_tx=785,
            revenue_month=42750, revenue_month_change=18, revenue_month_tx=3245,
            commissions_due=5240, commissions_due_ops=246,
            commissions_paid=18900, commissions_paid_ops=156,
            cash_in_transit=2460, cash_in_transit_ops=87,
        )

        revenue_dist = [
            RevenueDistributionItem(label="Carte bancaire", amount=18000, percent=42.1, color=REVENUE_COLORS["Carte bancaire"], trend=3.2),
            RevenueDistributionItem(label="Mobile Money", amount=12100, percent=28.3, color=REVENUE_COLORS["Mobile Money"], trend=5.1),
            RevenueDistributionItem(label="Espèces", amount=6400, percent=14.9, color=REVENUE_COLORS["Espèces"], trend=1.2),
            RevenueDistributionItem(label="Virement", amount=4150, percent=9.7, color=REVENUE_COLORS["Virement"], trend=-0.5),
            RevenueDistributionItem(label="Autres", amount=2100, percent=5.0, color=REVENUE_COLORS["Autres"], trend=0.8),
        ]

        channel_perf = [
            ChannelPerformanceItem(channel="Carte bancaire", delivery_rate=99.1, success_rate=99.1, failure_rate=0.9, avg_time_ms=180, latency_ms=180),
            ChannelPerformanceItem(channel="Mobile Money", delivery_rate=96.8, success_rate=96.8, failure_rate=3.2, avg_time_ms=420, latency_ms=420),
            ChannelPerformanceItem(channel="Espèces", delivery_rate=100.0, success_rate=100.0, failure_rate=0.0, avg_time_ms=0, latency_ms=0),
            ChannelPerformanceItem(channel="Virement", delivery_rate=98.0, success_rate=98.0, failure_rate=2.0, avg_time_ms=890, latency_ms=890),
        ]

        cash_flow = CashFlowResponse(
            cash_received=cash.cash_received if cash else 48250,
            cash_withdrawn=cash.cash_withdrawn if cash else 32560,
            cash_in_transit=cash.cash_in_transit if cash else 2460,
            cash_net=cash.cash_net if cash else 18150,
            sparkline_7d=(cash.data_points or {}).get("7d", []) if cash else [],
            sparkline_30d=(cash.data_points or {}).get("30d", []) if cash else [],
            sparkline_90d=(cash.data_points or {}).get("90d", []) if cash else [],
        )

        commissions = CommissionSummary(
            generated=24160, paid=18900, pending=5240, cancelled=420,
            distribution=[
                RevenueDistributionItem(label="Flutterwave", amount=8200, percent=34, color="#3B82F6"),
                RevenueDistributionItem(label="MTN", amount=5400, percent=22, color="#F59E0B"),
                RevenueDistributionItem(label="Orange", amount=4200, percent=17, color="#EF4444"),
                RevenueDistributionItem(label="Visa", amount=3800, percent=16, color="#8B5CF6"),
                RevenueDistributionItem(label="Autres", amount=2560, percent=11, color="#6B7280"),
            ],
        )

        return PaymentGatewaysDashboardResponse(
            kpis=kpis,
            gateways=[self._gateway(g) for g in gateways],
            revenue_distribution=revenue_dist,
            channel_performance=channel_perf,
            transactions=[self._tx(t, name_map) for t in txs],
            cash_flow=cash_flow,
            commissions=commissions,
            incidents=[self._incident(i) for i in incidents],
            success_rate_trend=[
                SuccessRatePoint(label="Lun", rate=97.8), SuccessRatePoint(label="Mar", rate=98.1),
                SuccessRatePoint(label="Mer", rate=98.5), SuccessRatePoint(label="Jeu", rate=98.2),
                SuccessRatePoint(label="Ven", rate=98.7), SuccessRatePoint(label="Sam", rate=98.9),
                SuccessRatePoint(label="Dim", rate=98.7),
            ],
            top_partners=[
                TopPartnerItem(name="Pressing Gombe", revenue=8400, transactions=420, avg_basket=20),
                TopPartnerItem(name="Nettoyage Limete", revenue=6200, transactions=310, avg_basket=20),
                TopPartnerItem(name="Blanchisserie Bandal", revenue=4800, transactions=240, avg_basket=20),
            ],
            settlements=[self._settlement(s, name_map) for s in settlements],
            webhooks=[self._webhook(w) for w in webhooks],
            reconciliations=[self._recon(r) for r in reconciliations],
            provider_health=[self._health(h, name_map) for h in health],
            refunds=[self._refund(r) for r in refunds],
            fraud=FraudMetrics(score=24, repeated_payments=3, suspicious_amounts=2, abusive_refunds=1, multiple_attempts=5),
            source="backend",
        )

    def get_gateway(self, slug: str) -> GatewayOverviewItem | None:
        g = self.db.query(PaymentGatewayProvider).filter(PaymentGatewayProvider.slug == slug).first()
        return self._gateway(g) if g else None

    def _gateway(self, g: PaymentGatewayProvider) -> GatewayOverviewItem:
        return GatewayOverviewItem(
            id=str(g.id), slug=g.slug, name=g.name, channel=g.channel, logo_key=g.logo_key,
            status=g.status, status_label=PaymentGatewaysOpsService.status_label(g.status),
            volume=g.volume, revenue=g.revenue, commission=g.commission, success_rate=g.success_rate,
            last_incident_at=g.last_incident_at.isoformat() if g.last_incident_at else None,
        )

    def _tx(self, t: PaymentGatewayTransaction, names: dict) -> GatewayTransactionItem:
        return GatewayTransactionItem(
            id=str(t.id), reference=t.reference, client_name=t.client_name,
            gateway_slug=t.gateway_slug, gateway_name=names.get(t.gateway_slug, t.gateway_slug),
            amount=t.amount, currency=t.currency, status=t.status,
            status_label=PaymentGatewaysOpsService.tx_status_label(t.status),
            created_at=t.created_at.isoformat() if t.created_at else None,
        )

    def _incident(self, i: PaymentGatewayIncident) -> IncidentItem:
        return IncidentItem(
            id=str(i.id), incident_type=i.incident_type, title=i.title, severity=i.severity,
            gateway_slug=i.gateway_slug, impact=i.impact,
            occurred_at=i.occurred_at.isoformat() if i.occurred_at else None,
        )

    def _settlement(self, s: PaymentGatewaySettlement, names: dict) -> SettlementItem:
        labels = {"scheduled": "Prévu", "in_progress": "En cours", "completed": "Effectué", "delayed": "Retardé"}
        return SettlementItem(
            id=str(s.id), gateway_slug=s.gateway_slug, gateway_name=names.get(s.gateway_slug, s.gateway_slug),
            scheduled_at=s.scheduled_at.isoformat() if s.scheduled_at else None,
            amount=s.amount, status=s.status, status_label=labels.get(s.status, s.status),
        )

    def _webhook(self, w: PaymentGatewayWebhook) -> WebhookItem:
        return WebhookItem(
            id=str(w.id), gateway_slug=w.gateway_slug, endpoint=w.endpoint,
            last_call_at=w.last_call_at.isoformat() if w.last_call_at else None,
            success_count=w.success_count, error_count=w.error_count, retry_count=w.retry_count,
            events=w.events or [],
        )

    def _recon(self, r: PaymentGatewayReconciliation) -> ReconciliationItem:
        labels = {"match": "Match", "missing_provider": "Missing Provider", "missing_internal": "Missing Internal", "amount_mismatch": "Amount Mismatch"}
        return ReconciliationItem(
            id=str(r.id), reference=r.reference, provider_amount=r.provider_amount,
            internal_amount=r.internal_amount, status=r.status, status_label=labels.get(r.status, r.status),
            gateway_slug=r.gateway_slug,
        )

    def _health(self, h: PaymentGatewayHealth, names: dict) -> ProviderHealthItem:
        return ProviderHealthItem(
            gateway_slug=h.gateway_slug, name=names.get(h.gateway_slug, h.gateway_slug),
            uptime=h.uptime, latency_ms=h.latency_ms, error_rate=h.error_rate,
            success_rate=h.success_rate, status=h.status,
        )

    def _refund(self, r: PaymentGatewayRefund) -> RefundItem:
        return RefundItem(
            id=str(r.id), client_name=r.client_name, amount=r.amount,
            reason=r.reason, status=r.status, gateway_slug=r.gateway_slug,
        )
