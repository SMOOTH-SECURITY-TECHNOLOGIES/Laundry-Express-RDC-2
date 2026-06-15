import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '../components/Icon';
import useAdminMgmtCenter from '../hooks/useAdminMgmtCenter';
import { AdminMgmtHeader } from '../components/admin/admin-mgmt/AdminMgmtHeader';
import { AdminKpiCards } from '../components/admin/admin-mgmt/AdminKpiCards';
import { AdminsTable } from '../components/admin/admin-mgmt/AdminsTable';
import { RolesGrid } from '../components/admin/admin-mgmt/RolesGrid';
import { RbacMatrix } from '../components/admin/admin-mgmt/RbacMatrix';
import { InvitationsTable } from '../components/admin/admin-mgmt/InvitationsTable';
import { SecuritySessionsPanel } from '../components/admin/admin-mgmt/SecuritySessionsPanel';
import { ActivityLogTable } from '../components/admin/admin-mgmt/ActivityLogTable';
import { AuditTrailPanel } from '../components/admin/admin-mgmt/AuditTrailPanel';
import { SecurityAlertsPanel } from '../components/admin/admin-mgmt/SecurityAlertsPanel';
import { RoleDistributionChart } from '../components/admin/admin-mgmt/RoleDistributionChart';
import { RecentActivityFeed } from '../components/admin/admin-mgmt/RecentActivityFeed';
import { trackAdminMgmtEvent } from '../lib/admin/admin-mgmt-api';

const TABS = ['overview', 'admins', 'roles', 'invitations', 'security', 'activity', 'audit'] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Vue d'ensemble", admins: 'Administrateurs', roles: 'Rôles & Permissions',
  invitations: 'Invitations', security: 'Sécurité', activity: 'Journal', audit: 'Audit Trail',
};
const ROLE_SLUGS = ['super_admin', 'admin', 'finance', 'support', 'marketing', 'operations', 'moderator'];

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger la gestion admin.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const AdminManagementControlCenter: React.FC = () => {
  const {
    kpis, admins, roles, rbacMatrix, rbacResources, invitations, sessions, security,
    activityLogs, auditLogs, securityAlerts, roleDistribution, loading, error, refresh,
  } = useAdminMgmtCenter();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackAdminMgmtEvent('admin_mgmt_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const q = search.toLowerCase();
  const filteredAdmins = useMemo(() => admins.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q) && !a.roleLabel.toLowerCase().includes(q)) return false;
    if (roleFilter !== 'all' && a.roleSlug !== roleFilter) return false;
    if (statusFilter === 'active' && a.status !== 'active') return false;
    if (statusFilter === 'suspended' && a.status !== 'suspended' && a.status !== 'inactive') return false;
    return true;
  }), [admins, q, roleFilter, statusFilter]);

  const onAdminAction = useCallback((action: string) => {
    if (action === 'edit') trackAdminMgmtEvent('admin_user_updated');
    setToast(action);
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  const roleTotal = roleDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <AdminMgmtHeader
        search={search} onSearchChange={setSearch} onRefresh={() => refresh()}
        onExport={() => setToast('Export lancé')}
        onAddAdmin={() => { trackAdminMgmtEvent('admin_user_created'); setToast('Ajouter admin'); }}
        onInvite={() => { trackAdminMgmtEvent('admin_invitation_sent'); setTab('invitations'); }}
        onSettings={() => setToast('Paramètres')}
      />
      {kpis && <AdminKpiCards kpis={kpis} />}

      <div className="flex flex-wrap gap-2">{TABS.map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab === t ? 'bg-violet-600 text-white border-violet-600' : 'bg-white'}`}>{TAB_LABELS[t]}</button>
      ))}</div>

      {tab === 'overview' && security && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-2">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-sm border rounded-xl px-3 py-1.5">
                <option value="all">Tous les rôles</option>{ROLE_SLUGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border rounded-xl px-3 py-1.5">
                <option value="all">Tous statuts</option><option value="active">Actifs</option><option value="suspended">Suspendus</option>
              </select>
            </div>
            <AdminsTable admins={filteredAdmins} onAction={(a, u) => onAdminAction(a)} />
            <RbacMatrix matrix={rbacMatrix} resources={rbacResources} roleSlugs={ROLE_SLUGS} />
            <InvitationsTable invitations={invitations.slice(0, 3)} onAction={(a) => setToast(a)} />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <RoleDistributionChart data={roleDistribution} total={roleTotal || kpis?.totalAdmins || 0} />
            <RecentActivityFeed logs={activityLogs} />
            <SecurityAlertsPanel alerts={securityAlerts} />
          </div>
          <div className="xl:col-span-1">
            <SecuritySessionsPanel security={security} sessions={sessions} onAction={(a) => setToast(a)} />
          </div>
        </div>
      )}

      {tab === 'admins' && (
        <>
          <div className="flex flex-wrap gap-2">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-sm border rounded-xl px-3 py-1.5"><option value="all">Tous les rôles</option>{ROLE_SLUGS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border rounded-xl px-3 py-1.5"><option value="all">Tous</option><option value="active">Actifs</option><option value="suspended">Suspendus</option></select>
          </div>
          <AdminsTable admins={filteredAdmins} onAction={(a) => onAdminAction(a)} />
        </>
      )}
      {tab === 'roles' && (
        <div className="space-y-6">
          <RolesGrid roles={roles} onAction={(a) => setToast(a)} />
          <RbacMatrix matrix={rbacMatrix} resources={rbacResources} roleSlugs={ROLE_SLUGS} />
        </div>
      )}
      {tab === 'invitations' && <InvitationsTable invitations={invitations} onAction={(a) => setToast(a)} />}
      {tab === 'security' && security && <SecuritySessionsPanel security={security} sessions={sessions} onAction={(a) => setToast(a)} />}
      {tab === 'activity' && <ActivityLogTable logs={activityLogs} />}
      {tab === 'audit' && <AuditTrailPanel logs={auditLogs} />}

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50">{toast}</div>}
    </div>
  );
};
