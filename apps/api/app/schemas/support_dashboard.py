from pydantic import BaseModel, Field


class SupportKpiResponse(BaseModel):
    open_tickets: int = 0
    open_tickets_change: float = 0
    open_tickets_sparkline: list[int] = Field(default_factory=list)
    new_tickets: int = 0
    new_tickets_change: float = 0
    new_tickets_sparkline: list[int] = Field(default_factory=list)
    waiting_client: int = 0
    waiting_client_change: float = 0
    waiting_client_sparkline: list[int] = Field(default_factory=list)
    waiting_support: int = 0
    waiting_support_change: float = 0
    waiting_support_sparkline: list[int] = Field(default_factory=list)
    sla_compliance: float = 0
    sla_compliance_change: float = 0
    sla_compliance_sparkline: list[float] = Field(default_factory=list)
    critical_tickets: int = 0
    critical_tickets_change: float = 0
    critical_tickets_sparkline: list[int] = Field(default_factory=list)
    satisfaction: float = 0
    satisfaction_change: float = 0
    satisfaction_sparkline: list[float] = Field(default_factory=list)
    avg_response_minutes: int = 0
    avg_response_change: float = 0
    avg_response_sparkline: list[int] = Field(default_factory=list)


class TicketMessageResponse(BaseModel):
    id: str
    content: str
    is_internal: bool
    created_at: str | None


class TicketItemResponse(BaseModel):
    id: str
    ticket_code: str
    title: str
    ai_summary: str
    client_name: str
    client_id: str
    category: str
    category_label: str
    priority: str
    priority_label: str
    status: str
    status_label: str
    sla_label: str
    sla_status: str
    sla_minutes_remaining: int | None
    updated_at: str | None
    agent_name: str | None
    channel: str
    order_id: str | None = None
    sentiment: str | None = None


class TicketDetailResponse(TicketItemResponse):
    description: str
    messages: list[TicketMessageResponse] = Field(default_factory=list)
    payment_id: str | None = None
    partner_name: str | None = None
    driver_name: str | None = None
    internal_notes: list[str] = Field(default_factory=list)
    ai_recommendations: list[str] = Field(default_factory=list)
    refund_risk: str = "low"
    churn_risk: str = "low"


class SlaBreakdownResponse(BaseModel):
    within_sla: int
    at_risk: int
    breached: int
    avg_resolution_minutes: int
    compliance_percent: float


class QueueColumnResponse(BaseModel):
    status: str
    status_label: str
    tickets: list[TicketItemResponse] = Field(default_factory=list)


class AiTriageItemResponse(BaseModel):
    ticket_id: str
    ticket_code: str
    client_name: str
    subject: str
    sentiment: str
    predicted_category: str
    priority: str
    refund_risk: str
    churn_risk: str
    suggested_reply: str


class SentimentBreakdownResponse(BaseModel):
    sentiment: str
    count: int
    percent: float
    color: str


class TopIssueResponse(BaseModel):
    issue: str
    tickets: int
    variation: float
    impact: str


class AgentPerformanceResponse(BaseModel):
    agent_id: str
    agent_name: str
    tickets_handled: int
    avg_response_minutes: int
    sla_percent: float
    satisfaction: float


class EscalationItemResponse(BaseModel):
    id: str
    label: str
    count: int
    severity: str


class TrendPointResponse(BaseModel):
    date: str
    new_tickets: int
    resolved_tickets: int
    open_tickets: int


class ChannelBreakdownResponse(BaseModel):
    channel: str
    count: int
    percent: float
    color: str


class SupportDashboardResponse(BaseModel):
    kpis: SupportKpiResponse
    tickets: list[TicketItemResponse] = Field(default_factory=list)
    sla: SlaBreakdownResponse
    queue: list[QueueColumnResponse] = Field(default_factory=list)
    ai_triage: list[AiTriageItemResponse] = Field(default_factory=list)
    sentiment: list[SentimentBreakdownResponse] = Field(default_factory=list)
    top_issues: list[TopIssueResponse] = Field(default_factory=list)
    agents: list[AgentPerformanceResponse] = Field(default_factory=list)
    escalations: list[EscalationItemResponse] = Field(default_factory=list)
    trends: list[TrendPointResponse] = Field(default_factory=list)
    channels: list[ChannelBreakdownResponse] = Field(default_factory=list)
    source: str = "backend"


class TicketCreateRequest(BaseModel):
    title: str
    description: str
    category: str = "other"
    priority: str = "medium"
    channel: str = "app"
    user_id: str | None = None


class TicketUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_to: str | None = None
    category: str | None = None


class TicketReplyRequest(BaseModel):
    content: str
    is_internal: bool = False


class TicketAssignRequest(BaseModel):
    agent_id: str


class SupportExportRequest(BaseModel):
    format: str = "csv"
    scope: str = "tickets"
