import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../components/Icon';
import usePromotionsCenter from '../hooks/usePromotionsCenter';
import { PromotionsHeader } from '../components/admin/promotions/PromotionsHeader';
import { PromotionsFiltersBar } from '../components/admin/promotions/PromotionsFilters';
import { PromotionsKpiStrip } from '../components/admin/promotions/PromotionsKpiStrip';
import { GrowthScoreGauge } from '../components/admin/promotions/GrowthScoreGauge';
import { PromotionsActiveTable } from '../components/admin/promotions/PromotionsActiveTable';
import { PromotionCreateWizard } from '../components/admin/promotions/PromotionCreateWizard';
import { CampaignsTable } from '../components/admin/promotions/CampaignsTable';
import { SegmentsPanel } from '../components/admin/promotions/SegmentsPanel';
import { ReactivationWidget } from '../components/admin/promotions/ReactivationWidget';
import { LoyaltyWidget } from '../components/admin/promotions/LoyaltyWidget';
import { ReferralWidget } from '../components/admin/promotions/ReferralWidget';
import { PromotionZoneMap } from '../components/admin/promotions/PromotionZoneMap';
import { PromotionFunnel } from '../components/admin/promotions/PromotionFunnel';
import { AttributionChart } from '../components/admin/promotions/AttributionChart';
import { AbTestingPanel } from '../components/admin/promotions/AbTestingPanel';
import { TopPromotionsList } from '../components/admin/promotions/TopPromotionsList';
import { RiskPromotionsCard } from '../components/admin/promotions/RiskPromotionsCard';
import { PromotionsInsights } from '../components/admin/promotions/PromotionsInsights';
import { PromotionsExportCenter } from '../components/admin/promotions/PromotionsExportCenter';
import type { PromoFilters, PromoCreatePayload } from '../lib/admin/promotions-types';

function defaultFilters(): PromoFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    dateStart: start.toISOString().slice(0, 10), dateEnd: end.toISOString().slice(0, 10),
    status: 'Tous les statuts', type: 'Tous les types', zone: 'Toutes les zones',
    segment: 'Tous les segments', channel: 'Tous les canaux',
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Impossible de charger le Growth & Promotions Center.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const PromotionsControlCenter: React.FC = () => {
  const {
    kpis, growthScore, activePromotions, campaigns, segments, reactivation, loyalty, referral,
    zones, funnel, attribution, abTests, topPromotions, riskPromotions, insights,
    loading, error, degraded, wsConnected, refresh, handleCreate, handlePause, handleDelete, handleExport,
  } = usePromotionsCenter();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PromoFilters>(defaultFilters);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showExportCenter, setShowExportCenter] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const onPromoAction = useCallback(async (id: string, action: string) => {
    const promo = activePromotions.find((p) => p.id === id);
    switch (action) {
      case 'pause': await handlePause(id); setToast(`Promotion ${promo?.code} suspendue`); break;
      case 'duplicate': setShowCreateWizard(true); setToast(`Duplication de ${promo?.code}`); break;
      case 'edit': setShowCreateWizard(true); break;
      case 'roi': setToast(`ROI ${promo?.code}: ${promo?.roi}x`); break;
      case 'delete': await handleDelete(id); setToast(`Promotion supprimée`); break;
    }
  }, [activePromotions, handlePause, handleDelete]);

  const onCreatePromo = useCallback(async (payload: PromoCreatePayload) => {
    const result = await handleCreate(payload);
    setToast(`Promotion ${payload.code} créée (${result.id})`);
    await refresh();
  }, [handleCreate, refresh]);

  const onExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope: 'promotions' | 'roi' | 'campaigns' | 'coupons' | 'segments') => {
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
  if (!kpis || !growthScore || !reactivation || !loyalty || !referral) return null;

  const q = search.toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const filteredPromos = activePromotions.filter((p) => match(p.code) || match(p.reduction));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200">{toast}</div>}
        {degraded && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Icon name="warning" className="w-4 h-4" /> Mode dégradé — données promotions partielles
          </div>
        )}

        <PromotionsHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={refresh}
          onExport={() => setShowExportCenter(true)}
          onCreatePromo={() => setShowCreateWizard(true)}
          onCreateCampaign={() => setShowCreateWizard(true)}
          wsConnected={wsConnected}
        />

        <PromotionsFiltersBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
          <div className="xl:col-span-6"><PromotionsKpiStrip kpis={kpis} /></div>
          <div className="xl:col-span-1"><GrowthScoreGauge score={growthScore} /></div>
        </div>

        <PromotionsActiveTable promotions={filteredPromos} onAction={onPromoAction} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <PromotionFunnel funnel={funnel} />
          <AttributionChart channels={attribution} />
          <CampaignsTable campaigns={campaigns} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SegmentsPanel segments={segments} />
          <ReactivationWidget data={reactivation} />
          <TopPromotionsList promotions={topPromotions} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <LoyaltyWidget data={loyalty} onOpenLoyalty={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Fidélité' }))} />
          <ReferralWidget data={referral} onOpenReferral={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Parrainage' }))} />
          <AbTestingPanel tests={abTests} />
        </div>

        <PromotionZoneMap zones={zones} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RiskPromotionsCard risks={riskPromotions} onAction={(id) => setToast(`Analyse risque ${id} ouverte`)} />
          <PromotionsInsights insights={insights} />
        </div>
      </div>

      <PromotionCreateWizard open={showCreateWizard} onClose={() => setShowCreateWizard(false)} onSubmit={onCreatePromo} />
      <PromotionsExportCenter open={showExportCenter} onClose={() => setShowExportCenter(false)} onExport={onExport} />
    </div>
  );
};
