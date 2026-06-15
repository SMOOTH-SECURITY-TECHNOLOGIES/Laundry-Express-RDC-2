from pydantic import BaseModel, Field


class SmsKpiResponse(BaseModel):
    sent_today: int = 24580
    sent_today_change: float = 18.6
    sent_today_sparkline: list[float] = Field(default_factory=list)
    delivery_rate: float = 97.8
    delivery_rate_change: float = 2.2
    delivery_rate_sparkline: list[float] = Field(default_factory=list)
    failure_rate: float = 2.2
    failure_rate_change: float = -0.8
    failure_rate_sparkline: list[float] = Field(default_factory=list)
    cost_today: float = 42.35
    cost_today_change: float = -5.2
    cost_today_sparkline: list[float] = Field(default_factory=list)
    credits_available: int = 125680
    credits_change: float = 12.4
    credits_sparkline: list[float] = Field(default_factory=list)
    active_campaigns: int = 8
    active_campaigns_change: float = 0.0
    otp_success_rate: float = 89.6
    otp_success_change: float = 9.1
    otp_success_sparkline: list[float] = Field(default_factory=list)
    monthly_volume: int = 685420
    monthly_volume_change: float = 21.3
    monthly_volume_sparkline: list[float] = Field(default_factory=list)


class OperatorDistributionItem(BaseModel):
    slug: str
    name: str
    volume: int
    percent: float
    cost: float
    delivery_rate: float
    color: str


class MessageItem(BaseModel):
    id: str
    reference: str
    recipient_name: str | None = None
    phone_number: str
    sender_name: str | None = None
    message_type: str
    message_type_label: str
    status: str
    status_label: str
    operator_slug: str | None = None
    operator_name: str | None = None
    cost: float
    sent_at: str | None = None


class MessageDetail(MessageItem):
    message: str
    provider_message_id: str | None = None
    delivered_at: str | None = None
    logs: list[dict] = Field(default_factory=list)


class OperatorPerformanceItem(BaseModel):
    slug: str
    name: str
    delivery_rate: float
    failure_rate: float
    avg_delivery_ms: int
    cost: float
    volume: int


class CampaignItem(BaseModel):
    id: str
    name: str
    campaign_type: str
    type_label: str
    status: str
    status_label: str
    audience: str | None = None
    sent_count: int
    delivered_count: int
    reply_count: int
    scheduled_at: str | None = None


class TemplateItem(BaseModel):
    id: str
    name: str
    category: str
    category_label: str
    content: str
    active: bool
    usage_count: int
    delivery_rate: float


class SenderItem(BaseModel):
    id: str
    name: str
    sender_id: str
    approved: bool
    active: bool
    approval_status: str
    approval_label: str
    volume: int
    delivery_rate: float


class DeliveryStatusItem(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class CreditSummary(BaseModel):
    current_credits: int
    monthly_consumption: int
    avg_cost_per_sms: float
    auto_recharge: bool
    alert_threshold: int


class CreditLedgerItem(BaseModel):
    id: str
    movement_type: str
    movement_label: str
    amount: int
    balance_after: int
    note: str | None = None
    created_at: str | None = None


class OtpKpiResponse(BaseModel):
    sent: int
    validated: int
    success_rate: float
    avg_validation_sec: int


class OtpRecordItem(BaseModel):
    id: str
    phone_number: str
    code_masked: str
    status: str
    status_label: str
    created_at: str | None = None
    expires_at: str | None = None


class LogItem(BaseModel):
    id: str
    reference: str | None = None
    phone_number: str | None = None
    event_type: str
    status: str | None = None
    provider_id: str | None = None
    created_at: str | None = None


class LogDetail(LogItem):
    request_json: dict | None = None
    response_json: dict | None = None


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


class ActivityItem(BaseModel):
    id: str
    message: str
    activity_type: str
    created_at: str | None = None


class WebhookItem(BaseModel):
    id: str
    endpoint: str
    secret_masked: str | None = None
    last_call_at: str | None = None
    success_count: int
    error_count: int
    consecutive_errors: int


class SmsSettingsResponse(BaseModel):
    auto_recharge: bool = True
    alert_threshold: int = 500
    default_sender: str = "LAUNDRY"
    providers: list[str] = Field(default_factory=list)


class SmsDashboardResponse(BaseModel):
    kpis: SmsKpiResponse
    operator_distribution: list[OperatorDistributionItem]
    messages: list[MessageItem]
    operator_performance: list[OperatorPerformanceItem]
    delivery_status: list[DeliveryStatusItem]
    campaigns: list[CampaignItem]
    templates: list[TemplateItem]
    senders: list[SenderItem]
    credits: CreditSummary
    credit_ledger: list[CreditLedgerItem]
    otp_kpis: OtpKpiResponse
    otp_records: list[OtpRecordItem]
    alerts: list[AlertItem]
    analytics: list[AnalyticsSeries]
    activities: list[ActivityItem]
    webhooks: list[WebhookItem]
    settings: SmsSettingsResponse
    logs: list[LogItem]
    source: str = "backend"


class SmsSendRequest(BaseModel):
    phone_number: str
    message: str
    message_type: str = "transaction"
    sender_id: str | None = None


class SmsBulkSendRequest(BaseModel):
    phones: list[str]
    message: str
    campaign_id: str | None = None


class SmsTemplateCreate(BaseModel):
    name: str
    category: str = "transaction"
    content: str


class SmsCampaignCreate(BaseModel):
    name: str
    campaign_type: str = "marketing"
    message: str
    audience: str | None = None
    scheduled_at: str | None = None


class SmsRechargeRequest(BaseModel):
    amount: int
    provider_slug: str | None = None


class SmsExportRequest(BaseModel):
    format: str = "csv"
