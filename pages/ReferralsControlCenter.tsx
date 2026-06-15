import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useReferralsCenter from '../hooks/useReferralsCenter';
import { ReferralHeader } from '../components/admin/referrals/ReferralHeader';
import { ReferralFilters } from '../components/admin/referrals/ReferralFilters';
import { ReferralKpiCards } from '../components/admin/referrals/ReferralKpiCards';
import { ReferralSettingsCard } from '../components/admin/referrals/ReferralSettingsCard';
import { ReferralPerformanceDonut } from '../components/admin/referrals/ReferralPerformanceDonut';
import { TopReferrersTable } from '../components/admin/referrals/TopReferrersTable';
import { RecentReferralConversions } from '../components/admin/referrals/RecentReferralConversions';
import { ReferralWatchlistCard } from '../components/admin/referrals/ReferralWatchlistCard';
import { ReferralChannelsCard } from '../components/admin/referrals/ReferralChannelsCard';
import { ReferralTrendChart } from '../components/admin/referrals/ReferralTrendChart';
import { ReferralImpactTable } from '../components/admin/referrals/ReferralImpactTable';
import { PopularCodesTable } from '../components/admin/referrals/PopularCodesTable';
import { ReferralQuickActions } from '../components/admin/referrals/ReferralQuickActions';
import { ReferralCampaignModal } from '../components/admin/referrals/ReferralCampaignModal';
import { ManualBonusModal } from '../components/admin/referrals/ManualBonusModal';
import { ReferralDetailDrawer } from '../components/admin/referrals/ReferralDetailDrawer';
import { ReferralAuditDrawer } from '../components/admin/referrals/ReferralAuditDrawer';
import { ReferralSettingsDrawer } from '../components/admin/referrals/ReferralSettingsDrawer';
import { trackReferralEvent } from '../lib/admin/referrals-api';
import type { ReferralSettings, TopReferrer } from '../lib/admin/referrals-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-6">
      <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
        <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les données de parrainage.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed p-12 text-center">
      <Icon name="users" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Aucune donnée de parrainage disponible.</p>
      <p className="text-xs text-gray-500 mt-2">Les conversions apparaîtront ici dès que vos clients inviteront leurs proches.</p>
    </div>
  );
}

export const ReferralsControlCenter: React.FC = () => {
  const {
    kpis, settings, channels, topReferrers, recentConversions, watchlist,
    trends, impact, popularCodes, totalRevenue, loading, error, source, days,
    refresh, handleSaveSettings, handleCreateCampaign, handleManualBonus, handleExport, handleAudit,
  } = useReferralsCenter();

  const [search, setSearch] = useState('');
  const [draftSettings, setDraftSettings] = useState<ReferralSettings | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [showCampaign, setShowCampaign] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<TopReferrer | null>(null);
  const [auditResult, setAuditResult] = useState<{ watchlist_items: number; conversions_audited: number; status: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    trackReferralEvent('admin_referrals_viewed');
  }, []);

  useEffect(() => {
    if (settings) setDraftSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const isEmpty = useMemo(() => {
    if (!kpis) return false;
    return kpis.usersWithCode === 0 && kpis.referredUsers === 0 && recentConversions.length === 0;
  }, [kpis, recentConversions]);

  const onFilterChange = useCallback((type: string, value: string | number) => {
    trackReferralEvent('referral_filter_changed', { type, value });
    if (type === 'days') refresh(Number(value));
    if (type === 'status') setStatusFilter(String(value));
    if (type === 'channel') setChannelFilter(String(value));
    if (type === 'zone') setZoneFilter(String(value));
    if (type === 'partner') setPartnerFilter(String(value));
  }, [refresh]);

  const validateSettings = (s: ReferralSettings): string | null => {
    if (s.referrerBonusPoints < 0 || s.refereeDiscountAmount < 0 || (s.bonusCapPerReferrer ?? 0) < 0 || (s.pointsExpiryDays ?? 0) < 0) {
      return 'Les valeurs doivent être ≥ 0.';
    }
    if (s.isEnabled && s.allowedChannels.length === 0) {
      return 'Au moins un canal doit être actif si le programme est actif.';
    }
    return null;
  };

  const onSave = useCallback(async () => {
    if (!draftSettings) return;
    const err = validateSettings(draftSettings);
    if (err) { setToast(err); return; }
    setSaving(true);
    try {
      await handleSaveSettings(draftSettings);
      trackReferralEvent('referral_settings_updated');
      setToast('Paramètres enregistrés');
    } catch {
      setToast('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }, [draftSettings, handleSaveSettings]);

  const onCreateCampaign = useCallback(async (name: string, audience: string, budget: number, start: string, end: string) => {
    try {
      const r = await handleCreateCampaign(name, audience, budget, start, end);
      trackReferralEvent('referral_campaign_created', { id: r.id });
      setToast(`Campagne créée (${r.id})`);
    } catch {
      setToast('Création campagne impossible');
    }
  }, [handleCreateCampaign]);

  const onManualBonus = useCallback(async (userId: string, points: number, reason: string) => {
    try {
      await handleManualBonus(userId, points, reason);
      trackReferralEvent('referral_manual_bonus_sent', { userId, points });
      setToast('Bonus envoyé');
    } catch {
      setToast('Envoi bonus impossible');
    }
  }, [handleManualBonus]);

  const onExport = useCallback(async () => {
    try {
      const r = await handleExport('csv', 'conversions');
      trackReferralEvent('referral_exported', { filename: r.filename });
      setToast(`Export — ${r.filename} (${r.count} lignes)`);
    } catch {
      setToast('Export impossible');
    }
  }, [handleExport]);

  const onAudit = useCallback(async () => {
    setAuditing(true);
    try {
      const r = await handleAudit();
      setAuditResult(r);
      trackReferralEvent('referral_audit_started');
      setToast('Audit terminé');
    } catch {
      setToast('Audit impossible');
    } finally {
      setAuditing(false);
    }
  }, [handleAudit]);

  if (loading && !kpis) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;
  if (!kpis || !draftSettings) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="flex-1 p-6 space-y-6">
        {toast && <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 text-sm font-medium text-purple-800 dark:text-purple-200">{toast}</div>}
        {source === 'backend' && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 px-4 py-2 text-xs font-medium text-green-800 flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5" /> Données 100% backend — Referral Growth Center
          </div>
        )}

        <ReferralHeader
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => refresh()}
          onExport={onExport}
          onCreateCampaign={() => setShowCampaign(true)}
        />

        <ReferralFilters
          days={days}
          status={statusFilter}
          channel={channelFilter}
          zone={zoneFilter}
          partner={partnerFilter}
          onDaysChange={(d) => onFilterChange('days', d)}
          onStatusChange={(v) => onFilterChange('status', v)}
          onChannelChange={(v) => onFilterChange('channel', v)}
          onZoneChange={(v) => onFilterChange('zone', v)}
          onPartnerChange={(v) => onFilterChange('partner', v)}
        />

        <ReferralKpiCards kpis={kpis} />

        {isEmpty ? <EmptyState /> : (
          <>
            <ReferralSettingsCard
              settings={draftSettings}
              onChange={setDraftSettings}
              onSave={onSave}
              onHistory={() => setShowSettingsDrawer(true)}
              saving={saving}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ReferralPerformanceDonut channels={channels} totalRevenue={totalRevenue} onViewAttribution={() => setShowAudit(true)} />
              <ReferralChannelsCard channels={channels} />
              <ReferralQuickActions
                onCreateCampaign={() => setShowCampaign(true)}
                onManualBonus={() => setShowBonus(true)}
                onExport={onExport}
                onWatchlist={() => { trackReferralEvent('referral_watchlist_opened'); setShowAudit(true); }}
                onPromotion={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))}
                onAudit={() => { setShowAudit(true); onAudit(); }}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TopReferrersTable
                referrers={topReferrers}
                search={search}
                onSelect={(r) => { setSelectedReferrer(r); trackReferralEvent('referral_detail_opened', { userId: r.userId }); }}
              />
              <RecentReferralConversions conversions={recentConversions} statusFilter={statusFilter} search={search} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ReferralWatchlistCard items={watchlist} onOpen={() => { trackReferralEvent('referral_watchlist_opened'); setShowAudit(true); }} />
              <ReferralTrendChart data={trends} days={days} onDaysChange={(d) => refresh(d)} />
              <ReferralImpactTable metrics={impact} />
            </div>

            <PopularCodesTable codes={popularCodes} search={search} />
          </>
        )}
      </div>
      <ReferralCampaignModal open={showCampaign} onClose={() => setShowCampaign(false)} onCreate={onCreateCampaign} />
      <ManualBonusModal open={showBonus} onClose={() => setShowBonus(false)} onSend={onManualBonus} />
      <ReferralDetailDrawer referrer={selectedReferrer} onClose={() => setSelectedReferrer(null)} />
      <ReferralAuditDrawer
        open={showAudit}
        watchlist={watchlist}
        auditResult={auditResult}
        loading={auditing}
        onClose={() => setShowAudit(false)}
        onRunAudit={onAudit}
      />
      <ReferralSettingsDrawer
        open={showSettingsDrawer}
        settings={draftSettings}
        onChange={setDraftSettings}
        onSave={onSave}
        onClose={() => setShowSettingsDrawer(false)}
        saving={saving}
      />
    </div>
  );
};
