from sqlalchemy.orm import Session

from app.models.rbac_ops import (
    RbacPermission,
    RbacPermissionAuditLog,
    RbacPermissionHistory,
    RbacRiskAlert,
    RbacRole,
    RbacRolePermission,
    RbacSecurityPolicy,
    RbacTemporaryPermission,
    RbacTenant,
    RbacUserPermission,
    RbacUserRole,
)
from app.schemas.rbac_dashboard import (
    AnalyticsPoint,
    AnalyticsSeries,
    RbacAuditLogItem,
    RbacDashboardResponse,
    RbacHistoryItem,
    RbacKpiResponse,
    RbacMatrixCell,
    RbacPermissionItem,
    RbacRiskAlertItem,
    RbacRoleItem,
    RbacSecurityPolicyItem,
    RbacTemporaryPermissionItem,
    RbacTenantItem,
    RbacUserAssignment,
    RbacUserPermissionOverride,
    RoleDistributionItem,
)
from app.services.rbac_ops_service import ACTIONS, MODULES, ROLE_COLORS, ROLE_MATRIX, RbacOpsService, _module_slug

POLICY_LABELS = {
    "mfa_required": "MFA obligatoire",
    "session_rotation_days": "Rotation sessions",
    "ip_whitelist": "Restriction IP (whitelist)",
    "geo_countries": "Restriction géographique",
}


class RbacDashboardService:
    def __init__(self, db: Session):
        self.db = db
        RbacOpsService(db).seed_if_empty()

    def get_dashboard(self) -> RbacDashboardResponse:
        roles = self.db.query(RbacRole).all()
        permissions = self.db.query(RbacPermission).all()
        users = self.db.query(RbacUserRole).all()
        overrides = self.db.query(RbacUserPermission).all()
        temporary = self.db.query(RbacTemporaryPermission).all()
        audit = self.db.query(RbacPermissionAuditLog).order_by(RbacPermissionAuditLog.occurred_at.desc()).limit(50).all()
        history = self.db.query(RbacPermissionHistory).order_by(RbacPermissionHistory.occurred_at.desc()).limit(50).all()
        alerts = self.db.query(RbacRiskAlert).all()
        policies = self.db.query(RbacSecurityPolicy).all()
        tenants = self.db.query(RbacTenant).all()

        role_perms = self.db.query(RbacRolePermission).all()
        perm_by_role: dict[str, set[str]] = {}
        for rp in role_perms:
            perm_by_role.setdefault(rp.role_slug, set()).add(rp.permission_slug)

        total_users = sum(r.user_count for r in roles) or 86

        return RbacDashboardResponse(
            kpis=RbacKpiResponse(
                roles_count=len(roles) or 12, roles_change=9.1, roles_sparkline=[8, 9, 9, 10, 11, 11, 12],
                permissions_count=len(permissions) or 164, permissions_change=6.7, permissions_sparkline=[140, 148, 152, 156, 160, 162, 164],
                affected_users=total_users, affected_users_change=12.4, affected_users_sparkline=[72, 74, 78, 80, 82, 84, 86],
                super_admins=4, super_admins_change=0.0,
                changes_30d=27, changes_30d_change=18.2, changes_30d_sparkline=[12, 15, 18, 20, 22, 25, 27],
                security_alerts=len(alerts) or 3, security_alerts_change=50.0, security_alerts_sparkline=[1, 1, 2, 2, 2, 3, 3],
            ),
            roles=[self._role(r) for r in roles],
            permissions=[self._permission(p) for p in permissions],
            matrix=self._build_matrix(role_perms),
            matrix_modules=MODULES,
            matrix_actions=ACTIONS,
            user_assignments=[self._user(u, perm_by_role) for u in users],
            user_overrides=[self._override(o, users) for o in overrides],
            temporary_permissions=[self._temp(t, users) for t in temporary],
            audit_logs=[self._audit(a) for a in audit],
            history=[self._history(h) for h in history],
            risk_alerts=[self._alert(a) for a in alerts],
            security_policies=[self._policy(p) for p in policies],
            tenants=[self._tenant(t) for t in tenants],
            role_distribution=[
                RoleDistributionItem(
                    role_slug=r.slug, role_label=RbacOpsService.role_label(r.slug),
                    count=r.user_count, percent=round(r.user_count / total_users * 100, 1),
                    color=ROLE_COLORS.get(r.slug, "#94A3B8"),
                )
                for r in roles
            ],
            analytics=[
                AnalyticsSeries(key="role_distribution", title="Répartition des rôles", data=[
                    AnalyticsPoint(label=RbacOpsService.role_label(r.slug), value=float(r.user_count)) for r in roles[:8]
                ]),
                AnalyticsSeries(key="permission_changes", title="Changements permissions", data=[
                    AnalyticsPoint(label=m, value=v) for m, v in zip(["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"], [4, 6, 8, 5, 7, 9])
                ]),
                AnalyticsSeries(key="users_by_permission", title="Utilisateurs par permission", data=[
                    AnalyticsPoint(label="view", value=86), AnalyticsPoint(label="export", value=24),
                    AnalyticsPoint(label="approve", value=12), AnalyticsPoint(label="delete", value=8),
                ]),
            ],
            read_only=True,
            source="backend",
        )

    def _role(self, r: RbacRole) -> RbacRoleItem:
        return RbacRoleItem(
            id=str(r.id), slug=r.slug, name=r.name, description=r.description,
            user_count=r.user_count, permissions_count=r.permissions_count,
            created_at_label=r.created_at_label, is_system=r.is_system, status=r.status,
        )

    def _permission(self, p: RbacPermission) -> RbacPermissionItem:
        return RbacPermissionItem(
            id=str(p.id), slug=p.slug, module=p.module, action=p.action, label=p.label,
            description=p.description, risk_level=p.risk_level, risk_label=RbacOpsService.risk_label(p.risk_level),
        )

    def _user(self, u: RbacUserRole, perm_by_role: dict[str, set[str]]) -> RbacUserAssignment:
        custom = list(perm_by_role.get(u.role_slug, set()))[:3]
        return RbacUserAssignment(
            id=str(u.id), name=u.user_name, email=u.user_email, role_slug=u.role_slug,
            role_label=RbacOpsService.role_label(u.role_slug),
            custom_permissions=custom, last_login_at=u.last_login_at,
            two_fa_enabled=u.two_fa_enabled, status=u.status,
            status_label="Actif" if u.status == "active" else u.status,
        )

    def _override(self, o: RbacUserPermission, users: list[RbacUserRole]) -> RbacUserPermissionOverride:
        user = next((u for u in users if u.user_email == o.user_email), None)
        return RbacUserPermissionOverride(
            id=str(o.id), user_email=o.user_email, user_name=user.user_name if user else o.user_email,
            role_slug=user.role_slug if user else "", permission_slug=o.permission_slug,
            grant_type=o.grant_type, grant_type_label=RbacOpsService.grant_label(o.grant_type),
            access_level=o.access_level,
        )

    def _temp(self, t: RbacTemporaryPermission, users: list[RbacUserRole]) -> RbacTemporaryPermissionItem:
        user = next((u for u in users if u.user_email == t.user_email), None)
        return RbacTemporaryPermissionItem(
            id=str(t.id), user_email=t.user_email, user_name=user.user_name if user else t.user_email,
            permission_slug=t.permission_slug, permission_label=t.permission_slug.replace(".", " — "),
            granted_by=t.granted_by, expires_at=t.expires_at,
        )

    def _audit(self, a: RbacPermissionAuditLog) -> RbacAuditLogItem:
        return RbacAuditLogItem(
            id=str(a.id), actor_name=a.actor_name, actor_email=a.actor_email,
            permission_slug=a.permission_slug, action=a.action,
            old_value=a.old_value, new_value=a.new_value, ip_address=a.ip_address, occurred_at=a.occurred_at,
        )

    def _history(self, h: RbacPermissionHistory) -> RbacHistoryItem:
        return RbacHistoryItem(
            id=str(h.id), event_type=h.event_type, event_label=h.event_label,
            actor_name=h.actor_name, target=h.target, occurred_at=h.occurred_at,
        )

    def _alert(self, a: RbacRiskAlert) -> RbacRiskAlertItem:
        return RbacRiskAlertItem(
            id=str(a.id), alert_type=a.alert_type, title=a.title, severity=a.severity,
            severity_label=RbacOpsService.severity_label(a.severity), user_email=a.user_email,
        )

    def _policy(self, p: RbacSecurityPolicy) -> RbacSecurityPolicyItem:
        return RbacSecurityPolicyItem(
            policy_key=p.policy_key, policy_label=POLICY_LABELS.get(p.policy_key, p.policy_key),
            policy_value=p.policy_value, enabled=p.enabled,
        )

    def _tenant(self, t: RbacTenant) -> RbacTenantItem:
        return RbacTenantItem(id=str(t.id), slug=t.slug, name=t.name, user_count=t.user_count, role_count=t.role_count, status=t.status)

    def _build_matrix(self, role_perms: list[RbacRolePermission]) -> list[RbacMatrixCell]:
        perm_map: dict[tuple[str, str], str] = {}
        for rp in role_perms:
            parts = rp.permission_slug.rsplit(".", 1)
            if len(parts) != 2:
                continue
            mod_slug, action = parts
            module = next((m for m in MODULES if _module_slug(m) == mod_slug), mod_slug)
            perm_map[(rp.role_slug, f"{module}:{action}")] = rp.access_level

        cells: list[RbacMatrixCell] = []
        for role_slug in ROLE_MATRIX:
            for module in MODULES:
                level = ROLE_MATRIX.get(role_slug, {}).get(module, "forbidden")
                actions = {a: level != "forbidden" and (level == "allowed" or a in {"view", "update"}) for a in ACTIONS}
                cells.append(RbacMatrixCell(
                    role_slug=role_slug, module=module,
                    can_view=actions.get("view", False), can_create=actions.get("create", False),
                    can_update=actions.get("update", False), can_delete=actions.get("delete", False),
                    can_export=actions.get("export", False), can_validate=actions.get("validate", False),
                    can_approve=actions.get("approve", False), access_level=level,
                ))
        return cells
