from pydantic import BaseModel, Field


class ActivityLogKpiResponse(BaseModel):
    total_activities: int = 4840
    total_change: float = 18.6
    total_sparkline: list[float] = Field(default_factory=list)
    admin_activities: int = 40
    admin_change: float = 12.4
    partner_activities: int = 26
    partner_change: float = 9.3
    driver_activities: int = 42
    driver_change: float = 15.2
    system_activities: int = 0
    system_change: float = 0.0
    anomalies: int = 0
    anomalies_change: float = 0.0


class ActivityLogEventItem(BaseModel):
    id: str
    event_id: str
    occurred_at: str | None = None
    actor_id: str | None = None
    actor_type: str
    actor_type_label: str
    actor_name: str
    actor_role: str | None = None
    action: str
    action_label: str | None = None
    description: str | None = None
    resource_type: str
    resource_id: str | None = None
    reference: str | None = None
    corridor: str
    corridor_label: str
    severity: str
    severity_label: str
    status: str
    status_label: str
    impact: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    device: str | None = None
    browser: str | None = None
    os_name: str | None = None
    before_state: dict | None = None
    after_state: dict | None = None
    corridors_impacted: list[str] = Field(default_factory=list)
    is_anomaly: bool = False


class HeatmapCell(BaseModel):
    day: int
    hour: int
    count: int


class TopActivityItem(BaseModel):
    label: str
    count: int
    percent: float
    color: str


class CorridorHealthItem(BaseModel):
    corridor: str
    corridor_label: str
    events: int
    anomalies: int
    coherence: str
    coherence_label: str
    latency_ms: float | None = None


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class ActorDistributionItem(BaseModel):
    actor_type: str
    actor_label: str
    count: int
    percent: float


class SeverityDistributionItem(BaseModel):
    severity: str
    severity_label: str
    count: int


class ActivityLogDashboardResponse(BaseModel):
    kpis: ActivityLogKpiResponse
    events: list[ActivityLogEventItem] = Field(default_factory=list)
    live_events: list[ActivityLogEventItem] = Field(default_factory=list)
    anomalies: list[ActivityLogEventItem] = Field(default_factory=list)
    heatmap: list[HeatmapCell] = Field(default_factory=list)
    top_activities: list[TopActivityItem] = Field(default_factory=list)
    corridor_health: list[CorridorHealthItem] = Field(default_factory=list)
    actor_distribution: list[ActorDistributionItem] = Field(default_factory=list)
    severity_distribution: list[SeverityDistributionItem] = Field(default_factory=list)
    analytics: list[AnalyticsSeries] = Field(default_factory=list)
    total: int = 0
    sensitive_access: bool = False
    read_only: bool = True
    source: str = "backend"


class ActivityLogExportRequest(BaseModel):
    format: str = "csv"
    period: str = "30d"
