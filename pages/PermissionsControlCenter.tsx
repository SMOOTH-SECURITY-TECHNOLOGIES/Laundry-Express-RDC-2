import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '../components/Icon';
import useRbacCenter from '../hooks/useRbacCenter';
import { RbacHeader } from '../components/admin/rbac/RbacHeader';
import { RbacKpiCards } from '../components/admin/rbac/RbacKpiCards';
import { RolesGrid } from '../components/admin/rbac/RolesGrid';
import { RbacMatrix } from '../components/admin/rbac/RbacMatrix';
import { PermissionsTable } from '../components/admin/rbac/PermissionsTable';
import { UsersAssignmentsTable } from '../components/admin/rbac/UsersAssignmentsTable';
import { AuditTrailPanel } from '../components/admin/rbac/AuditTrailPanel';
import { HistoryTimeline } from '../components/admin/rbac/HistoryTimeline';
import { RiskAlertsPanel } from '../components/admin/rbac/RiskAlertsPanel';
import { SecurityPoliciesPanel } from '../components/admin/rbac/SecurityPoliciesPanel';
import { RoleDistributionChart } from '../components/admin/rbac/RoleDistributionChart';
import { RbacAnalyticsCharts } from '../components/admin/rbac/RbacAnalyticsCharts';
import { TemporaryPermissionsPanel } from '../components/admin/rbac/TemporaryPermissionsPanel';
import { TenantsPanel } from '../components/admin/rbac/TenantsPanel';
import { UserOverridesPanel } from '../components/admin/rbac/UserOverridesPanel';
import { trackRbacEvent } from '../lib/admin/rbac-api';
import type { RbacRole, RbacUserAssignment } from '../lib/admin/rbac-types';

const TABS = ['overview', 'roles', 'permissions', 'matrix', 'users', 'audit', 'policies', 'reports'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Vue d'ensemble", roles: 'Rôles', permissions: 'Permissions', matrix: 'Matrice',
  users: 'Utilisateurs', audit: 'Audit Trail', policies: 'Politiques', reports: 'Rapports',
};
const MATRIX_ROLES = ['super_admin', 'admin', 'finance', 'support', 'marketing', 'partenaire', 'chauffeur', 'moderateur'];

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">{message}</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const PermissionsControlCenter: React.FC = () => {
  const {
    kpis, roles, permissions, matrix, matrixModules, userAssignments, userOverrides,
    temporaryPermissions, auditLogs, history, riskAlerts, securityPolicies, tenants,
    roleDistribution, analytics, loading, error, refresh,
  } = useRbacCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackRbacEvent('rbac_center_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const q = search.toLowerCase();
  const filteredRoles = useMemo(() => roles.filter((r) => !q || r.name.toLowerCase().includes(q) || r.slug.includes(q)), [roles, q]);
  const filteredPerms = useMemo(() => permissions.filter((p) => !q || p.slug.includes(q) || p.module.toLowerCase().includes(q)), [permissions, q]);
  const filteredUsers = useMemo(() => userAssignments.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q)), [userAssignments, q]);

  const onRoleAction = useCallback((action: string, role: RbacRole) => {
    trackRbacEvent(`rbac_role_${action.toLowerCase()}`);
    setToast(`${action} — ${role.name}`);
  }, []);

  const onUserAction = useCallback((action: string, user: RbacUserAssignment) => {
    trackRbacEvent(`rbac_user_${action.toLowerCase().replace(' ', '_')}`);
    setToast(`${action} — ${user.name}`);
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => refresh()} />;

  const roleTotal = roleDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <RbacHeader
        search={search} onSearchChange={setSearch} onRefresh={() => refresh()}
        onExport={() => setToast('Export CSV lancé')}
        onNewRole={() => { trackRbacEvent('rbac_role_created'); setToast('Nouveau rôle'); }}
        onCloneRole={() => setToast('Cloner un rôle')}
        onHistory={() => setTab('audit')}
      />
      {kpis && <RbacKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">{TABS.map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{TAB_LABELS[t]}</button>
      ))}</div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <RolesGrid roles={filteredRoles.slice(0, 8)} onAction={onRoleAction} />
            <RbacMatrix matrix={matrix} modules={matrixModules} roleSlugs={MATRIX_ROLES} compact />
          </div>
          <div className="space-y-6">
            <RoleDistributionChart data={roleDistribution} total={roleTotal} />
            <RiskAlertsPanel alerts={riskAlerts} />
            <HistoryTimeline items={history.slice(0, 5)} />
          </div>
          <div className="space-y-6">
            <UsersAssignmentsTable users={filteredUsers} onAction={onUserAction} />
            <TemporaryPermissionsPanel items={temporaryPermissions} />
          </div>
        </div>
      )}

      {tab === 'roles' && <RolesGrid roles={filteredRoles} onAction={onRoleAction} />}
      {tab === 'permissions' && <PermissionsTable permissions={filteredPerms} />}
      {tab === 'matrix' && <RbacMatrix matrix={matrix} modules={matrixModules} roleSlugs={MATRIX_ROLES} />}
      {tab === 'users' && (
        <div className="space-y-6">
          <UsersAssignmentsTable users={filteredUsers} onAction={onUserAction} />
          <UserOverridesPanel overrides={userOverrides} />
          <TemporaryPermissionsPanel items={temporaryPermissions} />
        </div>
      )}
      {tab === 'audit' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AuditTrailPanel logs={auditLogs} />
          <HistoryTimeline items={history} />
        </div>
      )}
      {tab === 'policies' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SecurityPoliciesPanel policies={securityPolicies} />
          <TenantsPanel tenants={tenants} />
        </div>
      )}
      {tab === 'reports' && <RbacAnalyticsCharts analytics={analytics} />}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>
      )}
    </div>
  );
};
