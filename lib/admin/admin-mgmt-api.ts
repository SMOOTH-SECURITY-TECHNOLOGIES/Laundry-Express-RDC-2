import { features } from '../../config/features';
import { realApi, type BackendAdminMgmtDashboardResponse } from '../../services/real-api';
import type { AdminMgmtDashboardSummary } from './admin-mgmt-types';

export const ADMIN_MGMT_WRITE_ENABLED = import.meta.env.VITE_ADMIN_MGMT_WRITE_ENABLED === 'true';

let cached: AdminMgmtDashboardSummary | null = null;
let promise: Promise<AdminMgmtDashboardSummary> | null = null;

export function invalidateAdminMgmtCache(): void { cached = null; promise = null; }

function map(raw: BackendAdminMgmtDashboardResponse): AdminMgmtDashboardSummary {
  return {
    kpis: {
      totalAdmins: raw.kpis.total_admins, totalAdminsChange: raw.kpis.total_admins_change, totalAdminsSparkline: raw.kpis.total_admins_sparkline ?? [],
      superAdmins: raw.kpis.super_admins, superAdminsChange: raw.kpis.super_admins_change,
      activeAdmins: raw.kpis.active_admins, activeAdminsChange: raw.kpis.active_admins_change,
      rolesCount: raw.kpis.roles_count, rolesChange: raw.kpis.roles_change,
      activeSessions: raw.kpis.active_sessions, activeSessionsChange: raw.kpis.active_sessions_change,
      pendingInvitations: raw.kpis.pending_invitations, pendingInvitationsChange: raw.kpis.pending_invitations_change,
    },
    admins: raw.admins.map((a) => ({
      id: a.id, name: a.name, email: a.email, phone: a.phone ?? undefined,
      roleSlug: a.role_slug, roleLabel: a.role_label, status: a.status, statusLabel: a.status_label,
      twoFaEnabled: a.two_fa_enabled, lastLoginAt: a.last_login_at ?? undefined, avatarUrl: a.avatar_url ?? undefined,
    })),
    roles: raw.roles.map((r) => ({ id: r.id, slug: r.slug, name: r.name, description: r.description ?? undefined, userCount: r.user_count, permissionsCount: r.permissions_count, createdAtLabel: r.created_at_label ?? undefined })),
    rbacMatrix: raw.rbac_matrix.map((c) => ({ roleSlug: c.role_slug, resource: c.resource, canView: c.can_view, canCreate: c.can_create, canUpdate: c.can_update, canDelete: c.can_delete, canExport: c.can_export })),
    rbacResources: raw.rbac_resources,
    invitations: raw.invitations.map((i) => ({ id: i.id, email: i.email, roleSlug: i.role_slug, roleLabel: i.role_label, invitedBy: i.invited_by ?? undefined, status: i.status, expiresAt: i.expires_at ?? undefined, createdAt: i.created_at ?? undefined })),
    sessions: raw.sessions.map((s) => ({ id: s.id, userName: s.user_name, userEmail: s.user_email, ipAddress: s.ip_address ?? undefined, city: s.city ?? undefined, device: s.device ?? undefined, browser: s.browser ?? undefined, isActive: s.is_active, lastSeenAt: s.last_seen_at ?? undefined })),
    security: { activeSessions: raw.security.active_sessions, logins24h: raw.security.logins_24h, loginFailures: raw.security.login_failures, twoFaPct: raw.security.two_fa_pct },
    activityLogs: raw.activity_logs.map((l) => ({ id: l.id, occurredAt: l.occurred_at ?? undefined, actorName: l.actor_name, action: l.action, actionLabel: l.action_label, target: l.target ?? undefined, ipAddress: l.ip_address ?? undefined, result: l.result, resultLabel: l.result_label })),
    auditLogs: raw.audit_logs.map((a) => ({ id: a.id, occurredAt: a.occurred_at ?? undefined, actorName: a.actor_name, resourceType: a.resource_type, resourceId: a.resource_id ?? undefined, oldState: a.old_state ?? undefined, newState: a.new_state ?? undefined })),
    securityAlerts: raw.security_alerts.map((a) => ({ id: a.id, alertType: a.alert_type, title: a.title, severity: a.severity, count: a.count })),
    roleDistribution: raw.role_distribution.map((r) => ({ roleSlug: r.role_slug, roleLabel: r.role_label, count: r.count, percent: r.percent, color: r.color })),
    analytics: raw.analytics.map((a) => ({ key: a.key, title: a.title, data: a.data.map((d) => ({ label: d.label, value: d.value })) })),
    readOnly: raw.read_only,
    source: raw.source,
  };
}

export async function fetchAdminMgmtBundle(): Promise<AdminMgmtDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour Admin Management.');
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token?.startsWith('TOKEN-')) {
    throw Object.assign(new Error('Session mock incompatible avec le backend. Reconnectez-vous avec un compte admin réel.'), { status: 401 });
  }
  if (cached) return cached;
  if (promise) return promise;
  promise = realApi.getAdminMgmtDashboard()
    .then((raw) => { cached = map(raw); promise = null; return cached; })
    .catch((err) => { promise = null; throw err; });
  return promise;
}

export function trackAdminMgmtEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'admin_management', ...detail } }));
}
