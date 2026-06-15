import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useDriversCenter from '../hooks/useDriversCenter';
import { DriversHeader } from '../components/admin/drivers/DriversHeader';
import { DriverKpiCards } from '../components/admin/drivers/DriverKpiCards';
import { DriverTable } from '../components/admin/drivers/DriverTable';
import { DriverHealthCard } from '../components/admin/drivers/DriverHealthCard';
import { DriverMap } from '../components/admin/drivers/DriverMap';
import { DriverQuickActions } from '../components/admin/drivers/DriverQuickActions';
import { DriverSlaCard } from '../components/admin/drivers/DriverSlaCard';
import { DriverRanking } from '../components/admin/drivers/DriverRanking';
import { DriverRevenueChart } from '../components/admin/drivers/DriverRevenueChart';
import { DriverIncidentCenter } from '../components/admin/drivers/DriverIncidentCenter';
import { DriverWatchList } from '../components/admin/drivers/DriverWatchList';
import { DriverZoneAvailability } from '../components/admin/drivers/DriverZoneAvailability';
import { DriverRewardsCard } from '../components/admin/drivers/DriverRewardsCard';
import { DriverActivityStream } from '../components/admin/drivers/DriverActivityStream';
import { DriverProfileDrawer } from '../components/admin/drivers/DriverProfileDrawer';
import { AddDriverModal } from '../components/admin/drivers/AddDriverModal';
import type { Driver, DriverIncident } from '../lib/admin/drivers-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-96 bg-white rounded-2xl border animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Impossible de charger les chauffeurs.</h2>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 mt-4">
          <Icon name="arrow-path" className="w-4 h-4" /> Réessayer
        </button>
      </div>
    </div>
  );
}

export const DriversControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis, drivers, health, mapPoints, ranking, sla, incidents, rewards, watchList,
    zoneAvailability, revenueTrend, activity, loading, error, degraded, wsConnected,
    refresh, handleAddDriver, handleSuspend, handleExport,
  } = useDriversCenter();

  const [search, setSearch] = useState('');
  const [profileDriver, setProfileDriver] = useState<Driver | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const navigateOrderTruth = useCallback((driverId: string) => {
    setAdminSectionParams({ section: 'ops_truth', orderId: driverId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
  }, [setAdminSectionParams]);

  const navigateInvestigate = useCallback((orderId: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add': setShowAddModal(true); break;
      case 'critical': setSearch(''); setToast('Filtre chauffeurs critiques appliqué'); break;
      case 'dispatch': window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Cockpit Dispatcher' })); break;
      case 'investigate': navigateInvestigate(''); break;
      case 'export': setShowExportMenu(true); break;
      case 'settings': window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' })); break;
    }
  }, [navigateInvestigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const run = () => refresh();
    window.addEventListener('admin-drivers-refresh', run);
    return () => window.removeEventListener('admin-drivers-refresh', run);
  }, [refresh]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={refresh} />;
  if (!kpis) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{toast}</div>}

        <DriversHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportMenu(true)}
          onAddDriver={() => setShowAddModal(true)}
          onImport={() => setToast('Import CSV — fonctionnalité en cours de déploiement')}
          wsConnected={wsConnected}
        />

        {degraded && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
            Mode dégradé : données de secours en attendant la connexion aux endpoints chauffeurs.
          </div>
        )}

        <DriverKpiCards kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <DriverTable
              drivers={drivers}
              search={search}
              onViewProfile={setProfileDriver}
              onCall={(d) => setToast(`Appel ${d.name} — ${d.phone}`)}
              onWhatsApp={(d) => setToast(`WhatsApp ouvert pour ${d.name}`)}
              onMap={(d) => { setProfileDriver(d); setToast(`Carte — ${d.zone}`); }}
              onHistory={setProfileDriver}
              onSuspend={async (d) => {
                try { await handleSuspend(d.id); setToast(`${d.name} suspendu`); } catch { setToast('Suspension simulée'); }
              }}
            />
          </div>
          <div className="space-y-6">
            {health && <DriverHealthCard health={health} />}
            <DriverMap points={mapPoints} />
            <DriverQuickActions onAction={onQuickAction} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {sla && <DriverSlaCard data={sla} />}
          <DriverRanking ranking={ranking} />
          <DriverRevenueChart trend={revenueTrend} />
          <DriverIncidentCenter incidents={incidents} onInvestigate={(i: DriverIncident) => navigateInvestigate(i.driverId)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DriverWatchList items={watchList} />
          <DriverZoneAvailability zones={zoneAvailability} />
          <DriverRewardsCard rewards={rewards} />
        </div>

        <DriverActivityStream activities={activity} />
      </div>

      <DriverProfileDrawer
        driver={profileDriver}
        onClose={() => setProfileDriver(null)}
        onOrderTruth={() => profileDriver && navigateOrderTruth(profileDriver.id)}
        onInvestigate={() => profileDriver && navigateInvestigate(profileDriver.id)}
      />

      <AddDriverModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (payload) => {
          try { await handleAddDriver(payload); setShowAddModal(false); setToast(`Chauffeur ${payload.name} créé`); }
          catch { setToast('Création simulée — activez VITE_DRIVERS_WRITE_ENABLED'); setShowAddModal(false); }
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
