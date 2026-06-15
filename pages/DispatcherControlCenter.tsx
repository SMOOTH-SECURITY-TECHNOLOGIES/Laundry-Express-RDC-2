import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import useDispatcherCenter from '../hooks/useDispatcherCenter';
import { DispatcherHeader } from '../components/admin/dispatcher/DispatcherHeader';
import { DispatcherKpiCards } from '../components/admin/dispatcher/DispatcherKpiCards';
import { DispatchBacklogTable } from '../components/admin/dispatcher/DispatchBacklogTable';
import { MissionActiveTable } from '../components/admin/dispatcher/MissionActiveTable';
import { DispatchMap } from '../components/admin/dispatcher/DispatchMap';
import { SlaCenterCard } from '../components/admin/dispatcher/SlaCenterCard';
import { DriverAvailabilityCard } from '../components/admin/dispatcher/DriverAvailabilityCard';
import { DriverHealthCard } from '../components/admin/dispatcher/DriverHealthCard';
import { IncidentCenterCard } from '../components/admin/dispatcher/IncidentCenterCard';
import { RevenueImpactCard } from '../components/admin/dispatcher/RevenueImpactCard';
import { TopDriversCard } from '../components/admin/dispatcher/TopDriversCard';
import { DispatcherAnalytics } from '../components/admin/dispatcher/DispatcherAnalytics';
import { MissionAssignmentModal } from '../components/admin/dispatcher/MissionAssignmentModal';
import { MissionDetailsDrawer } from '../components/admin/dispatcher/MissionDetailsDrawer';
import { AutoDispatchModal } from '../components/admin/dispatcher/AutoDispatchModal';
import type { ActiveMission, AutoDispatchResult, BacklogMission, DispatcherIncident } from '../lib/admin/dispatcher-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-96 bg-white rounded-2xl border animate-pulse" />
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
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Impossible de charger le cockpit dispatcher.</h2>
        <p className="text-sm text-gray-500 mb-6">Une erreur est survenue lors du chargement des données.</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Icon name="arrow-path" className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="truck" className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée dispatcher</h2>
        <p className="text-sm text-gray-500">Les missions et chauffeurs apparaîtront ici dès qu&apos;une activité est détectée.</p>
      </div>
    </div>
  );
}

export const DispatcherControlCenter: React.FC = () => {
  const { setAdminSectionParams } = useAppContext();
  const {
    kpis,
    backlog,
    activeMissions,
    drivers,
    driverHealth,
    sla,
    mapPoints,
    mapClusters,
    mapZoneKpis,
    incidents,
    revenue,
    topDrivers,
    analytics,
    loading,
    error,
    degraded,
    wsConnected,
    refresh,
    handleAssign,
    handleAutoDispatch,
    handleExport,
  } = useDispatcherCenter();

  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<BacklogMission | ActiveMission | null>(null);
  const [isReassign, setIsReassign] = useState(false);
  const [detailMission, setDetailMission] = useState<ActiveMission | null>(null);
  const [showAutoDispatch, setShowAutoDispatch] = useState(false);
  const [autoDispatchLoading, setAutoDispatchLoading] = useState(false);
  const [autoDispatchResult, setAutoDispatchResult] = useState<AutoDispatchResult | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const navigateOrderTruth = useCallback((orderId: string) => {
    setAdminSectionParams({ section: 'ops_truth', orderId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Order Truth' }));
  }, [setAdminSectionParams]);

  const navigateInvestigate = useCallback((orderId: string) => {
    setAdminSectionParams({ section: 'ops_investigate', orderId });
    window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Investigate' }));
  }, [setAdminSectionParams]);

  const onAssignConfirm = useCallback(async (missionId: string, driverId: string) => {
    try {
      await handleAssign(missionId, driverId);
      setAssignTarget(null);
      setIsReassign(false);
      setToast(`Mission ${missionId} assignée avec succès.`);
    } catch {
      setToast('Assignation simulée — activez VITE_DISPATCHER_WRITE_ENABLED pour les écritures API.');
      setAssignTarget(null);
    }
  }, [handleAssign]);

  const onAutoDispatchConfirm = useCallback(async () => {
    setAutoDispatchLoading(true);
    try {
      const result = await handleAutoDispatch();
      setAutoDispatchResult(result);
      setToast(`Auto dispatch : ${result.assigned} mission(s) assignée(s).`);
    } catch {
      setToast('Auto dispatch terminé en mode simulation.');
      setAutoDispatchResult({ assigned: 0, skipped: backlog.length, details: [] });
    } finally {
      setAutoDispatchLoading(false);
    }
  }, [handleAutoDispatch, backlog.length]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    const result = await handleExport(format);
    setShowExportMenu(false);
    setToast(`Export ${format.toUpperCase()} : ${result.filename} (${result.count} entrées)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const runRefresh = () => handleRefresh();
    window.addEventListener('admin-dispatcher-refresh', runRefresh);
    return () => window.removeEventListener('admin-dispatcher-refresh', runRefresh);
  }, [handleRefresh]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={handleRefresh} />;
  if (!kpis) return <EmptyState />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            {toast}
          </div>
        )}

        <DispatcherHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          onExport={() => setShowExportMenu(true)}
          onCreatePromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
          onAddPartner={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))}
          onAddDriver={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' }))}
          onAutoDispatch={() => { setShowAutoDispatch(true); setAutoDispatchResult(null); }}
          wsConnected={wsConnected}
        />

        {degraded && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
            Mode dégradé : affichage des données de secours en attendant la connexion complète aux endpoints logistiques.
          </div>
        )}

        <DispatcherKpiCards kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DispatchBacklogTable
            missions={backlog}
            search={search}
            onAssign={(mission) => { setAssignTarget(mission); setIsReassign(false); }}
          />
          <MissionActiveTable
            missions={activeMissions}
            search={search}
            onPhone={(m) => setToast(`Appel chauffeur ${m.driverName}`)}
            onWhatsApp={(m) => setToast(`WhatsApp ouvert pour ${m.driverName}`)}
            onGps={(m) => setToast(`Navigation GPS — ${m.address}`)}
            onDetails={(m) => setDetailMission(m)}
            onReassign={(m) => { setAssignTarget(m); setIsReassign(true); }}
            onCancel={(m) => setToast(`Annulation préparée pour ${m.id}`)}
            onOrderTruth={navigateOrderTruth}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <DispatchMap points={mapPoints} clusters={mapClusters} zoneKpis={mapZoneKpis} />
          </div>
          <div className="space-y-6">
            {sla && <SlaCenterCard data={sla} />}
            {driverHealth && <DriverHealthCard health={driverHealth} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DriverAvailabilityCard drivers={drivers} search={search} />
          <IncidentCenterCard
            incidents={incidents}
            onInvestigate={(incident: DispatcherIncident) => navigateInvestigate(incident.orderId)}
          />
        </div>

        {revenue && <RevenueImpactCard revenue={revenue} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopDriversCard drivers={topDrivers} />
          {analytics && <DispatcherAnalytics data={analytics} />}
        </div>
      </div>

      <MissionAssignmentModal
        isOpen={!!assignTarget}
        mission={assignTarget}
        isReassign={isReassign}
        onConfirm={onAssignConfirm}
        onClose={() => { setAssignTarget(null); setIsReassign(false); }}
      />

      <MissionDetailsDrawer
        mission={detailMission}
        onClose={() => setDetailMission(null)}
        onOrderTruth={navigateOrderTruth}
        onInvestigate={navigateInvestigate}
      />

      <AutoDispatchModal
        isOpen={showAutoDispatch}
        loading={autoDispatchLoading}
        result={autoDispatchResult}
        onConfirm={onAutoDispatchConfirm}
        onClose={() => { setShowAutoDispatch(false); setAutoDispatchResult(null); }}
      />

      {showExportMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowExportMenu(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Exporter les données</h3>
            <div className="space-y-2">
              {(['csv', 'excel', 'pdf'] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => onExport(format)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left uppercase"
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
