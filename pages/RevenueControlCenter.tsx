import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useFinanceCenter from '../hooks/useFinanceCenter';
import { FinanceHeader } from '../components/admin/finance/FinanceHeader';
import { FinanceFiltersBar } from '../components/admin/finance/FinanceFilters';
import { FinanceTrendCard } from '../components/admin/finance/FinanceTrendCard';
import { FinanceKpiGrid } from '../components/admin/finance/FinanceKpiGrid';
import { FinanceDailyChart } from '../components/admin/finance/FinanceDailyChart';
import { FinanceBreakdownChart } from '../components/admin/finance/FinanceBreakdownChart';
import { FinancePartnerTable } from '../components/admin/finance/FinancePartnerTable';
import { FinanceLeakageCenter } from '../components/admin/finance/FinanceLeakageCenter';
import { FinanceAlertsFeed } from '../components/admin/finance/FinanceAlertsFeed';
import { FinanceZoneMap } from '../components/admin/finance/FinanceZoneMap';
import { FinanceTruthCorridor } from '../components/admin/finance/FinanceTruthCorridor';
import { FinanceInvestigatePanel } from '../components/admin/finance/FinanceInvestigatePanel';
import { FinanceExportCenter } from '../components/admin/finance/FinanceExportCenter';
import { FinanceRuleDrawer } from '../components/admin/finance/FinanceRuleDrawer';
import type { FinanceFilters } from '../lib/admin/finance-types';

function defaultFilters(): FinanceFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    dateStart: start.toISOString().slice(0, 10),
    dateEnd: end.toISOString().slice(0, 10),
    service: 'Tous les services',
    zone: 'Toutes les zones',
    partner: 'Tous les partenaires',
  };
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />)}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Finance Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const RevenueControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    dashboard, dailyRevenue, breakdown, partners, leakage, alerts, zones, truthCorridors,
    loading, error, degraded, wsConnected, refresh, handleCreateRule, handleExport, applyFilters,
  } = useFinanceCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FinanceFilters>(defaultFilters);
  const [showRuleDrawer, setShowRuleDrawer] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateInvestigate = useCallback((id: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId: id });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onFilterChange = useCallback((partial: Partial<FinanceFilters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    applyFilters(next);
  }, [filters, applyFilters]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'finance' | 'marketplace' | 'logistics' | 'truth' | 'support') => {
    const result = await handleExport(format, scope);
    setToast(`Export ${scope} ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !dashboard) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!dashboard || !dailyRevenue) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredPartners = partners.filter((p) => match(p.name));
  const filteredAlerts = alerts.filter((a) => match(a.message));
  const filteredZones = zones.filter((z) => match(z.name));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données financières partielles
          </div>
        )}

        <FinanceHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onAddRevenueRule={() => setShowRuleDrawer(true)}
          wsConnected={wsConnected}
        />

        <FinanceFiltersBar filters={filters} onChange={onFilterChange} onAdvanced={() => setToast('Filtres avancés — en cours de déploiement')} />

        <FinanceTrendCard dashboard={dashboard} />
        <FinanceKpiGrid dashboard={dashboard} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <FinanceDailyChart data={dailyRevenue} />
          <FinanceBreakdownChart items={breakdown} total={dashboard.monthRevenue} />
          <FinancePartnerTable partners={filteredPartners} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <FinanceLeakageCenter items={leakage} onViewDetails={(id) => navigateInvestigate(id)} />
          <FinanceAlertsFeed alerts={filteredAlerts} onInvestigate={navigateInvestigate} />
          <FinanceZoneMap zones={filteredZones} />
        </div>

        <FinanceTruthCorridor corridors={truthCorridors} />
        <FinanceInvestigatePanel onInvestigate={navigateInvestigate} />
      </div>

      <FinanceRuleDrawer open={showRuleDrawer} onClose={() => setShowRuleDrawer(false)} onCreate={handleCreateRule} />
      <FinanceExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
