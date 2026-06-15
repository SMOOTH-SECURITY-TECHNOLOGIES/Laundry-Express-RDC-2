import { features } from '../../config/features';
import { realApi, type BackendRbacDashboardResponse } from '../../services/real-api';
import type { RbacDashboardSummary } from './rbac-types';

export const RBAC_WRITE_ENABLED = import.meta.env.VITE_RBAC_WRITE_ENABLED !== 'false';

let cached: RbacDashboardSummary | null = null;
let promise: Promise<RbacDashboardSummary> | null = null;

export function invalidateRbacCache(): void { cached = null; promise = null; }

function map(raw: BackendRbacDashboardResponse): RbacDashboardSummary {
  return {
    kpis: {
      rolesCount: raw.kpis.roles_count, rolesChange: raw.kpis.roles_change, rolesSparkline: raw.kpis.roles_sparkline ?? [],
      permissionsCount: raw.kpis.permissions_count, permissionsChange: raw.kpis.permissions_change, permissionsSparkline: raw.kpis.permissions_sparkline ?? [],
      affectedUsers: raw.kpis.affected_users, affectedUsersChange: raw.kpis.affected_users_change, affectedUsersSparkline: raw.kpis.affected_users_sparkline ?? [],
      superAdmins: raw.kpis.super_admins, superAdminsChange: raw.kpis.super_admins_change,
      changes30d: raw.kpis.changes_30d, changes30dChange: raw.kpis.changes_30d_change, changes30dSparkline: raw.kpis.changes_30d_sparkline ?? [],
      securityAlerts: raw.kpis.security_alerts, securityAlertsChange: raw.kpis.security_alerts_change, securityAlertsSparkline: raw.kpis.security_alerts_sparkline ?? [],
    },
    roles: raw.roles.map((r) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description ?? undefined,
      userCount: r.user_count, permissionsCount: r.permissions_count, createdAtLabel: r.created_at_label ?? undefined,
      isSystem: r.is_system, status: r.status,
    })),
    permissions: raw.permissions.map((p) => ({
      id: p.id, slug: p.slug, module: p.module, action: p.action, label: p.label,
      description: p.description ?? undefined, riskLevel: p.risk_level, riskLabel: p.risk_label,
    })),
    matrix: raw.matrix.map((c) => ({
      roleSlug: c.role_slug, module: c.module,
      canView: c.can_view, canCreate: c.can_create, canUpdate: c.can_update, canDelete: c.can_delete,
      canExport: c.can_export, canValidate: c.can_validate, canApprove: c.can_approve,
      accessLevel: c.access_level as RbacDashboardSummary['matrix'][0]['accessLevel'],
    })),
    matrixModules: raw.matrix_modules,
    matrixActions: raw.matrix_actions,
    userAssignments: raw.user_assignments.map((u) => ({
      id: u.id, name: u.name, email: u.email, roleSlug: u.role_slug, roleLabel: u.role_label,
      customPermissions: u.custom_permissions, lastLoginAt: u.last_login_at ?? undefined,
      twoFaEnabled: u.two_fa_enabled, status: u.status, statusLabel: u.status_label,
    })),
    userOverrides: raw.user_overrides.map((o) => ({
      id: o.id, userEmail: o.user_email, userName: o.user_name, roleSlug: o.role_slug,
      permissionSlug: o.permission_slug, grantType: o.grant_type, grantTypeLabel: o.grant_type_label, accessLevel: o.access_level,
    })),
    temporaryPermissions: raw.temporary_permissions.map((t) => ({
      id: t.id, userEmail: t.user_email, userName: t.user_name, permissionSlug: t.permission_slug,
      permissionLabel: t.permission_label, grantedBy: t.granted_by ?? undefined, expiresAt: t.expires_at ?? undefined,
    })),
    auditLogs: raw.audit_logs.map((a) => ({
      id: a.id, actorName: a.actor_name, actorEmail: a.actor_email ?? undefined, permissionSlug: a.permission_slug,
      action: a.action, oldValue: a.old_value ?? undefined, newValue: a.new_value ?? undefined,
      ipAddress: a.ip_address ?? undefined, occurredAt: a.occurred_at ?? undefined,
    })),
    history: raw.history.map((h) => ({
      id: h.id, eventType: h.event_type, eventLabel: h.event_label, actorName: h.actor_name,
      target: h.target ?? undefined, occurredAt: h.occurred_at ?? undefined,
    })),
    riskAlerts: raw.risk_alerts.map((a) => ({
      id: a.id, alertType: a.alert_type, title: a.title, severity: a.severity,
      severityLabel: a.severity_label, userEmail: a.user_email ?? undefined,
    })),
    securityPolicies: raw.security_policies.map((p) => ({
      policyKey: p.policy_key, policyLabel: p.policy_label, policyValue: p.policy_value ?? undefined, enabled: p.enabled,
    })),
    tenants: raw.tenants.map((t) => ({
      id: t.id, slug: t.slug, name: t.name, userCount: t.user_count, roleCount: t.role_count, status: t.status,
    })),
    roleDistribution: raw.role_distribution.map((r) => ({
      roleSlug: r.role_slug, roleLabel: r.role_label, count: r.count, percent: r.percent, color: r.color,
    })),
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    readOnly: raw.read_only,
    source: raw.source,
  };
}

export async function fetchRbacBundle(): Promise<RbacDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour RBAC.');
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token?.startsWith('TOKEN-')) {
    throw Object.assign(new Error('Session mock incompatible avec le backend.'), { status: 401 });
  }
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getRbacDashboard()
    .then((raw) => { cached = map(raw); promise = null; return cached; })
    .catch((err) => { promise = null; throw err; });
  return promise;
}

export function trackRbacEvent(event: string): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event, source: 'rbac_center' });
  }
}
