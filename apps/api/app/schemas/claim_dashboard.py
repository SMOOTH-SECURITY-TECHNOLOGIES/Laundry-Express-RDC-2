from pydantic import BaseModel, Field


class ClaimKpiResponse(BaseModel):
    open_claims: int = 0
    open_claims_change: float = 0
    open_claims_sparkline: list[int] = Field(default_factory=list)
    critical_claims: int = 0
    critical_claims_change: float = 0
    critical_claims_sparkline: list[int] = Field(default_factory=list)
    active_disputes: int = 0
    active_disputes_change: float = 0
    active_disputes_sparkline: list[int] = Field(default_factory=list)
    refund_exposure: float = 0
    refund_exposure_change: float = 0
    refund_exposure_sparkline: list[float] = Field(default_factory=list)
    sla_compliance: float = 0
    sla_compliance_change: float = 0
    sla_compliance_sparkline: list[float] = Field(default_factory=list)
    avg_resolution_hours: float = 0
    avg_resolution_change: float = 0
    avg_resolution_sparkline: list[float] = Field(default_factory=list)
    resolved_this_month: int = 0
    resolved_change: float = 0
    resolved_sparkline: list[int] = Field(default_factory=list)
    amount_at_risk: float = 0
    amount_at_risk_change: float = 0
    amount_at_risk_sparkline: list[float] = Field(default_factory=list)


class ClaimListItemResponse(BaseModel):
    id: str
    claim_number: str
    title: str
    ai_summary: str
    client_name: str
    category: str
    category_label: str
    priority: str
    priority_label: str
    status: str
    status_label: str
    financial_impact: float
    sla_label: str
    sla_state: str
    sla_minutes_remaining: int | None
    updated_at: str | None
    partner_name: str | None = None


class ClaimDetailResponse(ClaimListItemResponse):
    description: str
    order_id: str | None = None
    driver_name: str | None = None
    risk_score: float = 0
    recommendation: str = ""
    timeline: list[dict] = Field(default_factory=list)
    notes: list[dict] = Field(default_factory=list)
    attachments: list[dict] = Field(default_factory=list)
    refunds: list[dict] = Field(default_factory=list)
    escalations: list[dict] = Field(default_factory=list)


class DistributionItemResponse(BaseModel):
    category: str
    count: int
    percent: float
    color: str


class SlaPanelResponse(BaseModel):
    in_sla: int
    at_risk: int
    breached: int
    compliance_percent: float
    by_category: list[dict] = Field(default_factory=list)


class WorkflowColumnResponse(BaseModel):
    stage: str
    stage_label: str
    claims: list[ClaimListItemResponse] = Field(default_factory=list)


class RootCauseResponse(BaseModel):
    cause: str
    occurrences: int
    trend: float
    impact: str


class HeatmapZoneResponse(BaseModel):
    zone: str
    claims: int
    density: float


class PartnerRiskResponse(BaseModel):
    partner_id: str
    partner_name: str
    claim_count: int
    avg_rating: float
    refund_amount: float
    risk_score: float


class DriverRiskResponse(BaseModel):
    driver_id: str
    driver_name: str
    incident_count: int
    complaints: int
    avg_rating: float
    risk_score: float


class RefundCenterResponse(BaseModel):
    pending_count: int
    pending_amount: float
    approved_count: int
    approved_amount: float
    paid_count: int
    paid_amount: float
    rejected_count: int
    rejected_amount: float
    total_exposure: float


class ClaimDashboardResponse(BaseModel):
    kpis: ClaimKpiResponse
    claims: list[ClaimListItemResponse] = Field(default_factory=list)
    distribution: list[DistributionItemResponse] = Field(default_factory=list)
    sla: SlaPanelResponse
    workflow: list[WorkflowColumnResponse] = Field(default_factory=list)
    root_causes: list[RootCauseResponse] = Field(default_factory=list)
    heatmap: list[HeatmapZoneResponse] = Field(default_factory=list)
    partner_risks: list[PartnerRiskResponse] = Field(default_factory=list)
    driver_risks: list[DriverRiskResponse] = Field(default_factory=list)
    refunds: RefundCenterResponse
    escalations: list[dict] = Field(default_factory=list)
    source: str = "backend"


class ClaimCreateRequest(BaseModel):
    title: str
    description: str
    type: str = "other"
    priority: str = "medium"
    customer_id: str | None = None
    order_id: str | None = None
    partner_id: str | None = None
    driver_id: str | None = None
    zone: str | None = None


class ClaimStatusRequest(BaseModel):
    status: str
    note: str | None = None


class ClaimAssignRequest(BaseModel):
    assignee_id: str


class ClaimNoteRequest(BaseModel):
    content: str
    is_internal: bool = True


class ClaimAttachmentRequest(BaseModel):
    file_url: str
    mime_type: str | None = None
    size: int | None = None


class ClaimRefundActionRequest(BaseModel):
    action: str
    amount: float | None = None
