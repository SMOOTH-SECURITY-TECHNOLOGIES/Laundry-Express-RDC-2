export interface RbacKpis {
  rolesCount: number; rolesChange: number; rolesSparkline: number[];
  permissionsCount: number; permissionsChange: number; permissionsSparkline: number[];
  affectedUsers: number; affectedUsersChange: number; affectedUsersSparkline: number[];
  superAdmins: number; superAdminsChange: number;
  changes30d: number; changes30dChange: number; changes30dSparkline: number[];
  securityAlerts: number; securityAlertsChange: number; securityAlertsSparkline: number[];
}

export interface RbacRole {
  id: string; slug: string; name: string; description?: string;
  userCount: number; permissionsCount: number; createdAtLabel?: string;
  isSystem: boolean; status: string;
}

export interface RbacPermission {
  id: string; slug: string; module: string; action: string; label: string;
  description?: string; riskLevel: string; riskLabel: string;
}

export interface RbacMatrixCell {
  roleSlug: string; module: string;
  canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean;
  canExport: boolean; canValidate: boolean; canApprove: boolean;
  accessLevel: 'allowed' | 'restricted' | 'forbidden';
}

export interface RbacUserAssignment {
  id: string; name: string; email: string; roleSlug: string; roleLabel: string;
  customPermissions: string[]; lastLoginAt?: string; twoFaEnabled: boolean;
  status: string; statusLabel: string;
}

export interface RbacUserOverride {
  id: string; userEmail: string; userName: string; roleSlug: string;
  permissionSlug: string; grantType: string; grantTypeLabel: string; accessLevel: string;
}

export interface RbacTemporaryPermission {
  id: string; userEmail: string; userName: string; permissionSlug: string;
  permissionLabel: string; grantedBy?: string; expiresAt?: string;
}

export interface RbacAuditLog {
  id: string; actorName: string; actorEmail?: string; permissionSlug: string;
  action: string; oldValue?: string; newValue?: string; ipAddress?: string; occurredAt?: string;
}

export interface RbacHistoryItem {
  id: string; eventType: string; eventLabel: string; actorName: string;
  target?: string; occurredAt?: string;
}

export interface RbacRiskAlert {
  id: string; alertType: string; title: string; severity: string;
  severityLabel: string; userEmail?: string;
}

export interface RbacSecurityPolicy {
  policyKey: string; policyLabel: string; policyValue?: string; enabled: boolean;
}

export interface RbacTenant {
  id: string; slug: string; name: string; userCount: number; roleCount: number; status: string;
}

export interface RoleDistribution {
  roleSlug: string; roleLabel: string; count: number; percent: number; color: string;
}

export interface RbacAnalyticsSeries {
  key: string; title: string; data: Array<{ label: string; value: number }>;
}

export interface RbacDashboardSummary {
  kpis: RbacKpis;
  roles: RbacRole[];
  permissions: RbacPermission[];
  matrix: RbacMatrixCell[];
  matrixModules: string[];
  matrixActions: string[];
  userAssignments: RbacUserAssignment[];
  userOverrides: RbacUserOverride[];
  temporaryPermissions: RbacTemporaryPermission[];
  auditLogs: RbacAuditLog[];
  history: RbacHistoryItem[];
  riskAlerts: RbacRiskAlert[];
  securityPolicies: RbacSecurityPolicy[];
  tenants: RbacTenant[];
  roleDistribution: RoleDistribution[];
  analytics: RbacAnalyticsSeries[];
  readOnly: boolean;
  source: string;
}
