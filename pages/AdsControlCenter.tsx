import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useAdsCenter from '../hooks/useAdsCenter';
import { AdsHeader } from '../components/admin/ads/AdsHeader';
import { AdsFiltersBar } from '../components/admin/ads/AdsFilters';
import { AdsKpiStrip } from '../components/admin/ads/AdsKpiStrip';
import { AdsActiveTable } from '../components/admin/ads/AdsActiveTable';
import { AdFunnel } from '../components/admin/ads/AdFunnel';
import { ChannelDonutChart } from '../components/admin/ads/ChannelDonutChart';
import { AdsZoneMap } from '../components/admin/ads/AdsZoneMap';
import { CampaignsTable } from '../components/admin/ads/CampaignsTable';
import { SegmentsPanel } from '../components/admin/ads/SegmentsPanel';
import { ReactivationCenter } from '../components/admin/ads/ReactivationCenter';
import { AbTestingPanel } from '../components/admin/ads/AbTestingPanel';
import { TopAdsList } from '../components/admin/ads/TopAdsList';
import { AdsInsights } from '../components/admin/ads/AdsInsights';
import { AdsTruthCorridor } from '../components/admin/ads/AdsTruthCorridor';
import { AttributionWidget } from '../components/admin/ads/AttributionWidget';
import { AdsExportCenter } from '../components/admin/ads/AdsExportCenter';
import { AdsQuickActions } from '../components/admin/ads/AdsQuickActions';
import type { AdsFilters } from '../lib/admin/ads-types';

function defaultFilters(): AdsFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    dateStart: start.toISOString().slice(0, 10),
    dateEnd: end.toISOString().slice(0, 10),
    status: 'Tous les statuts',
    type: 'Tous les types',
    zone: 'Toutes les zones',
    partner: 'Tous les partenaires',
    channel: 'Tous les canaux',
    campaign: 'Toutes les campagnes',
  };
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Impossible de charger l&apos;Advertising Intelligence Center.
        </h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
          Réessayer
        </button>
      </div>
    </div>
  );
}

export const AdsControlCenter: React.FC = () => {
  const {
    kpis, ads, funnel, channels, zones, campaigns, segments, reactivation,
    abTests, topAds, insights, truthAnomalies, attribution,
    loading, error, source, refresh,
    handlePause, handleArchive, handleDuplicate, handleCreate, handleCreateCampaign, handleExport,
  } = useAdsCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdsFilters>(defaultFilters);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onFilterChange = useCallback((patch: Partial<AdsFilters>) => {
    setFilters((f) => {
      const next = { ...f, ...patch };
      if (patch.dateStart || patch.dateEnd) {
        refresh(daysBetween(next.dateStart, next.dateEnd));
      }
      return next;
    });
  }, [refresh]);

  const onAdAction = useCallback(async (id: string, action: string) => {
    const ad = ads.find((a) => a.id === id);
    try {
      switch (action) {
        case 'pause':
          await handlePause(id);
          setToast(`Publicité « ${ad?.title} » mise en pause`);
          break;
        case 'duplicate': {
          const r = await handleDuplicate(id);
          setToast(`Publicité dupliquée (${r.id})`);
          break;
        }
        case 'archive':
          await handleArchive(id);
          setToast(`Publicité « ${ad?.title} » archivée`);
          break;
        case 'view':
          setToast(`Détails: ${ad?.title} — ROI ${ad?.roi}x`);
          break;
        case 'edit':
          setToast(`Édition: ${ad?.title}`);
          break;
      }
    } catch {
      setToast('Action impossible — vérifiez les permissions.');
    }
  }, [ads, handlePause, handleDuplicate, handleArchive]);

  const onCreateAd = useCallback(async () => {
    try {
      const r = await handleCreate({ title: 'Nouvelle publicité', status: 'draft', channel: 'facebook', zone: 'Gombe' });
      setToast(`Publicité créée (${r.id})`);
    } catch {
      setToast('Création désactivée ou erreur backend.');
    }
  }, [handleCreate]);

  const onCreateCampaign = useCallback(async () => {
    try {
      const r = await handleCreateCampaign('Nouvelle campagne', 'conversion', 500);
      setToast(`Campagne créée (${r.id})`);
    } catch {
      setToast('Création campagne impossible.');
    }
  }, [handleCreateCampaign]);

  const onExport = useCallback(async (
    format: 'csv' | 'excel' | 'pdf' | 'json',
    scope: 'campaigns' | 'performances' | 'roi' | 'segments' | 'attribution',
  ) => {
    const result = await handleExport(format, scope);
    setToast(`Export ${scope} ${format.toUpperCase()} — ${result.filename} (${result.count} lignes)`);
  }, [handleExport]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const statusMap: Record<string, string> = {
    Actif: 'active', Pause: 'paused', Brouillon: 'draft', Archivé: 'archived',
  };

  const filteredAds = useMemo(() => {
    const q = search.toLowerCase();
    return ads.filter((ad) => {
      const matchSearch = !q || ad.title.toLowerCase().includes(q) || ad.campaign.toLowerCase().includes(q) || ad.zone.toLowerCase().includes(q);
      const matchStatus = filters.status === 'Tous les statuts' || ad.status === statusMap[filters.status];
      const matchZone = filters.zone === 'Toutes les zones' || ad.zone === filters.zone;
      const matchChannel = filters.channel === 'Tous les canaux' || ad.channel.toLowerCase() === filters.channel.toLowerCase();
      const matchCampaign = filters.campaign === 'Toutes les campagnes' || ad.campaign === filters.campaign;
      return matchSearch && matchStatus && matchZone && matchChannel && matchCampaign;
    });
  }, [ads, search, filters]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh(daysBetween(filters.dateStart, filters.dateEnd))} />;
  if (!kpis || !reactivation || !attribution) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">
            {toast}
          </div>
        )}
        {source === 'backend' && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-2 text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5" /> Données 100% backend — Advertising Intelligence Center
          </div>
        )}

        <AdsHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => refresh(daysBetween(filters.dateStart, filters.dateEnd))}
          onExport={() => setShowExportCenter(true)}
          onCreateAd={onCreateAd}
          onCreateCampaign={onCreateCampaign}
        />

        <AdsFiltersBar filters={filters} onChange={onFilterChange} />

        <AdsKpiStrip kpis={kpis} />

        <AdsActiveTable ads={filteredAds} onAction={onAdAction} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AdFunnel funnel={funnel} />
          <ChannelDonutChart channels={channels} />
          <AdsZoneMap zones={zones} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <CampaignsTable campaigns={campaigns} />
          <TopAdsList ads={topAds} />
          <AttributionWidget attribution={attribution} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SegmentsPanel segments={segments} />
          <ReactivationCenter data={reactivation} />
          <AbTestingPanel tests={abTests} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AdsInsights insights={insights} />
          <AdsTruthCorridor anomalies={truthAnomalies} />
          <AdsQuickActions
            onCreateAd={onCreateAd}
            onCreateCampaign={onCreateCampaign}
            onExport={() => setShowExportCenter(true)}
          />
        </div>
      </div>
      <AdsExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
