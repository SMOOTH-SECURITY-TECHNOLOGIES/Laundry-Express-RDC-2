from pydantic import BaseModel, Field


class WhatsappKpiResponse(BaseModel):
    open_conversations: int = 1284
    open_conversations_change: float = 12.5
    open_conversations_sparkline: list[float] = Field(default_factory=list)
    messages_today: int = 12450
    messages_today_change: float = 18.7
    messages_today_sparkline: list[float] = Field(default_factory=list)
    response_rate: float = 94.6
    response_rate_change: float = 4.2
    response_rate_sparkline: list[float] = Field(default_factory=list)
    avg_response_time: str = "2 min 14 sec"
    avg_response_time_change: str = "-15 sec"
    avg_response_time_sparkline: list[float] = Field(default_factory=list)
    active_templates: int = 36
    active_templates_change: float = 3.0
    active_templates_sparkline: list[float] = Field(default_factory=list)
    cost_today: float = 42.80
    cost_today_change: float = 5.3
    cost_today_sparkline: list[float] = Field(default_factory=list)
    ai_conversations_pct: float = 72.0
    ai_conversations_change: float = 8.0
    ai_conversations_sparkline: list[float] = Field(default_factory=list)
    satisfaction: float = 4.8
    satisfaction_change: float = 0.2
    satisfaction_sparkline: list[float] = Field(default_factory=list)


class ConversationItem(BaseModel):
    id: str
    client_name: str
    phone: str
    last_message: str | None = None
    channel: str
    assigned_to: str | None = None
    status: str
    status_label: str
    wait_time_sec: int = 0
    wait_time_label: str = ""
    created_at: str | None = None


class ConversationDetail(ConversationItem):
    messages: list[dict] = Field(default_factory=list)
    linked_orders: list[str] = Field(default_factory=list)
    linked_tickets: list[str] = Field(default_factory=list)
    internal_notes: list[str] = Field(default_factory=list)
    ai_suggestions: list[str] = Field(default_factory=list)


class LiveMonitorResponse(BaseModel):
    active_conversations: int = 124
    waiting_conversations: int = 18
    sla_breached: int = 7
    escalations: int = 5
    available_agents: list[str] = Field(default_factory=list)
    ai_active_pct: float = 72.0
    support_backlog: int = 18


class TemplateItem(BaseModel):
    id: str
    name: str
    category: str
    category_label: str
    language: str
    meta_status: str
    meta_status_label: str
    usage_count: int
    delivery_rate: float


class NotificationItem(BaseModel):
    id: str
    event_type: str
    event_label: str
    template_name: str | None = None
    recipient: str
    status: str
    status_label: str
    created_at: str | None = None


class CampaignItem(BaseModel):
    id: str
    name: str
    campaign_type: str
    type_label: str
    template_name: str | None = None
    audience: str | None = None
    status: str
    sent: int
    delivered: int
    opened: int
    replies: int
    clicks: int
    conversions: int


class AutomationItem(BaseModel):
    id: str
    name: str
    trigger_type: str
    trigger_label: str
    status: str
    runs_count: int
    success_rate: float


class WebhookItem(BaseModel):
    id: str
    endpoint: str
    secret_masked: str | None = None
    last_call_at: str | None = None
    success_count: int
    error_count: int
    retry_count: int
    events: list[str] = Field(default_factory=list)


class QualityResponse(BaseModel):
    quality_rating: str
    quality_label: str
    messaging_limit: str
    phone_status: str
    phone_status_label: str
    verification_status: str
    verification_label: str
    alerts: list[dict] = Field(default_factory=list)


class AiMetricsResponse(BaseModel):
    ai_conversations_pct: float
    human_escalations: int
    ai_confidence: float
    resolution_rate: float
    resolved_without_human: int
    cost_saved: float
    satisfaction: float


class CostResponse(BaseModel):
    total_today: float
    total_week: float
    total_month: float
    marketing_cost: float
    utility_cost: float
    auth_cost: float
    cost_per_conversation: float
    trend: float
    forecast: float
    sparkline_day: list[float] = Field(default_factory=list)
    sparkline_week: list[float] = Field(default_factory=list)
    sparkline_month: list[float] = Field(default_factory=list)


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class SegmentItem(BaseModel):
    id: str
    slug: str
    name: str
    size: int
    engagement: float
    conversion: float


class SlaResponse(BaseModel):
    first_response_avg: str
    resolution_avg: str
    open_conversations: int
    sla_breached: int
    first_response_status: str = "green"
    resolution_status: str = "green"
    open_status: str = "orange"
    breached_status: str = "red"


class WhatsappDashboardResponse(BaseModel):
    kpis: WhatsappKpiResponse
    conversations: list[ConversationItem]
    live_monitor: LiveMonitorResponse
    templates: list[TemplateItem]
    notifications: list[NotificationItem]
    campaigns: list[CampaignItem]
    automations: list[AutomationItem]
    webhooks: list[WebhookItem]
    quality: QualityResponse
    ai_metrics: AiMetricsResponse
    costs: CostResponse
    analytics: list[AnalyticsSeries]
    segments: list[SegmentItem]
    sla: SlaResponse
    source: str = "backend"


class WhatsappSendRequest(BaseModel):
    phone: str
    message: str
    template_name: str | None = None


class WhatsappTemplateCreate(BaseModel):
    name: str
    category: str = "utility"
    language: str = "fr"
    body: str = ""


class WhatsappExportRequest(BaseModel):
    format: str = "csv"
