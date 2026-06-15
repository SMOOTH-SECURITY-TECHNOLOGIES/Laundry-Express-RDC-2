import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useUsersCenter from '../hooks/useUsersCenter';
import { UsersHeader } from '../components/admin/users/UsersHeader';
import { UsersFilters } from '../components/admin/users/UsersFilters';
import { UsersKpiCards } from '../components/admin/users/UsersKpiCards';
import { UsersTable } from '../components/admin/users/UsersTable';
import { UsersRoleDistribution } from '../components/admin/users/UsersRoleDistribution';
import { UsersStatusCard } from '../components/admin/users/UsersStatusCard';
import { UsersGrowthChart } from '../components/admin/users/UsersGrowthChart';
import { UsersAcquisitionDonut } from '../components/admin/users/UsersAcquisitionDonut';
import { TopZonesTable } from '../components/admin/users/TopZonesTable';
import { RecentActivityCard } from '../components/admin/users/RecentActivityCard';
import { DevicesDonut } from '../components/admin/users/DevicesDonut';
import { UsersLoyaltyCard } from '../components/admin/users/UsersLoyaltyCard';
import { UserSecurityCard } from '../components/admin/users/UserSecurityCard';
import { TopUsersTable } from '../components/admin/users/TopUsersTable';
import { UserWatchlistCard } from '../components/admin/users/UserWatchlistCard';
import { UserSegmentsCard } from '../components/admin/users/UserSegmentsCard';
import { UserValueTable } from '../components/admin/users/UserValueTable';
import { UserQuickActions } from '../components/admin/users/UserQuickActions';
import { UserDetailDrawer } from '../components/admin/users/UserDetailDrawer';
import { UserSecurityDrawer } from '../components/admin/users/UserSecurityDrawer';
import { trackUserEvent } from '../lib/admin/users-api';
import type { UserDetail, UserSecurityDetail, UserSummary } from '../lib/admin/users-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les utilisateurs.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed p-12 text-center">
      <Icon name="users" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium">Aucun utilisateur enregistré.</p>
      <p className="text-xs text-gray-500 mt-2">Les utilisateurs apparaîtront ici lorsqu&apos;ils créeront un compte.</p>
    </div>
  );
}

export const UsersControlCenter: React.FC = () => {
  const {
    kpis, users, roleDistribution, statusBreakdown, growth, acquisitionSources,
    topZones, recentActivity, devices, loyalty, security, watchlist, topUsers,
    segments, valueUsers, loading, error, days, refresh,
    handleExport, handleSuspend, handleReactivate, handleUserDetail, handleUserSecurity,
  } = useUsersCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [securityUser, setSecurityUser] = useState<UserDetail | null>(null);
  const [securityData, setSecurityData] = useState<UserSecurityDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackUserEvent('admin_users_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((u) => u.status === statusFilter);
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (loyaltyFilter === 'with_points') list = list.filter((u) => u.loyaltyPoints > 0);
    if (loyaltyFilter === 'without_points') list = list.filter((u) => u.loyaltyPoints === 0);
    return list;
  }, [users, search, statusFilter, roleFilter, loyaltyFilter]);

  const isEmpty = useMemo(() => users.length === 0, [users]);

  const onFilter = useCallback((type: string, value: string) => {
    trackUserEvent('user_filter_changed', { type, value });
    if (type === 'status') setStatusFilter(value);
    if (type === 'role') setRoleFilter(value);
    if (type === 'zone') setZoneFilter(value);
    if (type === 'partner') setPartnerFilter(value);
    if (type === 'loyalty') setLoyaltyFilter(value);
    if (type === 'channel') setChannelFilter(value);
  }, []);

  const openDetail = useCallback(async (u: UserSummary) => {
    setDrawerLoading(true);
    setDetailUser(null);
    trackUserEvent('user_opened', { userId: u.id });
    try {
      setDetailUser(await handleUserDetail(u.id));
    } catch {
      setToast('Impossible de charger le profil');
    } finally {
      setDrawerLoading(false);
    }
  }, [handleUserDetail]);

  const openSecurity = useCallback(async (u: UserSummary) => {
    setDrawerLoading(true);
    setSecurityUser(null);
    setSecurityData(null);
    trackUserEvent('user_security_opened', { userId: u.id });
    try {
      const [detail, sec] = await Promise.all([handleUserDetail(u.id), handleUserSecurity(u.id)]);
      setSecurityUser(detail);
      setSecurityData(sec);
    } catch {
      setToast('Impossible de charger la sécurité');
    } finally {
      setDrawerLoading(false);
    }
  }, [handleUserDetail, handleUserSecurity]);

  const onExport = useCallback(async () => {
    try {
      const r = await handleExport('csv');
      trackUserEvent('user_exported', { filename: r.filename });
      setToast(`Export — ${r.filename} (${r.count} lignes)`);
    } catch {
      setToast('Export impossible');
    }
  }, [handleExport]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <UsersHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} />
      <UsersFilters
        statusFilter={statusFilter} roleFilter={roleFilter} zoneFilter={zoneFilter}
        partnerFilter={partnerFilter} loyaltyFilter={loyaltyFilter} channelFilter={channelFilter}
        onFilter={onFilter}
      />
      {kpis && <UsersKpiCards kpis={kpis} />}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <UsersTable users={filteredUsers} onView={openDetail} onSecurity={openSecurity} />
              <UsersGrowthChart data={growth} days={days} onDaysChange={(d) => refresh(d)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecentActivityCard activity={recentActivity} />
                <TopUsersTable users={topUsers} />
              </div>
              <UserValueTable users={valueUsers} />
            </div>
            <div className="space-y-6">
              <UsersRoleDistribution data={roleDistribution} total={kpis?.totalUsers ?? 0} />
              <UsersStatusCard data={statusBreakdown} />
              <UsersAcquisitionDonut data={acquisitionSources} />
              <TopZonesTable zones={topZones} />
              <DevicesDonut data={devices} />
              {loyalty && <UsersLoyaltyCard loyalty={loyalty} />}
              {security && <UserSecurityCard security={security} />}
              <UserQuickActions onExport={onExport} onFilter={(s) => onFilter('status', s)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserWatchlistCard items={watchlist} />
            <UserSegmentsCard segments={segments} />
          </div>
        </>
      )}
      {(detailUser || drawerLoading) && !securityUser && (
        <UserDetailDrawer
          user={detailUser}
          loading={drawerLoading && !detailUser}
          onClose={() => setDetailUser(null)}
          onSecurity={() => { if (detailUser) openSecurity({ id: detailUser.id, name: detailUser.name } as UserSummary); }}
        />
      )}
      {(securityUser || (drawerLoading && !securityData)) && (
        <UserSecurityDrawer
          user={securityUser}
          security={securityData}
          loading={drawerLoading && !securityData}
          onClose={() => { setSecurityUser(null); setSecurityData(null); }}
          onSuspend={async () => {
            if (!securityUser) return;
            try { await handleSuspend(securityUser.id); trackUserEvent('user_suspended'); setToast('Compte suspendu'); setSecurityUser(null); } catch { setToast('Action impossible'); }
          }}
          onReactivate={async () => {
            if (!securityUser) return;
            try { await handleReactivate(securityUser.id); trackUserEvent('user_reactivated'); setToast('Compte réactivé'); setSecurityUser(null); } catch { setToast('Action impossible'); }
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>
      )}
    </div>
  );
};
