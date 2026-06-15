import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchAdminMgmtBundle, invalidateAdminMgmtCache } from '../lib/admin/admin-mgmt-api';
import type { AdminMgmtDashboardSummary } from '../lib/admin/admin-mgmt-types';

export default function useAdminMgmtCenter() {
  const { user, isLoading: authLoading } = useAppContext();
  const [data, setData] = useState<AdminMgmtDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchAdminMgmtBundle()); }
    catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) setError('Session expirée ou invalide. Reconnectez-vous.');
      else setError('Impossible de charger la gestion admin.');
    }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateAdminMgmtCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    if (token.startsWith('TOKEN-')) {
      setLoading(false);
      setError('Session mock incompatible. Reconnectez-vous avec un compte admin backend.');
      return;
    }
    if (authLoading) return;
    if (!user) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [user, authLoading, loadData]);

  return {
    ...data,
    kpis: data?.kpis ?? null,
    admins: data?.admins ?? [],
    roles: data?.roles ?? [],
    rbacMatrix: data?.rbacMatrix ?? [],
    rbacResources: data?.rbacResources ?? [],
    invitations: data?.invitations ?? [],
    sessions: data?.sessions ?? [],
    security: data?.security ?? null,
    activityLogs: data?.activityLogs ?? [],
    auditLogs: data?.auditLogs ?? [],
    securityAlerts: data?.securityAlerts ?? [],
    roleDistribution: data?.roleDistribution ?? [],
    analytics: data?.analytics ?? [],
    readOnly: data?.readOnly ?? true,
    loading, error, refresh,
  };
}
