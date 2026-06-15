from pydantic import BaseModel, Field


class RbacKpiResponse(BaseModel):
    roles_count: int = 12
    roles_change: float = 9.1
    roles_sparkline: list[float] = Field(default_factory=list)
    permissions_count: int = 164
    permissions_change: float = 6.7
    permissions_sparkline: list[float] = Field(default_factory=list)
    affected_users: int = 86
    affected_users_change: float = 12.4
    affected_users_sparkline: list[float] = Field(default_factory=list)
    super_admins: int = 4
    super_admins_change: float = 0.0
    changes_30d: int = 27
    changes_30d_change: float = 18.2
    changes_30d_sparkline: list[float] = Field(default_factory=list)
    security_alerts: int = 3
    security_alerts_change: float = 50.0
    security_alerts_sparkline: list[float] = Field(default_factory=list)


class RbacRoleItem(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None = None
    user_count: int = 0
    permissions_count: int = 0
    created_at_label: str | None = None
    is_system: bool = False
    status: str = "active"


class RbacPermissionItem(BaseModel):
    id: str
    slug: str
    module: str
    action: str
    label: str
    description: str | None = None
    risk_level: str = "low"
    risk_label: str = "Faible"


class RbacMatrixCell(BaseModel):
    role_slug: str
    module: str
    can_view: bool = False
    can_create: bool = False
    can_update: bool = False
    can_delete: bool = False
    can_export: bool = False
    can_validate: bool = False
    can_approve: bool = False
    access_level: str = "forbidden"


class RbacUserAssignment(BaseModel):
    id: str
    name: str
    email: str
    role_slug: str
    role_label: str
    custom_permissions: list[str] = Field(default_factory=list)
    last_login_at: str | None = None
    two_fa_enabled: bool = False
    status: str = "active"
    status_label: str = "Actif"


class RbacUserPermissionOverride(BaseModel):
    id: str
    user_email: str
    user_name: str
    role_slug: str
    permission_slug: str
    grant_type: str
    grant_type_label: str
    access_level: str = "allowed"


class RbacTemporaryPermissionItem(BaseModel):
    id: str
    user_email: str
    user_name: str
    permission_slug: str
    permission_label: str
    granted_by: str | None = None
    expires_at: str | None = None


class RbacAuditLogItem(BaseModel):
    id: str
    actor_name: str
    actor_email: str | None = None
    permission_slug: str
    action: str
    old_value: str | None = None
    new_value: str | None = None
    ip_address: str | None = None
    occurred_at: str | None = None


class RbacHistoryItem(BaseModel):
    id: str
    event_type: str
    event_label: str
    actor_name: str
    target: str | None = None
    occurred_at: str | None = None


class RbacRiskAlertItem(BaseModel):
    id: str
    alert_type: str
    title: str
    severity: str
    severity_label: str
    user_email: str | None = None


class RbacSecurityPolicyItem(BaseModel):
    policy_key: str
    policy_label: str
    policy_value: str | None = None
    enabled: bool = False


class RbacTenantItem(BaseModel):
    id: str
    slug: str
    name: str
    user_count: int = 0
    role_count: int = 0
    status: str = "active"


class AnalyticsPoint(BaseModel):
    label: str
    value: float


class AnalyticsSeries(BaseModel):
    key: str
    title: str
    data: list[AnalyticsPoint] = Field(default_factory=list)


class RoleDistributionItem(BaseModel):
    role_slug: str
    role_label: str
    count: int
    percent: float
    color: str


class RbacRoleCreate(BaseModel):
    slug: str
    name: str
    description: str | None = None


class RbacRoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class RbacPermissionCreate(BaseModel):
    slug: str
    module: str
    action: str
    label: str
    description: str | None = None
    risk_level: str = "low"


class RbacUserPermissionsUpdate(BaseModel):
    role_slug: str | None = None
    custom_permissions: list[str] = Field(default_factory=list)
    exceptions: list[str] = Field(default_factory=list)


class RbacDashboardResponse(BaseModel):
    kpis: RbacKpiResponse
    roles: list[RbacRoleItem] = Field(default_factory=list)
    permissions: list[RbacPermissionItem] = Field(default_factory=list)
    matrix: list[RbacMatrixCell] = Field(default_factory=list)
    matrix_modules: list[str] = Field(default_factory=list)
    matrix_actions: list[str] = Field(default_factory=list)
    user_assignments: list[RbacUserAssignment] = Field(default_factory=list)
    user_overrides: list[RbacUserPermissionOverride] = Field(default_factory=list)
    temporary_permissions: list[RbacTemporaryPermissionItem] = Field(default_factory=list)
    audit_logs: list[RbacAuditLogItem] = Field(default_factory=list)
    history: list[RbacHistoryItem] = Field(default_factory=list)
    risk_alerts: list[RbacRiskAlertItem] = Field(default_factory=list)
    security_policies: list[RbacSecurityPolicyItem] = Field(default_factory=list)
    tenants: list[RbacTenantItem] = Field(default_factory=list)
    role_distribution: list[RoleDistributionItem] = Field(default_factory=list)
    analytics: list[AnalyticsSeries] = Field(default_factory=list)
    read_only: bool = True
    source: str = "backend"
