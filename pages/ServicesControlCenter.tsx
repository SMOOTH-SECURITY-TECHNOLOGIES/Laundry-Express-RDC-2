import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import useAdminServices from '../hooks/useAdminServices';

import ServiceKpiCards from '../components/admin/services/ServiceKpiCards';
import ServicePerformanceTable from '../components/admin/services/ServicePerformanceTable';
import ServiceRevenueChart from '../components/admin/services/ServiceRevenueChart';
import ServiceMixChart from '../components/admin/services/ServiceMixChart';
import ServiceAlertsCard from '../components/admin/services/ServiceAlertsCard';
import ServiceGeoCoverage from '../components/admin/services/ServiceGeoCoverage';
import ServiceHealthTable from '../components/admin/services/ServiceHealthTable';
import ServiceQuickActions from '../components/admin/services/ServiceQuickActions';
import ServiceTruthCorridors from '../components/admin/services/ServiceTruthCorridors';
import ServiceConversionFunnel from '../components/admin/services/ServiceConversionFunnel';
import ServiceWatchlist from '../components/admin/services/ServiceWatchlist';
import TopServicesCard from '../components/admin/services/TopServicesCard';
import ServiceInventoryTable from '../components/admin/services/ServiceInventoryTable';
import CreateServiceModal from '../components/admin/services/CreateServiceModal';
import PricingModal from '../components/admin/services/PricingModal';

const TOP_TABS = [
  { key: 'revenus', label: 'Revenus' },
  { key: 'croissance', label: 'Croissance' },
  { key: 'satisfaction', label: 'Satisfaction' },
  { key: 'marge', label: 'Marge' },
] as const;

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-20 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-80 bg-white rounded-2xl border animate-pulse" />
        <div className="h-80 bg-white rounded-2xl border animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="warning" className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
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
          <Icon name="shoppingBag" className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée disponible</h2>
        <p className="text-sm text-gray-500">Le catalogue de services est vide.</p>
      </div>
    </div>
  );
}

function toArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export const ServicesControlCenter: React.FC = () => {
  const {
    summary,
    performance,
    revenue,
    mix,
    geo,
    health,
    truth,
    funnel,
    watchlist,
    rankings,
    catalog,
    alerts,
    loading,
    error,
    refresh,
  } = useAdminServices();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>(TOP_TABS[0].key);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [catalog]);

  const handleCreateService = useCallback((_data: unknown) => {
    refresh();
  }, [refresh]);

  const handlePricingSubmit = useCallback((_data: unknown) => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const openCreate = () => setShowCreateModal(true);
    const openPricing = () => setShowPricingModal(true);
    const runRefresh = () => handleRefresh();
    const runExport = () => handleExport();

    window.addEventListener('admin-services-create', openCreate);
    window.addEventListener('admin-services-category', openCreate);
    window.addEventListener('admin-services-refresh', runRefresh);
    window.addEventListener('admin-services-export', runExport);

    return () => {
      window.removeEventListener('admin-services-create', openCreate);
      window.removeEventListener('admin-services-category', openCreate);
      window.removeEventListener('admin-services-refresh', runRefresh);
      window.removeEventListener('admin-services-export', runExport);
    };
  }, [handleExport, handleRefresh]);

  const pricingServices = useMemo(
    () =>
      catalog.map((item) => ({
        id: item.id,
        name: item.name,
        currentPrice: item.averagePrice,
      })),
    [catalog]
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={handleRefresh} />;
  if (!summary) return <EmptyState />;

  const performanceList = toArray(performance);
  const revenueData = Array.isArray(revenue) ? revenue : [];
  const mixItems = Array.isArray(mix) ? mix : [];
  const mixTotal = mixItems.reduce((s, i) => s + (i.amount || 0), 0);
  const geoZones = toArray(geo);
  const healthList = toArray(health);
  const truthList = toArray(truth);
  const watchlistItems = toArray(watchlist);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un service..."
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm font-semibold text-slate-500">
          {filteredCatalog.length} service{filteredCatalog.length > 1 ? 's' : ''} dans l’inventaire
        </p>
      </div>

        {/* ─── KPI ROW ─── */}
        <ServiceKpiCards summary={summary} />

        {/* ─── ROW 2: Performance + Revenue + Mix ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2">
            <ServicePerformanceTable services={performanceList as never[]} />
          </div>
          <div className="xl:col-span-1">
            <ServiceRevenueChart data={revenueData as never[]} />
          </div>
          <div className="xl:col-span-1">
            <ServiceMixChart items={mixItems as never[]} total={mixTotal} />
          </div>
        </div>

        {/* ─── ROW 3: Alerts + Geo + Health + Quick Actions ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <ServiceAlertsCard alerts={alerts} />
          </div>
          <div>
            <ServiceGeoCoverage zones={geoZones as never[]} />
          </div>
          <div>
            <ServiceHealthTable services={healthList as never[]} />
          </div>
          <div>
            <ServiceQuickActions
              onCreate={() => setShowCreateModal(true)}
              onPricing={() => setShowPricingModal(true)}
            />
          </div>
        </div>

        {/* ─── ROW 4: Truth + Funnel + Watchlist + Top Services ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <ServiceTruthCorridors corridors={truthList as never[]} />
          </div>
          <div>
            <ServiceConversionFunnel funnel={funnel} />
          </div>
          <div>
            <ServiceWatchlist items={watchlistItems as never[]} />
          </div>
          <div>
            <TopServicesCard rankings={rankings} />
          </div>
        </div>

        {/* ─── SERVICE INVENTORY ─── */}
        <ServiceInventoryTable catalog={filteredCatalog} />
      {/* ─── MODALS ─── */}
      <CreateServiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateService}
      />
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSubmit={handlePricingSubmit}
        services={pricingServices}
      />

    </div>
  );
};
