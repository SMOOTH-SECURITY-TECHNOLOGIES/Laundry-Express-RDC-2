from pydantic import BaseModel, Field


class NotificationsKpiResponse(BaseModel):
    total_sent: int = 0
    total_sent_change: float = 0
    total_sent_sparkline: list[int] = Field(default_factory=list)
    delivery_rate: float = 0
    delivery_rate_change: float = 0
    delivery_rate_sparkline: list[float] = Field(default_factory=list)
    email_open_rate: float = 0
    email_open_rate_change: float = 0
    email_open_rate_sparkline: list[float] = Field(default_factory=list)
    click_rate: float = 0
    click_rate_change: float = 0
    click_rate_sparkline: list[float] = Field(default_factory=list)
    unsubscribes: int = 0
    unsubscribes_change: float = 0
    unsubscribes_sparkline: list[int] = Field(default_factory=list)
    errors: int = 0
    errors_change: float = 0
    errors_sparkline: list[int] = Field(default_factory=list)


class NotificationItemResponse(BaseModel):
    id: str
    title: str
    message_preview: str
    channel: str
    channel_label: str
    event_type: str
    event_label: str
    audience: str
    status: str
    status_label: str
    sent_at: str | None
    delivery_rate: float
    open_rate: float | None = None
    click_rate: float | None = None
    zone: str | None = None


class ChannelDistributionItem(BaseModel):
    channel: str
    label: str
    count: int
    percent: float
    color: str
    trend: float = 0


class DeliveryStatusItem(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class TopEventItem(BaseModel):
    event_type: str
    label: str
    sends: int


class ChannelPerformanceItem(BaseModel):
    channel: str
    label: str
    delivery_rate: float
    open_rate: float
    click_rate: float
    failures: int


class PopularTemplateItem(BaseModel):
    id: str
    name: str
    channel: str
    usage_count: int
    delivery_rate: float
    open_rate: float | None = None


class AutomationItem(BaseModel):
    id: str
    name: str
    trigger_key: str
    trigger_label: str
    channel: str
    status: str
    last_run_at: str | None


class ActivityItem(BaseModel):
    id: str
    activity_type: str
    message: str
    actor_name: str | None
    created_at: str | None


class ProviderHealthItem(BaseModel):
    channel: str
    label: str
    provider: str
    delivery_rate: float
    latency_ms: int
    error_count: int
    status: str
    last_incident_at: str | None


class NotificationErrorItem(BaseModel):
    id: str
    channel: str
    provider: str
    error_code: str
    message: str
    occurrences: int
    last_occurrence_at: str | None


class UnsubscribeItem(BaseModel):
    id: str
    channel: str
    user_email: str | None
    user_phone: str | None
    reason: str | None
    unsubscribed_at: str | None


class SegmentItem(BaseModel):
    id: str
    name: str
    slug: str
    size: int
    preferred_channel: str | None
    engagement_rate: float


class TemplateItem(BaseModel):
    id: str
    name: str
    channel: str
    event_type: str
    language: str
    status: str
    usage_count: int
    delivery_rate: float
    open_rate: float | None
    updated_at: str | None


class NotificationsDashboardResponse(BaseModel):
    kpis: NotificationsKpiResponse
    notifications: list[NotificationItemResponse]
    channel_distribution: list[ChannelDistributionItem]
    delivery_status: list[DeliveryStatusItem]
    top_events: list[TopEventItem]
    channel_performance: list[ChannelPerformanceItem]
    popular_templates: list[PopularTemplateItem]
    automations: list[AutomationItem]
    activities: list[ActivityItem]
    provider_health: list[ProviderHealthItem]
    errors: list[NotificationErrorItem]
    unsubscribes: list[UnsubscribeItem]
    segments: list[SegmentItem]
    templates: list[TemplateItem]
    source: str = "backend"


class NotificationSendRequest(BaseModel):
    channel: str
    audience: str
    title: str
    message: str
    event_type: str = "promotion"
    schedule_at: str | None = None


class NotificationTemplateCreateRequest(BaseModel):
    name: str
    channel: str
    event_type: str
    language: str = "fr"
    subject: str | None = None
    body: str


class NotificationTemplateUpdateRequest(BaseModel):
    name: str | None = None
    subject: str | None = None
    body: str | None = None
    status: str | None = None
    translations: dict | None = None


class NotificationAutomationPatchRequest(BaseModel):
    status: str | None = None
    name: str | None = None


class NotificationExportRequest(BaseModel):
    format: str = "csv"
    date_start: str | None = None
    date_end: str | None = None
