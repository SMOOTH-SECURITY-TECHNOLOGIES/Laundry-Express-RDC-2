import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useRevenueLeakageCenter from '../hooks/useRevenueLeakageCenter';
import { LeakageHeader } from '../components/admin/revenue-leakage/LeakageHeader';
import { LeakageFiltersBar } from '../components/admin/revenue-leakage/LeakageFilters';
import { LeakageKpiStrip } from '../components/admin/revenue-leakage/LeakageKpiStrip';
import { LeakageRiskGauge } from '../components/admin/revenue-leakage/LeakageRiskGauge';
import { LeakageDetectionBlocks } from '../components/admin/revenue-leakage/LeakageDetectionBlocks';
import { LeakageTimeline } from '../components/admin/revenue-leakage/LeakageTimeline';
import { LeakageCorridorChart } from '../components/admin/revenue-leakage/LeakageCorridorChart';
import { LeakagePartnerRanking } from '../components/admin/revenue-leakage/LeakagePartnerRanking';
import { LeakageZoneMap } from '../components/admin/revenue-leakage/LeakageZoneMap';
import { LeakageTrendChart } from '../components/admin/revenue-leakage/LeakageTrendChart';
import { LeakageAlertsFeed } from '../components/admin/revenue-leakage/LeakageAlertsFeed';
import { LeakageInvestigationDrawer } from '../components/admin/revenue-leakage/LeakageInvestigationDrawer';
import { LeakageAssignmentPanel } from '../components/admin/revenue-leakage/LeakageAssignmentPanel';
import { LeakageTruthIntegration } from '../components/admin/revenue-leakage/LeakageTruthIntegration';
import { LeakageFinancialImpactCard } from '../components/admin/revenue-leakage/LeakageFinancialImpact';
import { LeakageInsights } from '../components/admin/revenue-leakage/LeakageInsights';
import { LeakageExportCenter } from '../components/admin/revenue-leakage/LeakageExportCenter';
import { LeakageQuickActions } from '../components/admin/revenue-leakage/LeakageQuickActions';
import type { LeakageFilters, LeakageAssignee } from '../lib/admin/revenue-leakage-types';

function defaultFilters(): LeakageFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    dateStart: start.toISOString().slice(0, 10), dateEnd: end.toISOString().slice(0, 10),
    status: 'Tous les statuts', type: 'Tous les types', zone: 'Toutes les zones', partner: 'Tous les partenaires',
    minAmount: '', maxAmount: '', orderId: '', paymentId: '',
  };
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Revenue Leakage Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const RevenueLeakageControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, riskScore, orphanPayments, unbilledCollections, missingCommissions, suspiciousRefunds,
    uncollectedOrders, payoutAnomalies, timeline, corridor, partners, zones, trend, alerts,
    assignments, truthHealth, financialImpact, insights, investigationDetail,
    loading, error, degraded, wsConnected, refresh, handleAssign, handleExport,
  } = useRevenueLeakageCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LeakageFilters>(defaultFilters);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateInvestigate = useCallback((id: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId: id });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const navigateOrderTruth = useCallback(() => {
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
  }, []);

  const onDetectionAction = useCallback((id: string, action: string) => {
    if (action === 'investigate') {
      setShowDrawer(true);
      navigateInvestigate(id);
    }
  }, [navigateInvestigate]);

  const onAssign = useCallback(async (caseId: string, assignee: LeakageAssignee) => {
    await handleAssign(caseId, assignee, 'investigating');
    setToast(`Cas ${caseId} assigné à ${assignee}`);
  }, [handleAssign]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'cases' | 'orphans' | 'commissions' | 'reconciliation' | 'anomalies') => {
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
  if (!kpis || !riskScore || !financialImpact) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredAlerts = alerts.filter((a) => match(a.message));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données revenue leakage partielles
          </div>
        )}

        <LeakageHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onInvestigate={() => setShowDrawer(true)}
          wsConnected={wsConnected}
        />

        <LeakageFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

        <LeakageKpiStrip kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1"><LeakageRiskGauge risk={riskScore} /></div>
          <div className="xl:col-span-3"><LeakageDetectionBlocks
            orphans={orphanPayments} unbilled={unbilledCollections} commissions={missingCommissions}
            refunds={suspiciousRefunds} uncollected={uncollectedOrders} payouts={payoutAnomalies}
            onAction={onDetectionAction}
          /></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LeakageCorridorChart corridor={corridor} />
          <LeakagePartnerRanking partners={partners} />
          <LeakageTrendChart trend={trend} />
        </div>

        <LeakageZoneMap zones={zones} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <LeakageAlertsFeed alerts={filteredAlerts} onInvestigate={(id) => { setShowDrawer(true); navigateInvestigate(id); }} />
          <LeakageFinancialImpactCard impact={financialImpact} />
          <LeakageTruthIntegration truthHealth={truthHealth} onViewCorridor={navigateOrderTruth} onInvestigate={() => navigateInvestigate('')} />
          <LeakageInsights insights={insights} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LeakageTimeline events={timeline} />
          <LeakageAssignmentPanel assignments={assignments} onAssign={onAssign} />
          <LeakageQuickActions
            onInvestigate={() => setShowDrawer(true)}
            onAssign={() => setToast('Sélectionnez un cas dans le panneau assignation')}
            onExport={() => setShowExportCenter(true)}
            onAdjust={() => setToast('Ajustement financier créé')}
          />
        </div>
      </div>

      <LeakageExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
      <LeakageInvestigationDrawer detail={showDrawer ? investigationDetail : null} onClose={() => setShowDrawer(false)} onInvestigate={navigateInvestigate} />
    </div>
  );
};
