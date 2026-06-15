import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useRefundsCenter from '../hooks/useRefundsCenter';
import { RefundsHeader } from '../components/admin/refunds/RefundsHeader';
import { RefundsFiltersBar } from '../components/admin/refunds/RefundsFilters';
import { RefundsKpiStrip } from '../components/admin/refunds/RefundsKpiStrip';
import { RefundHealthCard } from '../components/admin/refunds/RefundHealthCard';
import { RefundPipeline } from '../components/admin/refunds/RefundPipeline';
import { RefundRequestsTable } from '../components/admin/refunds/RefundRequestsTable';
import { RefundTimeline } from '../components/admin/refunds/RefundTimeline';
import { RefundReasonChart } from '../components/admin/refunds/RefundReasonChart';
import { RefundPartnerTable } from '../components/admin/refunds/RefundPartnerTable';
import { RefundMonthlyChart } from '../components/admin/refunds/RefundMonthlyChart';
import { RefundLeakageCenter } from '../components/admin/refunds/RefundLeakageCenter';
import { RefundTruthCorridor } from '../components/admin/refunds/RefundTruthCorridor';
import { RefundFraudDetection } from '../components/admin/refunds/RefundFraudDetection';
import { RefundInvestigatePanel } from '../components/admin/refunds/RefundInvestigatePanel';
import { RefundInvestigationPanel } from '../components/admin/refunds/RefundInvestigationPanel';
import { RefundAlertsFeed } from '../components/admin/refunds/RefundAlertsFeed';
import { RefundAutomation } from '../components/admin/refunds/RefundAutomation';
import { RefundExportCenter } from '../components/admin/refunds/RefundExportCenter';
import { RefundPolicyDrawer } from '../components/admin/refunds/RefundPolicyDrawer';
import type { RefundFilters, RefundAutomation as AutomationType } from '../lib/admin/refunds-types';

function defaultFilters(): RefundFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { dateStart: start.toISOString().slice(0, 10), dateEnd: end.toISOString().slice(0, 10), status: 'Tous les statuts', reason: 'Tous les motifs', zone: 'Toutes les zones', partner: 'Tous les partenaires' };
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Refund Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const RefundsControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, health, pipeline, requests, timeline, reasonBreakdown, partnerStats,
    monthlyTrend, leakage, truthCorridors, alerts, fraudItems, automation,
    loading, error, degraded, wsConnected, refresh, handleApprove, handleReject, handleCreatePolicy, handleExport,
  } = useRefundsCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<RefundFilters>(defaultFilters);
  const [showPolicyDrawer, setShowPolicyDrawer] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [selectedRefundId, setSelectedRefundId] = useState<string | undefined>('REF-8821');
  const [automationState, setAutomationState] = useState<AutomationType | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (automation) setAutomationState(automation); }, [automation]);

  const navigateInvestigate = useCallback((id: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId: id });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onRequestAction = useCallback(async (id: string, action: string) => {
    setSelectedRefundId(id);
    switch (action) {
      case 'view': setToast(`Détail remboursement ${id}`); break;
      case 'investigate': navigateInvestigate(id); break;
      case 'approve': await handleApprove(id); setToast(`Remboursement ${id} approuvé`); break;
      case 'reject': await handleReject(id); setToast(`Remboursement ${id} rejeté`); break;
    }
  }, [navigateInvestigate, handleApprove, handleReject]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'period' | 'partner' | 'reason' | 'status' | 'zone') => {
    const result = await handleExport(format, scope);
    setToast(`Export ${scope} ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis || !health || !pipeline || !automationState) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredRequests = requests.filter((r) => match(r.id) || match(r.orderId) || match(r.client) || match(r.partner));
  const filteredAlerts = alerts.filter((a) => match(a.message));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données remboursements partielles
          </div>
        )}

        <RefundsHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onNewPolicy={() => setShowPolicyDrawer(true)}
          wsConnected={wsConnected}
        />

        <RefundsFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} onAdvanced={() => setToast('Filtres avancés — en cours de déploiement')} />

        <RefundsKpiStrip kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RefundHealthCard health={health} />
          <RefundPipeline pipeline={pipeline} />
          <RefundReasonChart items={reasonBreakdown} />
        </div>

        <RefundRequestsTable requests={filteredRequests} onAction={onRequestAction} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RefundTimeline steps={timeline} />
          <RefundInvestigationPanel refundId={selectedRefundId} onOpenInvestigate={() => selectedRefundId && navigateInvestigate(selectedRefundId)} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RefundMonthlyChart data={monthlyTrend} />
          <RefundPartnerTable partners={partnerStats} />
          <RefundFraudDetection items={fraudItems} onInvestigate={navigateInvestigate} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RefundLeakageCenter items={leakage} onInvestigate={navigateInvestigate} />
          <RefundAlertsFeed alerts={filteredAlerts} onInvestigate={navigateInvestigate} />
          <RefundAutomation automation={automationState} onToggle={(key) => setAutomationState((s) => s ? { ...s, [key]: !s[key] } : s)} />
        </div>

        <RefundTruthCorridor corridors={truthCorridors} />
        <RefundInvestigatePanel onInvestigate={navigateInvestigate} />
      </div>

      <RefundPolicyDrawer open={showPolicyDrawer} onClose={() => setShowPolicyDrawer(false)} onCreate={handleCreatePolicy} />
      <RefundExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
