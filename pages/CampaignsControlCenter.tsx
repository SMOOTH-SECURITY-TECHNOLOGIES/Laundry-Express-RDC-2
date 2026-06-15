import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useCampaignsCenter from '../hooks/useCampaignsCenter';
import { CampaignHeader } from '../components/admin/campaigns/CampaignHeader';
import { CampaignFilters } from '../components/admin/campaigns/CampaignFilters';
import { CampaignKpiCards } from '../components/admin/campaigns/CampaignKpiCards';
import { CampaignsTable } from '../components/admin/campaigns/CampaignsTable';
import { CampaignPerformanceDonut } from '../components/admin/campaigns/CampaignPerformanceDonut';
import { CampaignFunnel } from '../components/admin/campaigns/CampaignFunnel';
import { CampaignTrendChart } from '../components/admin/campaigns/CampaignTrendChart';
import { TopCampaignsCard } from '../components/admin/campaigns/TopCampaignsCard';
import { TopSegmentsCard } from '../components/admin/campaigns/TopSegmentsCard';
import { CampaignAutomationsCard } from '../components/admin/campaigns/CampaignAutomationsCard';
import { AudienceBuilderCard } from '../components/admin/campaigns/AudienceBuilderCard';
import { CampaignCalendar } from '../components/admin/campaigns/CampaignCalendar';
import { CampaignROIWidget } from '../components/admin/campaigns/CampaignROIWidget';
import { CampaignWatchlistCard } from '../components/admin/campaigns/CampaignWatchlistCard';
import { GrowthEnginePanel } from '../components/admin/campaigns/GrowthEnginePanel';
import { CampaignCreateModal } from '../components/admin/campaigns/CampaignCreateModal';
import { CampaignAnalyticsDrawer } from '../components/admin/campaigns/CampaignAnalyticsDrawer';
import { AudienceBuilderModal } from '../components/admin/campaigns/AudienceBuilderModal';
import { CampaignDeleteModal } from '../components/admin/campaigns/CampaignDeleteModal';
import { trackCampaignEvent } from '../lib/admin/campaigns-api';
import type { Campaign, CampaignAnalytics } from '../lib/admin/campaigns-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les campagnes.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed p-12 text-center">
      <Icon name="paper-plane" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium">Aucune campagne marketing créée.</p>
      <p className="text-xs text-gray-500 mt-2">Commencez par créer votre première campagne.</p>
      <button type="button" onClick={onCreate} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">Nouvelle campagne</button>
    </div>
  );
}

export const CampaignsControlCenter: React.FC = () => {
  const {
    kpis, campaigns, channels, funnel, trends, topCampaigns, segments, automations,
    calendar, roi, watchlist, growth, loading, error, source, days, refresh,
    handleCreate, handleUpdate, handleDelete, handlePause, handleDuplicate, handleAnalytics, handleExport,
  } = useCampaignsCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [showAudience, setShowAudience] = useState(false);
  const [audienceSize, setAudienceSize] = useState(1284);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackCampaignEvent('admin_campaigns_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const isEmpty = useMemo(() => campaigns.length === 0, [campaigns]);

  const onFilter = useCallback((type: string, value: string | number) => {
    trackCampaignEvent('campaign_filter_changed', { type, value });
    if (type === 'days') refresh(Number(value));
    if (type === 'status') setStatusFilter(String(value));
    if (type === 'channel') setChannelFilter(String(value));
    if (type === 'partner') setPartnerFilter(String(value));
    if (type === 'zone') setZoneFilter(String(value));
    if (type === 'segment') setSegmentFilter(String(value));
  }, [refresh]);

  const onCreate = useCallback(async (data: Parameters<typeof handleCreate>[0]) => {
    try {
      const r = await handleCreate(data);
      trackCampaignEvent('campaign_created', { id: r.id });
      setToast(`Campagne créée (${r.id})`);
    } catch { setToast('Création impossible'); }
  }, [handleCreate]);

  const onAnalytics = useCallback(async (c: Campaign) => {
    try {
      setAnalytics(await handleAnalytics(c.id));
      trackCampaignEvent('campaign_analytics_opened', { id: c.id });
    } catch { setToast('Analytics indisponibles'); }
  }, [handleAnalytics]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;
  if (!kpis || !roi) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-800">{toast}</div>}
        {source === 'backend' && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-medium text-green-800 flex items-center gap-2"><Icon name="check" className="w-3.5 h-3.5" /> Données 100% backend — Marketing Campaign Center</div>}

        <CampaignHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={async () => { const r = await handleExport('csv', 'campaigns'); trackCampaignEvent('campaign_exported'); setToast(`Export ${r.filename}`); }} onCreate={() => { setEditCampaign(null); setShowCreate(true); }} />
        <CampaignFilters days={days} status={statusFilter} channel={channelFilter} partner={partnerFilter} zone={zoneFilter} segment={segmentFilter} onDaysChange={(d) => onFilter('days', d)} onStatusChange={(v) => onFilter('status', v)} onChannelChange={(v) => onFilter('channel', v)} onPartnerChange={(v) => onFilter('partner', v)} onZoneChange={(v) => onFilter('zone', v)} onSegmentChange={(v) => onFilter('segment', v)} />
        <CampaignKpiCards kpis={kpis} />
        {growth && <GrowthEnginePanel growth={growth} />}

        {isEmpty ? <EmptyState onCreate={() => setShowCreate(true)} /> : (
          <>
            <CampaignsTable campaigns={campaigns} search={search} statusFilter={statusFilter} channelFilter={channelFilter}
              onEdit={(c) => { setEditCampaign(c); setShowCreate(true); }}
              onPause={async (c) => { await handlePause(c.id); trackCampaignEvent('campaign_paused'); setToast('Campagne en pause'); }}
              onDuplicate={async (c) => { const r = await handleDuplicate(c.id); trackCampaignEvent('campaign_duplicated'); setToast(`Dupliquée (${r.id})`); }}
              onDelete={(c) => setDeleteTarget(c)}
              onAnalytics={onAnalytics}
            />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <CampaignPerformanceDonut channels={channels} totalRevenue={kpis.attributedRevenue} />
              <CampaignFunnel steps={funnel} />
              <CampaignROIWidget roi={roi} />
            </div>
            <CampaignTrendChart data={trends} days={days} onDaysChange={(d) => refresh(d)} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TopCampaignsCard campaigns={topCampaigns} />
              <TopSegmentsCard segments={segments} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <CampaignAutomationsCard automations={automations} onCreate={() => setToast('Workflow — bientôt disponible')} />
              <AudienceBuilderCard estimatedSize={audienceSize} onOpenBuilder={() => setShowAudience(true)} />
              <CampaignWatchlistCard items={watchlist} />
            </div>
            <CampaignCalendar events={calendar} />
          </>
        )}
      </div>
      <CampaignCreateModal open={showCreate} editCampaign={editCampaign} onClose={() => { setShowCreate(false); setEditCampaign(null); }} onCreate={async (data) => {
        if (editCampaign) { await handleUpdate(editCampaign.id, data); trackCampaignEvent('campaign_updated'); setToast('Campagne mise à jour'); }
        else await onCreate(data);
      }} />
      <CampaignAnalyticsDrawer data={analytics} onClose={() => setAnalytics(null)} />
      <AudienceBuilderModal open={showAudience} onClose={() => setShowAudience(false)} onEstimate={setAudienceSize} />
      <CampaignDeleteModal open={!!deleteTarget} name={deleteTarget?.name || ''} onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (deleteTarget) { await handleDelete(deleteTarget.id); trackCampaignEvent('campaign_deleted'); setToast('Campagne supprimée'); } }} />
    </div>
  );
};
