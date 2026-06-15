import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchRbacBundle, invalidateRbacCache } from '../lib/admin/rbac-api';
import type { RbacDashboardSummary } from '../lib/admin/rbac-types';

export default function useRbacCenter() {
  const { user, isLoading: authLoading } = useAppContext();
  const [data, setData] = useState<RbacDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchRbacBundle()); }
    catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) setError('Session expirée ou invalide. Reconnectez-vous.');
      else setError('Impossible de charger les permissions.');
    }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateRbacCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    if (token.startsWith('TOKEN-')) { setLoading(false); setError('Session mock incompatible. Reconnectez-vous avec un compte admin backend.'); return; }
    if (authLoading) return;
    if (!user) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [user, authLoading, loadData]);

  return {
    kpis: data?.kpis ?? null,
    roles: data?.roles ?? [],
    permissions: data?.permissions ?? [],
    matrix: data?.matrix ?? [],
    matrixModules: data?.matrixModules ?? [],
    matrixActions: data?.matrixActions ?? [],
    userAssignments: data?.userAssignments ?? [],
    userOverrides: data?.userOverrides ?? [],
    temporaryPermissions: data?.temporaryPermissions ?? [],
    auditLogs: data?.auditLogs ?? [],
    history: data?.history ?? [],
    riskAlerts: data?.riskAlerts ?? [],
    securityPolicies: data?.securityPolicies ?? [],
    tenants: data?.tenants ?? [],
    roleDistribution: data?.roleDistribution ?? [],
    analytics: data?.analytics ?? [],
    readOnly: data?.readOnly ?? true,
    loading, error, refresh,
  };
}
