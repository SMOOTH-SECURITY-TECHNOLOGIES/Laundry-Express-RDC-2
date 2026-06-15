from pydantic import BaseModel, Field


class IntegrationsKpiResponse(BaseModel):
    api_calls_today: int = 254820
    api_calls_today_change: float = 18.6
    api_calls_today_sparkline: list[float] = Field(default_factory=list)
    webhooks_received: int = 14582
    webhooks_received_change: float = 12.4
    webhooks_received_sparkline: list[float] = Field(default_factory=list)
    webhooks_sent: int = 22140
    webhooks_sent_change: float = 15.3
    webhooks_sent_sparkline: list[float] = Field(default_factory=list)
    success_rate: float = 99.2
    success_rate_change: float = 1.2
    success_rate_sparkline: list[float] = Field(default_factory=list)
    failed_events: int = 82
    failed_events_change: float = 22.5
    failed_events_sparkline: list[float] = Field(default_factory=list)
    active_integrations: int = 18
    active_integrations_change: float = 2.0
    active_integrations_sparkline: list[float] = Field(default_factory=list)
    api_keys_count: int = 42
    api_keys_change: float = 4.0
    api_keys_sparkline: list[float] = Field(default_factory=list)
    avg_response_time_ms: int = 127
    avg_response_time_change: float = 18.0
    avg_response_time_sparkline: list[float] = Field(default_factory=list)


class ApiKeyItem(BaseModel):
    id: str
    name: str
    key_type: str
    type_label: str
    scope: str
    created_by: str | None = None
    last_used_at: str | None = None
    status: str
    status_label: str


class WebhookItem(BaseModel):
    id: str
    name: str
    url: str
    event: str
    event_label: str
    last_call_at: str | None = None
    success_count: int
    failure_count: int
    status: str
    status_label: str
    signed: bool = True


class WebhookDeliveryItem(BaseModel):
    id: str
    webhook_id: str
    webhook_name: str | None = None
    payload: dict | None = None
    headers: dict | None = None
    signature: str | None = None
    response_body: str | None = None
    status: str
    duration_ms: int
    attempts: int
    created_at: str | None = None


class TrackingProviderItem(BaseModel):
    provider: str
    provider_label: str
    config_value: str | None = None
    enabled: bool
    health_status: str
    health_label: str


class ServerSideTracking(BaseModel):
    events_relayed_24h: int = 18456
    success_rate: float = 99.1
    failed_events: int = 168
    queue_size: int = 42


class IntegrationHealthItem(BaseModel):
    id: str
    name: str
    category: str
    category_label: str
    status: str
    status_label: str
    last_sync_at: str | None = None
    response_time_ms: int
    uptime_pct: float


class ApiLogItem(BaseModel):
    id: str
    occurred_at: str | None = None
    source: str
    endpoint: str
    log_type: str
    user_name: str | None = None
    integration_name: str | None = None
    status: str
    status_label: str
    response_time_ms: int


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class EventDistributionItem(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class TopEndpointItem(BaseModel):
    method: str
    path: str
    calls: int


class SecurityMetrics(BaseModel):
    api_keys_total: int = 42
    api_keys_expired: int = 3
    api_keys_revoked: int = 2
    webhooks_signed: int = 14
    webhooks_unsigned: int = 2
    audit_access_count: int = 1240
    audit_modifications: int = 84
    audit_deletions: int = 12


class AlertItem(BaseModel):
    id: str
    alert_type: str
    title: str
    severity: str
    count: int


class OpenApiSummary(BaseModel):
    version: str = "3.1.0"
    title: str = "Laundry Express API"
    endpoints_count: int = 48
    webhook_events: list[str] = Field(default_factory=list)


class IntegrationsDashboardResponse(BaseModel):
    kpis: IntegrationsKpiResponse
    api_keys: list[ApiKeyItem] = Field(default_factory=list)
    webhooks: list[WebhookItem] = Field(default_factory=list)
    webhook_deliveries: list[WebhookDeliveryItem] = Field(default_factory=list)
    tracking: list[TrackingProviderItem] = Field(default_factory=list)
    server_side_tracking: ServerSideTracking = Field(default_factory=ServerSideTracking)
    integrations: list[IntegrationHealthItem] = Field(default_factory=list)
    logs: list[ApiLogItem] = Field(default_factory=list)
    analytics: list[AnalyticsSeries] = Field(default_factory=list)
    event_distribution: list[EventDistributionItem] = Field(default_factory=list)
    top_endpoints: list[TopEndpointItem] = Field(default_factory=list)
    security: SecurityMetrics = Field(default_factory=SecurityMetrics)
    alerts: list[AlertItem] = Field(default_factory=list)
    openapi: OpenApiSummary = Field(default_factory=OpenApiSummary)
    source: str = "backend"


class ApiKeyCreate(BaseModel):
    name: str
    key_type: str = "internal"
    scope: str = "orders.read"


class WebhookCreate(BaseModel):
    name: str
    url: str
    event: str


class TrackingUpdate(BaseModel):
    provider: str
    config_value: str
    enabled: bool = True


class WebhookTestRequest(BaseModel):
    webhook_id: str | None = None


class WebhookReplayRequest(BaseModel):
    event: str
