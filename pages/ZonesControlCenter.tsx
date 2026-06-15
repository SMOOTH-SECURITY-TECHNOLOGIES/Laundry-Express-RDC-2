import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import useZonesCenter from '../hooks/useZonesCenter';
import { ZonesHeader } from '../components/admin/zones/ZonesHeader';
import { ZonesConnectionsBanner } from '../components/admin/zones/ZonesConnectionsBanner';
import { ZoneKpiCards } from '../components/admin/zones/ZoneKpiCards';
import { ZoneTable } from '../components/admin/zones/ZoneTable';
import { ZoneMap } from '../components/admin/zones/ZoneMap';
import { ZoneDistributionChart } from '../components/admin/zones/ZoneDistributionChart';
import { ZoneEtaAnalytics } from '../components/admin/zones/ZoneEtaAnalytics';
import { ZoneAlertsCard } from '../components/admin/zones/ZoneAlertsCard';
import { ZoneHeatmap } from '../components/admin/zones/ZoneHeatmap';
import { ZoneProfitabilityTable } from '../components/admin/zones/ZoneProfitabilityTable';
import { ZoneSlaIntegration } from '../components/admin/zones/ZoneSlaIntegration';
import { ZoneDispatcherIntegration } from '../components/admin/zones/ZoneDispatcherIntegration';
import { ZoneTruthIntegration } from '../components/admin/zones/ZoneTruthIntegration';
import { ZoneQuickActions } from '../components/admin/zones/ZoneQuickActions';
import { ZoneTariffDrawer } from '../components/admin/zones/ZoneTariffDrawer';
import { CreateZoneModal } from '../components/admin/zones/CreateZoneModal';
import type { Zone } from '../lib/admin/zones-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="xl:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les zones.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const ZonesControlCenter: React.FC = () => {
  const {
    kpis, zones, distribution, etaAnalytics, alerts, heatmap, dispatcherSnapshots,
    truthAnomalies, slaSummary, loading, error, degraded, refresh,
    handleCreateZone, handleUpdateTariff, handleDeleteZone, handleExport,
  } = useZonesCenter();

  const [search, setSearch] = useState('');
  const [tariffZone, setTariffZone] = useState<Zone | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add': setShowCreateModal(true); break;
      case 'tariffs': setTariffZone(zones.find((z) => z.status === 'at_risk') ?? zones[0] ?? null); break;
      case 'limits': setToast('Définition des limites — en cours de déploiement'); break;
      case 'saturated': setSearch(''); setToast('Filtre zones saturées'); break;
      case 'risk': setToast('Zones à risque : Kintambo, Masina'); break;
      case 'export': setShowExportMenu(true); break;
    }
  }, [zones]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{toast}</div>}

        <ZonesHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportMenu(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onCreateZone={() => setShowCreateModal(true)}
        />

        {degraded && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
            Mode dégradé : données de secours en attendant la connexion aux endpoints zones.
          </div>
        )}

        <ZonesConnectionsBanner />
        <ZoneKpiCards kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <ZoneTable
              zones={zones}
              search={search}
              onView={setTariffZone}
              onEdit={setTariffZone}
              onTariffs={setTariffZone}
              onHistory={(z) => setToast(`Historique ${z.name}`)}
              onDelete={async (z) => {
                try { await handleDeleteZone(z.id); setToast(`Zone ${z.name} supprimée`); }
                catch { setToast('Suppression simulée'); }
              }}
            />
          </div>
          <div className="xl:col-span-2">
            <ZoneMap zones={zones} onSelectZone={setTariffZone} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <ZoneDistributionChart data={distribution} />
          <ZoneEtaAnalytics data={etaAnalytics} />
          <ZoneAlertsCard alerts={alerts} />
        </div>

        {heatmap && <ZoneHeatmap data={heatmap} />}

        <ZoneProfitabilityTable zones={zones} />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {slaSummary && <ZoneSlaIntegration summary={slaSummary} onOpenSlaCenter={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'SLA Center' }))} />}
          <ZoneDispatcherIntegration snapshots={dispatcherSnapshots} onOpenDispatcher={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Cockpit Dispatcher' }))} />
          <ZoneTruthIntegration anomalies={truthAnomalies} onOpenTruth={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Truth Dashboard' }))} />
          <ZoneQuickActions onAction={onQuickAction} />
        </div>
      </div>

      <ZoneTariffDrawer
        zone={tariffZone}
        onClose={() => setTariffZone(null)}
        onSave={async (id) => {
          try { await handleUpdateTariff(id); setTariffZone(null); setToast('Tarifs mis à jour'); }
          catch { setToast('Modification simulée'); setTariffZone(null); }
        }}
      />

      <CreateZoneModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (payload) => {
          try { await handleCreateZone(payload); setShowCreateModal(false); setToast(`Zone ${payload.name} créée`); }
          catch { setToast('Création simulée'); setShowCreateModal(false); }
        }}
      />

      {showExportMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowExportMenu(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Exporter</h3>
            {(['csv', 'excel', 'pdf'] as const).map((f) => (
              <button key={f} type="button" onClick={async () => { const r = await handleExport(f); setShowExportMenu(false); setToast(`Export ${f.toUpperCase()} : ${r.filename}`); }}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium uppercase mb-2 hover:bg-gray-50 text-left">{f}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
