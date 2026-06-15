export interface AdminMgmtKpis {
  totalAdmins: number; totalAdminsChange: number; totalAdminsSparkline: number[];
  superAdmins: number; superAdminsChange: number;
  activeAdmins: number; activeAdminsChange: number;
  rolesCount: number; rolesChange: number;
  activeSessions: number; activeSessionsChange: number;
  pendingInvitations: number; pendingInvitationsChange: number;
}

export interface AdminMgmtUser {
  id: string; name: string; email: string; phone?: string;
  roleSlug: string; roleLabel: string; status: string; statusLabel: string;
  twoFaEnabled: boolean; lastLoginAt?: string; avatarUrl?: string;
}

export interface AdminMgmtRole {
  id: string; slug: string; name: string; description?: string;
  userCount: number; permissionsCount: number; createdAtLabel?: string;
}

export interface RbacCell {
  roleSlug: string; resource: string;
  canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean; canExport: boolean;
}

export interface AdminInvitation {
  id: string; email: string; roleSlug: string; roleLabel: string;
  invitedBy?: string; status: string; expiresAt?: string; createdAt?: string;
}

export interface AdminSession {
  id: string; userName: string; userEmail: string;
  ipAddress?: string; city?: string; device?: string; browser?: string;
  isActive: boolean; lastSeenAt?: string;
}

export interface SecuritySummary {
  activeSessions: number; logins24h: number; loginFailures: number; twoFaPct: number;
}

export interface ActivityLog {
  id: string; occurredAt?: string; actorName: string; action: string; actionLabel: string;
  target?: string; ipAddress?: string; result: string; resultLabel: string;
}

export interface AuditLog {
  id: string; occurredAt?: string; actorName: string; resourceType: string;
  resourceId?: string; oldState?: Record<string, unknown>; newState?: Record<string, unknown>;
}

export interface SecurityAlert {
  id: string; alertType: string; title: string; severity: string; count: number;
}

export interface RoleDistribution {
  roleSlug: string; roleLabel: string; count: number; percent: number; color: string;
}

export interface AnalyticsSeries { key: string; title: string; data: { label: string; value: number }[]; }

export interface AdminMgmtDashboardSummary {
  kpis: AdminMgmtKpis; admins: AdminMgmtUser[]; roles: AdminMgmtRole[];
  rbacMatrix: RbacCell[]; rbacResources: string[];
  invitations: AdminInvitation[]; sessions: AdminSession[];
  security: SecuritySummary; activityLogs: ActivityLog[]; auditLogs: AuditLog[];
  securityAlerts: SecurityAlert[]; roleDistribution: RoleDistribution[];
  analytics: AnalyticsSeries[]; readOnly: boolean; source: string;
}
