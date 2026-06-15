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
from app.schemas.integrations_dashboard import (
    AlertItem,
    AnalyticsPoint,
    AnalyticsSeries,
    ApiKeyItem,
    ApiLogItem,
    EventDistributionItem,
    IntegrationHealthItem,
    IntegrationsDashboardResponse,
    IntegrationsKpiResponse,
    OpenApiSummary,
    SecurityMetrics,
    ServerSideTracking,
    TopEndpointItem,
    TrackingProviderItem,
    WebhookDeliveryItem,
    WebhookItem,
)
from app.services.integrations_ops_service import EVENT_LABELS, IntegrationsOpsService

CATEGORY_LABELS = {
    "payments": "Paiements", "communication": "Communication",
    "analytics": "Analytics", "productivity": "Productivité", "other": "Autre",
}
TRACKING_LABELS = {"gtm": "Google Tag Manager", "meta": "Meta Pixel", "ga4": "Google Analytics 4", "tiktok": "TikTok Pixel", "linkedin": "LinkedIn Insight"}
LOG_STATUS = {"success": "Succès", "failed": "Échec", "error": "Erreur"}


class IntegrationsDashboardService:
    def __init__(self, db: Session):
        self.db = db
        IntegrationsOpsService(db).seed_if_empty()

    def get_dashboard(self) -> IntegrationsDashboardResponse:
        keys = self.db.query(IntegrationsApiKey).order_by(IntegrationsApiKey.last_used_at.desc()).all()
        webhooks = self.db.query(IntegrationsWebhook).all()
        deliveries = self.db.query(IntegrationsWebhookDelivery).order_by(IntegrationsWebhookDelivery.created_at.desc()).limit(100).all()
        tracking = self.db.query(IntegrationsTrackingConfig).all()
        integrations = self.db.query(IntegrationsHealth).all()
        logs = self.db.query(IntegrationsApiLog).order_by(IntegrationsApiLog.occurred_at.desc()).limit(50).all()
        alerts = self.db.query(IntegrationsAlert).all()

        wh_map = {str(w.id): w.name for w in webhooks}

        kpis = IntegrationsKpiResponse(
            api_calls_today=254820, api_calls_today_change=18.6,
            api_calls_today_sparkline=[180000, 195000, 210000, 225000, 238000, 248000, 254820],
            webhooks_received=14582, webhooks_received_change=12.4,
            webhooks_received_sparkline=[11000, 11800, 12400, 13200, 13800, 14200, 14582],
            webhooks_sent=22140, webhooks_sent_change=15.3,
            webhooks_sent_sparkline=[16000, 17500, 18800, 19800, 20800, 21500, 22140],
            success_rate=99.2, success_rate_change=1.2,
            success_rate_sparkline=[97.8, 98.2, 98.6, 98.9, 99.0, 99.1, 99.2],
            failed_events=82, failed_events_change=22.5,
            failed_events_sparkline=[42, 48, 55, 62, 70, 78, 82],
            active_integrations=18, active_integrations_change=2.0,
            active_integrations_sparkline=[14, 15, 16, 16, 17, 17, 18],
            api_keys_count=42, api_keys_change=4.0,
            api_keys_sparkline=[34, 36, 38, 39, 40, 41, 42],
            avg_response_time_ms=127, avg_response_time_change=18.0,
            avg_response_time_sparkline=[98, 102, 108, 115, 120, 124, 127],
        )

        return IntegrationsDashboardResponse(
            kpis=kpis,
            api_keys=[self._key(k) for k in keys],
            webhooks=[self._webhook(w) for w in webhooks],
            webhook_deliveries=[self._delivery(d, wh_map) for d in deliveries],
            tracking=[self._tracking(t) for t in tracking],
            server_side_tracking=ServerSideTracking(),
            integrations=[self._integration(i) for i in integrations],
            logs=[self._log(l) for l in logs],
            analytics=[
                AnalyticsSeries(key="api_volume", title="API Volume", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [198000, 212000, 225000, 238000, 254820, 142000, 98000])]),
                AnalyticsSeries(key="webhook_volume", title="Webhook Volume", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [18200, 19400, 20100, 21400, 22140, 12400, 8400])]),
                AnalyticsSeries(key="errors", title="Errors", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [42, 48, 55, 62, 82, 28, 14])]),
                AnalyticsSeries(key="response_time", title="Response Time (ms)", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [98, 102, 108, 115, 127, 110, 95])]),
            ],
            event_distribution=[
                EventDistributionItem(label="Orders", count=212840, percent=39.2, color="#3B82F6"),
                EventDistributionItem(label="Payments", count=155920, percent=28.7, color="#8B5CF6"),
                EventDistributionItem(label="Drivers", count=67240, percent=12.4, color="#22C55E"),
                EventDistributionItem(label="Support", count=51520, percent=9.5, color="#F59E0B"),
                EventDistributionItem(label="Notifications", count=33080, percent=6.1, color="#06B6D4"),
                EventDistributionItem(label="Autres", count=22760, percent=4.2, color="#94A3B8"),
            ],
            top_endpoints=[
                TopEndpointItem(method="POST", path="/api/v1/orders", calls=86540),
                TopEndpointItem(method="GET", path="/api/v1/orders/{id}", calls=62420),
                TopEndpointItem(method="POST", path="/api/v1/payments", calls=48200),
                TopEndpointItem(method="GET", path="/api/v1/drivers/available", calls=31840),
                TopEndpointItem(method="POST", path="/api/v1/webhooks/inbound", calls=22140),
            ],
            security=SecurityMetrics(),
            alerts=[self._alert(a) for a in alerts],
            openapi=OpenApiSummary(webhook_events=list(EVENT_LABELS.keys())),
            source="backend",
        )

    def _key(self, k: IntegrationsApiKey) -> ApiKeyItem:
        return ApiKeyItem(
            id=str(k.id), name=k.name, key_type=k.key_type,
            type_label=IntegrationsOpsService.key_type_label(k.key_type),
            scope=k.scope, created_by=k.created_by, last_used_at=k.last_used_at,
            status=k.status, status_label=IntegrationsOpsService.key_status_label(k.status),
        )

    def _webhook(self, w: IntegrationsWebhook) -> WebhookItem:
        status = "error" if w.failure_count >= 5 else ("disabled" if not w.active else "active")
        return WebhookItem(
            id=str(w.id), name=w.name, url=w.url, event=w.event,
            event_label=IntegrationsOpsService.event_label(w.event),
            last_call_at=w.last_call_at, success_count=w.success_count,
            failure_count=w.failure_count, status=status,
            status_label=IntegrationsOpsService.webhook_status_label(w),
            signed=bool(w.secret),
        )

    def _delivery(self, d: IntegrationsWebhookDelivery, wh_map: dict) -> WebhookDeliveryItem:
        return WebhookDeliveryItem(
            id=str(d.id), webhook_id=str(d.webhook_id),
            webhook_name=wh_map.get(str(d.webhook_id)),
            payload=d.payload, headers=d.headers, signature=d.signature,
            response_body=d.response_body, status=d.status,
            duration_ms=d.duration_ms, attempts=d.attempts,
            created_at=d.created_at.isoformat() if d.created_at else None,
        )

    def _tracking(self, t: IntegrationsTrackingConfig) -> TrackingProviderItem:
        cfg = t.config_json or {}
        val = cfg.get("container_id") or cfg.get("pixel_id") or cfg.get("measurement_id") or cfg.get("partner_id")
        return TrackingProviderItem(
            provider=t.provider, provider_label=TRACKING_LABELS.get(t.provider, t.provider),
            config_value=val, enabled=t.enabled,
            health_status=t.health_status, health_label=IntegrationsOpsService.health_label(t.health_status),
        )

    def _integration(self, i: IntegrationsHealth) -> IntegrationHealthItem:
        return IntegrationHealthItem(
            id=str(i.id), name=i.integration_name, category=i.category,
            category_label=CATEGORY_LABELS.get(i.category, i.category),
            status=i.status, status_label=IntegrationsOpsService.health_label(i.status),
            last_sync_at=i.last_sync_at, response_time_ms=i.response_time_ms, uptime_pct=i.uptime_pct,
        )

    def _log(self, l: IntegrationsApiLog) -> ApiLogItem:
        return ApiLogItem(
            id=str(l.id), occurred_at=l.occurred_at, source=l.source, endpoint=l.endpoint,
            log_type=l.log_type, user_name=l.user_name, integration_name=l.integration_name,
            status=l.status, status_label=LOG_STATUS.get(l.status, l.status),
            response_time_ms=l.response_time_ms,
        )

    def _alert(self, a: IntegrationsAlert) -> AlertItem:
        return AlertItem(id=str(a.id), alert_type=a.alert_type, title=a.title, severity=a.severity, count=a.count)
