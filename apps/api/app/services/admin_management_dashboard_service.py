from sqlalchemy.orm import Session

from app.models.admin_management_ops import (
    AdminMgmtActivityLog,
    AdminMgmtAuditLog,
    AdminMgmtInvitation,
    AdminMgmtRole,
    AdminMgmtSecurityAlert,
    AdminMgmtSession,
    AdminMgmtUser,
)
from app.schemas.admin_management_dashboard import (
    ActivityLogItem,
    AdminInvitationItem,
    AdminManagementDashboardResponse,
    AdminMgmtKpiResponse,
    AdminRoleItem,
    AdminSessionItem,
    AdminUserItem,
    AnalyticsPoint,
    AnalyticsSeries,
    AuditLogItem,
    RbacCell,
    RoleDistributionItem,
    SecurityAlertItem,
    SecuritySummary,
)
from app.services.admin_management_ops_service import (
    RESOURCES,
    ROLE_COLORS,
    ROLE_MATRIX,
    AdminManagementOpsService,
)

RESULT_LABELS = {"success": "Succès", "failed": "Échec", "error": "Erreur"}


class AdminManagementDashboardService:
    def __init__(self, db: Session):
        self.db = db
        AdminManagementOpsService(db).seed_if_empty()

    def get_dashboard(self) -> AdminManagementDashboardResponse:
        admins = self.db.query(AdminMgmtUser).all()
        roles = self.db.query(AdminMgmtRole).all()
        invitations = self.db.query(AdminMgmtInvitation).filter(AdminMgmtInvitation.status == "pending").all()
        sessions = self.db.query(AdminMgmtSession).filter(AdminMgmtSession.is_active == True).all()  # noqa: E712
        activity = self.db.query(AdminMgmtActivityLog).order_by(AdminMgmtActivityLog.occurred_at.desc()).limit(50).all()
        audit = self.db.query(AdminMgmtAuditLog).order_by(AdminMgmtAuditLog.occurred_at.desc()).limit(50).all()
        alerts = self.db.query(AdminMgmtSecurityAlert).all()

        role_counts = {r.slug: r.user_count for r in roles}
        total = sum(role_counts.values()) or 24

        return AdminManagementDashboardResponse(
            kpis=AdminMgmtKpiResponse(
                total_admins=24, total_admins_change=8.0, total_admins_sparkline=[18, 19, 20, 21, 22, 23, 24],
                super_admins=4, super_admins_change=0.0,
                active_admins=15, active_admins_change=15.4,
                roles_count=7, roles_change=0.0,
                active_sessions=19, active_sessions_change=11.8,
                pending_invitations=3, pending_invitations_change=0.0,
            ),
            admins=[self._admin(a) for a in admins],
            roles=[self._role(r) for r in roles],
            rbac_matrix=self._build_matrix(),
            rbac_resources=RESOURCES,
            invitations=[self._inv(i) for i in invitations],
            sessions=[self._session(s) for s in sessions],
            security=SecuritySummary(active_sessions=19, logins_24h=42, login_failures=3, two_fa_pct=68.0),
            activity_logs=[self._activity(a) for a in activity],
            audit_logs=[self._audit(a) for a in audit],
            security_alerts=[self._alert(a) for a in alerts],
            role_distribution=[
                RoleDistributionItem(role_slug=r.slug, role_label=r.name, count=r.user_count, percent=round(r.user_count / total * 100, 1), color=ROLE_COLORS.get(r.slug, "#94A3B8"))
                for r in roles
            ],
            analytics=[
                AnalyticsSeries(key="admin_activity", title="Activité admin", data=[AnalyticsPoint(label=d, value=v) for d, v in zip(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], [42, 48, 52, 58, 64, 28, 18])]),
                AnalyticsSeries(key="admin_creations", title="Créations admin", data=[AnalyticsPoint(label=m, value=v) for m, v in zip(["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"], [2, 3, 4, 2, 5, 3])]),
            ],
            read_only=True,
            source="backend",
        )

    def _admin(self, a: AdminMgmtUser) -> AdminUserItem:
        return AdminUserItem(
            id=str(a.id), name=a.name, email=a.email, phone=a.phone, role_slug=a.role_slug,
            role_label=AdminManagementOpsService.role_label(a.role_slug),
            status=a.status, status_label=AdminManagementOpsService.status_label(a.status),
            two_fa_enabled=a.two_fa_enabled, last_login_at=a.last_login_at, avatar_url=a.avatar_url,
        )

    def _role(self, r: AdminMgmtRole) -> AdminRoleItem:
        return AdminRoleItem(id=str(r.id), slug=r.slug, name=r.name, description=r.description, user_count=r.user_count, permissions_count=r.permissions_count, created_at_label=r.created_at_label)

    def _inv(self, i: AdminMgmtInvitation) -> AdminInvitationItem:
        return AdminInvitationItem(
            id=str(i.id), email=i.email, role_slug=i.role_slug,
            role_label=AdminManagementOpsService.role_label(i.role_slug),
            invited_by=i.invited_by, status=i.status, expires_at=i.expires_at,
            created_at=i.created_at.isoformat() if i.created_at else None,
        )

    def _session(self, s: AdminMgmtSession) -> AdminSessionItem:
        return AdminSessionItem(
            id=str(s.id), user_name=s.user_name, user_email=s.user_email,
            ip_address=s.ip_address, city=s.city, device=s.device, browser=s.browser,
            is_active=s.is_active, last_seen_at=s.last_seen_at,
        )

    def _activity(self, a: AdminMgmtActivityLog) -> ActivityLogItem:
        return ActivityLogItem(
            id=str(a.id), occurred_at=a.occurred_at, actor_name=a.actor_name,
            action=a.action, action_label=a.action_label, target=a.target,
            ip_address=a.ip_address, result=a.result, result_label=RESULT_LABELS.get(a.result, a.result),
        )

    def _audit(self, a: AdminMgmtAuditLog) -> AuditLogItem:
        return AuditLogItem(
            id=str(a.id), occurred_at=a.occurred_at, actor_name=a.actor_name,
            resource_type=a.resource_type, resource_id=a.resource_id,
            old_state=a.old_state, new_state=a.new_state,
        )

    def _alert(self, a: AdminMgmtSecurityAlert) -> SecurityAlertItem:
        return SecurityAlertItem(id=str(a.id), alert_type=a.alert_type, title=a.title, severity=a.severity, count=a.count)

    def _build_matrix(self) -> list[RbacCell]:
        cells: list[RbacCell] = []
        for role_slug, resources in ROLE_MATRIX.items():
            for resource in RESOURCES:
                perms = resources.get(resource, {})
                cells.append(RbacCell(
                    role_slug=role_slug, resource=resource,
                    can_view=perms.get("view", False), can_create=perms.get("create", False),
                    can_update=perms.get("update", False), can_delete=perms.get("delete", False),
                    can_export=perms.get("export", False),
                ))
        return cells
