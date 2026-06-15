import { useState, useEffect, useCallback } from 'react';
import { fetchClaimsBundle, invalidateClaimsCache, fetchClaimDetail } from '../lib/admin/claims-api';
import { realApi } from '../services/real-api';
import type {
  ClaimsKpis, ClaimItem, ClaimDistribution, ClaimSlaPanel, ClaimWorkflowColumn,
  RootCause, HeatmapZone, PartnerRisk, DriverRisk, RefundCenter,
} from '../lib/admin/claims-types';

export default function useClaimsCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<ClaimsKpis | null>(null);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [distribution, setDistribution] = useState<ClaimDistribution[]>([]);
  const [sla, setSla] = useState<ClaimSlaPanel | null>(null);
  const [workflow, setWorkflow] = useState<ClaimWorkflowColumn[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapZone[]>([]);
  const [partnerRisks, setPartnerRisks] = useState<PartnerRisk[]>([]);
  const [driverRisks, setDriverRisks] = useState<DriverRisk[]>([]);
  const [refunds, setRefunds] = useState<RefundCenter | null>(null);
  const [escalations, setEscalations] = useState<Array<{ reason: string; severity: string; claim_id?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchClaimsBundle>>) => {
    setKpis(b.kpis); setClaims(b.claims); setDistribution(b.distribution); setSla(b.sla);
    setWorkflow(b.workflow); setRootCauses(b.rootCauses); setHeatmap(b.heatmap);
    setPartnerRisks(b.partnerRisks); setDriverRisks(b.driverRisks); setRefunds(b.refunds);
    setEscalations(b.escalations); setSource(b.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try { applyBundle(await fetchClaimsBundle(d)); }
    catch { setError('Impossible de charger les réclamations.'); }
    finally { setLoading(false); }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateClaimsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise. Reconnectez-vous en tant qu\'administrateur.'); return; }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, claims, distribution, sla, workflow, rootCauses, heatmap,
    partnerRisks, driverRisks, refunds, escalations,
    loading, error, source, days, refresh,
    handleClaimDetail: (id: string) => fetchClaimDetail(id),
    handleCreateClaim: async (data: { title: string; description: string; type?: string; priority?: string }) => realApi.createClaim(data),
    handleUpdateStatus: async (id: string, status: string, note?: string) => realApi.updateClaimStatus(id, status, note),
    handleAssign: async (id: string, assigneeId: string) => realApi.assignClaim(id, assigneeId),
    handleEscalate: async (id: string) => realApi.escalateClaim(id),
    handleAddNote: async (id: string, content: string) => realApi.addClaimNote(id, content),
    handleRefundAction: async (id: string, action: string, amount?: number) => realApi.processClaimRefund(id, action, amount),
  };
}
