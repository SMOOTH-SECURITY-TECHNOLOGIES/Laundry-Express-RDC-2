import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useSlaCenter from '../hooks/useSlaCenter';
import { SlaHeader } from '../components/admin/sla/SlaHeader';
import { SlaKpiCards } from '../components/admin/sla/SlaKpiCards';
import { SlaDistributionBar } from '../components/admin/sla/SlaDistributionBar';
import { SlaHeatmap } from '../components/admin/sla/SlaHeatmap';
import { SlaTimeline } from '../components/admin/sla/SlaTimeline';
import { SlaZoneMap } from '../components/admin/sla/SlaZoneMap';
import { SlaZoneTable } from '../components/admin/sla/SlaZoneTable';
import { SlaPartnerRanking } from '../components/admin/sla/SlaPartnerRanking';
import { SlaDriverRanking } from '../components/admin/sla/SlaDriverRanking';
import { SlaAtRiskOrders } from '../components/admin/sla/SlaAtRiskOrders';
import { SlaBreachedOrders } from '../components/admin/sla/SlaBreachedOrders';
import { SlaViolationCauses } from '../components/admin/sla/SlaViolationCauses';
import { SlaFinancialImpact } from '../components/admin/sla/SlaFinancialImpact';
import { SlaTruthIntegration } from '../components/admin/sla/SlaTruthIntegration';
import { SlaOrderTruthIntegration } from '../components/admin/sla/SlaOrderTruthIntegration';
import { SlaDispatcherIntegration } from '../components/admin/sla/SlaDispatcherIntegration';
import { SlaAlertsFeed } from '../components/admin/sla/SlaAlertsFeed';
import { SlaQuickActions } from '../components/admin/sla/SlaQuickActions';
import { SlaRuleDrawer } from '../components/admin/sla/SlaRuleDrawer';
import { SlaExportCenter } from '../components/admin/sla/SlaExportCenter';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-64 bg-white rounded-2xl border animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le SLA Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const SlaControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, distribution, heatmap, timeline, zonePerformance, partnerPerformance, driverPerformance,
    atRiskOrders, breachedOrders, violationCauses, financialImpact, truthAnomalies, problematicOrders,
    dispatcherSnapshot, alerts, rules, loading, error, degraded, refresh, handleCreateRule, handleExport,
  } = useSlaCenter();

  const [search, setSearch] = useState('');
  const [showRuleDrawer, setShowRuleDrawer] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateInvestigate = useCallback((orderId: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const navigateOrderTruth = useCallback((orderId: string) => {
    setAdminSectionParams({ section: 'ops_truth', orderId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
  }, [setAdminSectionParams]);

  const onQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'rule': setShowRuleDrawer(true); break;
      case 'export': setShowExportCenter(true); break;
      case 'critical-orders': setToast('Filtre commandes critiques appliqué'); break;
      case 'critical-drivers': window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' })); break;
      case 'critical-partners': window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' })); break;
      case 'cockpit': window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Cockpit Dispatcher' })); break;
    }
  }, []);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    const result = await handleExport(format);
    setToast(`Export ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis || !distribution || !heatmap || !financialImpact || !dispatcherSnapshot) return null;

  const q = search.toLowerCase();
  const filterText = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredAtRisk = atRiskOrders.filter((o) => filterText(o.id) || filterText(o.zone) || filterText(o.partner));
  const filteredBreached = breachedOrders.filter((o) => filterText(o.id) || filterText(o.cause));
  const filteredZones = zonePerformance.filter((z) => filterText(z.name));
  const filteredPartners = partnerPerformance.filter((p) => filterText(p.name));
  const filteredDrivers = driverPerformance.filter((d) => filterText(d.name));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données SLA partielles
          </div>
        )}

        <SlaHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onAddDriver={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' }))}
          onCreateRule={() => setShowRuleDrawer(true)}
        />

        <SlaKpiCards kpis={kpis} />

        <SlaDistributionBar data={distribution} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SlaHeatmap data={heatmap} />
          <SlaTimeline timeline={timeline} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3"><SlaZoneMap zones={filteredZones} /></div>
          <div className="xl:col-span-2"><SlaZoneTable zones={filteredZones} /></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SlaViolationCauses causes={violationCauses} />
          <SlaFinancialImpact data={financialImpact} />
        </div>

        <SlaAtRiskOrders orders={filteredAtRisk} onInvestigate={navigateInvestigate} />
        <SlaBreachedOrders orders={filteredBreached} onInvestigate={navigateInvestigate} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SlaPartnerRanking partners={filteredPartners} />
          <SlaDriverRanking drivers={filteredDrivers} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SlaTruthIntegration anomalies={truthAnomalies} onOpenTruth={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Truth Dashboard' }))} />
          <SlaOrderTruthIntegration orders={problematicOrders} onOpenTimeline={navigateOrderTruth} />
          <SlaDispatcherIntegration snapshot={dispatcherSnapshot} onOpenCockpit={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Cockpit Dispatcher' }))} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><SlaAlertsFeed alerts={alerts} /></div>
          <SlaQuickActions onAction={onQuickAction} />
        </div>
      </div>

      <SlaRuleDrawer open={showRuleDrawer} rules={rules} onClose={() => setShowRuleDrawer(false)} onCreate={handleCreateRule} />
      <SlaExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
