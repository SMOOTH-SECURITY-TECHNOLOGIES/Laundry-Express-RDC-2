from pydantic import BaseModel, Field


class AdminMgmtKpiResponse(BaseModel):
    total_admins: int = 24
    total_admins_change: float = 8.0
    total_admins_sparkline: list[float] = Field(default_factory=list)
    super_admins: int = 4
    super_admins_change: float = 0.0
    active_admins: int = 15
    active_admins_change: float = 15.4
    roles_count: int = 7
    roles_change: float = 0.0
    active_sessions: int = 19
    active_sessions_change: float = 11.8
    pending_invitations: int = 3
    pending_invitations_change: float = 0.0


class AdminUserItem(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    role_slug: str
    role_label: str
    status: str
    status_label: str
    two_fa_enabled: bool
    last_login_at: str | None = None
    avatar_url: str | None = None


class AdminRoleItem(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None = None
    user_count: int
    permissions_count: int
    created_at_label: str | None = None


class RbacCell(BaseModel):
    role_slug: str
    resource: str
    can_view: bool = False
    can_create: bool = False
    can_update: bool = False
    can_delete: bool = False
    can_export: bool = False


class AdminInvitationItem(BaseModel):
    id: str
    email: str
    role_slug: str
    role_label: str
    invited_by: str | None = None
    status: str
    expires_at: str | None = None
    created_at: str | None = None


class AdminSessionItem(BaseModel):
    id: str
    user_name: str
    user_email: str
    ip_address: str | None = None
    city: str | None = None
    device: str | None = None
    browser: str | None = None
    is_active: bool
    last_seen_at: str | None = None


class SecuritySummary(BaseModel):
    active_sessions: int = 19
    logins_24h: int = 42
    login_failures: int = 3
    two_fa_pct: float = 68.0


class ActivityLogItem(BaseModel):
    id: str
    occurred_at: str | None = None
    actor_name: str
    action: str
    action_label: str
    target: str | None = None
    ip_address: str | None = None
    result: str
    result_label: str


class AuditLogItem(BaseModel):
    id: str
    occurred_at: str | None = None
    actor_name: str
    resource_type: str
    resource_id: str | None = None
    old_state: dict | None = None
    new_state: dict | None = None


class SecurityAlertItem(BaseModel):
    id: str
    alert_type: str
    title: str
    severity: str
    count: int


class RoleDistributionItem(BaseModel):
    role_slug: str
    role_label: str
    count: int
    percent: float
    color: str


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class AdminManagementDashboardResponse(BaseModel):
    kpis: AdminMgmtKpiResponse
    admins: list[AdminUserItem] = Field(default_factory=list)
    roles: list[AdminRoleItem] = Field(default_factory=list)
    rbac_matrix: list[RbacCell] = Field(default_factory=list)
    rbac_resources: list[str] = Field(default_factory=list)
    invitations: list[AdminInvitationItem] = Field(default_factory=list)
    sessions: list[AdminSessionItem] = Field(default_factory=list)
    security: SecuritySummary = Field(default_factory=SecuritySummary)
    activity_logs: list[ActivityLogItem] = Field(default_factory=list)
    audit_logs: list[AuditLogItem] = Field(default_factory=list)
    security_alerts: list[SecurityAlertItem] = Field(default_factory=list)
    role_distribution: list[RoleDistributionItem] = Field(default_factory=list)
    analytics: list[AnalyticsSeries] = Field(default_factory=list)
    read_only: bool = True
    source: str = "backend"


class AdminUserCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    role_slug: str = "admin"


class AdminInvitationCreate(BaseModel):
    email: str
    role_slug: str = "admin"
