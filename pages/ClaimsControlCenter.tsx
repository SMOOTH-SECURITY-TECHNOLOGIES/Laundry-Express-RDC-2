import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useClaimsCenter from '../hooks/useClaimsCenter';
import { ClaimsHeader } from '../components/admin/claims/ClaimsHeader';
import { ClaimsFilters } from '../components/admin/claims/ClaimsFilters';
import { ClaimsKpiCards } from '../components/admin/claims/ClaimsKpiCards';
import { ClaimsTable } from '../components/admin/claims/ClaimsTable';
import { ClaimSlaCard } from '../components/admin/claims/ClaimSlaCard';
import { ClaimDistributionChart } from '../components/admin/claims/ClaimDistributionChart';
import { ClaimWorkflowBoard } from '../components/admin/claims/ClaimWorkflowBoard';
import { ClaimHeatmap } from '../components/admin/claims/ClaimHeatmap';
import { PartnerRiskTable } from '../components/admin/claims/PartnerRiskTable';
import { DriverRiskTable } from '../components/admin/claims/DriverRiskTable';
import { RefundCenterCard } from '../components/admin/claims/RefundCenterCard';
import { RootCausesTable } from '../components/admin/claims/RootCausesTable';
import { EscalationCenter } from '../components/admin/claims/EscalationCenter';
import { ClaimDetailDrawer } from '../components/admin/claims/ClaimDetailDrawer';
import { trackClaimEvent } from '../lib/admin/claims-api';
import type { ClaimDetail, ClaimItem } from '../lib/admin/claims-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le centre réclamations.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed p-12 text-center">
      <Icon name="shield" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium">Aucune réclamation enregistrée.</p>
      <p className="text-xs text-gray-500 mt-2">Les réclamations importées depuis les litiges ou créées manuellement apparaîtront ici.</p>
    </div>
  );
}

export const ClaimsControlCenter: React.FC = () => {
  const {
    kpis, claims, distribution, sla, workflow, rootCauses, heatmap,
    partnerRisks, driverRisks, refunds, escalations,
    loading, error, refresh, handleClaimDetail, handleCreateClaim,
    handleUpdateStatus, handleEscalate, handleRefundAction,
  } = useClaimsCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [detail, setDetail] = useState<ClaimDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackClaimEvent('admin_claims_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = claims;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q) || c.claimNumber.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter((c) => c.priority === priorityFilter);
    if (categoryFilter !== 'all') list = list.filter((c) => c.category === categoryFilter);
    return list;
  }, [claims, search, statusFilter, priorityFilter, categoryFilter]);

  const onFilter = useCallback((type: string, value: string) => {
    trackClaimEvent('claim_filter_changed', { type, value });
    if (type === 'status') setStatusFilter(value);
    if (type === 'priority') setPriorityFilter(value);
    if (type === 'category') setCategoryFilter(value);
  }, []);

  const openClaim = useCallback(async (c: ClaimItem) => {
    setDrawerLoading(true); setDetail(null);
    trackClaimEvent('claim_opened', { claimId: c.id });
    try { setDetail(await handleClaimDetail(c.id)); }
    catch { setToast('Impossible de charger la réclamation'); }
    finally { setDrawerLoading(false); }
  }, [handleClaimDetail]);

  const onNewClaim = useCallback(async () => {
    const title = window.prompt('Titre de la réclamation');
    if (!title) return;
    const description = window.prompt('Description') || title;
    try {
      const res = await handleCreateClaim({ title, description, type: 'other', priority: 'medium' });
      setToast(`Réclamation ${res.claim_number} créée`);
      refresh();
    } catch { setToast('Création impossible'); }
  }, [handleCreateClaim, refresh]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <ClaimsHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onNewClaim={onNewClaim} />
      <ClaimsFilters statusFilter={statusFilter} priorityFilter={priorityFilter} categoryFilter={categoryFilter} onFilter={onFilter} />
      {kpis && <ClaimsKpiCards kpis={kpis} />}
      {claims.length === 0 ? <EmptyState /> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <ClaimsTable claims={filtered} onView={openClaim} />
              <ClaimWorkflowBoard workflow={workflow} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PartnerRiskTable partners={partnerRisks} />
                <DriverRiskTable drivers={driverRisks} />
              </div>
              <RootCausesTable causes={rootCauses} />
            </div>
            <div className="space-y-6">
              <ClaimDistributionChart data={distribution} total={claims.length} />
              {sla && <ClaimSlaCard sla={sla} />}
              {refunds && <RefundCenterCard refunds={refunds} />}
              <EscalationCenter items={escalations} />
            </div>
          </div>
          <ClaimHeatmap zones={heatmap} />
        </>
      )}
      {(detail || drawerLoading) && (
        <ClaimDetailDrawer
          claim={detail}
          loading={drawerLoading && !detail}
          onClose={() => setDetail(null)}
          onEscalate={async () => { if (!detail) return; try { await handleEscalate(detail.id); setToast('Réclamation escaladée'); setDetail(null); refresh(); } catch { setToast('Escalade impossible'); } }}
          onResolve={async () => { if (!detail) return; try { await handleUpdateStatus(detail.id, 'resolved'); setToast('Réclamation résolue'); setDetail(null); refresh(); } catch { setToast('Action impossible'); } }}
          onApproveRefund={async () => { if (!detail) return; try { await handleRefundAction(detail.id, 'approve', detail.financialImpact); setToast('Remboursement approuvé'); refresh(); } catch { setToast('Remboursement impossible'); } }}
        />
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
