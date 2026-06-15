from pydantic import BaseModel, Field


class EmailKpiResponse(BaseModel):
    sent_today: int = 18420
    sent_today_change: float = 15.8
    sent_today_sparkline: list[float] = Field(default_factory=list)
    delivery_rate: float = 99.1
    delivery_rate_change: float = 0.4
    delivery_rate_sparkline: list[float] = Field(default_factory=list)
    open_rate: float = 38.4
    open_rate_change: float = 2.1
    open_rate_sparkline: list[float] = Field(default_factory=list)
    click_rate: float = 9.2
    click_rate_change: float = 1.4
    click_rate_sparkline: list[float] = Field(default_factory=list)
    bounces: int = 214
    bounces_change: float = -12.0
    bounces_sparkline: list[float] = Field(default_factory=list)
    unsubscribes: int = 86
    unsubscribes_change: float = 3.2
    unsubscribes_sparkline: list[float] = Field(default_factory=list)
    active_templates: int = 42
    active_templates_change: float = 2.0
    active_templates_sparkline: list[float] = Field(default_factory=list)
    attributed_revenue: float = 12850.0
    attributed_revenue_change: float = 18.5
    attributed_revenue_sparkline: list[float] = Field(default_factory=list)


class EmailMessageItem(BaseModel):
    id: str
    reference: str
    recipient_email: str
    recipient_name: str | None = None
    subject: str
    message_type: str
    message_type_label: str
    template_name: str | None = None
    status: str
    status_label: str
    open_rate: float | None = None
    click_rate: float | None = None
    sent_at: str | None = None


class EmailTemplateItem(BaseModel):
    id: str
    name: str
    template_type: str
    type_label: str
    language: str
    subject: str
    status: str
    usage_count: int
    open_rate: float
    click_rate: float
    version: int


class EmailCampaignItem(BaseModel):
    id: str
    name: str
    audience: str | None = None
    status: str
    status_label: str
    sent_count: int
    opened_count: int
    clicked_count: int
    conversions: int
    revenue: float
    roi: float


class EmailAutomationItem(BaseModel):
    id: str
    name: str
    trigger_key: str
    trigger_label: str
    template_name: str | None = None
    status: str
    last_run_at: str | None = None
    volume_30d: int
    open_rate: float
    click_rate: float


class TypeDistributionItem(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class DomainPerformanceItem(BaseModel):
    domain: str
    delivery_rate: float
    open_rate: float
    click_rate: float
    bounce_rate: float


class DeliverabilityItem(BaseModel):
    domain: str
    health_status: str
    health_label: str
    spf: str
    dkim: str
    dmarc: str
    bounce_rate: float
    spam_complaints: float
    reputation_score: float


class BounceItem(BaseModel):
    id: str
    email: str
    bounce_type: str
    bounce_type_label: str
    reason: str | None = None
    provider_code: str | None = None
    occurred_at: str | None = None


class UnsubscribeSummary(BaseModel):
    total: int
    campaign: int
    marketing: int
    preferences_count: int


class UnsubscribeItem(BaseModel):
    id: str
    email: str
    unsubscribe_type: str
    type_label: str
    reason: str | None = None


class InvoiceSummary(BaseModel):
    sent: int
    opened: int
    downloaded: int
    reminders: int
    failures: int


class InvoiceLogItem(BaseModel):
    id: str
    invoice_ref: str
    recipient_email: str
    status: str
    opened: bool
    downloaded: bool
    reminder_count: int


class WebhookItem(BaseModel):
    id: str
    endpoint: str
    secret_masked: str | None = None
    last_call_at: str | None = None
    success_count: int
    error_count: int
    events: list[str] = Field(default_factory=list)


class AlertItem(BaseModel):
    id: str
    alert_type: str
    title: str
    severity: str
    count: int


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class SegmentItem(BaseModel):
    slug: str
    name: str
    size: int


class EmailSettingsResponse(BaseModel):
    provider: str = "resend"
    from_email: str = "noreply@laundryexpress.cd"
    reply_to: str = "support@laundryexpress.cd"
    marketing_opt_out_required: bool = True


class EmailDashboardResponse(BaseModel):
    kpis: EmailKpiResponse
    messages: list[EmailMessageItem]
    templates: list[EmailTemplateItem]
    campaigns: list[EmailCampaignItem]
    automations: list[EmailAutomationItem]
    type_distribution: list[TypeDistributionItem]
    domain_performance: list[DomainPerformanceItem]
    deliverability: list[DeliverabilityItem]
    bounces: list[BounceItem]
    unsubscribe_summary: UnsubscribeSummary
    unsubscribes: list[UnsubscribeItem]
    invoice_summary: InvoiceSummary
    invoices: list[InvoiceLogItem]
    webhooks: list[WebhookItem]
    alerts: list[AlertItem]
    analytics: list[AnalyticsSeries]
    segments: list[SegmentItem]
    settings: EmailSettingsResponse
    source: str = "backend"


class EmailSendRequest(BaseModel):
    to_email: str
    subject: str
    body_html: str = ""
    template_id: str | None = None


class EmailTemplateCreate(BaseModel):
    name: str
    template_type: str = "transactional"
    language: str = "fr"
    subject: str
    preheader: str = ""
    body_html: str = ""


class EmailCampaignCreate(BaseModel):
    name: str
    audience: str | None = None


class EmailExportRequest(BaseModel):
    format: str = "csv"
