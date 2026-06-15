import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useCommissionsCenter from '../hooks/useCommissionsCenter';
import { CommissionsHeader } from '../components/admin/commissions/CommissionsHeader';
import { CommissionsFiltersBar } from '../components/admin/commissions/CommissionsFilters';
import { CommissionsKpiStrip } from '../components/admin/commissions/CommissionsKpiStrip';
import { CommissionHealthCard } from '../components/admin/commissions/CommissionHealthCard';
import { CommissionRuleEngine } from '../components/admin/commissions/CommissionRuleEngine';
import { CommissionMonthlyChart } from '../components/admin/commissions/CommissionMonthlyChart';
import { CommissionServiceTable } from '../components/admin/commissions/CommissionServiceTable';
import { CommissionPartnerMatrix } from '../components/admin/commissions/CommissionPartnerMatrix';
import { CommissionTimeline } from '../components/admin/commissions/CommissionTimeline';
import { CommissionLeakageCenter } from '../components/admin/commissions/CommissionLeakageCenter';
import { CommissionTopPartners } from '../components/admin/commissions/CommissionTopPartners';
import { CommissionBreakdownChart } from '../components/admin/commissions/CommissionBreakdownChart';
import { CommissionRevenueVsChart } from '../components/admin/commissions/CommissionRevenueVsChart';
import { CommissionTruthCorridor } from '../components/admin/commissions/CommissionTruthCorridor';
import { CommissionInvestigatePanel } from '../components/admin/commissions/CommissionInvestigatePanel';
import { CommissionAlertsFeed } from '../components/admin/commissions/CommissionAlertsFeed';
import { CommissionAutomation } from '../components/admin/commissions/CommissionAutomation';
import { CommissionExportCenter } from '../components/admin/commissions/CommissionExportCenter';
import { CommissionRuleDrawer } from '../components/admin/commissions/CommissionRuleDrawer';
import type { CommissionFilters, CommissionAutomation as AutomationType } from '../lib/admin/commissions-types';

function defaultFilters(): CommissionFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { dateStart: start.toISOString().slice(0, 10), dateEnd: end.toISOString().slice(0, 10), service: 'Tous les services', zone: 'Toutes les zones', partner: 'Tous les partenaires' };
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Commission Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const CommissionsControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, health, rules, services, partners, timeline, leakage, topPartners,
    monthlyTrend, breakdown, revenueVsCommission, truthCorridors, alerts, automation,
    loading, error, degraded, wsConnected, refresh, handleCreateRule, handleExport,
  } = useCommissionsCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CommissionFilters>(defaultFilters);
  const [showRuleDrawer, setShowRuleDrawer] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [automationState, setAutomationState] = useState<AutomationType | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (automation) setAutomationState(automation); }, [automation]);

  const navigateInvestigate = useCallback((id: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId: id });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'partner' | 'period' | 'service' | 'zone' | 'status') => {
    const result = await handleExport(format, scope);
    setToast(`Export ${scope} ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  const onPartnerAction = useCallback((partnerId: string, action: string) => {
    if (action === 'view' || action === 'history') navigateInvestigate(partnerId);
    else if (action === 'pay') setToast(`Paiement commission lancé pour ${partnerId}`);
    else setToast(`Modification commission — ${partnerId}`);
  }, [navigateInvestigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis || !health || !automationState) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredPartners = partners.filter((p) => match(p.name));
  const filteredAlerts = alerts.filter((a) => match(a.message));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données commissions partielles
          </div>
        )}

        <CommissionsHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onNewRule={() => setShowRuleDrawer(true)}
          wsConnected={wsConnected}
        />

        <CommissionsFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} onAdvanced={() => setToast('Filtres avancés — en cours de déploiement')} />

        <CommissionsKpiStrip kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <CommissionHealthCard health={health} />
          <CommissionRuleEngine rules={rules} onEdit={() => setShowRuleDrawer(true)} />
          <CommissionMonthlyChart data={monthlyTrend} />
        </div>

        <CommissionPartnerMatrix partners={filteredPartners} onAction={onPartnerAction} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CommissionServiceTable services={services} />
          <CommissionTimeline steps={timeline} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <CommissionBreakdownChart items={breakdown} />
          <CommissionRevenueVsChart data={revenueVsCommission} />
          <CommissionTopPartners partners={topPartners} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <CommissionLeakageCenter items={leakage} onInvestigate={navigateInvestigate} />
          <CommissionAlertsFeed alerts={filteredAlerts} onInvestigate={navigateInvestigate} />
          <CommissionAutomation automation={automationState} onToggle={(key) => setAutomationState((s) => s ? { ...s, [key]: !s[key] } : s)} />
        </div>

        <CommissionTruthCorridor corridors={truthCorridors} />
        <CommissionInvestigatePanel onInvestigate={navigateInvestigate} />
      </div>

      <CommissionRuleDrawer open={showRuleDrawer} rules={rules} onClose={() => setShowRuleDrawer(false)} onCreate={handleCreateRule} />
      <CommissionExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
