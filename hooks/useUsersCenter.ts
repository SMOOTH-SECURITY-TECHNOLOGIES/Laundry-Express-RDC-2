import { useState, useEffect, useCallback } from 'react';
import {
  fetchUsersBundle, invalidateUsersCache, exportUsers,
  suspendUser, reactivateUser, fetchUserDetail, fetchUserSecurity,
} from '../lib/admin/users-api';
import type {
  UserKpis, UserSummary, RoleDistribution, StatusBreakdown, GrowthPoint,
  AcquisitionSource, TopZone, UserActivity, DeviceBreakdown, LoyaltySummary,
  SecuritySummary, WatchlistItem, TopUser, UserSegment, ValueUser,
  UserDetail, UserSecurityDetail,
} from '../lib/admin/users-types';

export default function useUsersCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<UserKpis | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [acquisitionSources, setAcquisitionSources] = useState<AcquisitionSource[]>([]);
  const [topZones, setTopZones] = useState<TopZone[]>([]);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [devices, setDevices] = useState<DeviceBreakdown[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [security, setSecurity] = useState<SecuritySummary | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [valueUsers, setValueUsers] = useState<ValueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchUsersBundle>>) => {
    setKpis(bundle.kpis);
    setUsers(bundle.users);
    setRoleDistribution(bundle.roleDistribution);
    setStatusBreakdown(bundle.statusBreakdown);
    setGrowth(bundle.growth);
    setAcquisitionSources(bundle.acquisitionSources);
    setTopZones(bundle.topZones);
    setRecentActivity(bundle.recentActivity);
    setDevices(bundle.devices);
    setLoyalty(bundle.loyalty);
    setSecurity(bundle.security);
    setWatchlist(bundle.watchlist);
    setTopUsers(bundle.topUsers);
    setSegments(bundle.segments);
    setValueUsers(bundle.valueUsers);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      applyBundle(await fetchUsersBundle(d));
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateUsersCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      setError('Session requise. Reconnectez-vous en tant qu\'administrateur.');
      return;
    }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, users, roleDistribution, statusBreakdown, growth, acquisitionSources,
    topZones, recentActivity, devices, loyalty, security, watchlist, topUsers,
    segments, valueUsers, loading, error, source, days, refresh,
    handleExport: async (format = 'csv') => exportUsers({ format, scope: 'users' }),
    handleSuspend: async (userId: string) => { await suspendUser(userId); invalidateUsersCache(); await loadData(); },
    handleReactivate: async (userId: string) => { await reactivateUser(userId); invalidateUsersCache(); await loadData(); },
    handleUserDetail: (id: string) => fetchUserDetail(id),
    handleUserSecurity: (id: string) => fetchUserSecurity(id),
  };
}
